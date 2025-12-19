// ========== MÓDULO ADMINISTRACIÓN ==========

VV.admin = {
    sponsorRequests: [],
    
    // Cargar panel de admin
    load() {
        if (!VV.utils.isAdmin()) {
            alert('No tienes permisos de administrador');
            return;
        }
        
        VV.admin.loadSponsorRequests();
        VV.admin.loadFeaturedRequests();
        VV.admin.loadSponsors();
    },
    
    // Cargar solicitudes pendientes
    loadSponsorRequests() {
        const requests = JSON.parse(localStorage.getItem('sponsorRequests') || '[]');
        const pending = requests.filter(r => r.status === 'pending');
        
        const container = document.getElementById('sponsor-requests-container');
        const list = document.getElementById('sponsor-requests-list');
        
        if (pending.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        list.innerHTML = pending.map(req => `
            <div class="sponsor-request-card">
                <div class="request-header">
                    <div>
                        <h4>${req.logo} ${req.name}</h4>
                        <p style="color: var(--gray-600); font-size: 0.85rem; margin-top: 0.25rem;">
                            Solicitado por: ${req.userName} (${req.userEmail})
                        </p>
                    </div>
                    <span class="request-tier-badge ${req.tier}">${req.tier.toUpperCase()}</span>
                </div>
                <div class="request-info">
                    <p><i class="fas fa-info-circle"></i> ${req.description}</p>
                    <p><i class="fas fa-phone"></i> ${req.contact}</p>
                    ${req.website ? `<p><i class="fas fa-globe"></i> ${req.website}</p>` : ''}
                </div>
                <div class="request-actions">
                    <button class="btn-approve" onclick="VV.admin.approveSponsorRequest('${req.id}')">
                        <i class="fas fa-check"></i> Aprobar
                    </button>
                    <button class="btn-reject" onclick="VV.admin.rejectSponsorRequest('${req.id}')">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                </div>
            </div>
        `).join('');
        
        // Badge en menú
        const adminMenuItem = document.querySelector('[data-section="admin"]');
        if (adminMenuItem && pending.length > 0) {
            let badge = adminMenuItem.querySelector('.notification-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notification-badge';
                badge.style.cssText = 'background: var(--error-red); color: white; font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 10px; margin-left: auto;';
                adminMenuItem.appendChild(badge);
            }
            badge.textContent = pending.length;
        }
    },
    
    // Aprobar solicitud
    approveSponsorRequest(requestId) {
        const requests = JSON.parse(localStorage.getItem('sponsorRequests') || '[]');
        const request = requests.find(r => r.id === requestId);
        
        if (!request) return;
        
        // Crear anunciante
        const newSponsor = {
            id: VV.utils.generateId(),
            name: request.name,
            description: request.description,
            logo: request.logo,
            tier: request.tier,
            contact: request.contact,
            website: request.website,
            active: true,
            views: 0,
            clicks: 0
        };
        
        VV.data.sponsors.push(newSponsor);
        
        // Actualizar solicitud
        request.status = 'approved';
        localStorage.setItem('sponsorRequests', JSON.stringify(requests));
        
        VV.admin.load();
        VV.banner.init();
        VV.utils.showSuccess('Anunciante aprobado');
    },
    
    // Rechazar solicitud
    rejectSponsorRequest(requestId) {
        if (!confirm('¿Rechazar esta solicitud?')) return;
        
        const requests = JSON.parse(localStorage.getItem('sponsorRequests') || '[]');
        const request = requests.find(r => r.id === requestId);
        
        if (request) {
            request.status = 'rejected';
            localStorage.setItem('sponsorRequests', JSON.stringify(requests));
            VV.admin.load();
            VV.utils.showSuccess('Solicitud rechazada');
        }
    },
    
    // Cargar anunciantes
    loadSponsors() {
        const container = document.getElementById('sponsors-management');
        
        if (VV.data.sponsors.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay anunciantes</p>';
            return;
        }
        
        container.innerHTML = VV.data.sponsors.map(sponsor => `
            <div class="sponsor-management-card">
                <div class="sponsor-management-header">
                    <div class="sponsor-logo">${sponsor.logo}</div>
                    <span class="sponsor-tier ${sponsor.tier}">${sponsor.tier.toUpperCase()}</span>
                </div>
                <h4>${sponsor.name}</h4>
                <p>${sponsor.description}</p>
                <div class="sponsor-stats">
                    <p><i class="fas fa-eye"></i> ${sponsor.views} vistas</p>
                    <p><i class="fas fa-mouse-pointer"></i> ${sponsor.clicks} clics</p>
                    <p><i class="fas fa-phone"></i> ${sponsor.contact}</p>
                </div>
                <div style="margin: 0.5rem 0; padding: 0.5rem; background: var(--gray-50); border-radius: 4px;">
                    <p style="font-size: 0.85rem; color: var(--gray-600); margin: 0;">
                        <i class="fas fa-map-marker-alt"></i> 
                        <strong>Visible en:</strong> 
                        ${sponsor.neighborhoods === 'all' || !sponsor.neighborhoods 
                            ? '<span style="color: var(--success-green);">Todos los barrios</span>' 
                            : Array.isArray(sponsor.neighborhoods) 
                                ? sponsor.neighborhoods.join(', ') 
                                : sponsor.neighborhoods
                        }
                    </p>
                </div>
                <div class="sponsor-management-actions">
                    <button class="btn-edit" onclick="VV.admin.showSponsorForm('${sponsor.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-toggle ${sponsor.active ? '' : 'inactive'}" onclick="VV.admin.toggleSponsor('${sponsor.id}')">
                        <i class="fas fa-${sponsor.active ? 'pause' : 'play'}"></i> ${sponsor.active ? 'Pausar' : 'Activar'}
                    </button>
                    <button class="btn-delete" onclick="VV.admin.deleteSponsor('${sponsor.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    // Mostrar formulario de anunciante
    showSponsorForm(sponsorId = null) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const sponsor = sponsorId ? VV.data.sponsors.find(s => s.id === sponsorId) : null;
        const isEdit = sponsor !== null;
        
        let overlay = document.getElementById('sponsor-form-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sponsor-form-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-${isEdit ? 'edit' : 'bullhorn'}"></i> ${isEdit ? 'Editar' : 'Nuevo'} Anunciante</h3>
                <form id="sponsor-form">
                    <div class="form-group">
                        <label>Nombre del negocio *</label>
                        <input type="text" id="sponsor-name" value="${sponsor?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Descripción *</label>
                        <input type="text" id="sponsor-description" value="${sponsor?.description || ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Logo (emoji) *</label>
                            <input type="text" id="sponsor-logo" value="${sponsor?.logo || ''}" placeholder="🏪" required>
                        </div>
                        <div class="form-group">
                            <label>Nivel *</label>
                            <select id="sponsor-tier" required>
                                <option value="">Seleccionar</option>
                                <option value="premium" ${sponsor?.tier === 'premium' ? 'selected' : ''}>Premium</option>
                                <option value="gold" ${sponsor?.tier === 'gold' ? 'selected' : ''}>Gold</option>
                                <option value="silver" ${sponsor?.tier === 'silver' ? 'selected' : ''}>Silver</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Teléfono *</label>
                        <input type="tel" id="sponsor-contact" value="${sponsor?.contact || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Sitio web</label>
                        <input type="url" id="sponsor-website" value="${sponsor?.website || ''}" placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label>Imagen del banner (opcional)</label>
                        <input type="file" id="sponsor-image" accept="image/*">
                        <p style="font-size: 0.85rem; color: var(--gray-600); margin-top: 0.5rem;">
                            <i class="fas fa-info-circle"></i> Si no subes imagen, se usará el emoji como logo
                        </p>
                        ${sponsor?.imageUrl ? `<p style="font-size: 0.85rem; color: var(--success-green); margin-top: 0.5rem;"><i class="fas fa-check"></i> Imagen actual cargada</p>` : ''}
                    </div>
                    <div class="form-group">
                        <label>Mostrar en barrios *</label>
                        <select id="sponsor-visibility" onchange="VV.admin.toggleNeighborhoodSelection()">
                            <option value="all" ${!sponsor?.neighborhoods || sponsor?.neighborhoods === 'all' ? 'selected' : ''}>Todos los barrios</option>
                            <option value="specific" ${sponsor?.neighborhoods && sponsor?.neighborhoods !== 'all' ? 'selected' : ''}>Barrios específicos</option>
                        </select>
                    </div>
                    <div class="form-group" id="neighborhoods-selection" style="display: ${sponsor?.neighborhoods && sponsor?.neighborhoods !== 'all' ? 'block' : 'none'};">
                        <label>Seleccionar barrios</label>
                        <div id="neighborhoods-checkboxes" style="max-height: 200px; overflow-y: auto; border: 1px solid var(--gray-300); border-radius: 8px; padding: 1rem;">
                            <!-- Se llenará dinámicamente -->
                        </div>
                        <p style="font-size: 0.85rem; color: var(--gray-600); margin-top: 0.5rem;">
                            <i class="fas fa-info-circle"></i> Selecciona uno o más barrios donde se mostrará el anuncio
                        </p>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="sponsor-active" ${sponsor?.active !== false ? 'checked' : ''}> 
                            Anuncio activo
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.admin.closeSponsorForm()">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-save"></i> ${isEdit ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        // Poblar lista de barrios
        VV.admin.loadNeighborhoodCheckboxes(sponsor);
        
        document.getElementById('sponsor-form').onsubmit = (e) => {
            e.preventDefault();
            VV.admin.saveSponsor(sponsor);
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.admin.closeSponsorForm();
        };
    },
    
    // Cargar checkboxes de barrios
    loadNeighborhoodCheckboxes(sponsor) {
        const container = document.getElementById('neighborhoods-checkboxes');
        const neighborhoods = VV.auth.getExistingNeighborhoods().filter(n => n !== 'Administrador');
        
        if (neighborhoods.length === 0) {
            container.innerHTML = '<p style="color: var(--gray-600); padding: 0.5rem;">No hay barrios registrados aún</p>';
            return;
        }
        
        const selectedNeighborhoods = sponsor?.neighborhoods && sponsor.neighborhoods !== 'all' 
            ? (Array.isArray(sponsor.neighborhoods) ? sponsor.neighborhoods : [sponsor.neighborhoods])
            : [];
        
        container.innerHTML = neighborhoods.map(n => `
            <label style="display: block; padding: 0.5rem; cursor: pointer; border-bottom: 1px solid var(--gray-200);">
                <input type="checkbox" name="neighborhood" value="${n}" ${selectedNeighborhoods.includes(n) ? 'checked' : ''} style="margin-right: 0.5rem;">
                ${n}
            </label>
        `).join('');
    },
    
    // Toggle selección de barrios
    toggleNeighborhoodSelection() {
        const visibility = document.getElementById('sponsor-visibility').value;
        const selection = document.getElementById('neighborhoods-selection');
        selection.style.display = visibility === 'specific' ? 'block' : 'none';
    },
    
    // Cerrar formulario
    closeSponsorForm() {
        const overlay = document.getElementById('sponsor-form-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Guardar anunciante
    async saveSponsor(existing) {
        // Obtener barrios seleccionados
        const visibility = document.getElementById('sponsor-visibility').value;
        let neighborhoods = 'all';
        
        if (visibility === 'specific') {
            const checkboxes = document.querySelectorAll('input[name="neighborhood"]:checked');
            if (checkboxes.length === 0) {
                alert('Debes seleccionar al menos un barrio');
                return;
            }
            neighborhoods = Array.from(checkboxes).map(cb => cb.value);
        }
        
        const formData = {
            name: document.getElementById('sponsor-name').value.trim(),
            description: document.getElementById('sponsor-description').value.trim(),
            logo: document.getElementById('sponsor-logo').value.trim(),
            tier: document.getElementById('sponsor-tier').value,
            contact: document.getElementById('sponsor-contact').value.trim(),
            website: document.getElementById('sponsor-website').value.trim(),
            active: document.getElementById('sponsor-active').checked,
            neighborhoods: neighborhoods,
            imageUrl: existing?.imageUrl || ''
        };
        
        if (!formData.name || !formData.description || !formData.logo || !formData.tier || !formData.contact) {
            alert('Completa todos los campos obligatorios');
            return;
        }
        
        // Procesar imagen si existe
        const imageInput = document.getElementById('sponsor-image');
        if (imageInput.files && imageInput.files[0]) {
            const file = imageInput.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                formData.imageUrl = e.target.result;
                VV.admin.saveSponsorData(existing, formData);
            };
            reader.readAsDataURL(file);
        } else {
            VV.admin.saveSponsorData(existing, formData);
        }
    },
    
    // Guardar datos del anunciante (helper)
    saveSponsorData(existing, formData) {
        if (existing) {
            const index = VV.data.sponsors.findIndex(s => s.id === existing.id);
            VV.data.sponsors[index] = { ...existing, ...formData };
        } else {
            VV.data.sponsors.push({
                id: VV.utils.generateId(),
                ...formData,
                views: 0,
                clicks: 0
            });
        }
        
        VV.admin.closeSponsorForm();
        VV.admin.loadSponsors();
        VV.banner.init();
        VV.utils.showSuccess(existing ? 'Anunciante actualizado' : 'Anunciante creado');
    },
    
    // Toggle anunciante
    toggleSponsor(sponsorId) {
        const sponsor = VV.data.sponsors.find(s => s.id === sponsorId);
        if (sponsor) {
            sponsor.active = !sponsor.active;
            VV.admin.loadSponsors();
            VV.banner.init();
            VV.utils.showSuccess(sponsor.active ? 'Anunciante activado' : 'Anunciante pausado');
        }
    },
    
    // Eliminar anunciante
    deleteSponsor(sponsorId) {
        if (!confirm('¿Eliminar este anunciante?')) return;
        
        VV.data.sponsors = VV.data.sponsors.filter(s => s.id !== sponsorId);
        VV.admin.loadSponsors();
        VV.banner.init();
        VV.utils.showSuccess('Anunciante eliminado');
    },
    
    // Cambiar tab
    showTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[onclick="VV.admin.showTab('${tabName}')"]`).classList.add('active');
        
        document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`admin-${tabName}`).classList.add('active');
        
        if (tabName === 'stats') VV.admin.loadStats();
        if (tabName === 'moderator-logs') VV.admin.loadModeratorLogs();
        if (tabName === 'featured') VV.admin.loadFeaturedOffers();
        if (tabName === 'avatars') VV.admin.loadAvatarsManagement();
        if (tabName === 'raffles') VV.admin.loadRafflesManagement();
    },
    
    // Cargar estadísticas
    loadStats() {
        const totalViews = VV.data.sponsors.reduce((sum, s) => sum + s.views, 0);
        const totalClicks = VV.data.sponsors.reduce((sum, s) => sum + s.clicks, 0);
        
        document.getElementById('banner-views').textContent = totalViews.toLocaleString();
        document.getElementById('banner-clicks').textContent = totalClicks.toLocaleString();
    },
    
    // Gestión de usuarios
    loadUsers() {
        if (!VV.utils.isAdmin()) {
            alert('No tienes permisos');
            return;
        }
        
        const users = VV.auth.getAllUsers();
        const container = document.getElementById('users-management-list');
        
        // Agrupar usuarios por barrio
        const usersByNeighborhood = {};
        users.forEach(user => {
            if (!usersByNeighborhood[user.neighborhood]) {
                usersByNeighborhood[user.neighborhood] = [];
            }
            usersByNeighborhood[user.neighborhood].push(user);
        });
        
        let html = '';
        
        // Mostrar usuarios agrupados por barrio
        Object.keys(usersByNeighborhood).sort().forEach(neighborhood => {
            const neighborhoodUsers = usersByNeighborhood[neighborhood];
            html += `
                <div style="grid-column: 1/-1; margin-top: 1.5rem; padding: 0.75rem; background: var(--gray-100); border-radius: 8px; font-weight: 600; color: var(--gray-700);">
                    <i class="fas fa-map-marker-alt"></i> ${neighborhood} (${neighborhoodUsers.length} usuario${neighborhoodUsers.length !== 1 ? 's' : ''})
                </div>
            `;
            
            html += neighborhoodUsers.map(user => `
                <div class="user-card">
                    <div class="user-info">
                        <h4>${user.name}</h4>
                        <p>${user.email} • ${user.phone}</p>
                        <p style="font-size: 0.85rem; color: var(--gray-500);">
                            <i class="fas fa-map-marker-alt"></i> ${user.neighborhood}
                        </p>
                    </div>
                    <span class="user-role-badge ${user.role}">
                        ${user.role === 'admin' ? '👑 ADMIN' : user.role === 'moderator' ? '🛡️ MODERADOR' : 'USUARIO'}
                    </span>
                    <div class="user-actions">
                        ${user.id !== VV.data.user.id ? `
                            ${user.role === 'moderator' ? 
                                `<button class="btn-edit" onclick="VV.admin.toggleModerator('${user.id}')">
                                    <i class="fas fa-user-minus"></i> Quitar Moderador
                                </button>` :
                                `<button class="btn-approve" onclick="VV.admin.toggleModerator('${user.id}')">
                                    <i class="fas fa-shield-alt"></i> Hacer Moderador
                                </button>`
                            }
                            <button class="btn-delete" onclick="VV.admin.deleteUser('${user.id}')">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        ` : '<span style="color: var(--gray-500); font-size: 0.85rem;">Tu cuenta</span>'}
                    </div>
                </div>
            `).join('');
        });
        
        container.innerHTML = html || '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay usuarios registrados</p>';
    },
    
    // Cambiar rol de usuario
    toggleUserRole(userId) {
        const userKey = `vecinosVirtuales_user_${userId}`;
        const userData = JSON.parse(localStorage.getItem(userKey));
        
        if (!userData) return;
        
        userData.role = userData.role === 'admin' ? 'user' : 'admin';
        localStorage.setItem(userKey, JSON.stringify(userData));
        
        VV.admin.loadUsers();
        VV.utils.showSuccess(`Usuario ${userData.role === 'admin' ? 'promovido a' : 'degradado de'} administrador`);
    },
    
    // Promover/degradar moderador
    toggleModerator(userId) {
        const userKey = `vecinosVirtuales_user_${userId}`;
        const userData = JSON.parse(localStorage.getItem(userKey));
        
        if (!userData) return;
        
        userData.role = userData.role === 'moderator' ? 'user' : 'moderator';
        localStorage.setItem(userKey, JSON.stringify(userData));
        
        VV.admin.loadUsers();
        VV.utils.showSuccess(`Usuario ${userData.role === 'moderator' ? 'promovido a' : 'degradado de'} moderador`);
    },
    
    // Eliminar usuario
    deleteUser(userId) {
        if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
        
        const userKey = `vecinosVirtuales_user_${userId}`;
        localStorage.removeItem(userKey);
        
        VV.admin.loadUsers();
        VV.utils.showSuccess('Usuario eliminado');
    },
    
    // Editar imagen de portada (solo admin)
    editBannerImage() {
        let overlay = document.getElementById('banner-image-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'banner-image-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        const currentImage = localStorage.getItem('welcomeBannerImage') || '';
        
        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-image"></i> Configurar Imagen de Portada</h3>
                <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                    Esta imagen se mostrará en la pantalla de bienvenida del dashboard
                </p>
                <form id="banner-image-form">
                    <div class="form-group">
                        <label>Subir imagen de portada</label>
                        <input type="file" id="banner-image-file" accept="image/*">
                        <p style="font-size: 0.85rem; color: var(--gray-600); margin-top: 0.5rem;">
                            <i class="fas fa-info-circle"></i> Recomendado: 1200x400px
                        </p>
                        ${currentImage ? `<p style="font-size: 0.85rem; color: var(--success-green); margin-top: 0.5rem;"><i class="fas fa-check"></i> Imagen actual configurada</p>` : ''}
                    </div>
                    ${currentImage ? `
                        <div class="form-group">
                            <button type="button" class="btn-delete" onclick="VV.admin.removeBannerImage()" style="width: 100%;">
                                <i class="fas fa-trash"></i> Eliminar Imagen Actual
                            </button>
                        </div>
                    ` : ''}
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="document.getElementById('banner-image-overlay').classList.remove('active')">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-save"></i> Guardar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('banner-image-form').onsubmit = (e) => {
            e.preventDefault();
            VV.admin.saveBannerImage();
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        };
    },
    
    // Guardar imagen de portada
    saveBannerImage() {
        const fileInput = document.getElementById('banner-image-file');
        if (!fileInput.files || !fileInput.files[0]) {
            alert('Por favor selecciona una imagen');
            return;
        }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('welcomeBannerImage', e.target.result);
            document.getElementById('banner-image-overlay').classList.remove('active');
            VV.admin.loadBannerImage();
            VV.utils.showSuccess('Imagen de portada actualizada');
        };
        reader.readAsDataURL(file);
    },
    
    // Eliminar imagen de portada
    removeBannerImage() {
        if (!confirm('¿Eliminar la imagen de portada?')) return;
        
        localStorage.removeItem('welcomeBannerImage');
        document.getElementById('banner-image-overlay').classList.remove('active');
        VV.admin.loadBannerImage();
        VV.utils.showSuccess('Imagen de portada eliminada');
    },
    
    // Cargar imagen de portada
    loadBannerImage() {
        const banner = document.getElementById('welcome-banner');
        const imageUrl = localStorage.getItem('welcomeBannerImage');
        
        if (imageUrl) {
            banner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${imageUrl}')`;
            banner.style.backgroundSize = 'cover';
            banner.style.backgroundPosition = 'center';
            banner.style.minHeight = '250px';
        } else {
            banner.style.backgroundImage = 'linear-gradient(135deg, var(--primary-blue), var(--primary-purple))';
            banner.style.backgroundSize = 'auto';
            banner.style.backgroundPosition = 'initial';
            banner.style.minHeight = 'auto';
        }
    },
    
    // Cargar logs de actividad de moderadores
    loadModeratorLogs() {
        const neighborhoodFilter = document.getElementById('log-filter-neighborhood').value;
        const actionFilter = document.getElementById('log-filter-action').value;
        
        // Cargar todos los logs
        let logs = VV.utils.getModeratorLogs(null, 200);
        
        // Aplicar filtros
        if (neighborhoodFilter) {
            logs = logs.filter(log => log.neighborhood === neighborhoodFilter);
        }
        if (actionFilter) {
            logs = logs.filter(log => log.action === actionFilter);
        }
        
        // Poblar filtro de barrios (solo una vez)
        const neighborhoodSelect = document.getElementById('log-filter-neighborhood');
        if (neighborhoodSelect.options.length === 1) {
            const neighborhoods = [...new Set(VV.utils.getModeratorLogs(null, 500).map(l => l.neighborhood))];
            neighborhoods.forEach(n => {
                const option = document.createElement('option');
                option.value = n;
                option.textContent = n;
                neighborhoodSelect.appendChild(option);
            });
        }
        
        const container = document.getElementById('moderator-logs-list');
        
        if (logs.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay actividad registrada</p>';
            return;
        }
        
        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                    <thead style="background: var(--gray-100);">
                        <tr>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--gray-300);">Fecha/Hora</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--gray-300);">Moderador</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--gray-300);">Barrio</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--gray-300);">Acción</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--gray-300);">Detalles</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map((log, index) => {
                            const date = new Date(log.timestamp);
                            const actionColor = {
                                'ELIMINAR_USUARIO': 'var(--error-red)',
                                'ELIMINAR_PRODUCTO': 'var(--warning-orange)',
                                'ELIMINAR_PUBLICACION': 'var(--primary-purple)'
                            }[log.action] || 'var(--gray-600)';
                            
                            const actionText = {
                                'ELIMINAR_USUARIO': '🚫 Eliminó Usuario',
                                'ELIMINAR_PRODUCTO': '🗑️ Eliminó Producto',
                                'ELIMINAR_PUBLICACION': '🚫 Eliminó Publicación'
                            }[log.action] || log.action;
                            
                            let detailsText = '';
                            if (log.action === 'ELIMINAR_USUARIO') {
                                detailsText = `Usuario: ${log.details.usuarioNombre}`;
                            } else if (log.action === 'ELIMINAR_PRODUCTO') {
                                detailsText = `Producto: "${log.details.productoNombre}" de ${log.details.vendedor}`;
                            } else if (log.action === 'ELIMINAR_PUBLICACION') {
                                detailsText = `"${log.details.publicacionTitulo}" (${log.details.tipo}) de ${log.details.autor}`;
                            }
                            
                            return `
                                <tr style="border-bottom: 1px solid var(--gray-200); ${index % 2 === 0 ? 'background: var(--gray-50);' : ''}">
                                    <td style="padding: 0.75rem; font-size: 0.85rem; color: var(--gray-600);">
                                        ${date.toLocaleDateString()}<br>
                                        ${date.toLocaleTimeString()}
                                    </td>
                                    <td style="padding: 0.75rem; font-weight: 600;">
                                        ${log.moderatorName}
                                    </td>
                                    <td style="padding: 0.75rem;">
                                        <span style="background: var(--gray-200); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">
                                            ${log.neighborhood}
                                        </span>
                                    </td>
                                    <td style="padding: 0.75rem; color: ${actionColor}; font-weight: 600;">
                                        ${actionText}
                                    </td>
                                    <td style="padding: 0.75rem; font-size: 0.9rem; color: var(--gray-700);">
                                        ${detailsText}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <p style="text-align: center; margin-top: 1rem; color: var(--gray-600); font-size: 0.85rem;">
                Mostrando ${logs.length} registro(s) de actividad
            </p>
        `;
    }
};

// Solicitar ser anunciante (usuarios comunes)
window.requestSponsorStatus = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    let overlay = document.getElementById('sponsor-request-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sponsor-request-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
        <div class="modal-form">
            <h3><i class="fas fa-bullhorn"></i> Solicitar ser Anunciante</h3>
            <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                Envía tu solicitud al administrador para publicar anuncios
            </p>
            <form id="sponsor-request-form">
                <div class="form-group">
                    <label>Nombre del negocio *</label>
                    <input type="text" id="request-name" required>
                </div>
                <div class="form-group">
                    <label>Descripción *</label>
                    <input type="text" id="request-description" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Logo (emoji) *</label>
                        <input type="text" id="request-logo" placeholder="🏪" required>
                    </div>
                    <div class="form-group">
                        <label>Nivel deseado *</label>
                        <select id="request-tier" required>
                            <option value="">Seleccionar</option>
                            <option value="premium">Premium</option>
                            <option value="gold">Gold</option>
                            <option value="silver">Silver</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Teléfono *</label>
                    <input type="tel" id="request-contact" value="${VV.data.user?.phone || ''}" required>
                </div>
                <div class="form-group">
                    <label>Sitio web</label>
                    <input type="url" id="request-website" placeholder="https://...">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="document.getElementById('sponsor-request-overlay').classList.remove('active')">Cancelar</button>
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
            name: document.getElementById('request-name').value.trim(),
            description: document.getElementById('request-description').value.trim(),
            logo: document.getElementById('request-logo').value.trim(),
            tier: document.getElementById('request-tier').value,
            contact: document.getElementById('request-contact').value.trim(),
            website: document.getElementById('request-website').value.trim(),
            userId: VV.data.user.id,
            userName: VV.data.user.name,
            userEmail: VV.data.user.email,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        const requests = JSON.parse(localStorage.getItem('sponsorRequests') || '[]');
        requests.push(request);
        localStorage.setItem('sponsorRequests', JSON.stringify(requests));
        
        overlay.classList.remove('active');
        VV.utils.showSuccess('Solicitud enviada. El administrador la revisará pronto.');
    };
    
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    };
}

// ========== FUNCIONES GLOBALES PARA ADMIN ==========

VV.admin.loadAllNeighborhoods = function() {
    if (!VV.utils.isAdmin()) return;
    
    // Obtener todos los barrios con usuarios
    const neighborhoods = new Map();
    const users = VV.auth.getAllUsers();
    
    users.forEach(user => {
        if (user.neighborhood && user.neighborhood !== 'Administrador') {
            if (!neighborhoods.has(user.neighborhood)) {
                neighborhoods.set(user.neighborhood, {
                    name: user.neighborhood,
                    users: [],
                    products: 0,
                    improvements: 0,
                    cultural: 0,
                    services: 0
                });
            }
            neighborhoods.get(user.neighborhood).users.push(user);
        }
    });
    
    // Contar productos, mejoras, etc por barrio
    VV.data.products.forEach(p => {
        if (neighborhoods.has(p.neighborhood)) {
            neighborhoods.get(p.neighborhood).products++;
        }
    });
    
    VV.data.improvements.forEach(i => {
        if (neighborhoods.has(i.neighborhood)) {
            neighborhoods.get(i.neighborhood).improvements++;
        }
    });
    
    VV.data.culturalPosts.forEach(c => {
        if (neighborhoods.has(c.neighborhood)) {
            neighborhoods.get(c.neighborhood).cultural++;
        }
    });
    
    VV.data.services.forEach(s => {
        if (neighborhoods.has(s.neighborhood)) {
            neighborhoods.get(s.neighborhood).services++;
        }
    });
    
    const neighborhoodsList = Array.from(neighborhoods.values());
    
    // Estadísticas
    const statsContainer = document.getElementById('admin-neighborhoods-stats');
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon blue">
                <i class="fas fa-map-marked-alt"></i>
            </div>
            <div class="stat-info">
                <h3>Total Barrios</h3>
                <p class="stat-number">${neighborhoodsList.length}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green">
                <i class="fas fa-users"></i>
            </div>
            <div class="stat-info">
                <h3>Total Usuarios</h3>
                <p class="stat-number">${users.filter(u => u.neighborhood !== 'Administrador').length}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon purple">
                <i class="fas fa-shopping-bag"></i>
            </div>
            <div class="stat-info">
                <h3>Total Productos</h3>
                <p class="stat-number">${VV.data.products.length}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon orange">
                <i class="fas fa-tools"></i>
            </div>
            <div class="stat-info">
                <h3>Total Mejoras</h3>
                <p class="stat-number">${VV.data.improvements.length}</p>
            </div>
        </div>
    `;
    
    // Lista de barrios
    const listContainer = document.getElementById('admin-neighborhoods-list');
    if (neighborhoodsList.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay barrios registrados</p>';
        return;
    }
    
    listContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            ${neighborhoodsList.map(n => `
                <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid var(--primary-blue);">
                    <h3 style="margin: 0 0 1rem 0; color: var(--primary-blue); display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-map-marker-alt"></i> ${n.name}
                    </h3>
                    <div style="display: grid; gap: 0.5rem; font-size: 0.9rem;">
                        <p style="margin: 0; display: flex; justify-content: space-between;">
                            <span><i class="fas fa-users"></i> Usuarios:</span>
                            <strong>${n.users.length}</strong>
                        </p>
                        <p style="margin: 0; display: flex; justify-content: space-between;">
                            <span><i class="fas fa-shopping-bag"></i> Productos:</span>
                            <strong>${n.products}</strong>
                        </p>
                        <p style="margin: 0; display: flex; justify-content: space-between;">
                            <span><i class="fas fa-tools"></i> Mejoras:</span>
                            <strong>${n.improvements}</strong>
                        </p>
                        <p style="margin: 0; display: flex; justify-content: space-between;">
                            <span><i class="fas fa-palette"></i> Cultura:</span>
                            <strong>${n.cultural}</strong>
                        </p>
                        <p style="margin: 0; display: flex; justify-content: space-between;">
                            <span><i class="fas fa-briefcase"></i> Servicios:</span>
                            <strong>${n.services}</strong>
                        </p>
                    </div>
                    <button class="btn-primary" style="margin-top: 1rem; width: 100%;" onclick="VV.admin.viewNeighborhoodDetails('${n.name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                </div>
            `).join('')}
        </div>
    `;
};

VV.admin.loadAllProducts = function() {
    if (!VV.utils.isAdmin()) return;
    
    const neighborhoodFilter = document.getElementById('admin-product-neighborhood-filter').value;
    const categoryFilter = document.getElementById('admin-product-category-filter').value;
    const searchTerm = document.getElementById('admin-product-search').value.toLowerCase();
    
    // Poblar filtro de barrios
    const neighborhoods = [...new Set(VV.data.products.map(p => p.neighborhood))].sort();
    const neighborhoodSelect = document.getElementById('admin-product-neighborhood-filter');
    const currentValue = neighborhoodSelect.value;
    neighborhoodSelect.innerHTML = '<option value="">Todos los barrios</option>' + 
        neighborhoods.map(n => `<option value="${n}" ${n === currentValue ? 'selected' : ''}>${n}</option>`).join('');
    
    // Poblar filtro de categorías
    const categories = [...new Set(VV.data.products.map(p => p.category))].sort();
    const categorySelect = document.getElementById('admin-product-category-filter');
    const currentCat = categorySelect.value;
    categorySelect.innerHTML = '<option value="">Todas las categorías</option>' + 
        categories.map(c => `<option value="${c}" ${c === currentCat ? 'selected' : ''}>${c}</option>`).join('');
    
    // Filtrar productos
    let filtered = VV.data.products;
    if (neighborhoodFilter) filtered = filtered.filter(p => p.neighborhood === neighborhoodFilter);
    if (categoryFilter) filtered = filtered.filter(p => p.category === categoryFilter);
    if (searchTerm) filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.description.toLowerCase().includes(searchTerm)
    );
    
    // Estadísticas
    const statsContainer = document.getElementById('admin-products-stats');
    const totalValue = filtered.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon blue">
                <i class="fas fa-boxes"></i>
            </div>
            <div class="stat-info">
                <h3>Productos</h3>
                <p class="stat-number">${filtered.length}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green">
                <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="stat-info">
                <h3>Valor Total</h3>
                <p class="stat-number">$${totalValue.toFixed(2)}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon purple">
                <i class="fas fa-tags"></i>
            </div>
            <div class="stat-info">
                <h3>Categorías</h3>
                <p class="stat-number">${categories.length}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon orange">
                <i class="fas fa-map-marked-alt"></i>
            </div>
            <div class="stat-info">
                <h3>Barrios</h3>
                <p class="stat-number">${neighborhoods.length}</p>
            </div>
        </div>
    `;
    
    // Lista de productos
    const listContainer = document.getElementById('admin-products-list');
    if (filtered.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay productos</p>';
        return;
    }
    
    listContainer.innerHTML = filtered.map(product => {
        const seller = VV.auth.getAllUsers().find(u => u.id === product.sellerId);
        return `
            <div class="product-card">
                <div class="product-image">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<i class="fas fa-box"></i>'}
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div style="margin: 0.5rem 0; padding: 0.5rem; background: var(--gray-50); border-radius: 4px; font-size: 0.85rem;">
                        <p style="margin: 0.25rem 0;"><i class="fas fa-map-marker-alt"></i> <strong>${product.neighborhood}</strong></p>
                        <p style="margin: 0.25rem 0;"><i class="fas fa-user"></i> ${seller ? seller.name : 'Usuario desconocido'}</p>
                    </div>
                    <div class="product-footer">
                        <span class="product-price">$${product.price}</span>
                        <button class="btn-delete" onclick="VV.admin.deleteProduct('${product.id}')" title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

VV.admin.loadAllImprovements = function() {
    if (!VV.utils.isAdmin()) return;
    
    const neighborhoodFilter = document.getElementById('admin-improvement-neighborhood-filter').value;
    const statusFilter = document.getElementById('admin-improvement-status-filter').value;
    
    // Poblar filtro de barrios
    const neighborhoods = [...new Set(VV.data.improvements.map(i => i.neighborhood))].sort();
    const neighborhoodSelect = document.getElementById('admin-improvement-neighborhood-filter');
    const currentValue = neighborhoodSelect.value;
    neighborhoodSelect.innerHTML = '<option value="">Todos los barrios</option>' + 
        neighborhoods.map(n => `<option value="${n}" ${n === currentValue ? 'selected' : ''}>${n}</option>`).join('');
    
    // Filtrar mejoras
    let filtered = VV.data.improvements;
    if (neighborhoodFilter) filtered = filtered.filter(i => i.neighborhood === neighborhoodFilter);
    if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
    
    // Estadísticas
    const statsContainer = document.getElementById('admin-improvements-stats');
    const pending = VV.data.improvements.filter(i => i.status === 'pending').length;
    const inProgress = VV.data.improvements.filter(i => i.status === 'in-progress').length;
    const completed = VV.data.improvements.filter(i => i.status === 'completed').length;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon orange">
                <i class="fas fa-clock"></i>
            </div>
            <div class="stat-info">
                <h3>Pendientes</h3>
                <p class="stat-number">${pending}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon blue">
                <i class="fas fa-spinner"></i>
            </div>
            <div class="stat-info">
                <h3>En Progreso</h3>
                <p class="stat-number">${inProgress}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-info">
                <h3>Completadas</h3>
                <p class="stat-number">${completed}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon purple">
                <i class="fas fa-map-marked-alt"></i>
            </div>
            <div class="stat-info">
                <h3>Barrios</h3>
                <p class="stat-number">${neighborhoods.length}</p>
            </div>
        </div>
    `;
    
    // Lista de mejoras
    const listContainer = document.getElementById('admin-improvements-list');
    if (filtered.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay mejoras</p>';
        return;
    }
    
    listContainer.innerHTML = filtered.map(improvement => {
        const author = VV.auth.getAllUsers().find(u => u.id === improvement.authorId);
        const statusColors = {
            'pending': 'var(--warning-orange)',
            'in-progress': 'var(--primary-blue)',
            'completed': 'var(--success-green)'
        };
        const statusLabels = {
            'pending': 'Pendiente',
            'in-progress': 'En Progreso',
            'completed': 'Completada'
        };
        
        return `
            <div class="improvement-card" style="border-left: 4px solid ${statusColors[improvement.status]};">
                <div class="improvement-header">
                    <h3>${improvement.title}</h3>
                    <span class="improvement-status" style="background: ${statusColors[improvement.status]};">
                        ${statusLabels[improvement.status]}
                    </span>
                </div>
                <p class="improvement-description">${improvement.description}</p>
                <div style="margin: 0.5rem 0; padding: 0.5rem; background: var(--gray-50); border-radius: 4px; font-size: 0.85rem;">
                    <p style="margin: 0.25rem 0;"><i class="fas fa-map-marker-alt"></i> <strong>${improvement.neighborhood}</strong></p>
                    <p style="margin: 0.25rem 0;"><i class="fas fa-user"></i> ${author ? author.name : 'Usuario desconocido'}</p>
                    <p style="margin: 0.25rem 0;"><i class="fas fa-calendar"></i> ${new Date(improvement.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="improvement-footer">
                    <div class="improvement-votes">
                        <i class="fas fa-thumbs-up"></i> ${improvement.votes || 0} votos
                    </div>
                    <button class="btn-delete" onclick="VV.admin.deleteImprovement('${improvement.id}')" title="Eliminar mejora">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
};

VV.admin.viewNeighborhoodDetails = function(neighborhood) {
    alert(`Detalles de ${neighborhood}\n\nEsta funcionalidad mostrará información detallada del barrio.`);
};

VV.admin.deleteProduct = function(productId) {
    if (!confirm('¿Eliminar este producto?')) return;
    
    VV.data.products = VV.data.products.filter(p => p.id !== productId);
    localStorage.setItem('vecinosVirtuales_products', JSON.stringify(VV.data.products));
    VV.admin.loadAllProducts();
    VV.utils.showSuccess('Producto eliminado');
};

VV.admin.deleteImprovement = function(improvementId) {
    if (!confirm('¿Eliminar esta mejora?')) return;
    
    VV.data.improvements = VV.data.improvements.filter(i => i.id !== improvementId);
    localStorage.setItem('vecinosVirtuales_improvements', JSON.stringify(VV.data.improvements));
    VV.admin.loadAllImprovements();
    VV.utils.showSuccess('Mejora eliminada');
};
// ========== GESTIÓN DE OFERTAS DESTACADAS (SUPABASE) ==========

/**
 * 1. CARGAR SOLICITUDES PENDIENTES
 * El Admin ve lo que los usuarios han solicitado y está esperando aprobación.
 */
VV.admin.loadFeaturedRequests = async function () {
    try {
        const container = document.getElementById('featured-requests-container');
        const list = document.getElementById('featured-requests-list');
        if (!container || !list) return;

        // Consultamos a Supabase solicitudes con estado 'pending'
        const { data: requests, error } = await supabase
            .from('featured_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!requests || requests.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        list.innerHTML = requests.map((req) => `
            <div class="sponsor-request-card" style="border-left: 4px solid var(--warning-orange); margin-bottom: 1rem; padding: 1rem; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div class="request-header" style="display: flex; justify-content: space-between;">
                    <div>
                        <h4 style="margin:0;"><i class="fas fa-star" style="color: var(--warning-orange);"></i> ${req.product_name || req.title || 'Solicitud de Destacado'}</h4>
                        <p style="color: var(--gray-600); font-size: 0.85rem; margin-top: 0.25rem;">
                            Por: ${req.user_name || 'Usuario'} | Barrio: ${req.neighborhood || 'N/A'}
                        </p>
                    </div>
                    <span style="background: var(--warning-orange); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; height: fit-content;">
                        ${req.duration_days || 7} DÍAS
                    </span>
                </div>
                <div class="request-info" style="margin: 1rem 0; font-size: 0.9rem;">
                    ${req.product_price ? `<p style="margin: 0.2rem 0;"><strong>Precio:</strong> $${req.product_price}</p>` : ''}
                    <p style="margin: 0.2rem 0;"><strong>Descripción/Mensaje:</strong> ${req.description || req.message || 'Sin descripción'}</p>
                </div>
                <div class="request-actions" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; background: #f0f0f0; padding: 0.3rem 0.6rem; border-radius: 4px;">
                        <input type="number" id="duration-${req.id}" value="${req.duration_days || 7}" min="1" max="90" style="width: 50px; border: none; background: transparent; font-weight: bold; text-align: center;">
                        <span style="font-size: 0.8rem; color: #666; margin-left: 4px;">días</span>
                    </div>
                    <button class="btn-approve" onclick="VV.admin.approveFeaturedRequest('${req.id}')" style="background: var(--success-green); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-check"></i> Aprobar
                    </button>
                    <button class="btn-reject" onclick="VV.admin.rejectFeaturedRequest('${req.id}')" style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error en loadFeaturedRequests:', error);
    }
};

/**
 * 2. APROBAR SOLICITUD
 * Cambia el estado a 'approved' y calcula la fecha de expiración real.
 */
VV.admin.approveFeaturedRequest = async function (requestId) {
    const input = document.getElementById(`duration-${requestId}`);
    const duration = parseInt(input?.value || '7', 10);

    try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration);

        const { error } = await supabase
            .from('featured_requests')
            .update({
                status: 'approved',
                duration_days: duration,
                expires_at: expiresAt.toISOString(),
                reviewed_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (error) throw error;

        alert('Solicitud aprobada correctamente.');
        VV.admin.loadFeaturedRequests(); // Recargar lista de pendientes
        VV.admin.loadFeaturedOffers();   // Recargar visor de activos
    } catch (e) {
        console.error('Error al aprobar:', e);
        alert('Error técnico al aprobar la solicitud.');
    }
};

/**
 * 3. VISOR DE DESTACADOS ACTIVOS
 * Muestra los productos que ya fueron aprobados y no han vencido.
 */
VV.admin.loadFeaturedOffers = async function () {
    const container = document.getElementById('featured-management');
    if (!container) return;

    try {
        const nowIso = new Date().toISOString();
        // Traemos solo los aprobados cuya fecha de vencimiento es mayor a "ahora"
        const { data: activeOffers, error } = await supabase
            .from('featured_requests')
            .select('*')
            .eq('status', 'approved')
            .gt('expires_at', nowIso)
            .order('expires_at', { ascending: true });

        if (error) throw error;

        if (!activeOffers || activeOffers.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay ofertas destacadas activas en este momento.</p>';
            return;
        }

        container.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <h4 style="color: var(--success-green);"><i class="fas fa-check-circle"></i> Destacados Activos (${activeOffers.length})</h4>
                <div style="display: grid; gap: 1rem; margin-top: 1rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
                    ${activeOffers.map(offer => {
                        const daysLeft = Math.ceil((new Date(offer.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
                        return `
                            <div style="background: white; border-radius: 8px; padding: 1rem; border-left: 4px solid var(--success-green); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div>
                                        <h5 style="margin: 0;">${offer.product_name || offer.title}</h5>
                                        <p style="margin: 0.25rem 0; font-size: 0.8rem; color: #666;">${offer.neighborhood || 'Sin barrio'}</p>
                                    </div>
                                    <span style="font-size: 0.7rem; font-weight: bold; color: var(--success-green);">ACTIVA</span>
                                </div>
                                <div style="margin: 0.8rem 0; font-size: 0.85rem;">
                                    <p style="margin: 2px 0;"><strong>Vence:</strong> ${new Date(offer.expires_at).toLocaleDateString()}</p>
                                    <p style="margin: 2px 0; color: ${daysLeft < 2 ? 'red' : 'inherit'};">
                                        <i class="fas fa-hourglass-half"></i> Quedan ${daysLeft} día(s)
                                    </p>
                                </div>
                                <button onclick="VV.admin.rejectFeaturedRequest('${offer.id}')" style="width: 100%; padding: 0.4rem; background: #fdf0f0; color: #c0392b; border: 1px solid #f5c6cb; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                                    <i class="fas fa-ban"></i> Finalizar antes de tiempo
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    } catch (e) {
        console.error('Error en loadFeaturedOffers:', e);
        container.innerHTML = '<p style="color: red;">Error al conectar con Supabase.</p>';
    }
};

/**
 * 4. RECHAZAR O FINALIZAR
 * Sirve tanto para rechazar una pendiente como para dar de baja una activa.
 */
VV.admin.rejectFeaturedRequest = async function (requestId) {
    if (!confirm('¿Confirmas esta acción sobre la solicitud?')) return;
    try {
        const { error } = await supabase
            .from('featured_requests')
            .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
            .eq('id', requestId);

        if (error) throw error;
        VV.admin.loadFeaturedRequests();
        VV.admin.loadFeaturedOffers();
    } catch (e) {
        console.error('Error al rechazar:', e);
    }
};


// ========== GESTIÓN DE AVATARES ==========

VV.admin.loadAvatarsManagement = function() {
    if (!VV.utils.isAdmin()) return;
    
    const container = document.getElementById('avatars-management');
    const users = VV.auth.getAllUsers().filter(u => u.role !== 'admin');
    const premiumAvatars = VV.avatars.defaultAvatars.filter(a => a.premium);
    
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h4><i class="fas fa-gift"></i> Desbloquear Avatares Premium para Usuarios</h4>
            <p style="color: var(--gray-600); margin: 1rem 0;">
                Selecciona un usuario y un avatar premium para desbloquearlo como premio.
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end;">
                <div class="form-group">
                    <label>Usuario</label>
                    <select id="unlock-user-select" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                        <option value="">Seleccionar usuario</option>
                        ${users.map(u => `
                            <option value="${u.id}">${u.name} #${u.uniqueNumber} - ${u.neighborhood}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Avatar Premium</label>
                    <select id="unlock-avatar-select" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                        <option value="">Seleccionar avatar</option>
                        ${premiumAvatars.map(a => `
                            <option value="${a.id}">${a.emoji} ${a.name} (${a.rarity})</option>
                        `).join('')}
                    </select>
                </div>
                <button class="btn-primary" onclick="VV.admin.unlockAvatarForUser()" style="padding: 0.75rem 1.5rem;">
                    <i class="fas fa-unlock"></i> Desbloquear
                </button>
            </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h4><i class="fas fa-users"></i> Usuarios y sus Avatares</h4>
            <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                ${users.map(user => {
                    const avatar = VV.avatars.getUserAvatar(user.id);
                    const unlockedAvatars = user.unlockedAvatars || [];
                    const totalPremium = premiumAvatars.length;
                    const unlockedPremium = unlockedAvatars.length;
                    
                    return `
                        <div style="background: white; border-radius: 12px; padding: 1.5rem; border-left: 4px solid var(--primary-blue); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary-blue), var(--primary-purple)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                                    ${avatar.emoji}
                                </div>
                                <div style="flex: 1;">
                                    <h5 style="margin: 0 0 0.25rem 0;">${user.name} #${user.uniqueNumber}</h5>
                                    <p style="margin: 0; font-size: 0.85rem; color: var(--gray-600);">
                                        <i class="fas fa-map-marker-alt"></i> ${user.neighborhood}
                                    </p>
                                </div>
                                <div style="text-align: center; padding: 1rem; background: var(--gray-50); border-radius: 8px;">
                                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-purple);">
                                        ${unlockedPremium}/${totalPremium}
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--gray-600);">Premium</div>
                                </div>
                                <button class="btn-secondary" onclick="VV.admin.showUserAvatars('${user.id}')" style="padding: 0.5rem 1rem;">
                                    <i class="fas fa-eye"></i> Ver Colección
                                </button>
                            </div>
                            ${unlockedPremium > 0 ? `
                                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);">
                                    <p style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: var(--gray-600);">
                                        <i class="fas fa-star"></i> Avatares premium desbloqueados:
                                    </p>
                                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                        ${unlockedAvatars.map(avatarId => {
                                            const a = VV.avatars.defaultAvatars.find(av => av.id === avatarId);
                                            return a ? `
                                                <span style="background: var(--gray-100); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">
                                                    ${a.emoji} ${a.name}
                                                </span>
                                            ` : '';
                                        }).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
};

VV.admin.unlockAvatarForUser = function() {
    const userId = document.getElementById('unlock-user-select').value;
    const avatarId = document.getElementById('unlock-avatar-select').value;
    
    if (!userId || !avatarId) {
        alert('Selecciona un usuario y un avatar');
        return;
    }
    
    const user = VV.auth.getAllUsers().find(u => u.id === userId);
    const avatar = VV.avatars.defaultAvatars.find(a => a.id === avatarId);
    
    if (!user || !avatar) {
        alert('Usuario o avatar no encontrado');
        return;
    }
    
    if (VV.avatars.unlockAvatar(userId, avatarId)) {
        VV.utils.showSuccess(`Avatar "${avatar.name}" desbloqueado para ${user.name}`);
        VV.admin.loadAvatarsManagement();
    } else {
        alert('El usuario ya tiene este avatar desbloqueado');
    }
};

VV.admin.showUserAvatars = function(userId) {
    const user = VV.auth.getAllUsers().find(u => u.id === userId);
    if (!user) return;
    
    const unlockedAvatars = user.unlockedAvatars || [];
    const premiumAvatars = VV.avatars.defaultAvatars.filter(a => a.premium);
    
    let overlay = document.getElementById('user-avatars-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'user-avatars-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
        <div class="modal-form" style="max-width: 700px;">
            <h3><i class="fas fa-user-circle"></i> Colección de ${user.name}</h3>
            
            <div style="margin: 2rem 0;">
                <h4 style="color: var(--primary-purple); margin-bottom: 1rem;">
                    <i class="fas fa-star"></i> Avatares Premium (${unlockedAvatars.length}/${premiumAvatars.length})
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem;">
                    ${premiumAvatars.map(avatar => {
                        const isUnlocked = unlockedAvatars.includes(avatar.id);
                        return `
                            <div style="
                                padding: 1rem;
                                background: ${isUnlocked ? 'white' : 'var(--gray-100)'};
                                border: 2px solid ${isUnlocked ? 'var(--success-green)' : 'var(--gray-300)'};
                                border-radius: 12px;
                                text-align: center;
                                opacity: ${isUnlocked ? '1' : '0.5'};
                            ">
                                ${isUnlocked ? `
                                    <div style="position: absolute; top: 5px; right: 5px; background: var(--success-green); color: white; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem;">
                                        <i class="fas fa-check"></i>
                                    </div>
                                ` : `
                                    <div style="position: absolute; top: 5px; right: 5px; background: var(--error-red); color: white; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem;">
                                        <i class="fas fa-lock"></i>
                                    </div>
                                `}
                                <div style="font-size: 3rem; margin: 0.5rem 0; ${isUnlocked ? '' : 'filter: grayscale(100%);'}">
                                    ${avatar.emoji}
                                </div>
                                <div style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0.25rem;">
                                    ${avatar.name}
                                </div>
                                <div style="font-size: 0.7rem; color: var(--gray-600);">
                                    ${avatar.rarity}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div style="text-align: center;">
                <button class="btn-secondary" onclick="VV.admin.closeUserAvatars()">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        </div>
    `;
    
    overlay.classList.add('active');
    
    overlay.onclick = (e) => {
        if (e.target === overlay) VV.admin.closeUserAvatars();
    };
};

VV.admin.closeUserAvatars = function() {
    const overlay = document.getElementById('user-avatars-overlay');
    if (overlay) overlay.classList.remove('active');
};

// ========== GESTIÓN DE SORTEOS ==========

VV.admin.loadRafflesManagement = function() {
    if (!VV.utils.isAdmin()) return;
    
    const container = document.getElementById('raffles-management');
    const raffles = JSON.parse(localStorage.getItem('raffles') || '[]');
    const activeRaffles = raffles.filter(r => r.status === 'active');
    const completedRaffles = raffles.filter(r => r.status === 'completed');
    
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <button class="btn-primary" onclick="VV.raffle.createRaffle()">
                <i class="fas fa-plus"></i> Crear Nuevo Sorteo
            </button>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h4 style="color: var(--primary-blue);"><i class="fas fa-dice"></i> Sorteos Activos (${activeRaffles.length})</h4>
            ${activeRaffles.length === 0 ? `
                <p style="color: var(--gray-600); padding: 2rem; text-align: center; background: var(--gray-50); border-radius: 8px;">
                    No hay sorteos activos
                </p>
            ` : `
                <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                    ${activeRaffles.map(raffle => `
                        <div style="background: white; border-radius: 12px; padding: 1.5rem; border-left: 4px solid var(--primary-purple); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div style="flex: 1;">
                                    <h5 style="margin: 0 0 0.5rem 0; color: var(--primary-purple);">
                                        <i class="fas fa-dice"></i> ${raffle.title}
                                    </h5>
                                    <p style="margin: 0; color: var(--gray-700);">${raffle.description}</p>
                                </div>
                                <span style="background: var(--success-green); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                                    ACTIVO
                                </span>
                            </div>
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                                <p style="margin: 0 0 0.5rem 0;"><strong>🎁 Premio:</strong> ${raffle.prizeData.prizeDisplay}</p>
                                <p style="margin: 0 0 0.5rem 0;"><strong>📍 Dirigido a:</strong> ${raffle.target === 'all' ? 'Todos los barrios' : raffle.target}</p>
                                <p style="margin: 0;"><strong>📅 Creado:</strong> ${new Date(raffle.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button class="btn-primary" onclick="VV.raffle.executeRaffle('${raffle.id}')" style="width: 100%;">
                                <i class="fas fa-play"></i> Ejecutar Sorteo
                            </button>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
        
        <div>
            <h4 style="color: var(--success-green);"><i class="fas fa-trophy"></i> Sorteos Completados (${completedRaffles.length})</h4>
            ${completedRaffles.length === 0 ? `
                <p style="color: var(--gray-600); padding: 2rem; text-align: center; background: var(--gray-50); border-radius: 8px;">
                    No hay sorteos completados
                </p>
            ` : `
                <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                    ${completedRaffles.map(raffle => `
                        <div style="background: white; border-radius: 12px; padding: 1.5rem; border-left: 4px solid var(--success-green); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div style="flex: 1;">
                                    <h5 style="margin: 0 0 0.5rem 0; color: var(--success-green);">
                                        <i class="fas fa-trophy"></i> ${raffle.title}
                                    </h5>
                                    <p style="margin: 0; color: var(--gray-700);">${raffle.description}</p>
                                </div>
                                <span style="background: var(--gray-400); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                                    COMPLETADO
                                </span>
                            </div>
                            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                                <p style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--gray-800);">
                                    🎉 Ganador: ${raffle.winnerName} #${raffle.winnerNumber}
                                </p>
                                <p style="margin: 0;"><strong>🎁 Premio:</strong> ${raffle.prizeData.prizeDisplay}</p>
                            </div>
                            <div style="font-size: 0.85rem; color: var(--gray-600);">
                                <p style="margin: 0;"><strong>📅 Realizado:</strong> ${new Date(raffle.drawnAt).toLocaleDateString()} ${new Date(raffle.drawnAt).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
};

console.log('✅ Módulo ADMIN cargado');
