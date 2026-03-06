// ========== MÓDULO OFERTAS DESTACADAS ==========

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
                                <option value="${p.id}">${p.product} - $${p.price}/${p.unit}</option>
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
        console.log('📝 Formulario encontrado:', form);

        if (form) {
            form.onsubmit = (e) => {
                console.log('📤 Form submit event triggered');
                e.preventDefault();
                VV.featured.submitRequest();
            };
        } else {
            console.error('❌ No se encontró el formulario featured-request-form');
        }

        overlay.onclick = (e) => {
            if (e.target === overlay) VV.featured.closeRequestForm();
        };
    },

    // Función para previsualizar imagen
    previewImage(input) {
        const preview = document.getElementById('featured-image-preview');
        preview.innerHTML = '';

        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Validar tamaño (5MB)
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

    // Cerrar formulario de solicitud
    closeRequestForm() {
        const overlay = document.getElementById('featured-request-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    // Enviar solicitud - MIGRADO A SUPABASE
    async submitRequest() {
        console.log('🚀 submitRequest llamado');

        const productSelect = document.getElementById('featured-product');
        const productId = productSelect ? productSelect.value : null;

        console.log('📦 Product ID:', productId);

        if (!productId) {
            alert('Selecciona un producto');
            return;
        }

        // Buscar el producto
        const product = VV.data.products.find(p => p.id === productId);
        if (!product) {
            alert('Producto no encontrado');
            return;
        }

        const description = document.getElementById('featured-description').value.trim();
        const specialPrice = document.getElementById('featured-price').value;
        const duration = parseInt(document.getElementById('featured-duration').value);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration);

        const price = specialPrice ? parseFloat(specialPrice) : product.price;
        const title = `${product.product} - $${price}/${product.unit}`;

        console.log('💾 Guardando en Supabase...');

        try {
            let imageUrl = null;
            const imageInput = document.getElementById('featured-image');

            if (imageInput && imageInput.files && imageInput.files[0]) {
                const file = imageInput.files[0];
                const fileName = `featured-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('featured-images')
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (uploadError) {
                    console.error('❌ Error subiendo imagen:', uploadError);
                    alert('Error al subir la imagen, pero se enviará la solicitud. Error: ' + uploadError.message);
                } else {
                    const { data: urlData } = supabase.storage
                        .from('featured-images')
                        .getPublicUrl(fileName);
                    imageUrl = urlData.publicUrl;
                }
            }

            const { error } = await supabase
                .from('featured_offers')
                .insert({
                    product_id: productId,
                    title: title,
                    description: description,
                    special_price: specialPrice ? parseFloat(specialPrice) : null,
                    duration: duration,
                    status: 'pending',
                    neighborhood: VV.data.neighborhood,
                    user_id: VV.data.user.id,
                    user_name: VV.data.user.name,
                    user_number: VV.data.user.uniqueNumber,
                    image_url: imageUrl,
                    expires_at: expiresAt.toISOString()
                });

            if (error) {
                console.error('❌ Error de Supabase:', error);
                throw error;
            }

            console.log('✅ Solicitud guardada exitosamente');

            VV.featured.closeRequestForm();
            VV.utils.showSuccess('Solicitud enviada. El administrador la revisará pronto.');

        } catch (error) {
            console.error('❌ Error enviando solicitud:', error);
            alert('Error al enviar la solicitud: ' + error.message);
        }
    },

    // Cargar ofertas destacadas en el dashboard - MIGRADO A SUPABASE
    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        const isAdmin = VV.utils.isAdmin();

        // Actualizar título y botón según el rol
        const titleElement = document.getElementById('featured-title');
        const requestBtn = document.getElementById('featured-request-btn');

        if (titleElement) {
            titleElement.textContent = isAdmin ? 'Ofertas Destacadas de Todos los Barrios' : 'Ofertas Destacadas del Barrio';
        }

        if (requestBtn) {
            requestBtn.style.display = isAdmin ? 'none' : 'inline-block';
        }

        // Mostrar botón de anuncio solo para admin
        const announcementBtn = document.getElementById('admin-announcement-btn');
        if (announcementBtn) {
            announcementBtn.style.display = isAdmin ? 'inline-block' : 'none';
        }

        try {
            // Cargar anuncios activos desde Supabase
            const { data: announcements, error: announcementsError } = await supabase
                .from('announcements')
                .select('*')
                .gt('expires_at', new Date().toISOString())
                .order('important', { ascending: false })
                .order('created_at', { ascending: false });

            if (announcementsError) throw announcementsError;

            // Función para normalizar barrios (sin tildes, minúsculas)
            const normalizeNeighborhood = (name) => {
                return name?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() || '';
            };

            const currentNeighborhoodNormalized = normalizeNeighborhood(VV.data.neighborhood);

            // Filtrar anuncios por barrio o usuario
            const activeAnnouncements = (announcements || []).filter(a =>
                a.target === 'all' ||
                normalizeNeighborhood(a.target) === currentNeighborhoodNormalized ||
                a.target === ('user_' + VV.data.user.uniqueNumber) ||
                isAdmin
            );

            // Cargar ofertas destacadas activas desde Supabase
            let offersQuery = supabase
                .from('featured_offers')
                .select('*')
                .eq('status', 'active')
                .eq('blocked', false)
                .gt('expires_at', new Date().toISOString());

            const { data: offers, error: offersError } = await offersQuery;

            if (offersError) throw offersError;

            // Filtrar ofertas por barrio
            const neighborhoodFeatured = (offers || []).filter(f =>
                isAdmin || normalizeNeighborhood(f.neighborhood) === currentNeighborhoodNormalized
            );

            if (neighborhoodFeatured.length === 0 && activeAnnouncements.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; background: var(--gray-50); border-radius: 12px; color: var(--gray-600);">
                        <i class="fas fa-star" style="font-size: 2rem; opacity: 0.5; margin-bottom: 0.5rem;"></i>
                        <p style="margin: 0;">No hay ofertas destacadas en este momento</p>
                    </div>
                `;
                return;
            }

            // Renderizar anuncios y ofertas
            let html = '';

            // Primero los anuncios oficiales
            if (activeAnnouncements.length > 0) {
                html += `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    ${activeAnnouncements.map(a => VV.featured.renderAnnouncement(a)).join('')}
                </div>
            `;
            }

            // Luego las ofertas
            if (isAdmin) {
                const byNeighborhood = {};
                neighborhoodFeatured.forEach(offer => {
                    if (!byNeighborhood[offer.neighborhood]) {
                        byNeighborhood[offer.neighborhood] = [];
                    }
                    byNeighborhood[offer.neighborhood].push(offer);
                });

                html += Object.keys(byNeighborhood).map(neighborhood => `
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: var(--primary-blue); margin-bottom: 1rem;">
                        <i class="fas fa-map-marker-alt"></i> ${neighborhood}
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                        ${byNeighborhood[neighborhood].map(offer => VV.featured.renderOfferCard(offer)).join('')}
                    </div>
                </div>
            `).join('');
            } else if (neighborhoodFeatured.length > 0) {
                html += `
                <div class="featured-carousel-container" style="position: relative; overflow-x: auto; overflow-y: hidden; padding: 1rem 0; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                    <div class="featured-carousel-track" style="display: flex; gap: 1.5rem; animation: scrollHorizontal ${neighborhoodFeatured.length * 5}s linear infinite;" onmouseover="this.style.animationPlayState='paused'" onmouseout="this.style.animationPlayState='running'" ontouchstart="this.style.animationPlayState='paused'" ontouchend="this.style.animationPlayState='running'">
                        ${neighborhoodFeatured.map(offer => VV.featured.renderOfferCard(offer)).join('')}
                        ${neighborhoodFeatured.map(offer => VV.featured.renderOfferCard(offer)).join('')}
                    </div>
                </div>
            `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('Error cargando ofertas destacadas:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; background: var(--gray-50); border-radius: 12px; color: var(--gray-600);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; opacity: 0.5; margin-bottom: 0.5rem;"></i>
                    <p style="margin: 0;">Error al cargar ofertas destacadas</p>
                </div>
            `;
        }
    },

    // Renderizar tarjeta de oferta - ACTUALIZADO PARA SUPABASE
    renderOfferCard(offer) {
        const title = offer.title;
        const description = offer.description || '';
        const userName = offer.user_name;
        const userNumber = offer.user_number;

        // Calcular días restantes
        const daysLeft = Math.ceil((new Date(offer.expires_at) - new Date()) / (1000 * 60 * 60 * 24));

        const imageHtml = offer.image_url ? `
            <div style="margin: -1.5rem -1.5rem 1rem -1.5rem; border-radius: 10px 10px 0 0; overflow: hidden; height: 160px; background: var(--gray-100);">
                <img src="${offer.image_url}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
        ` : '';

        return `
            <div class="featured-offer-card" style="background: linear-gradient(135deg, #fff5e6 0%, #ffffff 100%); border: 2px solid var(--warning-orange); border-radius: 12px; padding: 1.5rem; position: relative; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2); overflow: hidden;">
                <div style="position: absolute; top: 10px; right: 10px; z-index: 2; background: var(--warning-orange); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                    <i class="fas fa-star"></i> DESTACADO
                </div>
                
                ${imageHtml}
                
                <h3 style="margin: 0 0 0.5rem 0; color: var(--primary-purple); font-size: 1.1rem; ${offer.image_url ? 'margin-top: 0.5rem;' : ''}">
                    ${title}
                </h3>
                
                
                <div style="background: white; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                    <p style="margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <strong>Ofrecido por:</strong> ${userName} #${userNumber}
        
                        <!-- BOTÓN QUE ACTIVA LA GALERÍA -->
                        <button onclick="verTiendaVecino('${offer.seller_id || offer.sellerId || offer.user_id || offer.userId}', '${userName.replace(/'/g, "\\'")}')" 
                                style="background: #3b82f6; color: white; border: none; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; cursor: pointer;">
                            <i class="fas fa-store"></i> Ver todo
                        </button>
                    </p>
                    ${description ? `<p style="margin: 0 0 0.5rem 0; color: var(--gray-700);">${description}</p>` : ''}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 0.85rem; color: var(--gray-600);">
                    <span><i class="fas fa-map-marker-alt"></i> ${offer.neighborhood}</span>
                    <span><i class="fas fa-clock"></i> ${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}</span>
                </div>
                
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <button class="btn-secondary" onclick="VV.featured.contactSeller('${offer.product_id}', '${userName}')" style="flex: 1;">
                        <i class="fab fa-whatsapp"></i> Contactar al WhatsApp
                    </button>
                </div>
                
                <div style="border-top: 1px solid var(--gray-300); padding-top: 1rem;">
                    <p style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: var(--gray-600); text-align: center;">
                        ¿Cumplió con la oferta?
                    </p>
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button 
                            class="vote-btn" 
                            onclick="VV.featured.vote('${offer.id}', 'up')"
                            style="flex: 1; padding: 0.5rem; border: 2px solid var(--success-green); background: white; color: var(--success-green); border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                            <i class="fas fa-thumbs-up"></i> Bueno
                        </button>
                        <button 
                            class="vote-btn" 
                            onclick="VV.featured.vote('${offer.id}', 'down')"
                            style="flex: 1; padding: 0.5rem; border: 2px solid var(--error-red); background: white; color: var(--error-red); border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                            <i class="fas fa-thumbs-down"></i> Malo
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Votar en una oferta - MIGRADO A SUPABASE
    async vote(offerId, voteType) {
        try {
            // Verificar si ya votó
            const { data: existingVote, error: checkError } = await supabase
                .from('featured_votes')
                .select('*')
                .eq('offer_id', offerId)
                .eq('user_id', VV.data.user.id)
                .maybeSingle();

            if (existingVote) {
                alert('Ya has votado en esta oferta');
                return;
            }

            // Registrar voto
            const { error: voteError } = await supabase
                .from('featured_votes')
                .insert({
                    offer_id: offerId,
                    user_id: VV.data.user.id,
                    vote_type: voteType
                });

            if (voteError) throw voteError;

            // Si es voto negativo, verificar si alcanzó 10
            if (voteType === 'down') {
                const { count, error: countError } = await supabase
                    .from('featured_votes')
                    .select('*', { count: 'exact', head: true })
                    .eq('offer_id', offerId)
                    .eq('vote_type', 'down');

                if (countError) throw countError;

                if (count >= 10) {
                    // Bloquear oferta
                    const { error: blockError } = await supabase
                        .from('featured_offers')
                        .update({ blocked: true, status: 'blocked' })
                        .eq('id', offerId);

                    if (blockError) throw blockError;

                    alert('La oferta ha sido bloqueada por recibir 10 valoraciones negativas.');
                }
            }

            VV.featured.loadFeaturedOffers();
            VV.utils.showSuccess(voteType === 'up' ? '¡Gracias por tu valoración positiva!' : 'Valoración negativa registrada');

        } catch (error) {
            console.error('Error votando:', error);
            alert('Error al registrar tu voto');
        }
    },

    // Bloquear usuario
    blockUser(userId) {
        const users = VV.auth.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
            const user = users[userIndex];
            user.blocked = true;
            user.blockedAt = new Date().toISOString();
            user.blockReason = 'Recibió 10 valoraciones negativas en ofertas destacadas';

            // Actualizar en localStorage
            const userKey = `vecinosVirtuales_user_${user.id}`;
            localStorage.setItem(userKey, JSON.stringify(user));

            // Si es el usuario actual, cerrar sesión
            if (user.id === VV.data.user.id) {
                alert('Tu cuenta ha sido bloqueada por recibir 10 valoraciones negativas. Contacta al administrador.');
                localStorage.removeItem('vecinosVirtualesUser');
                location.reload();
            }
        }
    },

    // Contactar vendedor via WhatsApp
    async contactSeller(productId, sellerName) {
        try {
            // Mostrar estado de carga temporal
            VV.utils.showSuccess('Obteniendo contacto...');

            // Buscar el teléfono en el producto de Supabase
            const { data: productData, error } = await supabase
                .from('products')
                .select('contact')
                .eq('id', productId)
                .single();

            if (error) throw error;

            if (productData && productData.contact) {
                // Limpiar el teléfono de caracteres no numéricos
                let phone = productData.contact.replace(/\D/g, '');
                // Si el número no tiene código de país, asumir Argentina (54) temporalmente.
                if (phone.length === 10) {
                    phone = '549' + phone;
                } else if (!phone.startsWith('54')) {
                    phone = '549' + phone; // Aproximación segura para Argentina
                }

                const message = encodeURIComponent(`¡Hola ${sellerName}! Vi tu oferta destacada en Vecinos Virtuales y me interesa.`);
                window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
            } else {
                alert(`No se pudo encontrar el teléfono de ${sellerName}. Intenta contactarlo mediante la sección Compras.`);
            }
        } catch (error) {
            console.error('Error obteniendo contacto:', error);
            alert(`Ocurrió un error al intentar contactar a ${sellerName}.`);
        }
    },

    // ========== ANUNCIOS DEL ADMINISTRADOR ==========

    // Crear anuncio oficial
    async createAnnouncement() {
        if (!VV.utils.isAdmin()) {
            alert('Solo el administrador puede crear anuncios');
            return;
        }

        // Obtener barrios
        const neighborhoods = await VV.auth.getExistingNeighborhoods();

        let overlay = document.getElementById('announcement-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'announcement-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-megaphone"></i> Publicar Anuncio Oficial</h3>
                <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                    Los anuncios oficiales aparecen destacados en el visor de todos los barrios.
                </p>
                <form id="announcement-form">
                    <div class="form-group">
                        <label>Tipo de anuncio *</label>
                        <select id="announcement-type" required>
                            <option value="info">📢 Información General</option>
                            <option value="warning">⚠️ Advertencia</option>
                            <option value="success">✅ Buenas Noticias</option>
                            <option value="event">🎉 Evento</option>
                            <option value="update">🔔 Actualización</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Título del anuncio *</label>
                        <input type="text" id="announcement-title" required placeholder="Ej: Nueva funcionalidad disponible">
                    </div>
                    <div class="form-group">
                        <label>Mensaje *</label>
                        <textarea id="announcement-message" rows="4" required placeholder="Describe el anuncio..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Dirigido a:</label>
                        <select id="announcement-target-type" onchange="
                            if(this.value === 'user') {
                                document.getElementById('announcement-target-user-group').style.display='block';
                                document.getElementById('announcement-target-neighborhood').style.display='none';
                            } else if (this.value === 'neighborhood') {
                                document.getElementById('announcement-target-user-group').style.display='none';
                                document.getElementById('announcement-target-neighborhood').style.display='block';
                            } else {
                                document.getElementById('announcement-target-user-group').style.display='none';
                                document.getElementById('announcement-target-neighborhood').style.display='none';
                            }
                        ">
                            <option value="all">Todos los barrios</option>
                            <option value="neighborhood">Barrio específico</option>
                            <option value="user">Usuario específico</option>
                        </select>
                    </div>
                    <div class="form-group" id="announcement-target-neighborhood" style="display:none;">
                        <label>Seleccionar barrio:</label>
                        <select id="announcement-target">
                            ${neighborhoods.filter(n => n !== 'Administrador').map(n =>
            `<option value="${n}">${n}</option>`
        ).join('')}
                        </select>
                    </div>
                    <div class="form-group" id="announcement-target-user-group" style="display:none;">
                        <label>Número de usuario (# vecino):</label>
                        <input type="number" id="announcement-target-user" placeholder="Ej: 12345">
                    </div>
                    <div class="form-group">
                        <label>Duración *</label>
                        <select id="announcement-duration" required>
                            <option value="1">1 día</option>
                            <option value="3">3 días</option>
                            <option value="7" selected>7 días</option>
                            <option value="15">15 días</option>
                            <option value="30">30 días</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="announcement-important">
                            Marcar como importante (aparece primero)
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.featured.closeAnnouncementForm()">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-paper-plane"></i> Publicar Anuncio
                        </button>
                    </div>
                </form>
            </div>
        `;

        overlay.classList.add('active');

        document.getElementById('announcement-form').onsubmit = (e) => {
            e.preventDefault();
            VV.featured.saveAnnouncement();
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) VV.featured.closeAnnouncementForm();
        };
    },

    // Cerrar formulario de anuncio
    closeAnnouncementForm() {
        const overlay = document.getElementById('announcement-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    // Guardar anuncio - MIGRADO A SUPABASE
    async saveAnnouncement() {
        const type = document.getElementById('announcement-type').value;
        const title = document.getElementById('announcement-title').value.trim();
        const message = document.getElementById('announcement-message').value.trim();

        const targetType = document.getElementById('announcement-target-type').value;
        let finalTarget = 'all';
        if (targetType === 'neighborhood') {
            finalTarget = document.getElementById('announcement-target').value;
        } else if (targetType === 'user') {
            const userIdNum = document.getElementById('announcement-target-user').value.trim();
            finalTarget = 'user_' + userIdNum;
            if (!userIdNum) {
                alert('Por favor, ingresa el número de usuario');
                return;
            }
        }

        const duration = parseInt(document.getElementById('announcement-duration').value);
        const important = document.getElementById('announcement-important').checked;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration);

        try {
            const { error } = await supabase
                .from('announcements')
                .insert({
                    title: title,
                    message: message,
                    type: type,
                    important: important,
                    target: finalTarget,
                    expires_at: expiresAt.toISOString()
                });

            if (error) throw error;

            VV.featured.closeAnnouncementForm();
            VV.featured.loadFeaturedOffers();
            VV.utils.showSuccess('Anuncio publicado exitosamente');

        } catch (error) {
            console.error('Error publicando anuncio:', error);
            alert('Error al publicar el anuncio: ' + error.message);
        }
    },

    // Renderizar anuncio oficial
    renderAnnouncement(announcement) {
        const typeConfig = {
            'info': { color: 'var(--primary-blue)', icon: 'fa-info-circle', bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' },
            'warning': { color: 'var(--warning-orange)', icon: 'fa-exclamation-triangle', bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' },
            'success': { color: 'var(--success-green)', icon: 'fa-check-circle', bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' },
            'event': { color: 'var(--primary-purple)', icon: 'fa-calendar-star', bg: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)' },
            'update': { color: '#0ea5e9', icon: 'fa-bell', bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' }
        };

        const config = typeConfig[announcement.type] || typeConfig['info'];
        const daysLeft = Math.ceil((new Date(announcement.expires_at) - new Date()) / (1000 * 60 * 60 * 24));

        return `
            <div class="announcement-card" style="background: ${config.bg}; border: 3px solid ${config.color}; border-radius: 12px; padding: 1.5rem; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                ${announcement.important ? `
                    <div style="position: absolute; top: -10px; left: 10px; background: var(--error-red); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; animation: pulse 2s infinite;">
                        <i class="fas fa-exclamation"></i> IMPORTANTE
                    </div>
                ` : ''}
                
                <div style="position: absolute; top: -10px; right: 10px; background: ${config.color}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                    <i class="fas fa-crown"></i> OFICIAL
                </div>
                
                <div style="margin-top: ${announcement.important ? '1rem' : '0'};">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <div style="width: 50px; height: 50px; background: ${config.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                            <i class="fas ${config.icon}"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0; color: ${config.color}; font-size: 1.2rem;">
                                ${announcement.title}
                            </h3>
                            <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--gray-600);">
                                <i class="fas fa-user-shield"></i> Administrador
                            </p>
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                        <p style="margin: 0; color: var(--gray-800); white-space: pre-wrap; line-height: 1.6;">
                            ${announcement.message}
                        </p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--gray-600);">
                        <span>
                            <i class="fas fa-clock"></i> ${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}
                        </span>
                        ${announcement.target !== 'all' ? (
                announcement.target.startsWith('user_') ? `
                            <span>
                                <i class="fas fa-user"></i> Usuario específico (${announcement.target.replace('user_', '#')})
                            </span>
                            ` : `
                            <span>
                                <i class="fas fa-map-marker-alt"></i> ${announcement.target}
                            </span>
                            `
            ) : `
                            <span>
                                <i class="fas fa-globe"></i> Todos los barrios
                            </span>
                        `}
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            </style>
        `;
    }
};
async function verTiendaVecino(sellerId, nombre) {
    const seccion = document.getElementById('galeria-vendedor-seccion');
    const lista = document.getElementById('lista-productos-vendedor');
    const titulo = document.getElementById('titulo-galeria');

    if (!sellerId || sellerId === 'undefined') return;

    const idBusqueda = String(sellerId).trim();
    // Filtramos productos del mismo vendedor
    const productos = VV.data.products.filter(p => 
        String(p.seller_id || p.sellerId || p.user_id).trim() === idBusqueda
    );

    titulo.innerHTML = `<i class="fas fa-store" style="color: #3b82f6;"></i> Catálogo de ${nombre}`;
    seccion.style.display = 'block';

    if (productos.length === 0) {
        lista.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #64748b;">No hay otros productos públicos.</p>`;
    } else {
        lista.innerHTML = productos.map(p => {
            // DETECTAR LA IMAGEN CORRECTA
            const imgUrl = p.image || p.image_url || p.imageUrl || p.foto;
            
            return `
            <div class="product-card-mini" style="background: white; padding: 12px; border-radius: 12px; border: 1px solid #f1f5f9; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02); cursor: pointer;" 
                 onclick="VV.marketplace.showProductDetail('${p.id}')">
                
                <div style="width: 100%; height: 110px; background: #f8fafc; border-radius: 8px; overflow: hidden; margin-bottom: 8px; display: flex; align-items: center; justify-content: center;">
                    ${imgUrl ? 
                        `<img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com'">` : 
                        `<i class="fas fa-camera" style="font-size: 1.5rem; color: #cbd5e1;"></i>`
                    }
                </div>
                
                <h4 style="margin: 0; font-size: 0.85rem; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.product || p.name}</h4>
                <p style="margin: 4px 0 0 0; color: #059669; font-weight: bold; font-size: 0.95rem;">$${p.price}</p>
                
                <button style="margin-top: 8px; width: 100%; background: #3b82f6; color: white; border: none; padding: 5px; border-radius: 6px; font-size: 0.7rem; cursor: pointer;">
                    <i class="fas fa-search-plus"></i> Ver Detalle  // Sync fix
                </button>
            </div>`;
        }).join('');
    }

    seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
