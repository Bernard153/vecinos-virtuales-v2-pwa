window.VV_WALLET = {
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

    initWallet: async function(userId) {
        if (!userId) return;
        try {
            await supabase.from('billeteras').insert([{
                user_id: userId, saldo_monedas: 10, puntos_xp: 0
            }]);
            await this.addTransaction(userId, 10, 'reward', 'Créditos de bienvenida');
        } catch (err) {
            console.error('Error inicializando billetera:', err);
        }
    },

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
                .update({ saldo_monedas: nuevoSaldo, puntos_xp: nuevoXP, updated_at: new Date().toISOString() })
                .eq('user_id', userId);
            if (updateError) throw updateError;
            await this.addTransaction(userId, amount, 'reward', description, refId, refType);
            return true;
        } catch (err) {
            console.error('Error ganando créditos:', err);
            return false;
        }
    },

    spendCredits: async function(userId, amount, description, refId, refType) {
        if (!userId || amount <= 0) return { success: false, error: 'Cantidad inválida' };
        try {
            const { data: wallet } = await supabase
                .from('billeteras')
                .select('saldo_monedas')
                .eq('user_id', userId);
            if (!wallet || wallet.length === 0) return { success: false, error: 'Billetera no encontrada' };
            const saldo = wallet[0].saldo_monedas || 0;
            if (saldo < amount) return { success: false, error: 'Saldo insuficiente' };
            const nuevoSaldo = saldo - amount;
            const { error: updateError } = await supabase
                .from('billeteras')
                .update({ saldo_monedas: nuevoSaldo, updated_at: new Date().toISOString() })
                .eq('user_id', userId);
            if (updateError) throw updateError;
            await this.addTransaction(userId, -amount, 'purchase', description, refId, refType);
            return { success: true, newBalance: nuevoSaldo };
        } catch (err) {
            console.error('Error gastando créditos:', err);
            return { success: false, error: err.message };
        }
    },

    addTransaction: async function(userId, amount, type, description, refId, refType) {
        try {
            await supabase.from('wallet_transactions').insert([{
                user_id: userId, amount: amount, type: type,
                description: description, reference_id: refId || null, reference_type: refType || null
            }]);
        } catch (err) {
            console.error('Error registrando transacción:', err);
        }
    },

    getHistory: async function(userId, limit) {
        limit = limit || 20;
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

    sendGift: async function(toUserId, itemCode, refId, refType, message) {
        const user = VV_ROLES.getCurrentUser();
        if (!user) return { success: false, error: 'Debés iniciar sesión' };
        try {
            const { data: item, error: itemError } = await supabase
                .from('catalogo_regalos')
                .select('*')
                .eq('code', itemCode)
                .single();
            if (itemError || !item) return { success: false, error: 'Item no encontrado' };
            const spend = await this.spendCredits(user.id, item.precio_monedas, 'Regalo: ' + item.nombre, refId, refType);
            if (!spend.success) return { success: false, error: spend.error };
            await supabase.from('regalos_enviados').insert([{
                emisor_id: user.id, receptor_id: toUserId, tipo_regalo: itemCode,
                costo_monedas: item.precio_monedas, modulo_origen: refType || 'voces-virtuales',
                publicacion_id: refId || null
            }]);
            await this.addXP(toUserId, 2);
            return { success: true, item: item };
        } catch (err) {
            console.error('Error enviando regalo:', err);
            return { success: false, error: err.message };
        }
    },

    addXP: async function(userId, amount) {
        if (!userId || amount <= 0) return;
        try {
            const { data: wallet } = await supabase
                .from('billeteras')
                .select('puntos_xp')
                .eq('user_id', userId);
            if (!wallet || wallet.length === 0) return;
            const nuevoXP = (wallet[0].puntos_xp || 0) + amount;
            await supabase.from('billeteras')
                .update({ puntos_xp: nuevoXP, updated_at: new Date().toISOString() })
                .eq('user_id', userId);
        } catch (err) {
            console.error('Error agregando XP:', err);
        }
    },

    getShopItems: async function(category) {
        try {
            let query = supabase.from('catalogo_regalos').select('*').order('sort_order', { ascending: true });
            if (category) query = query.eq('category', category);
            const { data, error } = await query;
            if (error) { console.error('Error obteniendo catálogo:', error); return []; }
            return (data || []).filter(function(i) { return i.is_active !== false; });
        } catch (err) {
            console.error('Error obteniendo catálogo:', err);
            return [];
        }
    },

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
            await supabase.from('user_unlocks').insert([{
                user_id: userId, unlock_type: unlockType, unlock_code: unlockCode
            }]);
            return true;
        } catch (err) {
            console.error('Error desbloqueando item:', err);
            return false;
        }
    },

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
        } catch (err) { return false; }
    },

    purchaseItem: async function(itemCode) {
        const user = VV_ROLES.getCurrentUser();
        if (!user) return { success: false, error: 'Debés iniciar sesión' };
        try {
            const { data: item, error: itemError } = await supabase
                .from('catalogo_regalos')
                .select('*')
                .eq('code', itemCode)
                .single();
            if (itemError || !item) return { success: false, error: 'Item no encontrado' };
            const spend = await this.spendCredits(user.id, item.precio_monedas, 'Compra: ' + item.nombre, itemCode, item.category);
            if (!spend.success) return { success: false, error: spend.error };
            if (item.category === 'avatar' || item.category === 'filtro') {
                await this.unlockItem(user.id, item.category, itemCode);
            }
            return { success: true, item: item, newBalance: spend.newBalance };
        } catch (err) {
            console.error('Error comprando item:', err);
            return { success: false, error: err.message };
        }
    },

    loadReceivedGifts: async function(containerId) {
        const user = VV_ROLES.getCurrentUser();
        if (!user) return;
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<p style="color:#94a3b8;">Cargando regalos...</p>';

        try {
            const { data: gifts, error } = await supabase
                .from('regalos_enviados')
                .select('*')
                .eq('receptor_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            if (!gifts || gifts.length === 0) {
                container.innerHTML = '<p style="color:#94a3b8;font-size:0.85rem;">Todavía no recibiste regalos</p>';
                return;
            }

            const codes = [...new Set(gifts.map(g => g.tipo_regalo))];
            const { data: items } = await supabase
                .from('catalogo_regalos')
                .select('*')
                .in('code', codes);

            const senderIds = [...new Set(gifts.map(g => g.emisor_id))];
            const { data: users } = await supabase
                .from('users')
                .select('id, name')
                .in('id', senderIds);

            const itemMap = {};
            items.forEach(i => itemMap[i.code] = i);
            const userMap = {};
            users.forEach(u => userMap[u.id] = u.name || 'Anónimo');

            container.innerHTML = gifts.map(g => {
                const item = itemMap[g.tipo_regalo] || {};
                const senderName = userMap[g.emisor_id] || 'Anónimo';
                const fecha = new Date(g.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                return `
                    <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem;background:rgba(251,191,36,0.08);border-radius:10px;margin-bottom:0.5rem;">
                        <span style="font-size:1.8rem;">${item.icono || '🎁'}</span>
                        <div style="flex:1;">
                            <p style="margin:0;font-weight:600;color:#fbbf24;">${item.nombre || g.tipo_regalo}</p>
                            <p style="margin:0;font-size:0.75rem;color:#94a3b8;">De ${senderName} · ${fecha}</p>
                        </div>
                        <span style="font-size:0.8rem;color:#fbbf24;">🪙 ${g.costo_monedas}</span>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error('Error cargando regalos:', err);
            container.innerHTML = '<p style="color:#ef4444;">Error al cargar regalos</p>';
        }
    },


    rewardVideoUpload: async function(userId) {
        return await this.earnCredits(userId, 5, 'Subida de video', null, 'video');
    },

    rewardReceiveLike: async function(userId, videoId) {
        return await this.earnCredits(userId, 1, 'Recibiste un like', videoId, 'video');
    },

    rewardDailyLogin: async function(userId) {
        if (!userId) return false;
        const today = new Date().toDateString();
        const lastLogin = localStorage.getItem('vv_daily_login_' + userId);
        if (lastLogin === today) return false;
        localStorage.setItem('vv_daily_login_' + userId, today);
        const result = await this.earnCredits(userId, 2, 'Login diario', null, 'login');
        if (result && document.getElementById('wallet-balance-display')) {
            this.renderBalanceWidget('wallet-balance-display');
        }
        return result;
    },
    renderBalanceWidget: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const user = VV_ROLES.getCurrentUser();
        if (!user) {
            container.innerHTML = '<span style="color:#94a3b8;font-size:0.8rem;">Iniciá sesión</span>';
            var self = this;
            setTimeout(function() {
                var u = VV_ROLES.getCurrentUser();
                if (u) self.renderBalanceWidget(containerId);
            }, 2000);
            return;
        }
        this.getBalance(user.id).then(function(result) {
            container.innerHTML = '<span style="font-size:1.2rem;">🪙</span>' +
                '<span style="color:#fbbf24;font-weight:700;font-size:1rem;">' + result.balance + '</span>' +
                '<span style="font-size:0.7rem;color:#94a3b8;margin-left:0.3rem;">XP: ' + result.puntos_xp + '</span>';
        }).catch(function() {
            container.innerHTML = '<span style="color:#94a3b8;font-size:0.8rem;">Error</span>';
        });
    },

    showCreditRequestForm: function() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) { alert('Iniciá sesión para solicitar créditos'); return; }
        let overlay = document.getElementById('credit-request-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'credit-request-overlay';
            overlay.className = 'modal-overlay';
            overlay.style.zIndex = '10002';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = '<div class="modal-form" style="max-width:400px;">' +
            '<h3><i class="fas fa-coins"></i> Solicitar Créditos</h3>' +
            '<p style="color:var(--gray-600);margin-bottom:1rem;">Tu solicitud será revisada por el administrador.</p>' +
            '<form id="credit-request-form">' +
            '<div class="form-group"><label>Cantidad de créditos *</label>' +
            '<input type="number" id="credit-request-amount" min="1" max="100" required placeholder="Ej: 10"></div>' +
            '<div class="form-group"><label>Motivo *</label>' +
            '<textarea id="credit-request-reason" rows="3" required placeholder="Ej: Para regalar en el certamen..."></textarea></div>' +
            '<div class="form-actions">' +
            '<button type="button" class="btn-cancel" onclick="document.getElementById(\'credit-request-overlay\').classList.remove(\'active\')">Cancelar</button>' +
            '<button type="submit" class="btn-save"><i class="fas fa-paper-plane"></i> Enviar Solicitud</button>' +
            '</div></form></div>';
        overlay.classList.add('active');
        document.getElementById('credit-request-form').onsubmit = async function(e) {
            e.preventDefault();
            const amount = parseInt(document.getElementById('credit-request-amount').value);
            const reason = document.getElementById('credit-request-reason').value.trim();
            try {
                await supabase.from('credit_requests').insert([{
                    user_id: user.id, user_name: user.name,
                    neighborhood: user.neighborhood || '', amount: amount, reason: reason, status: 'pending'
                }]);
                overlay.classList.remove('active');
                alert('Solicitud enviada. El administrador la revisará pronto.');
            } catch (err) { alert('Error: ' + err.message); }
        };
        overlay.onclick = function(e) { if (e.target === overlay) overlay.classList.remove('active'); };
    },

    showExchangeForm: async function() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) { alert('Iniciá sesión para canjear XP'); return; }
        const result = await this.getBalance(user.id);
        const balance = result.balance;
        const puntos_xp = result.puntos_xp;
        const exchangeRate = 10;
        const maxCredits = Math.floor(puntos_xp / exchangeRate);
        let overlay = document.getElementById('exchange-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'exchange-overlay';
            overlay.className = 'modal-overlay';
            overlay.style.zIndex = '10002';
            document.body.appendChild(overlay);
        }
        let html = '<div class="modal-form" style="max-width:400px;">' +
            '<h3><i class="fas fa-exchange-alt"></i> Canjear XP por Créditos</h3>' +
            '<div style="background:var(--gray-50);padding:1rem;border-radius:8px;margin-bottom:1rem;">' +
            '<p style="margin:0.25rem 0;">Tu XP: <strong>' + puntos_xp + '</strong></p>' +
            '<p style="margin:0.25rem 0;">Tu saldo: <strong style="color:#fbbf24;">' + balance + ' 🪙</strong></p>' +
            '<p style="margin:0.5rem 0 0;font-size:0.85rem;color:var(--gray-600);">Tasa: <strong>' + exchangeRate + ' XP = 1 🪙</strong><br>Podés canjear hasta: <strong>' + maxCredits + ' 🪙</strong></p></div>';
        if (maxCredits > 0) {
            html += '<form id="exchange-form">' +
                '<div class="form-group"><label>Créditos a canjear *</label>' +
                '<input type="number" id="exchange-amount" min="1" max="' + maxCredits + '" required placeholder="Ej: 5"></div>' +
                '<div class="form-actions">' +
                '<button type="button" class="btn-cancel" onclick="document.getElementById(\'exchange-overlay\').classList.remove(\'active\')">Cancelar</button>' +
                '<button type="submit" class="btn-save"><i class="fas fa-check"></i> Canjear</button>' +
                '</div></form>';
        } else {
            html += '<p style="text-align:center;color:var(--gray-600);padding:1rem;">No tenés XP suficiente. Necesitás al menos ' + exchangeRate + ' XP.</p>' +
                '<button type="button" class="btn-cancel" style="width:100%;" onclick="document.getElementById(\'exchange-overlay\').classList.remove(\'active\')">Cerrar</button>';
        }
        html += '</div>';
        overlay.innerHTML = html;
        overlay.classList.add('active');
        if (maxCredits > 0) {
            var self = this;
            document.getElementById('exchange-form').onsubmit = async function(e) {
                e.preventDefault();
                const credits = parseInt(document.getElementById('exchange-amount').value);
                const xpCost = credits * exchangeRate;
                if (credits > maxCredits) { alert('No tenés XP suficiente'); return; }
                try {
                    const { data: wallet } = await supabase.from('billeteras').select('puntos_xp, saldo_monedas').eq('user_id', user.id);
                    if (!wallet || wallet.length === 0) { alert('Billetera no encontrada'); return; }
                    const newXP = (wallet[0].puntos_xp || 0) - xpCost;
                    const newBalance = (wallet[0].saldo_monedas || 0) + credits;
                    await supabase.from('billeteras').update({
                        puntos_xp: newXP, saldo_monedas: newBalance, updated_at: new Date().toISOString()
                    }).eq('user_id', user.id);
                    await self.addTransaction(user.id, credits, 'reward', 'Canje de ' + xpCost + ' XP por ' + credits + ' créditos', null, 'xp_exchange');
                    overlay.classList.remove('active');
                    alert('Canjeaste ' + xpCost + ' XP por ' + credits + ' 🪙');
                    if (document.getElementById('wallet-balance-display')) {
                        self.renderBalanceWidget('wallet-balance-display');
                    }
                } catch (err) { alert('Error: ' + err.message); }
            };
        }
        overlay.onclick = function(e) { if (e.target === overlay) overlay.classList.remove('active'); };
    },
    openShop: async function() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) { alert('Iniciá sesión para acceder a la tienda'); return; }
        const result = await this.getBalance(user.id);
        const balance = result.balance;
        const items = await this.getShopItems();
        const regalos = items.filter(function(i) { return i.category === 'regalo'; });
        const avatares = items.filter(function(i) { return i.category === 'avatar'; });
        const filtros = items.filter(function(i) { return i.category === 'filtro'; });
        const destacados = items.filter(function(i) { return i.category === 'destacado'; });
        const modal = document.createElement('div');
        modal.id = 'vv-shop-modal';
        modal.className = 'modal-overlay active';
        var html = '<div class="vv-modal-content" style="max-width:500px;">' +
            '<button class="vv-modal-close" onclick="document.getElementById(\'vv-shop-modal\').remove()">✕</button>' +
            '<div style="padding:1.25rem;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">' +
            '<h3 style="margin:0;color:#f1f5f9;">🛒 Tienda del Barrio</h3>' +
            '<div style="display:flex;align-items:center;gap:0.4rem;background:rgba(251,191,36,0.15);padding:0.4rem 0.8rem;border-radius:20px;">' +
            '<span style="font-size:1rem;">🪙</span><span style="font-weight:700;color:#fbbf24;">' + balance + '</span></div></div>';
        html += '<div style="margin-bottom:1.25rem;"><p style="color:#94a3b8;font-size:0.8rem;margin-bottom:0.5rem;text-transform:uppercase;">🎁 Regalos</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.5rem;">';
        regalos.forEach(function(item) {
            html += '<div class="vv-shop-item" onclick="VV_WALLET.purchaseItem(\'' + item.code + '\').then(function(r){if(r.success){alert(\'¡' + item.nombre + ' comprado!\');document.getElementById(\'vv-shop-modal\').remove();VV_WALLET.openShop();}else{alert(r.error);}})" style="background:rgba(255,255,255,0.05);border-radius:10px;padding:0.6rem;text-align:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);">' +
                '<div style="font-size:1.8rem;">' + item.icono + '</div>' +
                '<p style="margin:0;font-size:0.75rem;color:#cbd5e1;">' + item.nombre + '</p>' +
                '<p style="margin:0.2rem 0 0;font-size:0.8rem;color:#fbbf24;font-weight:700;">🪙 ' + item.precio_monedas + '</p></div>';
        });
        html += '</div></div>';
        html += '<div style="margin-bottom:1.25rem;"><p style="color:#94a3b8;font-size:0.8rem;margin-bottom:0.5rem;text-transform:uppercase;">👤 Avatares</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.5rem;">';
        avatares.forEach(function(item) {
            html += '<div class="vv-shop-item" onclick="VV_WALLET.purchaseItem(\'' + item.code + '\').then(function(r){if(r.success){alert(\'¡' + item.nombre + ' desbloqueado!\');document.getElementById(\'vv-shop-modal\').remove();VV_WALLET.openShop();}else{alert(r.error);}})" style="background:rgba(255,255,255,0.05);border-radius:10px;padding:0.6rem;text-align:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);">' +
                '<div style="font-size:1.8rem;">' + item.icono + '</div>' +
                '<p style="margin:0;font-size:0.75rem;color:#cbd5e1;">' + item.nombre + '</p>' +
                '<p style="margin:0.2rem 0 0;font-size:0.8rem;color:#fbbf24;font-weight:700;">🪙 ' + item.precio_monedas + '</p></div>';
        });
        html += '</div></div>';
        html += '<div style="margin-bottom:1.25rem;"><p style="color:#94a3b8;font-size:0.8rem;margin-bottom:0.5rem;text-transform:uppercase;">📷 Filtros</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.5rem;">';
        filtros.forEach(function(item) {
            html += '<div class="vv-shop-item" onclick="VV_WALLET.purchaseItem(\'' + item.code + '\').then(function(r){if(r.success){alert(\'¡' + item.nombre + ' desbloqueado!\');document.getElementById(\'vv-shop-modal\').remove();VV_WALLET.openShop();}else{alert(r.error);}})" style="background:rgba(255,255,255,0.05);border-radius:10px;padding:0.6rem;text-align:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);">' +
                '<div style="font-size:1.8rem;">' + item.icono + '</div>' +
                '<p style="margin:0;font-size:0.75rem;color:#cbd5e1;">' + item.nombre + '</p>' +
                '<p style="margin:0.2rem 0 0;font-size:0.8rem;color:#fbbf24;font-weight:700;">🪙 ' + item.precio_monedas + '</p></div>';
        });
        html += '</div></div>';
        html += '<div><p style="color:#94a3b8;font-size:0.8rem;margin-bottom:0.5rem;text-transform:uppercase;">📌 Destacados</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.5rem;">';
        destacados.forEach(function(item) {
            html += '<div class="vv-shop-item" onclick="VV_WALLET.purchaseItem(\'' + item.code + '\').then(function(r){if(r.success){alert(\'¡' + item.nombre + ' activado!\');document.getElementById(\'vv-shop-modal\').remove();}else{alert(r.error);}})" style="background:rgba(255,255,255,0.05);border-radius:10px;padding:0.6rem;text-align:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);">' +
                '<div style="font-size:1.8rem;">' + item.icono + '</div>' +
                '<p style="margin:0;font-size:0.75rem;color:#cbd5e1;">' + item.nombre + '</p>' +
                '<p style="margin:0.2rem 0 0;font-size:0.8rem;color:#fbbf24;font-weight:700;">🪙 ' + item.precio_monedas + '</p></div>';
        });
        html += '</div></div></div></div>';
        modal.innerHTML = html;
        document.body.appendChild(modal);
    },
    getLevel: function(xp) {
        const levels = [
            { level: 1, name: 'Vecino Nuevo', minXP: 0, icon: '🌱' },
            { level: 2, name: 'Vecino Activo', minXP: 20, icon: '🌿' },
            { level: 3, name: 'Vecino Destacado', minXP: 50, icon: '⭐' },
            { level: 4, name: 'Vecino Referente', minXP: 100, icon: '🏆' },
            { level: 5, name: 'Leyenda del Barrio', minXP: 200, icon: '👑' }
        ];
        let current = levels[0];
        let next = null;
        for (let i = 0; i < levels.length; i++) {
            if (xp >= levels[i].minXP) {
                current = levels[i];
                next = levels[i + 1] || null;
            }
        }
        const progress = next ? Math.round(((xp - current.minXP) / (next.minXP - current.minXP)) * 100) : 100;
        return { current, next, progress };
    },

    openWallet: async function() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) { alert('Iniciá sesión para ver tu billetera'); return; }

        const { balance, puntos_xp } = await this.getBalance(user.id);
        const { current, next, progress } = this.getLevel(puntos_xp);
        const history = await this.getHistory(user.id, 15);

        const modal = document.createElement('div');
        modal.style.zIndex = '10002';
        modal.id = 'vv-wallet-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:10001;overflow-y:auto;';

        let historyHtml = '';
        if (history.length === 0) {
            historyHtml = '<p style="color:#94a3b8;text-align:center;padding:1rem;">Sin movimientos aún</p>';
        } else {
            historyHtml = history.map(function(t) {
                const isIncome = t.amount > 0;
                const date = new Date(t.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                return '<div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">' +
                    '<div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.85rem;' +
                    (isIncome ? 'background:rgba(16,185,129,0.15);color:#10b981;' : 'background:rgba(239,68,68,0.15);color:#ef4444;') +
                    '">' + (isIncome ? '↗' : '↘') + '</div>' +
                    '<div style="flex:1;"><p style="margin:0;font-size:0.85rem;color:#e2e8f0;">' + t.description + '</p>' +
                    '<p style="margin:0;font-size:0.7rem;color:#64748b;">' + date + '</p></div>' +
                    '<span style="font-weight:700;font-size:0.9rem;' + (isIncome ? 'color:#10b981;' : 'color:#ef4444;') + '">' +
                    (isIncome ? '+' : '') + t.amount + ' 🪙</span></div>';
            }).join('');
        }

        modal.innerHTML = '<div style="background:#1e293b;border-radius:16px;max-width:480px;width:90%;margin:auto;color:#e2e8f0;box-shadow:0 25px 50px rgba(0,0,0,0.5);">' +
            '<div style="position:sticky;top:0;background:#1e293b;border-radius:16px 16px 0 0;padding:1rem 1.25rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.08);z-index:1;">' +
            '<h3 style="margin:0;font-size:1.1rem;">💰 Mi Billetera</h3>' +
            '<button onclick="document.getElementById(\'vv-wallet-modal\').remove()" style="background:rgba(255,255,255,0.1);border:none;color:#e2e8f0;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem;">✕</button></div>' +
            
            '<div style="padding:1.25rem;">' +
            
            '<!-- SALDO Y NIVEL -->' +
            '<div style="background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(124,58,237,0.1));border-radius:12px;padding:1.25rem;margin-bottom:1rem;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">' +
            '<div><p style="margin:0;font-size:0.75rem;color:#94a3b8;text-transform:uppercase;">Saldo</p>' +
            '<p style="margin:0.25rem 0 0;font-size:2rem;font-weight:800;color:#fbbf24;">🪙 ' + balance + '</p></div>' +
            '<div style="text-align:right;"><p style="margin:0;font-size:0.75rem;color:#94a3b8;text-transform:uppercase;">Nivel</p>' +
            '<p style="margin:0.25rem 0 0;font-size:1.5rem;">' + current.icon + '</p>' +
            '<p style="margin:0;font-size:0.75rem;color:#cbd5e1;font-weight:600;">' + current.name + '</p></div></div>' +
            
            '<div style="margin-top:0.75rem;">' +
            '<div style="display:flex;justify-content:space-between;font-size:0.7rem;color:#94a3b8;margin-bottom:0.25rem;">' +
            '<span>XP: ' + puntos_xp + '</span>' +
            (next ? '<span>Siguiente: ' + next.name + ' (' + next.minXP + ' XP)</span>' : '<span>¡Nivel máximo!</span>') + '</div>' +
            '<div style="background:rgba(255,255,255,0.08);border-radius:20px;height:8px;overflow:hidden;">' +
            '<div style="background:linear-gradient(90deg,#fbbf24,#8b5cf6);height:100%;border-radius:20px;width:' + progress + '%;transition:width 0.5s;"></div></div></div></div>' +
            
            '<!-- ACCIONES RÁPIDAS -->' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin-bottom:1rem;">' +
            '<button onclick="VV_WALLET.openShop()" style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);color:#fbbf24;padding:0.6rem;border-radius:10px;cursor:pointer;font-size:0.75rem;font-weight:600;">🛒 Tienda</button>' +
            '<button onclick="VV_WALLET.showExchangeForm()" style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);color:#a78bfa;padding:0.6rem;border-radius:10px;cursor:pointer;font-size:0.75rem;font-weight:600;">🔄 Canjear XP</button>' +
            '<button onclick="VV_WALLET.showCreditRequestForm()" style="background:rgba(52,199,89,0.1);border:1px solid rgba(52,199,89,0.2);color:#34c759;padding:0.6rem;border-radius:10px;cursor:pointer;font-size:0.75rem;font-weight:600;">✉️ Pedir</button>' +
            '</div>' +
            
            '<!-- TABS -->' +
            '<div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;">' +
            '<button id="wallet-tab-history" onclick="document.getElementById(\'wallet-history\').style.display=\'block\';document.getElementById(\'wallet-gifts\').style.display=\'none\';document.getElementById(\'wallet-guide\').style.display=\'none\';this.style.borderBottom=\'2px solid #fbbf24\';document.getElementById(\'wallet-tab-gifts\').style.borderBottom=\'none\';document.getElementById(\'wallet-tab-guide\').style.borderBottom=\'none\';" style="flex:1;background:none;border:none;border-bottom:2px solid #fbbf24;color:#e2e8f0;padding:0.5rem;cursor:pointer;font-size:0.8rem;font-weight:600;">📋 Movimientos</button>' +
            '<button id="wallet-tab-gifts" onclick="document.getElementById(\'wallet-history\').style.display=\'none\';document.getElementById(\'wallet-gifts\').style.display=\'block\';document.getElementById(\'wallet-guide\').style.display=\'none\';this.style.borderBottom=\'2px solid #fbbf24\';document.getElementById(\'wallet-tab-history\').style.borderBottom=\'none\';document.getElementById(\'wallet-tab-guide\').style.borderBottom=\'none\';VV_WALLET.loadReceivedGifts(\'wallet-gifts\');" style="flex:1;background:none;border:none;border-bottom:none;color:#94a3b8;padding:0.5rem;cursor:pointer;font-size:0.8rem;font-weight:600;">🎁 Regalos</button>' +
            '<button id="wallet-tab-guide" onclick="document.getElementById(\'wallet-history\').style.display=\'none\';document.getElementById(\'wallet-gifts\').style.display=\'none\';document.getElementById(\'wallet-guide\').style.display=\'block\';this.style.borderBottom=\'2px solid #fbbf24\';document.getElementById(\'wallet-tab-history\').style.borderBottom=\'none\';document.getElementById(\'wallet-tab-gifts\').style.borderBottom=\'none\';" style="flex:1;background:none;border:none;border-bottom:none;color:#94a3b8;padding:0.5rem;cursor:pointer;font-size:0.8rem;font-weight:600;">💡 Cómo ganar</button>' +
            '</div>' +
            
            '<!-- HISTORIAL -->' +
            '<div id="wallet-history" style="max-height:250px;overflow-y:auto;">' + historyHtml + '</div>' +
            
            '<!-- REGALOS -->' +
            '<div id="wallet-gifts" style="display:none;max-height:250px;overflow-y:auto;"></div>' +
            
            '<!-- GUÍA -->' +
            '<div id="wallet-guide" style="display:none;">' +
            '<div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem;background:rgba(16,185,129,0.08);border-radius:10px;margin-bottom:0.5rem;">' +
            '<span style="font-size:1.5rem;">🎥</span><div><p style="margin:0;font-size:0.85rem;color:#e2e8f0;font-weight:600;">Subir un video</p>' +
            '<p style="margin:0;font-size:0.75rem;color:#10b981;">+5 🪙 por video</p></div></div>' +
            '<div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem;background:rgba(16,185,129,0.08);border-radius:10px;margin-bottom:0.5rem;">' +
            '<span style="font-size:1.5rem;">❤️</span><div><p style="margin:0;font-size:0.85rem;color:#e2e8f0;font-weight:600;">Recibir un like</p>' +
            '<p style="margin:0;font-size:0.75rem;color:#10b981;">+1 🪙 por like</p></div></div>' +
            '<div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem;background:rgba(16,185,129,0.08);border-radius:10px;margin-bottom:0.5rem;">' +
            '<span style="font-size:1.5rem;">📅</span><div><p style="margin:0;font-size:0.85rem;color:#e2e8f0;font-weight:600;">Login diario</p>' +
            '<p style="margin:0;font-size:0.75rem;color:#10b981;">+2 🪙 por día</p></div></div>' +
            '<div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem;background:rgba(139,92,246,0.08);border-radius:10px;margin-bottom:0.5rem;">' +
            '<span style="font-size:1.5rem;">🔄</span><div><p style="margin:0;font-size:0.85rem;color:#e2e8f0;font-weight:600;">Canjear XP por monedas</p>' +
            '<p style="margin:0;font-size:0.75rem;color:#a78bfa;">10 XP = 1 🪙</p></div></div>' +
            '<div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem;background:rgba(251,191,36,0.08);border-radius:10px;margin-bottom:0.5rem;">' +
            '<span style="font-size:1.5rem;">🎁</span><div><p style="margin:0;font-size:0.85rem;color:#e2e8f0;font-weight:600;">Recibir regalos</p>' +
            '<p style="margin:0;font-size:0.75rem;color:#fbbf24;">+2 XP por regalo</p></div></div>' +
            '<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:0.75rem;margin-top:0.75rem;">' +
            '<p style="margin:0;font-size:0.7rem;color:#64748b;text-align:center;">Las monedas virtuales no tienen valor monetario. Se obtienen gratis por participación en la comunidad.</p></div>' +
            '</div>' +
            
            '</div></div>';

        document.body.appendChild(modal);
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    }

};
