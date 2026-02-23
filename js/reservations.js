// ========== MÓDULO DE RESERVAS ==========

VV.reservations = {
    // Crear nueva reserva
    async create(productId) {
        const product = VV.data.products.find(p => p.id === productId);
        if (!product) {
            alert('Producto no encontrado');
            return;
        }
        
        this.showReservationForm(product);
    },
    
    // Mostrar formulario de reserva
    showReservationForm(product) {
        let overlay = document.getElementById('reservation-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'reservation-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 500px;">
                <h3><i class="fas fa-calendar-check"></i> Reservar Producto</h3>
                
                <div style="background: var(--gray-100); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <h4 style="margin: 0 0 0.5rem 0;">${product.product}</h4>
                    <p style="margin: 0; color: var(--gray-600); font-size: 0.9rem;">
                        <strong>Vendedor:</strong> ${product.seller_name} #${product.seller_number}<br>
                        <strong>Negocio:</strong> ${product.business}<br>
                        <strong>Precio:</strong> $${product.price} / ${product.unit}
                    </p>
                </div>
                
                <form id="reservation-form">
                    <div class="form-group">
                        <label>Cantidad *</label>
                        <input type="number" id="res-quantity" min="0.01" step="0.01" value="1" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Total: <span id="res-total" style="font-size: 1.2rem; color: var(--success-green); font-weight: bold;">$${product.price}</span></label>
                    </div>
                    
                    <div class="form-group">
                        <label>¿Cómo lo retiras? *</label>
                        <select id="res-pickup-method" required>
                            <option value="pickup">🏪 Paso a buscarlo</option>
                            <option value="delivery">🚚 Necesito delivery</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="delivery-address-group" style="display: none;">
                        <label>Dirección de entrega</label>
                        <input type="text" id="res-delivery-address" placeholder="Calle y número">
                    </div>
                    
                    <div class="form-group">
                        <label>¿Cuándo? *</label>
                        <select id="res-pickup-time" required>
                            <option value="today">Hoy (antes de 18hs)</option>
                            <option value="tomorrow">Mañana (10am)</option>
                            <option value="custom">Otro día/hora</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="custom-time-group" style="display: none;">
                        <label>Fecha y hora</label>
                        <input type="datetime-local" id="res-custom-time">
                    </div>
                    
                    <div class="form-group">
                        <label>Mensaje al vendedor (opcional)</label>
                        <textarea id="res-message" rows="3" placeholder="Ej: ¿Tienen fría?"></textarea>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem;">
                        <p style="margin: 0; font-size: 0.85rem; color: #92400e;">
                            <i class="fas fa-info-circle"></i> El vendedor confirmará tu reserva. Recibirás una notificación.
                        </p>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.reservations.closeForm()">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-paper-plane"></i> Enviar Solicitud
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        // Calcular total dinámicamente
        document.getElementById('res-quantity').oninput = () => {
            const qty = parseFloat(document.getElementById('res-quantity').value) || 0;
            const total = qty * product.price;
            document.getElementById('res-total').textContent = `$${total.toFixed(2)}`;
        };
        
        // Toggle delivery address
        document.getElementById('res-pickup-method').onchange = (e) => {
            const addressGroup = document.getElementById('delivery-address-group');
            addressGroup.style.display = e.target.value === 'delivery' ? 'block' : 'none';
        };
        
        // Toggle custom time
        document.getElementById('res-pickup-time').onchange = (e) => {
            const customGroup = document.getElementById('custom-time-group');
            customGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
        };
        
        // Submit form
        document.getElementById('reservation-form').onsubmit = async (e) => {
            e.preventDefault();
            await this.submitReservation(product);
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) this.closeForm();
        };
    },
    
    // Enviar reserva
    async submitReservation(product) {
        const quantity = parseFloat(document.getElementById('res-quantity').value);
        const pickupMethod = document.getElementById('res-pickup-method').value;
        const deliveryAddress = document.getElementById('res-delivery-address')?.value || '';
        const pickupTimeOption = document.getElementById('res-pickup-time').value;
        const customTime = document.getElementById('res-custom-time')?.value;
        const message = document.getElementById('res-message').value.trim();
        
        // Calcular tiempo de retiro
        let pickupTime = new Date();
        if (pickupTimeOption === 'today') {
            pickupTime.setHours(18, 0, 0, 0);
        } else if (pickupTimeOption === 'tomorrow') {
            pickupTime.setDate(pickupTime.getDate() + 1);
            pickupTime.setHours(10, 0, 0, 0);
        } else if (customTime) {
            pickupTime = new Date(customTime);
        }
        
        const totalAmount = quantity * product.price;
        
        console.log('📦 Creando reserva:', {
            producto: product.product,
            vendedor: product.seller_id,
            comprador: VV.data.user.id
        });
        
        const reservation = {
            product_id: product.id,
            buyer_id: VV.data.user.id,
            seller_id: product.seller_id,
            neighborhood: VV.data.user.current_neighborhood || VV.data.user.neighborhood,
            product_name: product.product,
            product_price: product.price,
            quantity: quantity,
            total_amount: totalAmount,
            pickup_method: pickupMethod,
            pickup_time: pickupTime.toISOString(),
            delivery_address: deliveryAddress,
            buyer_message: message,
            status: 'requested'
        };
        
        try {
            const { data, error } = await supabase
                .from('reservations')
                .insert([reservation])
                .select()
                .single();
            
            if (error) throw error;
            
            this.closeForm();
            VV.utils.showSuccess('✅ Solicitud enviada. El vendedor recibirá una notificación.');
            
        } catch (error) {
            console.error('Error creando reserva:', error);
            alert('Error al crear la reserva. Intenta nuevamente.');
        }
    },
    
    // Cerrar formulario
    closeForm() {
        const overlay = document.getElementById('reservation-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Cargar reservas del usuario
    async loadMyReservations() {
        const userId = VV.data.user.id;
        
        console.log('🔍 Cargando reservas para usuario:', userId);
        
        try {
            const { data, error } = await supabase
                .from('reservations')
                .select('*')
                .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            console.log('📦 Reservas encontradas:', data);
            console.log('📊 Total:', data?.length || 0);
            
            // Mostrar detalles de cada reserva
            data?.forEach(r => {
                console.log(`  - ${r.product_name}: buyer=${r.buyer_id}, seller=${r.seller_id}`);
            });
            
            return data || [];
            
        } catch (error) {
            console.error('❌ Error cargando reservas:', error);
            return [];
        }
    },
    
    // Confirmar reserva (vendedor)
    async confirm(reservationId, sellerMessage = '') {
        try {
            const { error } = await supabase
                .from('reservations')
                .update({
                    status: 'confirmed',
                    seller_message: sellerMessage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reservationId);
            
            if (error) throw error;
            
            VV.utils.showSuccess('✅ Reserva confirmada');
            this.showManagePanel();
            
        } catch (error) {
            console.error('Error confirmando reserva:', error);
            alert('Error al confirmar la reserva');
        }
    },
    
    // Rechazar reserva (vendedor)
    async reject(reservationId, reason = '') {
        try {
            const { error } = await supabase
                .from('reservations')
                .update({
                    status: 'cancelled',
                    cancel_reason: reason,
                    cancelled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', reservationId);
            
            if (error) throw error;
            
            VV.utils.showSuccess('Reserva rechazada');
            this.showManagePanel();
            
        } catch (error) {
            console.error('Error rechazando reserva:', error);
            alert('Error al rechazar la reserva');
        }
    },
    
    // Marcar como preparada (vendedor)
    async markPrepared(reservationId) {
        try {
            const { error } = await supabase
                .from('reservations')
                .update({
                    status: 'prepared',
                    updated_at: new Date().toISOString()
                })
                .eq('id', reservationId);
            
            if (error) throw error;
            
            VV.utils.showSuccess('✅ Producto marcado como listo');
            this.showManagePanel();
            
        } catch (error) {
            console.error('Error marcando como preparado:', error);
            alert('Error al actualizar el estado');
        }
    },
    
    // Completar reserva
    async complete(reservationId, rating = null, review = '') {
        try {
            const { error } = await supabase
                .from('reservations')
                .update({
                    status: 'completed',
                    buyer_confirmed: true,
                    rating: rating,
                    review: review,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', reservationId);
            
            if (error) throw error;
            
            VV.utils.showSuccess('✅ ¡Gracias! Transacción completada');
            this.showManagePanel();
            
        } catch (error) {
            console.error('Error completando reserva:', error);
            alert('Error al completar la reserva');
        }
    },
    
    // Cancelar reserva (comprador)
    async cancel(reservationId, reason = '') {
        if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
        
        try {
            const { error } = await supabase
                .from('reservations')
                .update({
                    status: 'cancelled',
                    cancel_reason: reason,
                    cancelled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', reservationId);
            
            if (error) throw error;
            
            VV.utils.showSuccess('Reserva cancelada');
            this.showManagePanel();
            
        } catch (error) {
            console.error('Error cancelando reserva:', error);
            alert('Error al cancelar la reserva');
        }
    },
    
    // Mostrar panel de gestión
    async showManagePanel() {
        const reservations = await this.loadMyReservations();
        const userId = VV.data.user.id;
        
        console.log('📋 Reservas cargadas:', reservations);
        
        // Separar por rol
        const asBuyer = reservations.filter(r => r.buyer_id === userId);
        const asSeller = reservations.filter(r => r.seller_id === userId);
        
        console.log('🛒 Como comprador:', asBuyer.length);
        console.log('🏪 Como vendedor:', asSeller.length);
        
        // Obtener usuarios para mostrar nombres
        const { data: users } = await supabase.from('users').select('id, name, unique_number, phone');
        const usersMap = {};
        users?.forEach(u => usersMap[u.id] = u);
        
        // Crear mapa de productos para obtener negocio
        const productsMap = {};
        VV.data.products.forEach(p => productsMap[p.id] = p);
        
        console.log('📦 Productos disponibles:', VV.data.products.length);
        console.log('🗺️ Mapa de productos:', Object.keys(productsMap).length);
        
        let overlay = document.getElementById('manage-reservations-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'manage-reservations-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <h3><i class="fas fa-calendar-check"></i> Gestión de Reservas</h3>
                
                <div class="admin-tabs" style="margin-bottom: 1.5rem;">
                    <button class="tab-btn active" onclick="VV.reservations.switchTab('buyer')">
                        <i class="fas fa-shopping-bag"></i> Mis Compras (${asBuyer.length})
                    </button>
                    <button class="tab-btn" onclick="VV.reservations.switchTab('seller')">
                        <i class="fas fa-store"></i> Mis Ventas (${asSeller.length})
                    </button>
                </div>
                
                <div id="res-buyer-tab" class="admin-tab-content active">
                    ${this.renderBuyerTab(asBuyer, usersMap, productsMap)}
                </div>
                
                <div id="res-seller-tab" class="admin-tab-content">
                    ${this.renderSellerTab(asSeller, usersMap, productsMap)}
                </div>
                
                <div style="margin-top: 1.5rem; text-align: center;">
                    <button class="btn-secondary" onclick="VV.reservations.closeManagePanel()">Cerrar</button>
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
        overlay.onclick = (e) => {
            if (e.target === overlay) this.closeManagePanel();
        };
    },
    
    // Renderizar tab de comprador
    renderBuyerTab(reservations, usersMap, productsMap) {
        if (reservations.length === 0) {
            return '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No tienes reservas</p>';
        }
        
        const active = reservations.filter(r => ['requested', 'confirmed', 'prepared'].includes(r.status));
        const completed = reservations.filter(r => r.status === 'completed');
        const cancelled = reservations.filter(r => ['cancelled', 'expired'].includes(r.status));
        
        let html = '';
        
        if (active.length > 0) {
            html += '<h4>🟢 Activas</h4>';
            html += active.map(r => this.renderBuyerCard(r, usersMap, productsMap)).join('');
        }
        
        if (completed.length > 0) {
            html += '<h4 style="margin-top: 1.5rem;">✅ Completadas</h4>';
            html += completed.slice(0, 5).map(r => this.renderBuyerCard(r, usersMap, productsMap)).join('');
        }
        
        if (cancelled.length > 0) {
            html += '<h4 style="margin-top: 1.5rem;">❌ Canceladas</h4>';
            html += cancelled.slice(0, 3).map(r => this.renderBuyerCard(r, usersMap, productsMap)).join('');
        }
        
        return html;
    },
    
    // Renderizar tarjeta de comprador
    renderBuyerCard(r, usersMap, productsMap) {
        const seller = usersMap[r.seller_id] || {};
        const statusInfo = this.getStatusInfo(r.status);
        
        // Obtener producto para datos del negocio
        const product = productsMap[r.product_id] || {};
        const businessName = product.business || 'Negocio';
        const sellerPhone = product.contact || '';
        
        return `
            <div style="background: white; border-left: 4px solid ${statusInfo.color}; padding: 1.25rem; margin-bottom: 1rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header con vendedor destacado -->
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid var(--gray-200);">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                🏪
                            </div>
                            <div>
                                <h4 style="margin: 0; font-size: 1.1rem; color: #1e293b;">Le compras a:</h4>
                                <p style="margin: 0; font-size: 1.2rem; font-weight: bold; color: var(--primary-blue);">
                                    ${businessName}
                                </p>
                                <p style="margin: 0; font-size: 0.85rem; color: var(--gray-600);">
                                    ${seller.name} #${seller.unique_number}
                                </p>
                            </div>
                        </div>
                        <div style="background: #f8fafc; padding: 0.75rem; border-radius: 8px; margin-top: 0.5rem;">
                            <p style="margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 600; color: #334155;">
                                ${r.product_name}
                            </p>
                            <p style="margin: 0; font-size: 0.9rem; color: var(--gray-600);">
                                Cantidad: ${r.quantity} | Total: <span style="color: var(--success-green); font-weight: bold; font-size: 1.1rem;">$${r.total_amount}</span>
                            </p>
                        </div>
                    </div>
                    <span style="background: ${statusInfo.bg}; color: ${statusInfo.color}; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        ${statusInfo.label}
                    </span>
                </div>
                
                <!-- Timeline visual -->
                <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${r.status === 'requested' ? statusInfo.color : '#10b981'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">
                            ${r.status === 'requested' ? '1' : '✓'}
                        </div>
                        <span style="font-size: 0.9rem; color: #475569;">Solicitud enviada</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${['confirmed', 'prepared', 'completed'].includes(r.status) ? '#10b981' : '#e2e8f0'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">
                            ${['confirmed', 'prepared', 'completed'].includes(r.status) ? '✓' : '2'}
                        </div>
                        <span style="font-size: 0.9rem; color: ${['confirmed', 'prepared', 'completed'].includes(r.status) ? '#475569' : '#94a3b8'};">
                            ${r.status === 'confirmed' ? '⏳ Vendedor preparando...' : ['prepared', 'completed'].includes(r.status) ? 'Vendedor confirmó' : 'Esperando confirmación del vendedor'}
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${['prepared', 'completed'].includes(r.status) ? '#10b981' : '#e2e8f0'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">
                            ${['prepared', 'completed'].includes(r.status) ? '✓' : '3'}
                        </div>
                        <span style="font-size: 0.9rem; color: ${['prepared', 'completed'].includes(r.status) ? '#475569' : '#94a3b8'};">
                            ${r.status === 'prepared' ? '📦 ¡Listo para retirar!' : r.status === 'completed' ? 'Producto retirado' : 'Preparación del producto'}
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${r.status === 'completed' ? '#10b981' : '#e2e8f0'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">
                            ${r.status === 'completed' ? '✓' : '4'}
                        </div>
                        <span style="font-size: 0.9rem; color: ${r.status === 'completed' ? '#475569' : '#94a3b8'};">
                            ${r.status === 'completed' ? '✅ Operación completada' : 'Confirmar retiro'}
                        </span>
                    </div>
                </div>
                
                <!-- Detalles -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem;">
                    <div style="background: #f8fafc; padding: 0.5rem; border-radius: 6px;">
                        <strong style="color: var(--gray-600);">Retiro:</strong><br>
                        ${r.pickup_method === 'pickup' ? '🏪 En local' : '🚚 Delivery'}
                    </div>
                    <div style="background: #f8fafc; padding: 0.5rem; border-radius: 6px;">
                        <strong style="color: var(--gray-600);">Cuándo:</strong><br>
                        ${new Date(r.pickup_time).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                </div>
                
                ${r.buyer_message ? `<div style="background: #fef3c7; border-left: 3px solid #f59e0b; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; font-size: 0.9rem;"><strong>Tu mensaje:</strong><br>${r.buyer_message}</div>` : ''}
                ${r.seller_message ? `<div style="background: #dbeafe; border-left: 3px solid #3b82f6; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; font-size: 0.9rem;"><strong>Respuesta del vendedor:</strong><br>${r.seller_message}</div>` : ''}
                ${r.delivery_address ? `<div style="background: #f8fafc; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; font-size: 0.9rem;"><strong>📍 Dirección:</strong> ${r.delivery_address}</div>` : ''}
                
                <!-- Acciones -->
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--gray-200);">
                    ${sellerPhone ? `
                        <a href="https://wa.me/${sellerPhone.replace(/[^0-9]/g, '')}" target="_blank" class="btn-secondary" style="flex: 1; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <i class="fab fa-whatsapp"></i> Contactar Vendedor
                        </a>
                    ` : ''}
                    ${r.status === 'prepared' ? `
                        <button class="btn-primary" onclick="VV.reservations.complete('${r.id}')" style="flex: 2; font-size: 1rem; padding: 0.75rem;">
                            <i class="fas fa-check-circle"></i> ✅ YA RETIRÉ EL PRODUCTO
                        </button>
                    ` : ''}
                    ${['requested', 'confirmed'].includes(r.status) ? `
                        <button class="btn-delete" onclick="VV.reservations.cancel('${r.id}')" style="flex: 1;">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },
    
    // Renderizar tab de vendedor
    renderSellerTab(reservations, usersMap, productsMap) {
        console.log('🏪 Renderizando tab vendedor:', reservations.length, 'reservas');
        
        if (reservations.length === 0) {
            return '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No tienes reservas de ventas</p>';
        }
        
        const pending = reservations.filter(r => r.status === 'requested');
        const active = reservations.filter(r => ['confirmed', 'prepared'].includes(r.status));
        const completed = reservations.filter(r => r.status === 'completed');
        
        console.log('  - Pendientes:', pending.length);
        console.log('  - Activas:', active.length);
        console.log('  - Completadas:', completed.length);
        
        let html = '';
        
        if (pending.length > 0) {
            html += '<h4>🔔 Pendientes de Confirmar</h4>';
            html += pending.map(r => this.renderSellerCard(r, usersMap, productsMap)).join('');
        }
        
        if (active.length > 0) {
            html += '<h4 style="margin-top: 1.5rem;">🟢 Activas</h4>';
            html += active.map(r => this.renderSellerCard(r, usersMap, productsMap)).join('');
        }
        
        if (completed.length > 0) {
            html += '<h4 style="margin-top: 1.5rem;">✅ Completadas</h4>';
            html += completed.slice(0, 5).map(r => this.renderSellerCard(r, usersMap, productsMap)).join('');
        }
        
        return html;
    },
    
    // Renderizar tarjeta de vendedor
    renderSellerCard(r, usersMap, productsMap) {
        console.log('🎴 Renderizando tarjeta vendedor:', r.product_name, 'para', r.buyer_id);
        
        const buyer = usersMap[r.buyer_id] || {};
        const statusInfo = this.getStatusInfo(r.status);
        
        console.log('  - Comprador:', buyer.name || 'NO ENCONTRADO');
        console.log('  - Estado:', r.status);
        
        return `
            <div style="background: white; border-left: 4px solid ${statusInfo.color}; padding: 1.25rem; margin-bottom: 1rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header con comprador destacado -->
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid var(--gray-200);">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                🛒
                            </div>
                            <div>
                                <h4 style="margin: 0; font-size: 1.1rem; color: #1e293b;">Te compra:</h4>
                                <p style="margin: 0; font-size: 1.2rem; font-weight: bold; color: var(--success-green);">
                                    ${buyer.name} #${buyer.unique_number}
                                </p>
                            </div>
                        </div>
                        <div style="background: #f8fafc; padding: 0.75rem; border-radius: 8px; margin-top: 0.5rem;">
                            <p style="margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 600; color: #334155;">
                                ${r.product_name}
                            </p>
                            <p style="margin: 0; font-size: 0.9rem; color: var(--gray-600);">
                                Cantidad: ${r.quantity} | Ganancia: <span style="color: var(--success-green); font-weight: bold; font-size: 1.1rem;">$${r.total_amount}</span>
                            </p>
                        </div>
                    </div>
                    <span style="background: ${statusInfo.bg}; color: ${statusInfo.color}; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        ${statusInfo.label}
                    </span>
                </div>
                
                <!-- Timeline visual para vendedor -->
                <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: #10b981; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">✓</div>
                        <span style="font-size: 0.9rem; color: #475569;">Cliente solicitó reserva</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${['confirmed', 'prepared', 'completed'].includes(r.status) ? '#10b981' : r.status === 'requested' ? '#f59e0b' : '#e2e8f0'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">
                            ${['confirmed', 'prepared', 'completed'].includes(r.status) ? '✓' : r.status === 'requested' ? '!' : '1'}
                        </div>
                        <span style="font-size: 0.9rem; color: ${['confirmed', 'prepared', 'completed'].includes(r.status) ? '#475569' : r.status === 'requested' ? '#92400e' : '#94a3b8'}; font-weight: ${r.status === 'requested' ? 'bold' : 'normal'};">
                            ${r.status === 'requested' ? '👉 DEBES CONFIRMAR LA RESERVA' : ['confirmed', 'prepared', 'completed'].includes(r.status) ? 'Confirmaste la reserva' : 'Confirmar reserva'}
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${['prepared', 'completed'].includes(r.status) ? '#10b981' : r.status === 'confirmed' ? '#f59e0b' : '#e2e8f0'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">
                            ${['prepared', 'completed'].includes(r.status) ? '✓' : r.status === 'confirmed' ? '!' : '2'}
                        </div>
                        <span style="font-size: 0.9rem; color: ${['prepared', 'completed'].includes(r.status) ? '#475569' : r.status === 'confirmed' ? '#92400e' : '#94a3b8'}; font-weight: ${r.status === 'confirmed' ? 'bold' : 'normal'};">
                            ${r.status === 'confirmed' ? '👉 PREPARA Y MARCA COMO LISTO' : ['prepared', 'completed'].includes(r.status) ? 'Marcaste como listo' : 'Preparar producto'}
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${r.status === 'completed' ? '#10b981' : r.status === 'prepared' ? '#f59e0b' : '#e2e8f0'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">
                            ${r.status === 'completed' ? '✓' : r.status === 'prepared' ? '!' : '3'}
                        </div>
                        <span style="font-size: 0.9rem; color: ${r.status === 'completed' ? '#475569' : r.status === 'prepared' ? '#92400e' : '#94a3b8'}; font-weight: ${r.status === 'prepared' ? 'bold' : 'normal'};">
                            ${r.status === 'prepared' ? '⏳ Esperando que cliente retire' : r.status === 'completed' ? 'Cliente retiró el producto' : 'Entrega del producto'}
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${r.status === 'completed' ? '#10b981' : '#e2e8f0'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">
                            ${r.status === 'completed' ? '✓' : '4'}
                        </div>
                        <span style="font-size: 0.9rem; color: ${r.status === 'completed' ? '#475569' : '#94a3b8'};">
                            ${r.status === 'completed' ? '✅ Venta completada' : 'Completar venta'}
                        </span>
                    </div>
                </div>
                
                <!-- Detalles -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem;">
                    <div style="background: #f8fafc; padding: 0.5rem; border-radius: 6px;">
                        <strong style="color: var(--gray-600);">Retiro:</strong><br>
                        ${r.pickup_method === 'pickup' ? '🏪 En tu local' : '🚚 Delivery'}
                    </div>
                    <div style="background: #f8fafc; padding: 0.5rem; border-radius: 6px;">
                        <strong style="color: var(--gray-600);">Cuándo:</strong><br>
                        ${new Date(r.pickup_time).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                </div>
                
                ${r.buyer_message ? `<div style="background: #dbeafe; border-left: 3px solid #3b82f6; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; font-size: 0.9rem;"><strong>Mensaje del cliente:</strong><br>${r.buyer_message}</div>` : ''}
                ${r.delivery_address ? `<div style="background: #fef3c7; border-left: 3px solid #f59e0b; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; font-size: 0.9rem;"><strong>📍 Dirección de entrega:</strong><br>${r.delivery_address}</div>` : ''}
                
                <!-- Acciones -->
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--gray-200);">
                    ${buyer.phone ? `
                        <a href="https://wa.me/${buyer.phone.replace(/[^0-9]/g, '')}" target="_blank" class="btn-secondary" style="flex: 1; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <i class="fab fa-whatsapp"></i> Contactar Cliente
                        </a>
                    ` : ''}
                    ${r.status === 'requested' ? `
                        <button class="btn-primary" onclick="VV.reservations.confirm('${r.id}')" style="flex: 2; font-size: 1rem; padding: 0.75rem;">
                            <i class="fas fa-check-circle"></i> ✅ CONFIRMAR RESERVA
                        </button>
                        <button class="btn-delete" onclick="VV.reservations.reject('${r.id}')" style="flex: 1;">
                            <i class="fas fa-times"></i> Rechazar
                        </button>
                    ` : ''}
                    ${r.status === 'confirmed' ? `
                        <button class="btn-primary" onclick="VV.reservations.markPrepared('${r.id}')" style="flex: 2; font-size: 1rem; padding: 0.75rem;">
                            <i class="fas fa-box-open"></i> 📦 MARCAR COMO LISTO
                        </button>
                    ` : ''}
                    ${r.status === 'prepared' ? `
                        <div style="flex: 1; text-align: center; padding: 1rem; background: #fef3c7; border-radius: 8px; border: 2px solid #f59e0b;">
                            <strong style="color: #92400e;">⏳ Esperando que el cliente retire</strong>
                        </div>
                    ` : ''}
                    ${r.rating ? `
                        <div style="flex: 1; text-align: center; padding: 1rem; background: #fef3c7; border-radius: 8px;">
                            <strong>Calificación:</strong><br>
                            <span style="font-size: 1.5rem;">${'⭐'.repeat(r.rating)}</span>
                            ${r.review ? `<br><em style="font-size: 0.9rem; color: var(--gray-600);">"${r.review}"</em>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },
    
    // Obtener info de estado
    getStatusInfo(status) {
        const info = {
            requested: { label: '⏳ Pendiente', color: '#f59e0b', bg: '#fef3c7' },
            confirmed: { label: '✅ Confirmada', color: '#3b82f6', bg: '#dbeafe' },
            prepared: { label: '📦 Lista', color: '#10b981', bg: '#d1fae5' },
            completed: { label: '✅ Completada', color: '#6b7280', bg: '#f3f4f6' },
            cancelled: { label: '❌ Cancelada', color: '#ef4444', bg: '#fee2e2' },
            expired: { label: '⏰ Expirada', color: '#6b7280', bg: '#f3f4f6' }
        };
        return info[status] || info.requested;
    },
    
    // Cambiar tab
    switchTab(tab) {
        // Remover active de todos los botones y contenidos
        document.querySelectorAll('#manage-reservations-overlay .tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('#manage-reservations-overlay .admin-tab-content').forEach(content => content.classList.remove('active'));
        
        // Activar el tab seleccionado
        const buttons = document.querySelectorAll('#manage-reservations-overlay .tab-btn');
        if (tab === 'buyer') {
            buttons[0].classList.add('active');
        } else {
            buttons[1].classList.add('active');
        }
        
        document.getElementById(`res-${tab}-tab`).classList.add('active');
    },
    
    // Cerrar panel
    closeManagePanel() {
        const overlay = document.getElementById('manage-reservations-overlay');
        if (overlay) overlay.classList.remove('active');
    }
};

console.log('✅ Módulo RESERVATIONS cargado');
