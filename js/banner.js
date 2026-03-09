// ========== MÓDULO BANNER - 3 CUADROS FIJOS ==========

VV.banner = {
    currentBanners: [],
    rotationInterval: null,
    
    // Inicializar banner
    async init() {
        const container = document.getElementById('banner-container');
        
        // Recargar sponsors desde Supabase
        try {
            const { data: sponsors, error } = await supabase
                .from('sponsors')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            VV.data.sponsors = sponsors || [];
            console.log('🔄 Sponsors recargados:', VV.data.sponsors.length);
        } catch (error) {
            console.error('Error recargando sponsors:', error);
        }
        
        // Filtrar anunciantes activos y que correspondan al barrio actual
        const activeBanners = VV.banner.getActiveBanners();
        console.log('📢 Banners activos:', activeBanners.length);
        
        // Cargar también en el banner de desktop
        VV.banner.loadDesktopBanners(activeBanners);
        
        // Siempre mostrar el banner
        container.style.display = 'grid';
        
        // Si no hay banners, mostrar placeholders
        if (activeBanners.length === 0) {
            container.innerHTML = `
                <div class="banner-slide" style="opacity: 0.5;">
                    <div class="banner-logo">🏪</div>
                    <div>
                        <div class="banner-title">Tu Anuncio Aquí</div>
                        <div class="banner-description">Espacio disponible</div>
                    </div>
                </div>
                <div class="banner-slide" style="opacity: 0.5;">
                    <div class="banner-logo">💼</div>
                    <div>
                        <div class="banner-title">Publicita tu Negocio</div>
                        <div class="banner-description">Contacta al admin</div>
                    </div>
                </div>
                <div class="banner-slide" style="opacity: 0.5;">
                    <div class="banner-logo">🎯</div>
                    <div>
                        <div class="banner-title">Llega a tu Barrio</div>
                        <div class="banner-description">Sé Anunciante</div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Guardar todos los banners disponibles
        VV.banner.currentBanners = activeBanners;
        
        // Mostrar 3 banners aleatorios
        VV.banner.rotateBanners();
        
        // Rotar cada 10 segundos
        if (VV.banner.rotationInterval) clearInterval(VV.banner.rotationInterval);
        VV.banner.rotationInterval = setInterval(() => {
            console.log('🔄 Rotando banners...');
            VV.banner.rotateBanners();
        }, 10000);
        
        // Agregar botón para ver todos
        VV.banner.addViewAllButton();
    },
    
    // Rotar banners aleatoriamente
    rotateBanners() {
        const container = document.getElementById('banner-container');
        const shuffled = [...VV.banner.currentBanners].sort(() => Math.random() - 0.5);
        const bannersToShow = shuffled.slice(0, 2);
        
        console.log('🎲 Mostrando banners:', bannersToShow.map(b => b.business_name || b.name));
        
        // Rellenar con placeholders si hay menos de 3
        while (bannersToShow.length < 2) {
            bannersToShow.push({
                logo: '🏪',
                name: 'Espacio Disponible',
                description: 'Tu anuncio aquí',
                tier: 'silver',
                id: 'placeholder-' + bannersToShow.length
            });
        }
        
        container.innerHTML = bannersToShow.map(banner => `
        <div class="banner-slide ${banner.tier}" onclick="VV.banner.click('${banner.id}')">
            
            <!-- IMAGEN TOTAL: Usamos etiqueta <img> para que object-fit haga su magia -->
            ${(banner.image_url || banner.imageUrl) ? 
                `<img src="${banner.image_url || banner.imageUrl}" class="banner-img-full" alt="banner">` :
                `<div class="banner-logo-placeholder">${banner.logo}</div>`
            }
            
            <!-- TEXTO SUPERPUESTO (Solo si hay texto) -->
            ${(banner.business_name || banner.name) ? `
                <div class="banner-info-overlay">
                    <div class="banner-title">${banner.business_name || banner.name}</div>
                    <div class="banner-description">${banner.description || ''}</div>
                </div>
            ` : ''}
        </div>
    `).join('');
    },
    
    // Agregar botón para ver todos
    addViewAllButton() {
        let button = document.getElementById('banner-toggle-btn');
        if (!button) {
            button = document.createElement('button');
            button.id = 'banner-toggle-btn';
            button.className = 'banner-toggle-btn';
            document.body.appendChild(button);
        }
        
        // Siempre mostrar en móviles si hay anunciantes
        if (VV.banner.currentBanners.length > 0) {
            button.innerHTML = '<i class="fas fa-bullhorn"></i> Anunciantes';
            button.onclick = () => VV.banner.showAllSponsors();
            button.style.display = '';
        } else {
            button.style.display = 'none';
        }
    },
    
    // Mostrar todos los anunciantes en folleto
    showAllSponsors() {
        let overlay = document.getElementById('sponsors-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sponsors-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 1000px;">
                <h3><i class="fas fa-bullhorn"></i> Todos los Anunciantes</h3>
                <p style="color: var(--gray-600); margin-bottom: 1rem;">Total: ${VV.banner.currentBanners.length} anunciantes</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; max-height: 60vh; overflow-y: auto;">
                    ${VV.banner.currentBanners.map(sponsor => `
                        <div class="sponsor-card" onclick="VV.banner.click('${sponsor.id}')" style="cursor: pointer; border: 2px solid var(--gray-200); border-radius: 8px; padding: 1rem; background: white; transition: all 0.3s;">
                            ${sponsor.imageUrl ? 
                                `<div style="width: 100%; height: 150px; background-image: url('${sponsor.imageUrl}'); background-size: cover; background-position: center; border-radius: 8px; margin-bottom: 0.5rem;"></div>` :
                                `<div style="font-size: 3rem; text-align: center; margin: 1rem 0;">${sponsor.logo}</div>`
                            }
                            <h4 style="margin: 0.5rem 0; color: var(--primary-blue);">${sponsor.name}</h4>
                            <p style="font-size: 0.85rem; color: var(--gray-600); margin: 0.25rem 0;">${sponsor.description}</p>
                            ${sponsor.contact ? `<p style="font-size: 0.85rem; margin: 0.25rem 0;"><i class="fas fa-phone"></i> ${sponsor.contact}</p>` : ''}
                            ${sponsor.website ? `<p style="font-size: 0.85rem; margin: 0.25rem 0;"><i class="fas fa-globe"></i> ${sponsor.website}</p>` : ''}
                            <span class="badge ${sponsor.tier}" style="margin-top: 0.5rem; display: inline-block;">${sponsor.tier.toUpperCase()}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button class="btn-cancel" onclick="document.getElementById('sponsors-overlay').classList.remove('active')">Cerrar</button>
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
        
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        };
    },
    
    // Click en banner
    click(sponsorId) {
        if (sponsorId.startsWith('placeholder')) return;
        
        const sponsor = VV.data.sponsors.find(s => s.id === sponsorId);
        if (sponsor) {
            sponsor.clicks += 1;
            sponsor.views += 1;
            VV.banner.showSponsorDetails(sponsor);
        }
    },
    
    // Registrar click desde tarjetas
    trackClick(sponsorId) {
        if (sponsorId.startsWith('placeholder')) return;
        
        const sponsor = VV.data.sponsors.find(s => s.id === sponsorId);
        if (sponsor) {
            sponsor.clicks += 1;
            sponsor.views += 1;
            VV.banner.showSponsorDetails(sponsor);
        }
    },
    
    // Mostrar detalles del anunciante
    showSponsorDetails(sponsor) {
        let overlay = document.getElementById('sponsor-details-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sponsor-details-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 600px;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    ${sponsor.logo ? `
                        <img src="${sponsor.logo}" alt="${sponsor.businessName}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid var(--warning-orange); margin-bottom: 1rem;">
                    ` : `
                        <div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, var(--warning-orange), var(--primary-blue)); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; font-weight: 700; margin: 0 auto 1rem;">
                            ${sponsor.businessName.charAt(0)}
                        </div>
                    `}
                    <h2 style="margin: 0 0 0.5rem 0; color: var(--gray-800);">${sponsor.businessName}</h2>
                    <p style="margin: 0; color: var(--gray-600); font-size: 1.1rem;">${sponsor.category || 'Negocio Local'}</p>
                    <span style="display: inline-block; margin-top: 0.5rem; background: linear-gradient(135deg, var(--warning-orange), var(--primary-blue)); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600;">
                        ${sponsor.tier.toUpperCase()}
                    </span>
                </div>
                
                <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: var(--primary-blue);">
                        <i class="fas fa-info-circle"></i> Sobre el Negocio
                    </h4>
                    <p style="margin: 0; color: var(--gray-700); line-height: 1.6;">
                        ${sponsor.description || 'Negocio local de confianza en tu barrio'}
                    </p>
                </div>
                
                <div style="display: grid; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: white; padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary-blue);">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; background: var(--primary-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                                <i class="fas fa-phone"></i>
                            </div>
                            <div>
                                <p style="margin: 0; font-size: 0.85rem; color: var(--gray-600);">Teléfono</p>
                                <p style="margin: 0; font-weight: 600; color: var(--gray-800); font-size: 1.1rem;">
                                    ${sponsor.contact}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    ${sponsor.website ? `
                        <div style="background: white; padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary-purple);">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="width: 40px; height: 40px; background: var(--primary-purple); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="fas fa-globe"></i>
                                </div>
                                <div style="flex: 1; overflow: hidden;">
                                    <p style="margin: 0; font-size: 0.85rem; color: var(--gray-600);">Sitio Web</p>
                                    <p style="margin: 0; font-weight: 600; color: var(--gray-800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${sponsor.website}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    ${sponsor.website ? `
                        <button class="btn-primary" onclick="window.open('${sponsor.website}', '_blank')" style="width: 100%;">
                            <i class="fas fa-external-link-alt"></i> Visitar Sitio
                        </button>
                    ` : ''}
                    <button class="btn-primary" onclick="window.open('https://wa.me/${sponsor.contact.replace(/[^0-9]/g, '')}', '_blank')" style="width: 100%; background: #25D366;">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    <button class="btn-primary" onclick="window.location.href='tel:${sponsor.contact}'" style="width: 100%;">
                        <i class="fas fa-phone"></i> Llamar
                    </button>
                </div>
                
                <div style="text-align: center;">
                    <button class="btn-secondary" onclick="VV.banner.closeSponsorDetails()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.banner.closeSponsorDetails();
        };
    },
    
    // Cerrar detalles del anunciante
    closeSponsorDetails() {
        const overlay = document.getElementById('sponsor-details-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Obtener banners activos del barrio
    getActiveBanners() {
        const now = new Date();
        
        return VV.data.sponsors.filter(s => {
            // Verificar si está activo
            if (!s.active || s.status === 'expired') return false;
            
            // Verificar fecha de expiración
            if (s.expiresAt) {
                const expiresAt = new Date(s.expiresAt);
                if (expiresAt <= now) {
                    // Marcar como expirado
                    s.status = 'expired';
                    s.active = false;
                    console.log(`🗑️ Anunciante vencido: ${s.name} (expiró el ${expiresAt.toLocaleDateString()})`);
                    return false;
                }
            }
            
            // Si no tiene barrios definidos o es 'all', mostrar en todos
            if (!s.neighborhoods || s.neighborhoods === 'all') return true;
            
            // Si tiene barrios específicos, verificar si el barrio actual está incluido
            if (Array.isArray(s.neighborhoods)) {
                return s.neighborhoods.includes(VV.data.neighborhood);
            }
            
            return false;
        });
    },
    
    // Cargar banners en el dashboard desktop
    loadDesktopBanners(banners) {
        const container = document.getElementById('desktop-sponsors-banner');
        if (!container) return;
        
        if (banners.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: var(--gray-50); border-radius: 12px; color: var(--gray-600);">
                    <i class="fas fa-bullhorn" style="font-size: 2rem; opacity: 0.5; margin-bottom: 0.5rem;"></i>
                    <p style="margin: 0;">No hay anunciantes en este momento</p>
                </div>
            `;
            return;
        }
        
        // Mostrar máximo 3 banners en el dashboard
        const displayBanners = banners.slice(0, 3);
         container.innerHTML = displayBanners.slice(0, 2).map(sponsor => `
            <div class="banner-slide" onclick="VV.banner.trackClick('${sponsor.id}')">
                <!-- Quitamos los estilos de 60px y dejamos que el CSS mande -->
                <img src="${sponsor.logo || sponsor.image_url}" alt="${sponsor.businessName}">
        
                <!-- El texto flota sobre la imagen -->
                <div class="banner-info-overlay">
                    <h4 class="banner-title">${sponsor.businessName}</h4>
                </div>
            </div>
`        ).join('');

    },
    
    // Mostrar todos los anunciantes en modal
    showAllSponsors() {
        const banners = VV.banner.getActiveBanners();
        
        let overlay = document.getElementById('all-sponsors-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'all-sponsors-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <h3><i class="fas fa-bullhorn"></i> Anunciantes de ${VV.data.neighborhood}</h3>
                <p style="color: var(--gray-600); margin-bottom: 2rem;">
                    Apoya a los negocios locales de tu barrio
                </p>
                
                ${banners.length === 0 ? `
                    <div style="text-align: center; padding: 3rem; background: var(--gray-50); border-radius: 12px;">
                        <i class="fas fa-store-slash" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                        <h4 style="color: var(--gray-600);">No hay anunciantes</h4>
                        <p style="color: var(--gray-500);">Aún no hay negocios anunciándose en tu barrio</p>
                    </div>
                ` : `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                        ${banners.map(sponsor => `
                            <div class="sponsor-card" onclick="VV.banner.trackClick('${sponsor.id}')" style="
                                background: white;
                                border-radius: 12px;
                                padding: 1.5rem;
                                cursor: pointer;
                                transition: all 0.3s;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                border: 2px solid var(--gray-200);
                            " onmouseover="this.style.borderColor='var(--warning-orange)'; this.style.transform='translateY(-4px)'" onmouseout="this.style.borderColor='var(--gray-200)'; this.style.transform='translateY(0)'">
                                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                    <div style="font-size: 3rem; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; background: var(--gray-100); border-radius: 50%;">
                                        ${sponsor.logo}
                                    </div>
                                    <div style="flex: 1;">
                                        <h4 style="margin: 0 0 0.25rem 0; color: var(--gray-800); font-size: 1.1rem;">${sponsor.business_name || sponsor.name}</h4>
                                        <p style="margin: 0; font-size: 0.85rem; color: var(--gray-600);">
                                            Negocio Local
                                        </p>
                                        <span style="display: inline-block; margin-top: 0.25rem; background: linear-gradient(135deg, var(--warning-orange), var(--primary-blue)); color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">
                                            ${sponsor.tier.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <p style="margin: 0 0 1rem 0; color: var(--gray-700); line-height: 1.5;">
                                    ${sponsor.description || 'Conoce más sobre nuestros productos y servicios'}
                                </p>
                                <div style="display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; background: var(--gray-50); border-radius: 8px;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--primary-blue);">
                                        <i class="fas fa-phone"></i>
                                        <span style="font-weight: 600;">${sponsor.contact}</span>
                                    </div>
                                    ${sponsor.website ? `
                                        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--primary-purple);">
                                            <i class="fas fa-globe"></i>
                                            <span style="font-size: 0.85rem;">${sponsor.website}</span>
                                        </div>
                                    ` : ''}
                                </div>
                                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--gray-500);">
                                    <span><i class="fas fa-eye"></i> ${sponsor.views || 0} vistas</span>
                                    <span><i class="fas fa-mouse-pointer"></i> ${sponsor.clicks || 0} clicks</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
                
                <div style="text-align: center; margin-top: 2rem;">
                    <button class="btn-secondary" onclick="VV.banner.closeAllSponsors()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.banner.closeAllSponsors();
        };
    },
    
    // Cerrar modal de todos los anunciantes
    closeAllSponsors() {
        const overlay = document.getElementById('all-sponsors-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Mostrar formulario de solicitud de anunciante (para usuarios comunes)
    showSponsorRequestForm() {
        let overlay = document.getElementById('sponsor-request-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sponsor-request-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 600px;">
                <h3><i class="fas fa-bullhorn"></i> Solicitar ser Anunciante</h3>
                <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                    Tu negocio aparecerá en el banner principal de la aplicación, visible para todos los usuarios del barrio.
                </p>
                
                <form id="sponsor-request-form">
                    <div class="form-group">
                        <label>Nombre del Negocio *</label>
                        <input type="text" id="sponsor-name" required placeholder="Ej: Panadería El Sol">
                    </div>
                    
                    <div class="form-group">
                        <label>Descripción *</label>
                        <textarea id="sponsor-description" rows="3" required placeholder="Describe tu negocio y lo que ofreces"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Logo/Emoji *</label>
                        <input type="text" id="sponsor-logo" required placeholder="Ej: 🍞 o URL de imagen" maxlength="100">
                        <small style="color: var(--gray-600);">Puedes usar un emoji o la URL de tu logo</small>
                    </div>
                    
                    <div class="form-group">
                        <label>Nivel de Anuncio *</label>
                        <select id="sponsor-tier" required>
                            <option value="bronze">🥉 Bronce - Básico</option>
                            <option value="silver">🥈 Plata - Destacado</option>
                            <option value="gold">🥇 Oro - Premium</option>
                        </select>
                        <small style="color: var(--gray-600);">El nivel afecta el tamaño y posición del anuncio</small>
                    </div>
                    
                    <div class="form-group">
                        <label>Teléfono de Contacto *</label>
                        <input type="tel" id="sponsor-contact" required placeholder="Ej: +54 9 11 1234-5678">
                    </div>
                    
                    <div class="form-group">
                        <label>Sitio Web (opcional)</label>
                        <input type="url" id="sponsor-website" placeholder="https://tu-sitio.com">
                    </div>
                    
                    <div class="form-group">
                        <label>Duración solicitada *</label>
                        <select id="sponsor-duration" required>
                            <option value="30">30 días</option>
                            <option value="60">60 días</option>
                            <option value="90">90 días</option>
                            <option value="180">180 días (6 meses)</option>
                            <option value="365">365 días (1 año)</option>
                        </select>
                    </div>
                    
                    <div style="background: var(--info-blue); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <p style="margin: 0; font-size: 0.9rem;">
                            <i class="fas fa-info-circle"></i> El administrador revisará tu solicitud y te contactará para coordinar el pago y activación.
                        </p>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.banner.closeSponsorRequestForm()">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-paper-plane"></i> Enviar Solicitud
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('sponsor-request-form').onsubmit = (e) => {
            e.preventDefault();
            
            const request = {
                id: VV.utils.generateId(),
                name: document.getElementById('sponsor-name').value.trim(),
                description: document.getElementById('sponsor-description').value.trim(),
                logo: document.getElementById('sponsor-logo').value.trim(),
                tier: document.getElementById('sponsor-tier').value,
                contact: document.getElementById('sponsor-contact').value.trim(),
                website: document.getElementById('sponsor-website').value.trim(),
                duration: parseInt(document.getElementById('sponsor-duration').value),
                userId: VV.data.user.id,
                userName: VV.data.user.name,
                userNumber: VV.data.user.unique_number,
                neighborhood: VV.data.neighborhood,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            // Guardar solicitud
            const requests = JSON.parse(localStorage.getItem('sponsorRequests') || '[]');
            requests.push(request);
            localStorage.setItem('sponsorRequests', JSON.stringify(requests));
            
            VV.banner.closeSponsorRequestForm();
            VV.utils.showSuccess('Solicitud enviada. El administrador la revisará pronto y te contactará.');
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.banner.closeSponsorRequestForm();
        };
    },
    
    closeSponsorRequestForm() {
        const overlay = document.getElementById('sponsor-request-overlay');
        if (overlay) overlay.classList.remove('active');
    }
};

console.log('✅ Módulo BANNER cargado');
