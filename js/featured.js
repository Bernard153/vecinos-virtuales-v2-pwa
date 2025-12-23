// ========== MÓDULO DESTACADOS 2025 (CON IMAGEN Y FILTRO GLOBAL ADMIN) ==========
VV.featured = {
    requestFeatured() {
        const userProducts = VV.data.products || [];
        const overlay = document.getElementById('featured-request-overlay');
        if (!overlay) return;

        // 1. Limpiamos el contenido por completo primero
        overlay.innerHTML = "";
        overlay.classList.remove('active');

        // 2. Pequeña pausa para forzar al navegador a procesar el cambio
        setTimeout(() => {
            overlay.innerHTML = `
                <div class="modal-form" style="max-width: 450px; background: white; padding: 25px; border-radius: 15px; border: 3px solid #f39c12; position: relative; z-index: 10001 !important;">
                    <h3 style="text-align:center; color:#2c3e50;"><i class="fas fa-star" style="color:#f39c12;"></i> SOLICITAR DESTACADO</h3>
                    <form id="featured-request-form">
                        <div style="margin-bottom:15px;">
                            <label style="display:block; font-weight:bold;">¿Qué producto deseas destacar? *</label>
                            <select id="featured-product" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc;">
                                <option value="">-- Seleccionar --</option>
                                ${userProducts.map(p => `<option value="${p.id}">${p.product}</option>`).join('')}
                            </select>
                        </div>

                        <!-- DIV DE IMAGEN RESALTADO CON COLOR ROJO PARA PRUEBA -->
                        <div style="margin-bottom:15px; background:#fff9f0; padding:15px; border:3px dashed #ff0000; border-radius:10px; display: block !important;">
                            <label style="font-weight:bold; color:#d35400; display: block !important;"><i class="fas fa-camera"></i> FOTO DE LA OFERTA *</label>
                            <input type="file" id="featured-image-file" accept="image/*" required style="display:block !important; width:100%; margin-top:10px; opacity: 1 !important; visibility: visible !important;">
                        </div>

                        <div style="margin-bottom:15px;">
                            <label style="display:block; font-weight:bold;">Mensaje de la oferta *</label>
                            <textarea id="featured-message" rows="2" required placeholder="Ej: ¡Oferta imperdible!" style="width:100%; border-radius:8px; padding:10px; border:1px solid #ccc;"></textarea>
                        </div>

                        <div style="display:flex; gap:10px;">
                            <button type="button" onclick="VV.featured.closeRequestForm()" style="flex:1; padding:12px; border-radius:10px; background:#eee; border:none; cursor:pointer;">CANCELAR</button>
                            <button type="submit" id="btn-submit-featured" style="flex:1; padding:12px; border-radius:10px; background:#f39c12; color:white; border:none; font-weight:bold; cursor:pointer;">ENVIAR SOLICITUD</button>
                        </div>
                    </form>
                </div>
            `;
            overlay.classList.add('active');
            
            // Re-asignar el evento después de crear el HTML
            document.getElementById('featured-request-form').onsubmit = (e) => {
                e.preventDefault();
                VV.featured.submitRequest();
            };
        }, 100);
    },
    async submitRequest() {
        const btn = document.getElementById('btn-submit-featured');
        const fileInput = document.getElementById('featured-image-file');
        const file = fileInput.files[0]; // CAPTURA EL ARCHIVO REAL

        if (!file) return alert("Selecciona una foto");
        
        try {
            btn.disabled = true;
            btn.innerText = "Subiendo...";

            // 1. Subir al Storage
            const fileName = `${Date.now()}-${VV.data.user.id}.jpg`;
            const { error: upErr } = await supabase.storage.from('featured-images').upload(`${VV.data.user.id}/${fileName}`, file);
            if (upErr) throw upErr;

            const { data: { publicUrl } } = supabase.storage.from('featured-images').getPublicUrl(`${VV.data.user.id}/${fileName}`);

            // 2. Insertar solicitud
            const { error } = await supabase.from('featured_requests').insert([{
                product_id: document.getElementById('featured-product').value,
                user_id: VV.data.user.id,
                neighborhood: VV.data.user.neighborhood || VV.data.neighborhood,
                message: document.getElementById('featured-message').value,
                product_image: publicUrl,
                status: 'pending',
                expires_at: new Date(Date.now() + 604800000).toISOString() // 7 días
            }]);

            if (error) throw error;
            alert("✅ Solicitud enviada con imagen");
            this.closeRequestForm();
        } catch (e) {
            alert("Error: " + e.message);
            btn.disabled = false;
        }
    },

    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;

        try {
            const userNB = VV.data.user.neighborhood || VV.data.neighborhood;
            
            // FILTRO: Muestra lo de tu barrio O lo que publique un Administrador
            const { data: offers, error } = await supabase
                .from('featured_offers')
                .select(`id, expires_at, products!inner ( product, price, seller_name, contact, neighborhood, image_url )`)
                .eq('status', 'active')
                .or(`neighborhood.eq."${userNB}",neighborhood.eq."Administrador"`, { foreignTable: 'products' })
                .gt('expires_at', new Date().toISOString());

            if (error) throw error;

            container.innerHTML = (offers || []).map(off => `
                <div class="featured-card" style="border:2px solid #f39c12; padding:12px; border-radius:12px; min-width:220px; background:white;">
                    <img src="${off.products.image_url || 'via.placeholder.com'}" style="width:100%; height:120px; object-fit:cover; border-radius:8px;">
                    <h4 style="margin:8px 0 0 0;">${off.products.product}</h4>
                    <p style="color:#27ae60; font-weight:bold; margin:5px 0;">$${off.products.price}</p>
                    <a href="wa.me{off.products.contact}" target="_blank" style="display:block; text-align:center; background:#25d366; color:white; padding:8px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:10px;">WHATSAPP</a>
                </div>
            `).join('');
        } catch (e) { console.error(e); }
    },

    closeRequestForm() { document.getElementById('featured-request-overlay').classList.remove('active'); }
};
