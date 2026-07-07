// ============================================================
// 💰 BILLETERA VIRTUAL DEL BARRIO
// Funciones core — transversal a todos los módulos
// ============================================================

window.VV_WALLET = {
    // ============================================================
    // CONSULTAR SALDO
    // ============================================================
    getBalance: async function(userId) {
        if (!userId) {
            const user = VV_ROLES.getCurrentUser();
            if (!user) return { balance: 0, puntos_xp: 0 };
            userId = user.id;
        }

        try {
            const { data, error } = await supabase
                .from('billeteras')
                .select('saldo_monedas, puntos_xp')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (!data) {
                // Crear billetera si no existe
                await this.initWallet(userId);
                return { balance: 0, puntos_xp: 0 };
            }

            return { balance: data.saldo_monedas || 0, puntos_xp: data.puntos_xp || 0 };
        } catch (err) {
            console.error('Error obteniendo saldo:', err);
            return { balance: 0, puntos_xp: 0 };
        }
    },

    // ============================================================
    // INICIALIZAR BILLETERA (usuario nuevo)
    // ============================================================
    initWallet: async function(userId) {
        if (!userId) return;
        try {
            await supabase
                .from('billeteras')
                .insert([{
                    user_id: userId,
                    saldo_monedas: 10,  // Créditos de bienvenida
                    puntos_xp: 0
                }]);

            // Registrar transacción de bienvenida
            await this.addTransaction(userId, 10, 'reward', 'Créditos de bienvenida 🎉');
            
            console.log('💰 Billetera inicializada para usuario:', userId);
        } catch (err) {
            console.error('Error inicializando billetera:', err);
        }
    },

    // ============================================================
    // GANAR CRÉDITOS
    // ============================================================
    earnCredits: async function(userId, amount, description, refId, refType) {
        if (!userId || amount <= 0) return false;

        try {
            // 1. Obtener saldo actual
            const { data: wallet } = await supabase
                .from('billeteras')
                .select('saldo_monedas, puntos_xp')
                .eq('user_id', userId)
                .single();

            if (!wallet) {
                await this.initWallet(userId);
            }

            const nuevoSaldo = (wallet?.saldo_monedas || 0) + amount;
            const nuevoXP = (wallet?.puntos_xp || 0) + Math.floor(amount / 2);

            // 2. Actualizar saldo
            const { error: updateError } = await supabase
                .from('billeteras')
                .update({ 
                    saldo_monedas: nuevoSaldo,
                    puntos_xp: nuevoXP,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            // 3. Registrar transacción
            await this.addTransaction(userId, amount, 'reward', description, refId, refType);

            console.log(`💰 +${amount} créditos para ${userId}: ${description}`);
            return true;
        } catch (err) {
            console.error('Error ganando créditos:', err);
            return false;
        }
    },

    // ============================================================
    // GASTAR CRÉDITOS
    // ============================================================
    spendCredits: async function(userId, amount, description, refId, refType) {
        if (!userId || amount <= 0) return false;

        try {
            const { data: wallet } = await supabase
                .from('billeteras')
                .select('saldo_monedas')
                .eq('user_id', userId)
                .single();

            if (!wallet || wallet.saldo_monedas < amount) {
                return { success: false, error: 'Saldo insuficiente' };
            }

            const nuevoSaldo = wallet.saldo_monedas - amount;

            const { error: updateError } = await supabase
                .from('billeteras')
                .update({ 
                    saldo_monedas: nuevoSaldo,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            await this.addTransaction(userId, -amount, 'purchase', description, refId, refType);

            console.log(`💰 -${amount} créditos de ${userId}: ${description}`);
            return { success: true, newBalance: nuevoSaldo };
        } catch (err) {
            console.error('Error gastando créditos:', err);
            return { success: false, error: err.message };
        }
    },

    // ============================================================
    // REGISTRAR TRANSACCIÓN
    // ============================================================
    addTransaction: async function(userId, amount, type, description, refId, refType) {
        try {
            await supabase
                .from('wallet_transactions')
                .insert([{
                    user_id: userId,
                    amount: amount,
                    type: type,
                    description: description,
                    reference_id: refId || null,
                    reference_type: refType || null
                }]);
        } catch (err) {
            console.error('Error registrando transacción:', err);
        }
    },

    // ============================================================
    // OBTENER HISTORIAL
    // ============================================================
    getHistory: async function(userId, limit = 20) {
        if (!userId) {
            const user = VV_ROLES.getCurrentUser();
            if (!user) return [];
            userId = user.id;
        }

        try {
            const { data, error } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error obteniendo historial:', err);
            return [];
        }
    },

    // ============================================================
    // ENVIAR REGALO
    // ============================================================
    sendGift: async function(toUserId, itemCode, refId, refType, message) {
        const user = VV_ROLES.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Debés iniciar sesión' };
        }

        try {
            // 1. Buscar el item en el catálogo
            const { data: item, error: itemError } = await supabase
                .from('catalogo_regalos')
                .select('*')
                .eq('code', itemCode)
                .eq('is_active', true)
                .single();

            if (itemError || !item) {
                return { success: false, error: 'Item no encontrado' };
            }

            // 2. Verificar saldo y descontar
            const spend = await this.spendCredits(
                user.id, 
                item.precio_monedas, 
                `Regalo: ${item.nombre} para ${toUserId}`,
                refId,
                refType
            );

            if (!spend.success) {
                return { success: false, error: spend.error };
            }

            // 3. Registrar el regalo
            await supabase
                .from('regalos_enviados')
                .insert([{
                    emisor_id: user.id,
                    receptor_id: toUserId,
                    tipo_regalo: itemCode,
                    costo_monedas: item.precio_monedas,
                    modulo_origen: refType || 'voces-virtuales',
                    publicacion_id: refId || null,
                    message: message || null
                }]);

            // 4. Dar XP al receptor
            await this.addXP(toUserId, 2);

            console.log(`🎁 ${item.nombre} enviado a ${toUserId}`);
            return { success: true, item: item };
        } catch (err) {
            console.error('Error enviando regalo:', err);
            return { success: false, error: err.message };
        }
    },

    // ============================================================
    // AGREGAR XP
    // ============================================================
    addXP: async function(userId, amount) {
        if (!userId || amount <= 0) return;

        try {
            const { data: wallet } = await supabase
                .from('billeteras')
                .select('puntos_xp')
                .eq('user_id', userId)
                .single();

            if (!wallet) return;

            const nuevoXP = (wallet.puntos_xp || 0) + amount;

            await supabase
                .from('billeteras')
                .update({ puntos_xp: nuevoXP, updated_at: new Date().toISOString() })
                .eq('user_id', userId);
        } catch (err) {
            console.error('Error agregando XP:', err);
        }
    },

    // ============================================================
    // OBTENER CATÁLOGO DE LA TIENDA
    // ============================================================
        getShopItems: async function(category = null) {
        try {
            let query = supabase
                .from('catalogo_regalos')
                .select('*')
                .order('sort_order', { ascending: true });

            if (category) {
                query = query.eq('category', category);
            }

            const { data, error } = await query;
            if (error) {
                console.error('Error obteniendo catálogo:', error);
                return [];
            }
            // Filtrar activos en JS por si la columna no existe
            return (data || []).filter(i => i.is_active !== false);
        } catch (err) {
            console.error('Error obteniendo catálogo:', err);
            return [];
        }
    },


    // ============================================================
    // DESBLOQUEAR ITEM (avatar, filtro, etc.)
    // ============================================================
    unlockItem: async function(userId, unlockType, unlockCode) {
        if (!userId) return false;

        try {
            // Verificar si ya está desbloqueado
            const { data: existing } = await supabase
                .from('user_unlocks')
                .select('id')
                .eq('user_id', userId)
                .eq('unlock_type', unlockType)
                .eq('unlock_code', unlockCode)
                .single();

            if (existing) return true;

            // Insertar desbloqueo
            await supabase
                .from('user_unlocks')
                .insert([{
                    user_id: userId,
                    unlock_type: unlockType,
                    unlock_code: unlockCode
                }]);

            return true;
        } catch (err) {
            console.error('Error desbloqueando item:', err);
            return false;
        }
    },

    // ============================================================
    // VERIFICAR SI TIENE DESBLOQUEADO
    // ============================================================
    hasUnlock: async function(userId, unlockType, unlockCode) {
        if (!userId) return false;

        try {
            const { data } = await supabase
                .from('user_unlocks')
                .select('id')
                .eq('user_id', userId)
                .eq('unlock_type', unlockType)
                .eq('unlock_code', unlockCode)
                .single();

            return !!data;
        } catch (err) {
            return false;
        }
    },

    // ============================================================
    // COMPRAR ITEM DE LA TIENDA (avatar, filtro, destacado)
    // ============================================================
    purchaseItem: async function(itemCode) {
        const user = VV_ROLES.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Debés iniciar sesión' };
        }

        try {
            const { data: item, error: itemError } = await supabase
                .from('catalogo_regalos')
                .select('*')
                .eq('code', itemCode)
                .eq('is_active', true)
                .single();

            if (itemError || !item) {
                return { success: false, error: 'Item no encontrado' };
            }

            // Gastar créditos
            const spend = await this.spendCredits(
                user.id,
                item.precio_monedas,
                `Compra: ${item.nombre}`,
                itemCode,
                item.category
            );

            if (!spend.success) {
                return { success: false, error: spend.error };
            }

            // Si es avatar o filtro, desbloquear
            if (item.category === 'avatar' || item.category === 'filtro') {
                await this.unlockItem(user.id, item.category, itemCode);
            }

            console.log(`🛒 ${item.nombre} comprado por ${user.id}`);
            return { success: true, item: item, newBalance: spend.newBalance };
        } catch (err) {
            console.error('Error comprando item:', err);
            return { success: false, error: err.message };
        }
    },

    // ============================================================
    // RECOMPENSAS AUTOMÁTICAS
    // ============================================================
    rewardVideoUpload: async function(userId) {
        return await this.earnCredits(userId, 5, 'Subida de video', null, 'video');
    },

    rewardReceiveLike: async function(userId, videoId) {
        return await this.earnCredits(userId, 1, 'Recibiste un like', videoId, 'video');
    },

    rewardDailyLogin: async function(userId) {
        const today = new Date().toDateString();
        const lastLogin = localStorage.getItem(`vv_daily_login_${userId}`);

        if (lastLogin === today) return false;

        localStorage.setItem(`vv_daily_login_${userId}`, today);
        return await this.earnCredits(userId, 2, 'Login diario', null, 'login');
    },

    // ============================================================
    // UI: MOSTRAR SALDO EN PANTALLA
    // ============================================================
            renderBalanceWidget: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const user = VV_ROLES.getCurrentUser();
        if (!user) {
            container.innerHTML = '<span style="color:#94a3b8;font-size:0.8rem;">Iniciá sesión</span>';
            // Reintentar en 2 segundos (esperar login)
            setTimeout(() => {
                const u = VV_ROLES.getCurrentUser();
                if (u) this.renderBalanceWidget(containerId);
            }, 2000);
            return;
        }

        this.getBalance(user.id).then(({ balance, puntos_xp }) => {
            container.innerHTML = `
                <span style="font-size:1.2rem;">🪙</span>
                <span style="color:#fbbf24;font-weight:700;font-size:1rem;">${balance}</span>
                <span style="font-size:0.7rem;color:#94a3b8;margin-left:0.3rem;">XP: ${puntos_xp}</span>
            `;
        }).catch(() => {
            container.innerHTML = '<span style="color:#94a3b8;font-size:0.8rem;">Error</span>';
        });
    },



    // ============================================================
    // UI: ABRIR TIENDA
    // ============================================================
    openShop: async function() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) {
            alert('Iniciá sesión para acceder a la tienda');
            return;
        }

        const { balance } = await this.getBalance(user.id);
        const items = await this.getShopItems();

        const regalos = items.filter(i => i.category === 'regalo');
        const avatares = items.filter(i => i.category === 'avatar');
        const filtros = items.filter(i => i.category === 'filtro');
        const destacados = items.filter(i => i.category === 'destacado');

        const modal = document.createElement('div');
        modal.id = 'vv-shop-modal';
        modal.className = 'vv-modal-overlay';
        modal.innerHTML = `
            <div class="vv-modal-content" style="max-width:500px;">
                <button class="vv-modal-close" onclick="document.getElementById('vv-shop-modal').remove()">✕</button>
                <div style="padding:1.25rem;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                        <h3 style="margin:0;color:#f1f5f9;">🛒 Tienda del Barrio</h3>
                        <div style="display:flex;align-items:center;gap:0.4rem;background:rgba(251,191,36,0.15);padding:0.4rem 0.8rem;border-radius:20px;">
                            <span style="font-size:1rem;">🪙</span>
                            <span style="font-weight:700;color:#fbbf24;">${balance}</span>
                        </div>
                    </div>

                    <div style="margin-bottom:1.25rem;">
                        <p style="color:#94a3b8;font-size:0.8rem;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05rem;">🎁 Regalos</p>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.5rem;">
                            ${regalos.map(item => `
                                <div class="vv-shop-item" style="background:rgba(255,255,255,0.05);border-radius:10px;padding:0.6rem;text-align:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);transition:all 0.2s;" 
                                     onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                                     onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                                    <div style="font-size:1.8rem;margin-bottom:0.25rem;">${item.icono}</div>
                                    <p style="margin:0;font-size:0.75rem;color:#cbd5e1;">${item.nombre}</p>
                                    <p style="margin:0.2rem 0 0;font-size:0.8rem;color:#fbbf24;font-weight:700;">🪙 ${item.precio_monedas}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div style="margin-bottom:1.25rem;">
                        <p style="color:#94a3b8;font-size:0.8rem;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05rem;">👤 Avatares</p>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.5rem;">
                            ${avatares.map(item => `
                                <div class="vv-shop-item" onclick="VV_WALLET.purchaseItem('${item.code}').then(r => { if(r.success){alert('✅ ¡${item.nombre} desbloqueado!');document.getElementById('vv-shop-modal').remove();VV_WALLET.openShop();} else {alert('❌ ' + r.error);} })" 
                                     style="background:rgba(255,255,255,0.05);border-radius:10px;padding:0.6rem;text-align:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);">
                                    <div style="font-size:1.8rem;margin-bottom:0.25rem;">${item.icono}</div>
                                    <p style="margin:0;font-size:0.75rem;color:#cbd5e1;">${item.nombre}</p>
                                    <p style="margin:0.2rem 0 0;font-size:0.8rem;color:#fbbf24;font-weight:700;">🪙 ${item.precio_monedas}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div style="margin-bottom:1.25rem;">
                        <p style="color:#94a3b8;font-size:0.8rem;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05rem;">📷 Filtros</p>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.5rem;">
                            ${filtros.map(item => `
                                <div class="vv-shop-item" onclick="VV_WALLET.purchaseItem('${item.code}').then(r => { if(r.success){alert('✅ ¡${item.nombre} desbloqueado!');document.getElementById('vv-shop-modal').remove();VV_WALLET.openShop();} else {alert('❌ ' + r.error);} })" 
                                     style="background:rgba(255,255,255,0.05);border-radius:10px;padding:0.6rem;text-align:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);">
                                    <div style="font-size:1.8rem;margin-bottom:0.25rem;">${item.icono}</div>
                                    <p style="margin:0;font-size:0.75rem;color:#cbd5e1;">${item.nombre}</p>
                                    <p style="margin:0.2rem 0 0;font-size:0.8rem;color:#fbbf24;font-weight:700;">🪙 ${item.precio_monedas}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <p style="color:#94a3b8;font-size:0.8rem;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05rem;">📌 Destacados</p>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.5rem;">
                            ${destacados.map(item => `
                                <div class="vv-shop-item" onclick="VV_WALLET.purchaseItem('${item.code}').then(r => { if(r.success){alert('✅ ¡${item.nombre} activado!');document.getElementById('vv-shop-modal').remove();} else {alert('❌ ' + r.error);} })" 
                                     style="background:rgba(255,255,255,0.05);border-radius:10px;padding:0.6rem;text-align:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);">
                                    <div style="font-size:1.8rem;margin-bottom:0.25rem;">${item.icono}</div>
                                    <p style="margin:0;font-size:0.75rem;color:#cbd5e1;">${item.nombre}</p>
                                    <p style="margin:0.2rem 0 0;font-size:0.8rem;color:#fbbf24;font-weight:700;">🪙 ${item.precio_monedas}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }
};
