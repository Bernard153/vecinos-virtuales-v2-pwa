// ========== MÓDULO DESTACADOS FINAL (CORREGIDO 2025, REVISADO 2026-01-02) ==========
VV.featured = {
    requestFeatured() {
        const userProducts = VV.data.products || [];
        const overlay = document.getElementById('featured-request-overlay');
        if (!overlay) return;

        overlay.innerHTML = ""; // Limpieza total

        // Helper para construir las opciones del select (escapando comillas también)
        const productOptions = userProducts.map(p => {
            const name = String(p.product || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const id = String(p.id || '').replace(/"/g, '&quot;');
            return `<option value="${id}">${name}</option>`;
        }).join('');

        // Renderizamos con el borde rojo para confirmar visualmente
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 450px; background: white; padding: 25px; border-radius: 15px; border: 4px solid #ff0000; position: relative; z-index: 10001;">
                <h3 style="text-align:center;"><i class="fas fa-star" style="color:#f39c12;"></i> SOLICITAR DESTACADO</h3>
                <form id="featured-request-form-new" novalidate>
                    <div style="margin-bottom:15px;">
                        <label style="display:block; font-weight:bold;">Producto a destacar *</label>
                        <select id="f-prod" required style="width:100%; padding:10px; border-radius:8px;">
                            <option value="">-- Seleccionar --</option>
                            ${productOptions}
                        </select>
                    </div>

                    <!-- ESTE ES EL CAMPO DE IMAGEN -->
                    <div style="margin-bottom:15px; background:#fff9f0; padding:15px; border:3px dashed #ff0000; border-radius:10px;">
                        <label style="font-weight:bold; color:#d35400;"><i class="fas fa-camera"></i> FOTO DE LA OFERTA *</label>
                        <input type="file" id="f-image" accept="image/*" required style="display:block; width:100%; margin-top:10px;">
                        <small style="color:#666;">Formatos aceptados: JPG, PNG, WEBP. Máx 5MB.</small>
                    </div>

                    <div style="margin-bottom:15px;">
                        <label style="display:block; font-weight:bold;">Mensaje de la oferta *</label>
                        <textarea id="f-msg" rows="2" required placeholder="Ej: ¡Oferta imperdible!" style="width:100%; padding:10px; border-radius:8px;"></textarea>
                    </div>

                    <div style="display:flex; gap:10px;">
                        <button type="button" id="f-cancel" style="flex:1; padding:12px; border-radius:10px; border:none; cursor:pointer; background:#e0e0e0;">CANCELAR</button>
                        <button type="submit" id="f-btn" style="flex:1; padding:12px; border-radius:10px; background:#f39c12; color:white; border:none; font-weight:bold; cursor:pointer;">ENVIAR SOLICITUD</button>
                    </div>
                </form>
            </div>
        `;
        overlay.classList.add('active');

        const form = document.getElementById('featured-request-form-new');
        const cancelBtn = document.getElementById('f-cancel');

        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                VV.featured.submitRequest();
            };
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => VV.featured.closeRequestForm());
        }
    },

    async submitRequest() {
        const btn = document.getElementById('f-btn');
        const fileInput = document.getElementById('f-image');
        const prodSelect = document.getElementById('f-prod');
        const msgInput = document.getElementById('f-msg');

        if (!btn || !fileInput || !prodSelect || !msgInput) {
            return alert("Formulario incompleto (elementos faltantes).");
        }

        const file = fileInput.files && fileInput.files[0]; // <--- EL [0] ES FUNDAMENTAL

        // Validaciones
        if (!prodSelect.value) return alert("Por favor, selecciona un producto.");
        if (!file) return alert("Por favor, selecciona una imagen.");
        if (!msgInput.value || String(msgInput.value).trim().length < 3) return alert("Por favor, escribe un mensaje válido (mín 3 caracteres).");

        const maxBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxBytes) return alert("La imagen es demasiado grande. Máximo 5MB.");
        if (!file.type || !file.type.startsWith('image/')) return alert("El archivo seleccionado no es una imagen.");

        // Conservar la extensión original de forma segura
        const origName = file.name || '';
        const extMatch = origName.match(/\.([a-zA-Z0-9]+)$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : (file.type.split('/')[1] || 'jpg');
        const safeExt = String(ext).replace(/[^a-z0-9]/gi, '');
        const fileName = `${Date.now()}-${String(VV.data.user?.id || 'anon')}.${safeExt}`;

        try {
            btn.disabled = true;
            const prevText = btn.innerText;
            btn.innerText = "SUBIENDO IMAGEN...";

            // 1. SUBIR AL STORAGE
            const path = `${VV.data.user?.id || 'unknown'}/${fileName}`;
            // Hacemos explícito upsert: false para evitar sobrescritura accidental
            const { data: uploadData, error: upErr } = await supabase.storage
                .from('featured-images')
                .upload(path, file, { upsert: false });

            if (upErr) throw upErr;

            // 2. OBTENER PUBLIC URL (manejar defensivamente para distintas versiones del SDK)
            const getPublic = await supabase.storage.from('featured-images').getPublicUrl(path);
            const publicUrl = (getPublic && getPublic.data && (getPublic.data.publicUrl || getPublic.data.public_url || getPublic.data.publicURL)) || null;
            if (!publicUrl) throw new Error('No se pudo obtener la URL pública de la imagen.');

            // 3. INSERTAR EN TABLA DE SOLICITUDES
            const insertPayload = {
                product_id: prodSelect.value,
                user_id: VV.data.user?.id || null,
                message: String(msgInput.value).trim(),
                product_image: publicUrl,
                status: 'pending',
                neighborhood: VV.data.user?.neighborhood || VV.data?.neighborhood || null,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // +7 días
            };

            const { data: insertData, error } = await supabase.from('featured_requests').insert([insertPayload]);

            if (error) throw error;

            alert("✅ Solicitud enviada con éxito.");
            // restaurar estado del botón y cerrar
            btn.disabled = false;
            btn.innerText = prevText || "ENVIAR SOLICITUD";
            this.closeRequestForm();
        } catch (e) {
            const msg = e?.message || e || 'Error desconocido';
            alert("Error: " + msg);
            if (btn) {
                btn.disabled = false;
                btn.innerText = "ENVIAR SOLICITUD";
            }
        }
    },

    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;
        try {
            const miBarrio = VV.data.user?.neighborhood || VV.data?.neighborhood;
            const now = new Date().toISOString();
            const { data: offers, error } = await supabase
                .from('featured_offers')
                .select(`id, expires_at, status, products(*)`)
                .eq('status', 'active')
                .gt('expires_at', now);

            if (error) throw error;

            // Helper para escapar texto
            const esc = (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            container.innerHTML = (offers || []).map(off => {
                const prod = Array.isArray(off.products) ? off.products[0] : off.products || {};
                const img = esc(prod.image_url || '');
                const title = esc(prod.product || 'Producto');
                const price = esc(prod.price || '');
                const contact = esc(prod.contact || '');
                const priceText = price !== '' ? `$${price}` : '';
                const waLink = contact ? `https://wa.me/${contact}` : '#';

                return `
                    <div class="featured-card" style="border:2px solid orange; padding:12px; border-radius:12px; min-width:220px; background:white;">
                        <img src="${img}" alt="${title}" style="width:100%; height:120px; object-fit:cover; border-radius:8px;">
                        <h4 style="margin:8px 0 0 0;">${title}</h4>
                        <p style="color:#27ae60; font-weight:bold; margin:5px 0;">${priceText}</p>
                        <a href="${waLink}" target="_blank" rel="noopener" style="display:block; text-align:center; background:#25d366; color:white; padding:8px; border-radius:8px; text-decoration:none;">
                            Contactar por WhatsApp
                        </a>
                    </div>
                `;
            }).join('');
        } catch (e) {
            console.error('loadFeaturedOffers error:', e);
        }
    },

    closeRequestForm() {
        const overlay = document.getElementById('featured-request-overlay');
        if (overlay) overlay.classList.remove('active');
    }
};
