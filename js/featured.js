// ========== MÓDULO OFERTAS DESTACADAS (Versión Completa 2026) ==========

VV.featured = {
    // 1. Solicitar destacar oferta (Mantiene lógica de usuario y agrega Imagen)
    async requestFeatured() {
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
                <p style="color: var(--gray-600); margin-bottom: 1.5rem; font-size: 0.9rem;">
                    Las ofertas destacadas aparecen en el dashboard principal. 
                    <strong style="color: var(--error-red);">Importante:</strong> Si recibes 10 valoraciones negativas, tu cuenta será bloqueada.
                </p>
                <form id="featured-request-form">
                    <div class="form-group">
                        <label>Selecciona tu producto *</label>
                        <select id="featured-product" required>
                            <option value="">Seleccionar producto</option>
                            ${userProducts.map(p => `
                                <option value="${p.id}">${p.product} - $${p.price}/${p.unit}</option>
                            `).join('')}
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
                    
                    <!-- NUEVO: Zona de Carga de Imagen -->
                    <div class="form-group">
                        <label>Foto de la Oferta (Simpatía Visual) *</label>
                        <div class="vv-upload-zone" style="border: 2px dashed #3498db; padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;" onclick="document.getElementById('featured-image-file').click()">
                            <i class="fas fa-camera" style="font-size: 1.5rem; color: #3498db;"></i>
                            <p id="vv-file-name" style="margin: 5px 0 0; font-size: 0.85rem;">Toca para subir la foto del producto</p>
                            <input type="file" id="featured-image-file" accept="image/*" style="display:none" 
                                   onchange="document.getElementById('vv-file-name').innerText = this.files[0].name">
                        </div>
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
        
        overlay.onclick = (e) => {
            if (e.target === overlay) this.closeRequestForm();
        };
    },

    // 2. Cerrar formulario
    closeRequestForm() {
        const overlay = document.getElementById('featured-request-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    // 3. Enviar solicitud (Mantiene tu lógica de base de datos y agrega Subida de Imagen)
    async submitRequest(e) {
        e.preventDefault();
        console.log('🚀 Iniciando submitRequest con Imagen...');
        
        const btn = e.target.querySelector('.btn-save');
        const fileInput = document.getElementById('featured-image-file');
        const file = fileInput.files[0];

        if (!file) {
            alert('La foto es obligatoria para destacar el producto.');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

        try {
            // A. Subir Imagen al Bucket
            const fileExt = file.name.split('.').pop();
            const fileName = `${VV.data.user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, file);

            if (uploadError) throw new Error('Error al subir imagen: ' + uploadError.message);

            // B. Preparar datos (Lógica original de expiración)
            const duration = parseInt(document.getElementById('featured-duration').value);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + duration);

            // C. Insertar en Supabase (Usando tu tabla featured_offers)
            const { error: insertError } = await supabase
                .from('featured_offers')
                .insert({
                    product_id: document.getElementById('featured-product').value,
                    title: document.getElementById('featured-title-input').value,
                    description: document.getElementById('featured-description').value,
                    filename: fileName, // Nombre para recuperar la URL después
                    duration: duration,
                    status: 'pending',
                    neighborhood: VV.data.neighborhood,
                    user_id: VV.data.user.id,
                    user_name: VV.data.user.name,
                    user_number: VV.data.user.uniqueNumber,
                    expires_at: expiresAt.toISOString()
                });

            if (insertError) throw insertError;

            console.log('✅ Solicitud guardada exitosamente');
            this.closeRequestForm();
            VV.utils.showSuccess('Solicitud enviada. El administrador la revisará pronto.');
            this.loadFeaturedOffers();

        } catch (error) {
            console.error('❌ Error:', error);
            alert(error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud';
        }
    },

    // 4. Cargar ofertas (Mantiene lógica de Admin y agrega renderizado visual)
    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;

        const isAdmin = VV.utils.isAdmin();
        
        // Actualizar título según rol (Tu lógica original)
        const titleElement = document.getElementById('featured-title');
        if (titleElement) {
            titleElement.textContent = isAdmin ? 'Ofertas Destacadas (Admin)' : 'Ofertas Destacadas del Barrio';
        }

        try {
            let query = supabase.from('featured_offers').select('*');
            
            if (!isAdmin) {
                query = query.eq('status', 'active').eq('neighborhood', VV.data.neighborhood);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="text-align:center; width:100%; padding:20px; color:#999;">No hay ofertas activas.</p>';
                return;
            }

            // Renderizado con el diseño de Tarjetas de Imagen
            container.innerHTML = `
                <div class="vv-cards-grid" style="display: flex; gap: 1rem; overflow-x: auto; padding: 10px 0;">
                    ${data.map(item => {
                        const imgUrl = `${supabase.storage.from('product-images').getPublicUrl(item.filename).data.publicUrl}`;
                        return `
                            <div class="vv-card-destacada" style="min-width: 260px; background: white; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                                <div style="height: 140px; background: #f0f0f0;">
                                    <img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://via.placeholder.com'">
                                </div>
                                <div style="padding: 15px;">
                                    <h4 style="margin:0 0 10px; font-size: 1rem;">${item.title}</h4>
                                    <p style="font-size: 0.8rem; color: #666; margin-bottom: 15px;">${item.description.substring(0, 60)}...</p>
                                    <button class="btn-primary" style="width:100%; font-size:0.8rem;" onclick="VV.featured.viewDetail('${item.id}')">Ver Detalle</button>
                                    ${isAdmin && item.status === 'pending' ? `
                                        <div style="display:flex; gap:5px; margin-top:10px;">
                                            <button class="btn-save" style="flex:1; padding:5px;" onclick="VV.featured.approve('${item.id}')">Aprobar</button>
                                            <button class="btn-cancel" style="flex:1; padding:5px;" onclick="VV.featured.reject('${item.id}')">Rechazar</button>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

        } catch (error) {
            console.error('Error cargando destacados:', error);
        }
    },

    // 5. Funciones adicionales (Tu lógica de Admin y Ver Detalle)
    async approve(id) {
        if (!confirm('¿Aprobar esta oferta?')) return;
        const { error } = await supabase.from('featured_offers').update({ status: 'active' }).eq('id', id);
        if (!error) this.loadFeaturedOffers();
    },

    async reject(id) {
        if (!confirm('¿Rechazar esta oferta?')) return;
        const { error } = await supabase.from('featured_offers').update({ status: 'rejected' }).eq('id', id);
        if (!error) this.loadFeaturedOffers();
    },

    viewDetail(id) {
        // Aquí puedes disparar tu modal de detalles
        console.log('Ver detalle de oferta:', id);
        alert('Abriendo detalles de la oferta ID: ' + id);
    },

    createAnnouncement() {
        // Función original de administrador
        if (VV.utils.isAdmin()) {
            console.log('Abriendo creador de anuncios...');
            // Tu lógica de anuncio aquí
        }
    }
};
