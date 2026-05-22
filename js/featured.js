// ========== MÓDULO OFERTAS DESTACADAS + CAROUSEL SUPERIOR (PARTE 1) ==========

VV.featured = {
    // Solicitar destacar oferta
    requestFeatured() {
        // Verificar si el usuario tiene productos
        const userProducts = VV.data.products.filter(p => p.seller_id === VV.data.user.id);

        if (userProducts.length === 0) {
            alert('Primero debes publicar al menos un producto para poder destacarlo.');
            VV.utils.showSection('marketplace');
            return;
        }

        let overlay = document.getElementById('featured-request-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'featured-request-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-star"></i> Solicitar Oferta Destacada</h3>
                <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                    Las ofertas destacadas aparecen en el dashboard principal y son votadas por la comunidad.
                    <strong style="color: var(--error-red);">Importante:</strong> Si recibes 10 valoraciones negativas, tu cuenta será bloqueada.
                </p>
                <form id="featured-request-form">
                    <div class="form-group">
                        <label>Selecciona tu producto *</label>
                        <select id="featured-product" required>
                            <option value="">Seleccionar producto</option>
                            ${userProducts.map(p => `
                                <option value="\${p.id}">\({p.product} -\)\({p.price}/\){p.unit}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Título de la oferta *</label>
                        <input type="text" id="featured-title" required placeholder="Ej: ¡Oferta especial! 20% de descuento">
                    </div>
                    <div class="form-group">
                        <label>Descripción de la oferta *</label>
                        <textarea id="featured-description" rows="3" required placeholder="Describe tu oferta especial..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Precio especial (opcional)</label>
                        <input type="number" id="featured-price" min="0" step="0.01" placeholder="Deja vacío para usar el precio original">
                    </div>
                    <div class="form-group">
                        <label>Imagen de la oferta (Opcional - Recomendado)</label>
                        <div style="background: var(--gray-50); border: 2px dashed var(--gray-300); border-radius: 8px; padding: 1rem; text-align: center;">
                            <input type="file" id="featured-image" accept="image/*" 
                                   onchange="VV.featured.previewImage(this)"
                                   style="display: none;">
                            <button type="button" class="btn-secondary" 
                                    onclick="document.getElementById('featured-image').click()"
                                    style="margin-bottom: 0.5rem;">
                                <i class="fas fa-upload"></i> Subir Imagen
                            </button>
                            <p style="font-size: 0.85rem; color: var(--gray-600); margin: 0.5rem 0;">
                                Formatos: JPG, PNG, GIF (máx 5MB)
                            </p>
                            <div id="featured-image-preview" style="margin-top: 0.5rem;"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Duración de la oferta *</label>
                        <select id="featured-duration" required>
                            <option value="3">3 días</option>
                            <option value="7" selected>7 días</option>
                            <option value="15">15 días</option>
                            <option value="30">30 días</option>
                        </select>
                    </div>
                    <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                        <p style="margin: 0; font-size: 0.9rem; color: var(--gray-700);">
                            <i class="fas fa-info-circle"></i> Tu solicitud será revisada por el administrador antes de ser publicada.
                        </p>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.featured.closeRequestForm()">Cancelar</button>
                        <button type="button" class="btn-save" onclick="VV.featured.submitRequest()">
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

        overlay.onclick = (e) => {
            if (e.target === overlay) VV.featured.closeRequestForm();
        };
    },

    // Previsualizar imagen
    previewImage(input) {
        const preview = document.getElementById('featured-image-preview');
        preview.innerHTML = '';

        if (input.files && input.files[0]) {
            const file = input.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen es demasiado grande. El límite es 5MB.');
                input.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                preview.innerHTML = `
                    <div style="position: relative; display: inline-block;">
                        <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid var(--warning-orange);">
                        <button type="button" onclick="document.getElementById('featured-image').value=''; document.getElementById('featured-image-preview').innerHTML='';" 
                                style="position: absolute; top: 5px; right: 5px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        }
    },

    // Cerrar formulario
    closeRequestForm() {
        const overlay = document.getElementById('featured-request-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    // Enviar solicitud corregida a Supabase
    async submitRequest() {
        const productSelect = document.getElementById('featured-product');
        const productId = productSelect ? productSelect.value : null;

        if (!productId) {
            alert('Selecciona un producto');
            return;
        }

        const product = VV.data.products.find(p => p.id === productId);
        if (!product) {
            alert('Producto no encontrado');
            return;
        }

        const title = document.getElementById('featured-title').value.trim();
        const description = document.getElementById('featured-description').value.trim();
        const priceInput = document.getElementById('featured-price').value;
        const duration = document.getElementById('featured-duration').value;
        const imageInput = document.getElementById('featured-image');

        if (!title || !description) {
            alert('Completa los campos obligatorios');
            return;
        }

        try {
            let mediaUrl = product.image_url;

            // Si subió una imagen nueva, la procesamos
            if (imageInput.files && imageInput.files[0]) {
                const file = imageInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${VV.data.user.id}_${Date.now()}.${fileExt}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('featured_images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('featured_images')
                    .getPublicUrl(fileName);
                
                mediaUrl = urlData.publicUrl;
            }

            const featuredPrice = priceInput ? parseFloat(priceInput) : product.price;

            const { error } = await supabase
                .from('featured_offers')
                .insert({
                    product_id: productId,
                    title: title,
                    description: description,
                    price: featuredPrice,
                    image_url: mediaUrl,
                    duration_days: parseInt(duration),
                    seller_id: VV.data.user.id,
                    neighborhood: VV.data.neighborhood,
                    status: 'pendiente'
                });

            if (error) throw error;

            VV.utils.showSuccess('¡Solicitud enviada con éxito! Será revisada por el administrador.');

```javascript
    // Cargar ofertas destacadas reales en el carrusel de abajo
    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;

        try {
            const { data: offers, error } = await supabase
                .from('featured_offers')
                .select('*')
                .eq('neighborhood', VV.data.neighborhood)
                .eq('status', 'aprobado');

            if (error) throw error;

            if (!offers || offers.length === 0) {
                container.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: var(--gray-500); width: 100%;">
                        <p>No hay ofertas destacadas esta semana en tu barrio.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = offers.map(offer => this.renderOfferCard(offer)).join('');

        } catch (error) {
            console.error('Error cargando ofertas destacadas:', error);
        }
    },

    // Renderizar tarjeta individual de oferta destacada comercial
    renderOfferCard(offer) {
        return `
            <div class="featured-card" style="min-width: 240px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 0.75rem; border: 1px solid var(--gray-200); text-align: left;">
                ${offer.image_url ? `<img src="${offer.image_url}" style="width:100%; hieght: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 0.5rem;">` : ''}
                <h4 style="margin: 0; font-weight: bold; color: var(--gray-800); font-size: 0.9rem;">${offer.title}</h4>
                <p style="margin: 2px 0; font-size: 0.75rem; color: var(--gray-600); line-height: 1.2;">${offer.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; border-top: 1px solid var(--gray-100); padding-top: 0.25rem;">
                    <span style="font-weight: bold; color: var(--primary-blue); font-size: 0.9rem;">$${offer.price}</span>
                    <button onclick="VV.marketplace.openContact('${offer.seller_id}')" style="background: var(--primary-blue); color: white; border: none; font-size: 0.7rem; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Contacto</button>
                </div>
            </div>
        `;
    },

    // 🌟 NUEVA INNOVACIÓN INTEGRADA: El Carrusel Superior de Avances y Novedades del Barrio
    renderNovedadesCarrusel() {
        // Buscamos el contenedor padre del dashboard general
        const contenedorPadre = document.getElementById('dashboard-novedades-container') || document.getElementById('featured-container') || document.body;
        
        if (document.getElementById('carrusel-novedades-superior')) return;

        const seccionNovedades = document.createElement('section');
        seccionNovedades.id = 'carrusel-novedades-superior';
        seccionNovedades.style.cssText = 'margin-bottom: 1.5rem; width: 100%; overflow: hidden; padding: 0.5rem 0; font-family: sans-serif;';

        const itemsNovedades = [
            {
                icono: "🎤",
                titulo: "¡Estudio de Karaoke!",
                desc: "Canta tus canciones favoritas con eco real y filtros estéticos. ¡Suma aplausos de tu barrio!",
                accion: "window.location.href='estudio-karaoke.html'",
                textoBoton: "Cantar Ahora 🎙️",
                fondo: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)"
            },
            {
                icono: "🛒",
                titulo: "Ahorra en tu Barrio",
                desc: "Compara precios en tiempo real entre los comercios de tu cuadra antes de salir a comprar.",
                accion: "VV.utils.showSection('marketplace')",
                textoBoton: "Ver Almacenes 🍎",
                fondo: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)"
            },
            {
                icono: "📢",
                titulo: "Reportes de Mejoras",
                desc: "Publica baches o caños rotos. Apoya reclamos con tu nuevo cofre de megáfonos.",
                accion: "VV.utils.showSection('improvements')",
                textoBoton: "Ver Reclamos ⚠️",
                fondo: "linear-gradient(135deg, #7c2d12 0%, #431407 100%)"
            }
        ];

        seccionNovedades.innerHTML = `
            <h3 style="font-size: 0.85rem; text-transform: uppercase; color: #4b5563; letter-spacing: 0.05em; margin: 0 0 0.5rem 0.5rem; font-weight: bold; text-align: left;">
                ✨ Descubre Vecinos Virtuales
            </h3>
            <div id="tira-deslizable-novedades" style="display: flex; gap: 1rem; overflow-x: auto; scroll-behavior: smooth; padding: 0.25rem 0.5rem; -webkit-overflow-scrolling: touch;">
                ${itemsNovedades.map(item => `
                    <div style="background: ${item.fondo}; color: white; min-width: 280px; width: 280px; border-radius: 16px; padding: 1.25rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem;">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <span style="font-size: 2.2rem; margin:0;">${item.icono}</span>
                            <div style="text-align: left;">
                                <h4 style="margin: 0 0 2px 0; font-weight: bold; font-size: 1rem; color: white;">${item.titulo}</h4>
                                <p style="margin: 0; font-size: 0.75rem; color: rgba(255,255,255,0.7); line-height: 1.3;">${item.desc}</p>
                            </div>
                        </div>
                        <button onclick="${item.accion}" style="background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); font-weight: 600; font-size: 0.75rem; padding: 0.5rem; border-radius: 50px; cursor: pointer; transition: background 0.2s; width: 100%; text-align: center;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                            ${item.textoBoton}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        // Insertamos el carrusel al principio del contenedor del dashboard
        if (contenedorPadre.firstChild) {
            contenedorPadre.insertBefore(seccionNovedades, contenedorPadre.firstChild);
        } else {
            contenedorPadre.appendChild(seccionNovedades);
        }
        console.log("🎬 Carrusel superior de avances y novedades acoplado perfectamente.");
    }
};

console.log('✅ Módulo FEATURED cargado e innovaciones inyectadas con éxito');
