// ========== MÓDULO OFERTAS DESTACADAS ==========

VV.featured = {
    // Solicitar destacar oferta
    requestFeatured() {
        // Verificar si el usuario tiene productos
        const userProducts = VV.data.products.filter(p => p.sellerId === VV.data.user.id);
        
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
                        <button type="submit" class="btn-save">
                            <i class="fas fa-paper-plane"></i> Enviar Solicitud
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
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.featured.closeRequestForm();
        };
    },
    
    // Cerrar formulario de solicitud
    closeRequestForm() {
        const overlay = document.getElementById('featured-request-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Enviar solicitud
    submitRequest() {
        const productId = document.getElementById('featured-product').value;
        const product = VV.data.products.find(p => p.id === productId);
        
        if (!product) {
            alert('Producto no encontrado');
            return;
        }
        
        const request = {
            id: VV.utils.generateId(),
            productId: productId,
            product: product,
            title: document.getElementById('featured-title').value.trim(),
            description: document.getElementById('featured-description').value.trim(),
            specialPrice: document.getElementById('featured-price').value || null,
            duration: parseInt(document.getElementById('featured-duration').value),
            userId: VV.data.user.id,
            userName: VV.data.user.name,
            userNumber: VV.data.user.uniqueNumber,
            neighborhood: VV.data.neighborhood,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        const requests = JSON.parse(localStorage.getItem('featuredRequests') || '[]');
        requests.push(request);
        localStorage.setItem('featuredRequests', JSON.stringify(requests));
        
        VV.featured.closeRequestForm();
        VV.utils.showSuccess('Solicitud enviada. El administrador la revisará pronto.');
    },
    
    // Cargar ofertas destacadas en el dashboard
    loadFeaturedOffers() {
        // Limpiar ofertas y anuncios vencidos
        VV.featured.cleanExpiredItems();
        
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
        
        // Obtener anuncios oficiales activos
        const allAnnouncements = JSON.parse(localStorage.getItem('adminAnnouncements') || '[]');
        const activeAnnouncements = allAnnouncements.filter(a => 
            new Date(a.expiresAt) > new Date() &&
            (a.target === 'all' || a.target === VV.data.neighborhood || isAdmin)
        );
        
        // Ordenar anuncios: importantes primero
        activeAnnouncements.sort((a, b) => {
            if (a.important && !b.important) return -1;
            if (!a.important && b.important) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Obtener ofertas aprobadas y activas
        const allFeatured = JSON.parse(localStorage.getItem('featuredOffers') || '[]');
        
        // Si es admin, mostrar de todos los barrios; si no, solo del barrio del usuario
        const neighborhoodFeatured = allFeatured.filter(f => 
            f.status === 'active' && 
            !f.blocked &&
            new Date(f.expiresAt) > new Date() &&
            (isAdmin || f.neighborhood === VV.data.neighborhood)
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
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                    ${neighborhoodFeatured.map(offer => VV.featured.renderOfferCard(offer)).join('')}
                </div>
            `;
        }
        
        container.innerHTML = html;
    },
    
    // Renderizar tarjeta de oferta
    renderOfferCard(offer) {
        // Compatibilidad con estructura antigua y nueva
        const productName = offer.productName || offer.product?.product || 'Producto';
        const productPrice = offer.productPrice || offer.product?.price || 0;
        const productUnit = offer.productUnit || offer.product?.unit || 'unidad';
        const message = offer.message || offer.description || '';
        
        // Verificar si el usuario ya votó
        const userVote = VV.featured.getUserVote(offer.id);
        
        // Calcular días restantes
        const daysLeft = Math.ceil((new Date(offer.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="featured-offer-card" style="background: linear-gradient(135deg, #fff5e6 0%, #ffffff 100%); border: 2px solid var(--warning-orange); border-radius: 12px; padding: 1.5rem; position: relative; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);">
                <div style="position: absolute; top: -10px; right: 10px; background: var(--warning-orange); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                    <i class="fas fa-star"></i> DESTACADO
                </div>
                
                <h3 style="margin: 0 0 0.5rem 0; color: var(--primary-purple); font-size: 1.1rem;">
                    ${productName}
                </h3>
                
                <div style="background: white; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                    <p style="margin: 0 0 0.5rem 0;"><strong>Ofrecido por:</strong> ${offer.userName} #${offer.userNumber}</p>
                    ${message ? `<p style="margin: 0 0 0.5rem 0; color: var(--gray-700);">${message}</p>` : ''}
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                        <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary-blue);">$${productPrice}</span>
                        <span style="color: var(--gray-600);">/ ${productUnit}</span>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 0.85rem; color: var(--gray-600);">
                    <span><i class="fas fa-map-marker-alt"></i> ${offer.neighborhood}</span>
                    <span><i class="fas fa-clock"></i> ${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}</span>
                </div>
                
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    ${offer.productId ? `
                        <button class="btn-primary" onclick="VV.marketplace.addToCart('${offer.productId}')" style="flex: 1;">
                            <i class="fas fa-shopping-cart"></i> Agregar
                        </button>
                    ` : ''}
                    <button class="btn-secondary" onclick="VV.featured.contactUser('${offer.userName}', '${offer.userNumber}')" style="flex: 1;">
                        <i class="fas fa-user"></i> Contactar
                    </button>
                </div>
                
                <div style="border-top: 1px solid var(--gray-300); padding-top: 1rem;">
                    <p style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: var(--gray-600); text-align: center;">
                        ¿Cumplió con la oferta?
                    </p>
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button 
                            class="vote-btn ${userVote === 'good' ? 'voted' : ''}" 
                            onclick="VV.featured.vote('${offer.id}', 'good')"
                            ${userVote ? 'disabled' : ''}
                            style="flex: 1; padding: 0.5rem; border: 2px solid var(--success-green); background: ${userVote === 'good' ? 'var(--success-green)' : 'white'}; color: ${userVote === 'good' ? 'white' : 'var(--success-green)'}; border-radius: 8px; cursor: ${userVote ? 'not-allowed' : 'pointer'}; font-weight: 600; transition: all 0.3s;">
                            <i class="fas fa-thumbs-up"></i> Bueno (${offer.goodVotes || 0})
                        </button>
                        <button 
                            class="vote-btn ${userVote === 'bad' ? 'voted' : ''}" 
                            onclick="VV.featured.vote('${offer.id}', 'bad')"
                            ${userVote ? 'disabled' : ''}
                            style="flex: 1; padding: 0.5rem; border: 2px solid var(--error-red); background: ${userVote === 'bad' ? 'var(--error-red)' : 'white'}; color: ${userVote === 'bad' ? 'white' : 'var(--error-red)'}; border-radius: 8px; cursor: ${userVote ? 'not-allowed' : 'pointer'}; font-weight: 600; transition: all 0.3s;">
                            <i class="fas fa-thumbs-down"></i> Malo (${offer.badVotes || 0})
                        </button>
                    </div>
                    ${userVote ? `
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem; color: var(--gray-600); text-align: center;">
                            <i class="fas fa-check-circle"></i> Ya votaste en esta oferta
                        </p>
                    ` : ''}
                </div>
            </div>
        `;
    },
    
    // Obtener voto del usuario para una oferta
    getUserVote(offerId) {
        const votes = JSON.parse(localStorage.getItem('userVotes') || '{}');
        const userKey = VV.data.user.id;
        return votes[userKey]?.[offerId] || null;
    },
    
    // Votar en una oferta
    vote(offerId, voteType) {
        // Verificar si ya votó
        const userVote = VV.featured.getUserVote(offerId);
        if (userVote) {
            alert('Ya has votado en esta oferta');
            return;
        }
        
        // Registrar voto del usuario
        const votes = JSON.parse(localStorage.getItem('userVotes') || '{}');
        const userKey = VV.data.user.id;
        if (!votes[userKey]) votes[userKey] = {};
        votes[userKey][offerId] = voteType;
        localStorage.setItem('userVotes', JSON.stringify(votes));
        
        // Actualizar contadores de la oferta
        const allFeatured = JSON.parse(localStorage.getItem('featuredOffers') || '[]');
        const offerIndex = allFeatured.findIndex(f => f.id === offerId);
        
        if (offerIndex !== -1) {
            const offer = allFeatured[offerIndex];
            
            if (voteType === 'good') {
                offer.goodVotes = (offer.goodVotes || 0) + 1;
            } else {
                offer.badVotes = (offer.badVotes || 0) + 1;
                
                // Verificar si alcanzó 10 votos malos
                if (offer.badVotes >= 10) {
                    offer.blocked = true;
                    offer.status = 'blocked';
                    
                    // Bloquear usuario
                    VV.featured.blockUser(offer.userId);
                    
                    alert(`La oferta ha sido bloqueada por recibir 10 valoraciones negativas. El usuario ${offer.userName} ha sido bloqueado.`);
                }
            }
            
            allFeatured[offerIndex] = offer;
            localStorage.setItem('featuredOffers', JSON.stringify(allFeatured));
        }
        
        VV.featured.loadFeaturedOffers();
        VV.utils.showSuccess(voteType === 'good' ? '¡Gracias por tu valoración positiva!' : 'Valoración negativa registrada');
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
    
    // Contactar vendedor
    contactSeller(phone) {
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
    },
    
    // Contactar usuario
    contactUser(userName, userNumber) {
        alert(`Contacta a ${userName} #${userNumber} a través del chat de la aplicación o pregunta al administrador por sus datos de contacto.`);
    },
    
    // ========== ANUNCIOS DEL ADMINISTRADOR ==========
    
    // Crear anuncio oficial
    createAnnouncement() {
        if (!VV.utils.isAdmin()) {
            alert('Solo el administrador puede crear anuncios');
            return;
        }
        
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
                        <select id="announcement-target">
                            <option value="all">Todos los barrios</option>
                            ${VV.auth.getExistingNeighborhoods().filter(n => n !== 'Administrador').map(n => 
                                `<option value="${n}">${n}</option>`
                            ).join('')}
                        </select>
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
    
    // Guardar anuncio
    saveAnnouncement() {
        const type = document.getElementById('announcement-type').value;
        const title = document.getElementById('announcement-title').value.trim();
        const message = document.getElementById('announcement-message').value.trim();
        const target = document.getElementById('announcement-target').value;
        const duration = parseInt(document.getElementById('announcement-duration').value);
        const important = document.getElementById('announcement-important').checked;
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration);
        
        const announcement = {
            id: VV.utils.generateId(),
            type: type,
            title: title,
            message: message,
            target: target,
            important: important,
            isOfficial: true,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString()
        };
        
        const announcements = JSON.parse(localStorage.getItem('adminAnnouncements') || '[]');
        announcements.push(announcement);
        localStorage.setItem('adminAnnouncements', JSON.stringify(announcements));
        
        VV.featured.closeAnnouncementForm();
        VV.featured.loadFeaturedOffers();
        VV.utils.showSuccess('Anuncio publicado exitosamente');
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
        const daysLeft = Math.ceil((new Date(announcement.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
        
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
                        ${announcement.target !== 'all' ? `
                            <span>
                                <i class="fas fa-map-marker-alt"></i> ${announcement.target}
                            </span>
                        ` : `
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
    },
    
    // Eliminar anuncio (solo admin)
    deleteAnnouncement(announcementId) {
        if (!VV.utils.isAdmin()) return;
        if (!confirm('¿Eliminar este anuncio?')) return;
        
        const announcements = JSON.parse(localStorage.getItem('adminAnnouncements') || '[]');
        const filtered = announcements.filter(a => a.id !== announcementId);
        localStorage.setItem('adminAnnouncements', JSON.stringify(filtered));
        
        VV.featured.loadFeaturedOffers();
        VV.utils.showSuccess('Anuncio eliminado');
    },
    
    // Limpiar items vencidos automáticamente
    cleanExpiredItems() {
        const now = new Date();
        
        // Limpiar ofertas destacadas vencidas
        const allFeatured = JSON.parse(localStorage.getItem('featuredOffers') || '[]');
        const activeFeatured = allFeatured.filter(f => {
            const expiresAt = new Date(f.expiresAt);
            if (expiresAt <= now && f.status === 'active') {
                console.log(`🗑️ Oferta destacada vencida: ${f.productName} (expiró el ${expiresAt.toLocaleDateString()})`);
                f.status = 'expired';
            }
            return true; // Mantener todas para historial
        });
        
        if (JSON.stringify(allFeatured) !== JSON.stringify(activeFeatured)) {
            localStorage.setItem('featuredOffers', JSON.stringify(activeFeatured));
        }
        
        // Limpiar anuncios vencidos
        const allAnnouncements = JSON.parse(localStorage.getItem('adminAnnouncements') || '[]');
        const activeAnnouncements = allAnnouncements.filter(a => {
            const expiresAt = new Date(a.expiresAt);
            if (expiresAt <= now) {
                console.log(`🗑️ Anuncio vencido: ${a.title} (expiró el ${expiresAt.toLocaleDateString()})`);
                return false; // Eliminar anuncios vencidos
            }
            return true;
        });
        
        if (allAnnouncements.length !== activeAnnouncements.length) {
            localStorage.setItem('adminAnnouncements', JSON.stringify(activeAnnouncements));
        }
        
        // Limpiar anunciantes de banner vencidos
        const allSponsors = JSON.parse(localStorage.getItem('sponsors') || '[]');
        const activeSponsors = allSponsors.filter(s => {
            if (s.expiresAt) {
                const expiresAt = new Date(s.expiresAt);
                if (expiresAt <= now && s.status === 'active') {
                    console.log(`🗑️ Anunciante vencido: ${s.name} (expiró el ${expiresAt.toLocaleDateString()})`);
                    s.status = 'expired';
                }
            }
            return true; // Mantener todos para historial
        });
        
        if (JSON.stringify(allSponsors) !== JSON.stringify(activeSponsors)) {
            localStorage.setItem('sponsors', JSON.stringify(activeSponsors));
        }
    }
};

console.log('✅ Módulo FEATURED cargado');
