// ========== MÓDULO OFERTAS DESTACADAS (Versión con URL de Imagen) ==========

if (!window.VV) window.VV = {};
VV.featured = {
    // 1. Solicitar destacar oferta
    async requestFeatured() {
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
                <p style="color: var(--gray-600); margin-bottom: 1.5rem; font-size: 0.9rem;">
                    Las ofertas destacadas aparecen en el dashboard principal. 
                    <strong style="color: var(--error-red);">Importante:</strong> Si recibes 10 valoraciones negativas, tu cuenta será bloqueada.
                </p>
                <form id="featured-request-form">
                    <div class="form-group">
                        <label>Selecciona tu producto *</label>
                        <select id="featured-product" required>
                            <option value="">Seleccionar producto</option>
                            ${userProducts.map(p => `<option value="${p.id}">${p.product} - $${p.price}/${p.unit}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Título de la oferta *</label>
                        <input type="text" id="featured-title-input" required placeholder="Ej: ¡Súper Promo 20% OFF!">
                    </div>
                    <div class="form-group">
                        <label>Descripción detallada *</label>
                        <textarea id="featured-description" rows="3" required placeholder="Describe tu oferta especial..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Foto de la Oferta (Simpatía Visual) *</label>
                        <div class="vv-upload-zone" style="border: 2px dashed #3498db; padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;" onclick="document.getElementById('featured-image-file').click()">
                            <i class="fas fa-camera" style="font-size: 1.5rem; color: #3498db;"></i>
                            <p id="vv-file-name" style="margin: 5px 0 0; font-size: 0.85rem;">Toca para subir la foto del producto</p>
                            <input type="file" id="featured-image-file" accept="image/*" style="display:none;" 
                                   onchange="document.getElementById('vv-file-name').innerText = this.files[0].name">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Opcional: URL de imagen externa</label>
                        <input type="url" id="featured-url-input" placeholder="https://ejemplo.com/imagen.jpg">
                        <small style="color: #666; display: block; margin-top: 5px;">
                            Deja vacío para usar la foto que subes. Máx. 5MB para fotos locales.
                        </small>
                    </div>

                    <div class="form-group">
                        <label>Duración de la oferta *</label>
                        <select id="featured-duration" required>
                            <option value="3">3 días</option>
                            <option value="7" selected>7 días</option>
                            <option value="15">15 días</option>
                        </select>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.featured.closeRequestForm()">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-paper-plane"></i> Enviar Solicitud
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        document.getElementById('featured-request-form').onsubmit = (e) => this.submitRequest(e);
        overlay.onclick = (e) => { if (e.target === overlay) this.closeRequestForm(); };
    },
    
    closeRequestForm() {
        const overlay = document.getElementById('featured-request-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    async submitRequest(e) {
        e.preventDefault();
        const btn = e.target.querySelector('.btn-save');
        const fileInput = document.getElementById('featured-image-file');
        const file = fileInput.files[0];
        const urlInput = document.getElementById('featured-url-input');
        const url = urlInput.value.trim();

        // Validar: Opción archivo O opción URL (pero no ambas)
        if (file && url) {
            alert('Selecciona solo UNA opción: Foto o URL, no ambas.');
            return;
        }

        if (!file && !url) {
            alert('Debes subir una foto o ingresar una URL de imagen.');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

        try {
            let filename = null;

            // USAR URL SI EXISTE, SINO USAR ARCHIVO
            if (url) {
                // Validar URL
                try {
                    new URL(url);
                } catch (err) {
                    throw new Error('URL inválida. Verifica el formato.');
                }
                filename = url; // Guardar la URL directamente
            } else {
                // Procesar archivo (existente)
                if (!file) throw new Error('No se seleccionó ningún archivo.');
                
                const fileExt = file.name.split('.').pop();
                filename = `${VV.data.user.id}/${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
                if (uploadError) throw uploadError;
            }

            const duration = parseInt(document.getElementById('featured-duration').value);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + duration);

            const { error: insertError } = await supabase.from('featured_offers').insert({
                product_id: document.getElementById('featured-product').value,
                title: document.getElementById('featured-title-input').value,
                description: document.getElementById('featured-description').value,
                filename: filename,  // Guarda URL O nombre de archivo
                duration: duration,
                status: 'pending',
                neighborhood: VV.data.neighborhood,
                user_id: VV.data.user.id,
                user_name: VV.data.user.name,
                user_number: VV.data.user.uniqueNumber,
                expires_at: expiresAt.toISOString()
            });

            if (insertError) throw insertError;

            this.closeRequestForm();
            VV.utils.showSuccess('Solicitud enviada.');
            this.loadFeaturedOffers();

        } catch (error) {
            alert(error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud';
        }
    },
    
    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;

        const isAdmin = VV.utils.isAdmin();
        try {
            let query = supabase.from('featured_offers').select('*');
            if (!isAdmin) {
                query = query.eq('status', 'active').eq('neighborhood', VV.data.neighborhood);
            }
            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            container.innerHTML = `
                <div class="vv-cards-grid">
                    ${data.map(item => {
                        // Detectar si filename es URL o nombre de archivo
                        const isUrl = item.filename.startsWith('http');
                        const imageUrl = isUrl ? item.filename : 
                            supabase.storage.from('product-images').getPublicUrl(`${item.filename}?v=${Date.now()}`).data.publicUrl;
                        
                        return `
                            <div class="vv-card-destacada">
                                <div class="vv-card-image-container">
                                    <img src="${imageUrl}" 
                                         onerror="this.src='https://via.placeholder.com/300x200'" 
                                         alt="${item.title}">
                                </div>
                                <div class="vv-card-body">
                                    <h4 class="vv-card-title">${item.title}</h4>
                                    <button class="btn-primary" onclick="alert('Pronto: Detalle de ${item.id}')">Ver Detalle</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>`;
        } catch (error) {
            console.error('Error:', error);
        }
    }
};

// Al final de js/featured.js
window.addEventListener('load', () => {
    console.log("🕒 Esperando estabilidad del DOM...");
    setTimeout(() => {
        if (VV.featured && VV.featured.loadFeaturedOffers) {
            VV.featured.loadFeaturedOffers();
        }
    }, 500); // 500ms de cortesía para que el HTML aparezca
});
