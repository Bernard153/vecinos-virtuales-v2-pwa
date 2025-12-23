// ========== MÓDULO OFERTAS DESTACADAS (VERSIÓN FINAL 2025) ==========
VV.featured = {
    requestFeatured() {
        const userProducts = VV.data.products || [];
        const overlay = document.getElementById('featured-request-overlay');
        if (!overlay) return;

        // Limpieza previa para forzar renderizado
        overlay.innerHTML = ""; 

        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 450px; margin: 20px auto; background: white; padding: 25px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); border: 2px solid #f39c12;">
                <h3 style="color: #2c3e50; text-align:center; margin-bottom:10px;">
                    <i class="fas fa-star" style="color: #f39c12;"></i> SOLICITAR DESTACADO
                </h3>
                <p style="text-align:center; color:#666; font-size:0.85rem; margin-bottom:20px;">
                    Tu oferta será visible solo en el barrio: <br><b>${VV.data.user.neighborhood || VV.data.neighborhood || 'Tu Barrio'}</b>
                </p>
                
                <form id="featured-request-form">
                    <!-- 1. SELECCIÓN DE PRODUCTO -->
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: bold; display: block; margin-bottom:5px;">¿Qué producto deseas destacar? *</label>
                        <select id="featured-product" required style="width: 100%; height: 40px; border: 1px solid #ccc; border-radius: 8px; padding: 0 10px;">
                            <option value="">-- Seleccionar producto --</option>
                            ${userProducts.map(p => `<option value="${p.id}">${p.product} ($${p.price})</option>`).join('')}
                        </select>
                    </div>

                    <!-- 2. CAMPO DE IMAGEN RESALTADO -->
                    <div class="form-group" style="margin-bottom: 15px; background: #fff9f0; padding: 15px; border-radius: 10px; border: 2px dashed #f39c12;">
                        <label style="font-weight: bold; color: #d35400; display: block; margin-bottom:8px;">
                            <i class="fas fa-camera"></i> FOTO DE LA OFERTA *
                        </label>
                        <input type="file" id="featured-image-file" accept="image/*" required style="display: block; width: 100%; cursor: pointer;">
                        <small style="color: #e67e22; display:block; margin-top:5px; font-size:0.75rem;">Sube la imagen que verán los vecinos en el visor.</small>
                    </div>

                    <!-- 3. MENSAJE -->
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: bold; display: block; margin-bottom:5px;">Mensaje de la oferta *</label>
                        <textarea id="featured-message" rows="2" required placeholder="Ej: ¡Solo por este fin de semana!" style="width: 100%; border: 1px solid #ccc; border-radius: 8px; padding: 10px; font-family: inherit;"></textarea>
                    </div>

                    <!-- 4. PRECIO Y DURACIÓN -->
                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <div style="flex: 1;">
                            <label style="font-weight: bold; display: block; margin-bottom:5px;">Precio Oferta ($)</label>
                            <input type="number" id="featured-price" step="0.01" placeholder="Opcional" style="width: 100%; height: 40px; border: 1px solid #ccc; border-radius: 8px; padding: 0 10px;">
                        </div>
                        <div style="flex: 1;">
                            <label style="font-weight: bold; display: block; margin-bottom:5px;">Duración *</label>
                            <select id="featured-duration" style="width: 100%; height: 40px; border: 1px solid #ccc; border-radius: 8px; padding: 0 10px;">
                                <option value="3">3 días</option>
                                <option value="7" selected>7 días</option>
                                <option value="15">15 días</option>
                            </select>
                        </div>
                    </div>

                    <!-- BOTONES -->
                    <div style="display: flex; gap: 10px;">
                        <button type="button" onclick="VV.featured.closeRequestForm()" style="flex: 1; padding: 12px; border-radius: 10px; background: #eee; border: none; font-weight: bold; cursor: pointer;">CANCELAR</button>
                        <button type="submit" id="btn-submit-featured" style="flex: 1; padding: 12px; border-radius: 10px; background: #f39c12; color: white; border: none; font-weight: bold; cursor: pointer;">ENVIAR SOLICITUD</button>
                    </div>
                </form>
            </div>
        `;

        overlay.classList.add('active');
        
        document.getElementById('featured-request-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-submit-featured');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
            await VV.featured.submitRequest();
        };
    },

    closeRequestForm() {
        const overlay = document.getElementById('featured-request-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    async submitRequest() {
        const productSelect = document.getElementById('featured-product');
        const fileInput = document.getElementById('featured-image-file');
        const file = fileInput.files[0]; // Captura el archivo correctamente

        if (!file) {
            alert("Debes seleccionar una imagen.");
            document.getElementById('btn-submit-featured').disabled = false;
            document.getElementById('btn-submit-featured').innerText = "ENVIAR SOLICITUD";
            return;
        }

        try {
            // 1. SUBIR IMAGEN AL STORAGE
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${VV.data.user.id}.${fileExt}`;
            const filePath = `${VV.data.user.id}/${fileName}`;

            const { error: upErr } = await supabase.storage
                .from('featured-images')
                .upload(filePath, file);

            if (upErr) throw upErr;

            const { data: { publicUrl } } = supabase.storage
                .from('featured-images')
                .getPublicUrl(filePath);

            // 2. INSERTAR EN BASE DE DATOS
            const days = parseInt(document.getElementById('featured-duration').value);
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + days);

            const { error } = await supabase.from('featured_requests').insert([{
                product_id: productSelect.value,
                user_id: VV.data.user.id,
                neighborhood: VV.data.user.neighborhood || VV.data.neighborhood,
                message: document.getElementById('featured-message').value.trim(),
                product_image: publicUrl,
                status: 'pending',
                created_at: new Date().toISOString(),
                expires_at: expireDate.toISOString()
            }]);

            if (error) throw error;

            alert('✅ Solicitud y foto enviadas con éxito. El administrador las revisará pronto.');
            this.closeRequestForm();
            
        } catch (e) {
            console.error('Error:', e);
            alert('Error al enviar: ' + e.message);
            document.getElementById('btn-submit-featured').disabled = false;
            document.getElementById('btn-submit-featured').innerText = "ENVIAR SOLICITUD";
        }
    },

    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;

        try {
            const userNeighborhood = VV.data.user.neighborhood || VV.data.neighborhood;
            const now = new Date().toISOString();

            // CONSULTA CON FILTRO DE BARRIO
            const { data: offers, error } = await supabase
                .from('featured_offers')
                .select(`
                    id, expires_at,
                    products!inner ( product, price, seller_name, contact, neighborhood, image_url )
                `)
                .eq('status', 'active')
                .eq('products.neighborhood', userNeighborhood)
                .gt('expires_at', now);

            if (error) throw error;

            if (!offers || offers.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:#999; padding:20px; width:100%;">No hay ofertas destacadas hoy en ${userNeighborhood}.</p>`;
                return;
            }

            container.innerHTML = offers.map(off => {
                const p = off.products;
                const diasRest = Math.ceil((new Date(off.expires_at) - new Date()) / 86400000);

                return `
                    <div class="featured-card" style="border: 2px solid #f39c12; padding: 15px; border-radius: 15px; min-width: 240px; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <img src="${p.image_url || 'via.placeholder.com'}" style="width:100%; height:140px; object-fit:cover; border-radius:10px;">
                        <h4 style="margin:10px 0 5px 0; color:#2c3e50;">${p.product}</h4>
                        <p style="color: #27ae60; font-weight: bold; font-size: 1.2rem; margin: 5px 0;">$${p.price}</p>
                        <div style="font-size: 0.8rem; color:#777; margin-bottom:10px;">
                            <span><i class="fas fa-user"></i> ${p.seller_name}</span><br>
                            <span><i class="far fa-clock"></i> Quedan ${diasRest} días</span>
                        </div>
                        <a href="wa.me{p.contact}" target="_blank" style="display:block; text-align:center; background:#25d366; color:white; padding:10px; border-radius:8px; text-decoration:none; font-weight:bold;">
                            <i class="fab fa-whatsapp"></i> CONTACTAR
                        </a>
                    </div>
                `;
            }).join('');
        } catch (e) {
            console.error('Error visor:', e);
            container.innerHTML = '<p style="color:red; text-align:center;">Error al cargar destacados.</p>';
        }
    }
};
