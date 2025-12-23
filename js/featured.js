// ========== MÓDULO OFERTAS DESTACADAS (FILTRO POR BARRIO + IMAGEN - 2025) ==========

VV.featured = {
    requestFeatured() {
        const userProducts = VV.data.products || [];
        const overlay = document.getElementById('featured-request-overlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 450px; margin: 20px auto; background: white; padding: 20px; border-radius: 15px;">
                <h3><i class="fas fa-star" style="color: #f39c12;"></i> Solicitar Oferta Destacada</h3>
                <p style="color: #666; font-size: 0.85rem; margin-bottom: 1rem;">La imagen y oferta serán visibles solo en <b>${VV.data.user.neighborhood || 'tu barrio'}</b>.</p>
                
                <form id="featured-request-form">
                    <div class="form-group">
                        <label>Producto a destacar *</label>
                        <select id="featured-product" required style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="">Selecciona uno...</option>
                            ${userProducts.map(p => `<option value="${p.id}">${p.product} - $${p.price}</option>`).join('')}
                        </select>
                    </div>

                    <!-- CAMPO DE IMAGEN (ASEGÚRATE DE QUE ESTE BLOQUE ESTÉ AQUÍ) -->
                    <div class="form-group" style="margin-top: 15px;">
                        <label><i class="fas fa-camera"></i> Foto de la Oferta *</label>
                        <input type="file" id="featured-image-file" accept="image/*" required style="width: 100%; margin-top: 5px;">
                        <small style="display:block; color: #999; font-size: 0.75rem;">Sube la foto que verán los vecinos.</small>
                    </div>

                    <div class="form-group" style="margin-top: 15px;">
                        <label>Mensaje publicitario *</label>
                        <textarea id="featured-message" rows="2" required placeholder="Ej: ¡Oferta exclusiva solo por hoy!" style="width: 100%; padding: 8px; margin-top: 5px;"></textarea>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <div style="flex: 1;">
                            <label>Precio Oferta ($)</label>
                            <input type="number" id="featured-price" step="0.01" style="width: 100%; padding: 8px;">
                        </div>
                        <div style="flex: 1;">
                            <label>Días *</label>
                            <select id="featured-duration" style="width: 100%; padding: 8px;">
                                <option value="3">3 días</option>
                                <option value="7" selected>7 días</option>
                                <option value="15">15 días</option>
                            </select>
                        </div>
                    </div>

                    <div style="margin-top: 20px; display: flex; gap: 10px;">
                        <button type="button" onclick="VV.featured.closeRequestForm()" style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #ccc; cursor: pointer;">Cancelar</button>
                        <button type="submit" style="flex: 1; padding: 10px; border-radius: 8px; background: #f39c12; color: white; border: none; font-weight: bold; cursor: pointer;">Enviar Solicitud</button>
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
        const fileInput = document.getElementById('featured-image-file');
        const file = fileInput.files[0]; // NOTA EL [0] - ES CRUCIAL

        if (!file) return alert("Debes subir una imagen.");

        try {
            console.log('📡 Subiendo imagen...');
            const fileName = `${Date.now()}-${VV.data.user.id}.jpg`;
            const { error: upErr } = await supabase.storage.from('featured-images').upload(`${VV.data.user.id}/${fileName}`, file);
            if (upErr) throw upErr;

            const { data: { publicUrl } } = supabase.storage.from('featured-images').getPublicUrl(`${VV.data.user.id}/${fileName}`);

            const { error } = await supabase.from('featured_requests').insert([{
                product_id: productSelect.value,
                user_id: VV.data.user.id,
                message: document.getElementById('featured-message').value,
                product_image: publicUrl,
                status: 'pending',
                expires_at: new Date(Date.now() + (parseInt(document.getElementById('featured-duration').value) * 86400000)).toISOString()
            }]);

            if (error) throw error;
            alert('✅ Solicitud enviada.');
            this.closeRequestForm();
        } catch (e) { alert('Error: ' + e.message); }
    },

    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;

        try {
            const userNeighborhood = VV.data.user.neighborhood || VV.data.neighborhood;
            
            // CORRECCIÓN DE FILTRO: Solo mostramos lo del barrio del usuario logueado
            const { data: offers, error } = await supabase
                .from('featured_offers')
                .select(`
                    id, expires_at,
                    products!inner ( product, price, seller_name, contact, neighborhood, image_url )
                `)
                .eq('status', 'active')
                .eq('products.neighborhood', userNeighborhood) // <--- FILTRO DE BARRIO
                .gt('expires_at', new Date().toISOString());

            if (error) throw error;

            if (!offers || offers.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:#999; width:100%;">No hay ofertas hoy en ${userNeighborhood}.</p>`;
                return;
            }

            container.innerHTML = offers.map(off => `
                <div class="featured-card" style="border: 2px solid #f39c12; padding: 12px; border-radius: 12px; min-width: 220px; background: white;">
                    <img src="${off.products.image_url || 'via.placeholder.com'}" style="width:100%; height:120px; object-fit:cover; border-radius:8px;">
                    <h4 style="margin:8px 0 2px 0;">${off.products.product}</h4>
                    <p style="color: #27ae60; font-weight: bold; margin: 4px 0;">$${off.products.price}</p>
                    <small style="color: #666; font-size: 0.75rem;">Vendedor: ${off.products.seller_name}</small>
                    <a href="wa.me{off.products.contact}" target="_blank" style="display:block; text-align:center; background:#25d366; color:white; padding:8px; border-radius:6px; margin-top:10px; text-decoration:none; font-weight:bold;">
                        <i class="fab fa-whatsapp"></i> Contactar
                    </a>
                </div>
            `).join('');
        } catch (e) { console.error('Error visor:', e); }
    }
};
