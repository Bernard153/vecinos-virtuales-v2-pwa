// ========== MÓDULO OFERTAS DESTACADAS (CORREGIDO 2025) ==========

VV.featured = {
    // Abrir el formulario para que el usuario solicite destacar
    requestFeatured() {
        const userProducts = VV.data.products || [];
        const overlay = document.getElementById('featured-request-overlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-star"></i> Solicitar Oferta Destacada</h3>
                <p style="color: var(--gray-600); margin-bottom: 1.5rem; font-size: 0.9rem;">
                    Tu solicitud será revisada por el administrador antes de ser publicada en el dashboard del barrio.
                </p>
                <form id="featured-request-form">
                    <div class="form-group">
                        <label>Selecciona tu producto *</label>
                        <select id="featured-product" required style="width: 100%; padding: 0.5rem; border-radius: 4px;">
                            <option value="">Seleccionar producto</option>
                            ${userProducts.map(p => `
                                <option value="${p.id}">${p.product} - $${p.price}/${p.unit}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Título de la oferta *</label>
                        <input type="text" id="featured-title" required placeholder="Ej: ¡Gran oferta de fin de semana!" style="width: 100%; padding: 0.5rem; border-radius: 4px;">
                    </div>
                    <div class="form-group">
                        <label>Descripción detallada *</label>
                        <textarea id="featured-description" rows="3" required placeholder="Describe los beneficios..." style="width: 100%; padding: 0.5rem; border-radius: 4px;"></textarea>
                    </div>
                    <div class="form-group" style="display: flex; gap: 1rem;">
                        <div style="flex: 1;">
                            <label>Precio Especial (opcional)</label>
                            <input type="number" id="featured-price" step="0.01" placeholder="Ej: 500" style="width: 100%; padding: 0.5rem; border-radius: 4px;">
                        </div>
                        <div style="flex: 1;">
                            <label>Duración *</label>
                            <select id="featured-duration" required style="width: 100%; padding: 0.5rem; border-radius: 4px;">
                                <option value="3">3 días</option>
                                <option value="7" selected>7 días</option>
                                <option value="15">15 días</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-actions" style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                        <button type="button" class="btn-cancel" onclick="VV.featured.closeRequestForm()" style="flex: 1; padding: 0.7rem; border-radius: 4px; border: 1px solid #ccc; cursor: pointer;">Cancelar</button>
                        <button type="submit" class="btn-save" style="flex: 1; padding: 0.7rem; border-radius: 4px; background: #f39c12; color: white; border: none; cursor: pointer; font-weight: bold;">
                            <i class="fas fa-paper-plane"></i> Enviar Solicitud
                        </button>
                    </div>
                </form>
            </div>
        `;

        overlay.classList.add('active');

        const form = document.getElementById('featured-request-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                VV.featured.submitRequest();
            };
        }
    },

    // Cerrar el modal
    closeRequestForm() {
        const overlay = document.getElementById('featured-request-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    // ENVIAR A SUPABASE (Función principal corregida)
    async submitRequest() {
        const productSelect = document.getElementById('featured-product');
        const titleInput = document.getElementById('featured-title');
        const descInput = document.getElementById('featured-description');
        const priceInput = document.getElementById('featured-price');
        const durSelect = document.getElementById('featured-duration');

        if (!productSelect.value) return alert('Selecciona un producto');

        // Buscamos datos del producto original para completar la tabla
        const product = VV.data.products.find(p => p.id === productSelect.value);

        try {
            console.log('📡 Enviando solicitud a la tabla featured_requests...');

            const { error } = await supabase
                .from('featured_requests') // Nombre de tabla corregido
                .insert([{
                    product_id: productSelect.value,
                    title: titleInput.value.trim(),
                    description: descInput.value.trim(),
                    product_name: product ? product.product : 'Producto',
                    product_price: priceInput.value ? parseFloat(priceInput.value) : (product ? product.price : 0),
                    duration_days: parseInt(durSelect.value),
                    status: 'pending', // Estado inicial para que el Admin lo vea
                    neighborhood: VV.data.user.neighborhood || VV.data.neighborhood,
                    user_id: VV.data.user.id,
                    user_name: VV.data.user.name || 'Vecino',
                    user_number: VV.data.user.phone || VV.data.user.uniqueNumber || '',
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            console.log('✅ Solicitud guardada exitosamente.');
            VV.featured.closeRequestForm();
            
            if (VV.utils && VV.utils.showSuccess) {
                VV.utils.showSuccess('Solicitud enviada. El administrador la revisará pronto.');
            } else {
                alert('¡Solicitud enviada con éxito!');
            }

        } catch (error) {
            console.error('❌ Error de Supabase:', error);
            alert('No se pudo enviar la solicitud: ' + error.message);
        }
    },

    // CARGAR EL VISOR (Dashboard de vecinos)
    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;

        try {
            const now = new Date().toISOString();
            // Traer solo las aprobadas que no han vencido del barrio actual
            const { data: offers, error } = await supabase
                .from('featured_requests')
                .select('*')
                .eq('status', 'approved')
                .eq('neighborhood', VV.data.user.neighborhood || VV.data.neighborhood)
                .gt('expires_at', now)
                .order('expires_at', { ascending: true });

            if (error) throw error;

            if (!offers || offers.length === 0) {
                container.innerHTML = '<p style="padding: 2rem; color: #999; text-align: center;">No hay ofertas destacadas hoy.</p>';
                return;
            }

            container.innerHTML = offers.map(off => `
                <div class="featured-card" style="min-width: 250px; background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-top: 5px solid #f39c12;">
                    <h4 style="margin: 0; color: #333;">${off.title}</h4>
                    <p style="font-size: 0.9rem; color: #666; margin: 0.5rem 0;">${off.description}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                        <span style="font-weight: bold; color: #27ae60; font-size: 1.1rem;">$${off.product_price}</span>
                        <span style="font-size: 0.75rem; background: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 4px;">Destacado</span>
                    </div>
                </div>
            `).join('');

        } catch (e) {
            console.error('Error cargando visor:', e);
        }
    }
};
