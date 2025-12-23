// ========== MÓDULO OFERTAS DESTACADAS (COMPLETO: STORAGE + TABLAS - 2025) ==========

VV.featured = {
    requestFeatured() {
        const userProducts = VV.data.products || [];
        const overlay = document.getElementById('featured-request-overlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-star"></i> Solicitar Oferta Destacada</h3>
                <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">
                    Tu solicitud y la imagen de la oferta serán revisadas.
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
                        <label>Mensaje de la oferta *</label>
                        <textarea id="featured-message" rows="2" required placeholder="Ej: ¡Solo por este finde!" style="width: 100%; padding: 0.5rem;"></textarea>
                    </div>
                    
                    <!-- NUEVO: CAMPO DE IMAGEN -->
                    <div class="form-group" style="margin-top: 10px;">
                        <label><i class="fas fa-camera"></i> Foto de la Oferta *</label>
                        <input type="file" id="featured-image-file" accept="image/*" required style="width: 100%; padding: 0.5rem;">
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
                        <button type="submit" style="flex: 1; padding: 0.7rem; background: #f39c12; color: white; border: none; font-weight: bold; cursor: pointer;">
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
        const fileInput = document.getElementById('featured-image-file');

        const product = VV.data.products.find(p => p.id === productSelect.value);
        const file = fileInput.files[0];
        
        if (!file) return alert("Por favor, selecciona una imagen.");

        try {
            // 1. SUBIR IMAGEN AL STORAGE
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${VV.data.user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('featured-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('featured-images')
                .getPublicUrl(filePath);

            // 2. INSERTAR SOLICITUD
            const days = parseInt(durSelect.value);
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + days);

            const { error } = await supabase
                .from('featured_requests')
                .insert([{
                    product_id: productSelect.value,
                    user_id: VV.data.user.id,
                    message: messageInput.value.trim(),
                    status: 'pending',
                    product_name: product ? product.product : 'Producto',
                    product_price: priceInput.value ? parseFloat(priceInput.value) : (product ? product.price : 0),
                    product_image: publicUrl, // URL del storage
                    expires_at: expireDate.toISOString() 
                }]);

            if (error) throw error;

            alert('✅ Solicitud e imagen enviadas con éxito.');
            VV.featured.closeRequestForm();

        } catch (error) {
            console.error('❌ Error:', error);
            alert('Error: ' + error.message);
        }
    },

    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;

        try {
            const now = new Date().toISOString();
            const { data: offers, error } = await supabase
                .from('featured_offers') 
                .select(`id, expires_at, products (product, price, seller_name, contact, neighborhood, image_url)`)
                .eq('status', 'active') 
                .gt('expires_at', now);

            if (error) throw error;

            if (!offers || offers.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#999;">No hay ofertas hoy.</p>';
                return;
            }

            container.innerHTML = offers.map(off => {
                const p = off.products;
                if (!p) return '';
                const dias = Math.ceil((new Date(off.expires_at) - new Date()) / (86400000));

                return `
                    <div class="featured-card" style="border: 2px solid #f39c12; padding: 1rem; border-radius: 12px; min-width: 220px; background: white;">
                        <img src="${p.image_url || 'via.placeholder.com'}" style="width:100%; height:120px; object-fit:cover; border-radius:8px;">
                        <h4 style="margin:8px 0 0 0;">${p.product}</h4>
                        <p style="color: #27ae60; font-weight: bold; margin: 4px 0;">$${p.price}</p>
                        <small style="color: #999;">${dias} días restantes</small>
                        <a href="wa.me{p.contact}" target="_blank" style="display:block; text-align:center; background:#25d366; color:white; padding:8px; border-radius:6px; margin-top:10px; text-decoration:none;">
                            <i class="fab fa-whatsapp"></i> Contactar
                        </a>
                    </div>
                `;
            }).join('');
        } catch (e) { console.error(e); }
    }
};
