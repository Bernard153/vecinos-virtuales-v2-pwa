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
                .eq('user_id', userId);

            if (error) throw error;

            if (!data || data.length === 0) {
                await this.initWallet(userId);
                return { balance: 10, puntos_xp: 0 };
            }

            return { balance: data[0].saldo_monedas || 0, puntos_xp: data[0].puntos_xp || 0 };
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
                    saldo_monedas: 10,
                    puntos_xp: 0
                }]);

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
            const { data: wallet } = await supabase
                .from('billeteras')
                .select('saldo_monedas, puntos_xp')
                .eq('user_id', userId);

            if (!wallet || wallet.length === 0) {
                await this.initWallet(userId);
            }

            const w = wallet && wallet[0] ? wallet[0] : { saldo_monedas: 0, puntos_xp: 0 };
            const nuevoSaldo = (w.saldo_monedas || 0) + amount;
            const nuevoXP = (w.puntos_xp || 0) + Math.floor(amount / 2);

            const { error: updateError } = await supabase
                .from('billeteras')
                .update({ 
                    saldo_monedas: nuevoSaldo,
                    puntos_xp: nuevoXP,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

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
        if (!userId || amount <= 0) return { success: false, error: 'Cantidad inválida' };

        try {
            const { data: wallet } = await supabase
                .from('billeteras')
                .select('saldo_monedas')
                .eq('user_id', userId);

            if (!wallet || wallet.length === 0) {
                return { success: false, error: 'Billetera no encontrada' };
            }

            const saldo = wallet[0].saldo_monedas || 0;
            if (saldo < amount) {
                return { success: false, error: 'Saldo insuficiente' };
            }

            const nuevoSaldo = saldo - amount;

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
            const { data: item, error: itemError } = await supabase
                .from('catalogo_regalos')
                .select('*')
                .eq('code', itemCode)
                .single();

            if (itemError || !item) {
                return { success: false, error: 'Item no encontrado' };
            }

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

            await supabase
                .from('regalos_enviados')
                .insert([{
                    emisor_id: user.id,
                    receptor_id: toUserId,
                    tipo_regalo: itemCode,
                    costo_monedas: item.precio_monedas,
                    modulo_origen: refType || 'voces-virtuales',
                    publicacion_id: refId || null
                }]);

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
                .eq('user_id', userId);

            if (!wallet || wallet.length === 0) return;

            const nuevoXP = (wallet[0].puntos_xp || 0) + amount;

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
            const { data: existing } = await supabase
                .from('user_unlocks')
                .select('id')
                .eq('user_id', userId)
                .eq('unlock_type', unlockType)
                .eq('unlock_code', unlockCode)
                .single();

            if (existing) return true;

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
                .single();

            if (itemError || !item) {
                return { success: false, error: 'Item no encontrado' };
            }

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
        if (!userId) return false;
        const today = new Date().toDateString();
        const lastLogin = localStorage.getItem(`vv_daily_login_${userId}`);

        if (lastLogin === today) {
            console.log('💰 Login diario ya reclamado hoy');
            return false;
        }

        localStorage.setItem(`vv_daily_login_${userId}`, today);
        const result = await this.earnCredits(userId, 2, 'Login diario', null, 'login');
        if (result) {
            console.log('💰 +2 créditos por login diario');
            // Actualizar saldo visible
            if (document.getElementById('wallet-balance-display')) {
                this.renderBalanceWidget('wallet-balance-display');
            }
        }
        return result;
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
    // UI: SOLICITAR CRÉDITOS AL ADMIN
    // ============================================================
    showCreditRequestForm: function() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) {
            alert('Iniciá sesión para solicitar créditos');
            return;
        }

        let overlay = document.getElementById('credit-request-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'credit-request-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 400px;">
                <h3><i class="fas fa-coins"></i> Solicitar Créditos</h3>
                <p style="color: var(--gray-600); margin-bottom: 1rem;">
                    Tu solicitud será revisada por el administrador.
                </p>
                <form id="credit-request-form">
                    <div class="form-group">
                        <label>Cantidad de créditos *</label>
                        <input type="number" id="credit-request-amount" min="1" max="100" required placeholder="Ej: 10">
                    </div>
                    <div class="form-group">
                        <label>Motivo *</label>
                        <textarea id="credit-request-reason" rows="3" required placeholder="Ej: Para regalar en el certamen, para destacar mi producto, etc."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="document.getElementById('credit-request-overlay').classList.remove('active')">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-paper-plane"></i> Enviar Solicitud
                        </button>
                    </div>
                </form>
            </div>
        `;

        overlay.classList.add('active');

        document.getElementById('credit-request-form').onsubmit = async (e) => {
            e.preventDefault();
            const amount = parseInt(document.getElementById('credit-request-amount').value);
            const reason = document.getElementById('credit-request-reason').value.trim();

            try {
                await supabase
                    .from('credit_requests')
                    .insert([{
                        user_id: user.id,
                        user_name: user.name,
                        neighborhood: user.neighborhood || '',
                        amount: amount,
                        reason: reason,
                        status: 'pending'
                    }]);

                overlay.classList.remove('active');
                alert('✅ Solicitud enviada. El administrador la revisará pronto.');
            } catch (err) {
                alert('Error: ' + err.message);
            }
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        };
    },

    // ============================================================
    // UI: CANJEAR XP POR CRÉDITOS
    // ============================================================
    showExchangeForm: async function() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) {
            alert('Iniciá sesión para canjear XP');
            return;
        }

        const { balance, puntos_xp } = await this.getBalance(user.id);
        const exchangeRate = 10;
        const maxCredits = Math.floor(puntos_xp / exchangeRate);

        let overlay = document.getElementById('exchange-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'exchange-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 400px;">
                <h3><i class="fas fa-exchange-alt"></i> Canjear XP por Créditos</h3>
                <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <p style="margin: 0.25rem 0;"><i class="fas fa-star"></i> Tu XP: <strong>${puntos_xp}</strong></p>
                    <p style="margin: 0.25rem 0;"><i class="fas fa-coins"></i> Tu saldo: <strong style="color: #fbbf24;">${balance} 🪙</strong></p>
                    <p style="margin: 0.5rem 0 0; font-size: 0.85rem; color: var(--gray-600);">
                        Tasa de cambio: <strong>${exchangeRate} XP = 1 🪙</strong><br>
                        Podés canjear hasta: <strong>${maxCredits} 🪙</strong>
                    </p>
                </div>
                ${maxCredits > 0 ? `
                    <form id="exchange-form">
                        <div class="form-group">
                            <label>Créditos a canjear *</label>
                            <input type="number" id="exchange-amount" min="1" max="${maxCredits}" required placeholder="Ej: 5">
                            <p style="font-size: 0.8rem; color: var(--gray-600); margin-top: 0.25rem;">Se descontarán ${exchangeRate} XP por cada crédito</p>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="document.getElementById('exchange-overlay').classList.remove('active')">Cancelar</button>
                            <button type="submit" class="btn-save">
                                <i class="fas fa-check"></i> Canjear
                            </button>
                        </div>
                    </form>
                ` : `
                    <p style="text-align: center; color: var(--gray-600); padding: 1rem;">No tenés XP suficiente para canjear. Necesitás al menos ${exchangeRate} XP.</p>
                    <button type="button" class="btn-cancel" style="width: 100%;" onclick="document.getElementById('exchange-overlay').classList.remove('active')">Cerrar</button>
                `}
            </div>
        `;

        overlay.classList.add('active');

        if (maxCredits > 0) {
            document.getElementById('exchange-form').onsubmit = async (e) => {
                e.preventDefault();
                const credits = parseInt(document.getElementById('exchange-amount').value);
                const xpCost = credits * exchangeRate;

                if (credits > maxCredits) {
                    alert('No tenés XP suficiente');
                    return;
                }

                try {
                    const { data: wallet } = await supabase
                        .from('billeteras')
                        .select('puntos_xp, saldo_monedas')
                        .eq('user_id', user.id);

                    if (!wallet || wallet.length === 0) {
                        alert('Billetera no encontrada');
                        return;
                    }

                    const newXP = (wallet[0].puntos_xp || 0) - xpCost;
                    const newBalance = (wallet[0].saldo_monedas || 0) + credits;

                    await supabase
                        .from('billeteras')
                        .update({
                            puntos_xp: newXP,
                            saldo_monedas: newBalance,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', user.id);

                    await this.addTransaction(user.id, credits, 'reward', `Canje de ${xpCost} XP por ${credits} créditos`, null, 'xp_exchange');

                    overlay.classList.remove('active');
                    alert(`✅ Canjeaste ${xpCost} XP por ${credits} 🪙`);

                    if (document.getElementById('wallet-balance-display')) {
                        this.renderBalanceWidget('wallet-balance-display');
                    }
                } catch (err) {
                    alert('Error: ' + err.message);
                }
            };
        }

        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        };
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
        modal.className = 'modal-overlay active';
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
                                <div class="vv-shop-item" onclick="VV_WALLET.purchaseItem('${item.code}').then(r => { if(r.success){alert('✅ ¡${item.nombre} comprado!');document.getElementById('vv-shop-modal').remove();VV_WALLET.openShop();} else {alert('❌ ' + r.error);} })" 
                                     style="background:rgba(255,255,255,0.05);border-radius:10px;padding:0.6rem;text-align:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);transition:all 0.2s;" 
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
