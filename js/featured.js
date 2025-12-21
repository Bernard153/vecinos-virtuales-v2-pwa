// ========== MÓDULO OFERTAS DESTACADAS (CORREGIDO PARA TUS COLUMNAS - 2025) ==========

VV.featured = {
    requestFeatured() {
        const userProducts = VV.data.products || [];
        const overlay = document.getElementById('featured-request-overlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-star"></i> Solicitar Oferta Destacada</h3>
                <p style="color: #666; margin-bottom: 1.5rem; font-size: 0.9rem;">
                    Tu solicitud será revisada por el administrador.
                </p>
                <form id="featured-request-form">
                    <div class="form-group">
                        <label>Selecciona tu producto *</label>
                        <select id="featured-product" required style="width: 100%; padding: 0.5rem;">
                            <option value="">Seleccionar producto</option>
                            ${userProducts.map(p => `
                                <option value="${p.id}">${p.product} - $${p.price}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="margin-top: 10px;">
                        <label>Mensaje / Descripción de la oferta *</label>
                        <textarea id="featured-message" rows="3" required placeholder="Ej: ¡Solo por este finde!" style="width: 100%; padding: 0.5rem;"></textarea>
                    </div>
                    <div class="form-group" style="display: flex; gap: 1rem; margin-top: 10px;">
                        <div style="flex: 1;">
                            <label>Precio Oferta ($)</label>
                            <input type="number" id="featured-price" step="0.01" style="width: 100%; padding: 0.5rem;">
                        </div>
                        <div style="flex: 1;">
                            <label>Duración *</label>
                            <select id="featured-duration" required style="width: 100%; padding: 0.5rem;">
                                <option value="3">3 días</option>
                                <option value="7" selected>7 días</option>
                                <option value="15">15 días</option>
                            </select>
                        </div>
                    </div>
                    <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                        <button type="button" onclick="VV.featured.closeRequestForm()" style="flex: 1; padding: 0.7rem;">Cancelar</button>
                        <button type="submit" style="flex: 1; padding: 0.7rem; background: #f39c12; color: white; border: none; font-weight: bold;">
                            Enviar Solicitud
                        </button>
                    </div>
                </form>
            </div>
        `;

        overlay.classList.add('active');
        document.getElementById('featured-request-form').onsubmit = (e) => {
            e.preventDefault();
            VV.featured.submitRequest();
        };
    },

    closeRequestForm() {
        const overlay = document.getElementById('featured-request-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    async submitRequest() {
        const productSelect = document.getElementById('featured-product');
        const messageInput = document.getElementById('featured-message');
        const priceInput = document.getElementById('featured-price');
        const durSelect = document.getElementById('featured-duration');

        const product = VV.data.products.find(p => p.id === productSelect.value);
        const days = parseInt(durSelect.value);
        
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + days);

        try {
            console.log('📡 Enviando a Supabase...');

            const { error } = await supabase
                .from('featured_requests')
                .insert([{
                    product_id: productSelect.value,
                    user_id: VV.data.user.id,
                    neighborhood: VV.data.user.neighborhood || VV.data.neighborhood,
                    duration_days: days,
                    message: messageInput.value.trim(),
                    status: 'pending', // Así lo verá el Admin
                    product_name: product ? product.product : 'Producto',
                    product_price: priceInput.value ? parseFloat(priceInput.value) : (product ? product.price : 0),
                    product_unit: product ? product.unit : '',
                    product_image: product ? product.image_url : '', // Ajustado a tu columna
                    user_name: VV.data.user.name || 'Vecino',
                    user_number: VV.data.user.phone || '',
                    created_at: new Date().toISOString(),
                    expires_at: expireDate.toISOString() 
                }]);

            if (error) throw error;

            alert('✅ Solicitud enviada correctamente.');
            VV.featured.closeRequestForm();

        } catch (error) {
            console.error('❌ Error:', error);
            alert('No se pudo enviar: ' + error.message);
        }
    },

async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;

        try {
            const now = new Date().toISOString();
            
            // CORRECCIÓN CLAVE:
            // 1. Usamos 'featured_requests' (la tabla que SI tiene los datos).
            // 2. Filtramos por 'active' (el único estado que tu DB acepta para aprobados).
            // 3. Eliminamos el filtro de 'blocked' y 'neighborhood' para asegurar visibilidad.
            
            const { data: offers, error } = await supabase
                .from('featured_requests') 
                .select('*')
                .eq('status', 'active') 
                .gt('expires_at', now)
                .order('expires_at', { ascending: true });

            if (error) throw error;

            console.log("🚀 Ofertas cargadas con éxito:", offers);

            if (!offers || offers.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#999; width:100%;">No hay ofertas destacadas.</p>';
                return;
            }

            container.innerHTML = offers.map(off => `
                <div class="featured-card" style="border: 2px solid #f39c12; padding: 1rem; border-radius: 12px; min-width: 220px; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h4 style="margin:0; color: #2c3e50;">${off.product_name}</h4>
                    <p style="font-size:0.85rem; color:#555; margin: 8px 0;">${off.message || ''}</p>
                    <p style="color: #27ae60; font-weight: bold; font-size: 1.2rem; margin: 5px 0;">$${off.product_price}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <small style="color: #999;"><i class="far fa-calendar-alt"></i> ${new Date(off.expires_at).toLocaleDateString()}</small>
                        <span style="font-size: 0.7rem; background: #fff3e0; color: #f39c12; padding: 2px 6px; border-radius: 4px;">${off.neighborhood || 'Vecino'}</span>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('❌ Error cargando ofertas destacadas:', error);
            container.innerHTML = '<p style="text-align:center; color:red;">Error al cargar destacados.</p>';
        }
    }
};
