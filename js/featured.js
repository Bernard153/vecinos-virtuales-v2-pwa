window.VV = window.VV || {};
// ========== MÓDULO DESTACADOS FINAL (CORREGIDO 2025) ==========
VV.featured = {
    requestFeatured() {
        const userProducts = VV.data.products || [];
        const overlay = document.getElementById('featured-request-overlay');
        if (!overlay) return;

        overlay.innerHTML = ""; // Limpieza total
        
        // Renderizamos con el borde rojo para confirmar visualmente
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 450px; background: white; padding: 25px; border-radius: 15px; border: 4px solid #ff0000; position: relative; z-index: 10001;">
                <h3 style="text-align:center;"><i class="fas fa-star" style="color:#f39c12;"></i> SOLICITAR DESTACADO</h3>
                <form id="featured-request-form-new">
                    <div style="margin-bottom:15px;">
                        <label style="display:block; font-weight:bold;">Producto a destacar *</label>
                        <select id="f-prod" required style="width:100%; padding:10px; border-radius:8px;">
                            <option value="">-- Seleccionar --</option>
                            ${userProducts.map(p => `<option value="${p.id}">${p.product}</option>`).join('')}
                        </select>
                    </div>

                    <!-- ESTE ES EL CAMPO DE IMAGEN -->
                    <div style="margin-bottom:15px; background:#fff9f0; padding:15px; border:3px dashed #ff0000; border-radius:10px;">
                        <label style="font-weight:bold; color:#d35400;"><i class="fas fa-camera"></i> FOTO DE LA OFERTA *</label>
                        <input type="file" id="f-image" accept="image/*" required style="display:block; width:100%; margin-top:10px;">
                    </div>

                    <div style="margin-bottom:15px;">
                        <label style="display:block; font-weight:bold;">Mensaje de la oferta *</label>
                        <textarea id="f-msg" rows="2" required placeholder="Ej: ¡Oferta imperdible!" style="width:100%; padding:10px; border-radius:8px;"></textarea>
                    </div>

                    <div style="display:flex; gap:10px;">
                        <button type="button" onclick="VV.featured.closeRequestForm()" style="flex:1; padding:12px; border-radius:10px; border:none; cursor:pointer;">CANCELAR</button>
                        <button type="submit" id="f-btn" style="flex:1; padding:12px; border-radius:10px; background:#f39c12; color:white; border:none; font-weight:bold; cursor:pointer;">ENVIAR SOLICITUD</button>
                    </div>
                </form>
            </div>
        `;
        overlay.classList.add('active');

        document.getElementById('featured-request-form-new').onsubmit = (e) => {
            e.preventDefault();
            VV.featured.submitRequest();
        };
    },

    async submitRequest() {
        const btn = document.getElementById('f-btn');
        const fileInput = document.getElementById('f-image');
        const file = fileInput.files[0]; // <--- EL [0] ES FUNDAMENTAL

        if (!file) return alert("Por favor, selecciona una imagen.");

        try {
            btn.disabled = true;
            btn.innerText = "SUBIENDO IMAGEN...";

            // 1. SUBIR AL STORAGE
            const fileName = `${Date.now()}-${VV.data.user.id}.jpg`;
            const { error: upErr } = await supabase.storage
                .from('featured-images')
                .upload(`${VV.data.user.id}/${fileName}`, file);

            if (upErr) throw upErr;

            const { data: { publicUrl } } = supabase.storage
                .from('featured-images')
                .getPublicUrl(`${VV.data.user.id}/${fileName}`);

            // 2. INSERTAR EN TABLA DE SOLICITUDES
            const { error } = await supabase.from('featured_requests').insert([{
                product_id: document.getElementById('f-prod').value,
                user_id: VV.data.user.id,
                message: document.getElementById('f-msg').value,
                product_image: publicUrl,
                status: 'pending',
                neighborhood: VV.data.user.neighborhood || VV.data.neighborhood,
                expires_at: new Date(Date.now() + 604800000).toISOString()
            }]);

            if (error) throw error;
            alert("✅ Solicitud enviada con éxito.");
            this.closeRequestForm();
        } catch (e) {
            alert("Error: " + e.message);
            btn.disabled = false;
            btn.innerText = "ENVIAR SOLICITUD";
        }
    },

    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;
        try {
            const miBarrio = VV.data.user.neighborhood || VV.data.neighborhood;
            const { data: offers, error } = await supabase
                .from('featured_offers')
                .select(`id, expires_at, products!inner(*)`)
                .eq('status', 'active')
                //.eq('products.neighborhood', miBarrio) // FILTRO ESTRICTO
                //.gt('expires_at', new Date().toISOString());//

            if (error) throw error;

            container.innerHTML = (offers || []).map(off => `
                <div class="featured-card" style="border:2px solid orange; padding:12px; border-radius:12px; min-width:220px; background:white;">
                    <img src="${off.products.image_url || ''}" style="width:100%; height:120px; object-fit:cover; border-radius:8px;">
                    <h4 style="margin:8px 0 0 0;">${off.products.product}</h4>
                    <p style="color:#27ae60; font-weight:bold; margin:5px 0;">$${off.products.price}</p>
                    <a href="https://wa.me/${off.products.contact}" target="_blank" style="display:block; text-align:center; background:#25d366; color:white; padding:8px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:10px;">WHATSAPP</a>
                </div>
            `).join('');
        } catch (e) { console.error(e); }
    },

    closeRequestForm() {
        document.getElementById('featured-request-overlay').classList.remove('active');
    }
};
