// ========== MÓDULO ADMINISTRACIÓN ==========

VV.admin = {
    sponsorRequests: [],
    
    // Cargar panel de admin
    async load() {
        if (!VV.utils.isAdmin()) {
            alert('No tienes permisos de administrador');
            return;
        }
        
        await VV.admin.loadSponsorRequests();
        await VV.admin.loadFeaturedRequests();
        await VV.admin.loadSponsors();
    },
    
    // Cargar solicitudes pendientes
    async loadSponsorRequests() {
        try {
            const { data: sponsors, error } = await supabase
                .from('sponsors')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            console.log('📋 Solicitudes de anunciantes:', sponsors);
            
            const pending = sponsors || [];
        
        const container = document.getElementById('sponsor-requests-container');
        const list = document.getElementById('sponsor-requests-list');
        
        if (pending.length === 0) {
            console.log('⚠️ No hay solicitudes de anunciantes pendientes');
            container.style.display = 'none';
            return;
        }
        
        console.log(`✅ ${pending.length} solicitud(es) de anunciante(s) pendiente(s)`);
        
        container.style.display = 'block';
        list.innerHTML = pending.map(req => `
            <div class="sponsor-request-card" style="border-left: 4px solid var(--primary-blue);">
                <div class="request-header">
                    <div>
                        <h4><i class="fas fa-bullhorn"></i> ${req.business_name}</h4>
                        <p style="color: var(--gray-600); font-size: 0.85rem; margin-top: 0.25rem;">
                            Solicitado por: ${req.user_name} (${req.neighborhood})
                        </p>
                    </div>
                    <span class="request-tier-badge ${req.tier}">${req.tier.toUpperCase()}</span>
                </div>
                <div class="request-info">
                    <p>${req.description}</p>
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
        } catch (error) {
            console.error('Error cargando solicitudes de sponsors:', error);
        }
    },
    
    // Aprobar solicitud
    async approveSponsorRequest(requestId) {
        // Solicitar duración al admin
        const duration = prompt('¿Por cuántos días activar este anunciante? (Ej: 30, 60, 90)', '30');
        if (!duration || isNaN(duration)) {
            alert('Duración inválida');
            return;
        }
        
        try {
            // Calcular fecha de expiración
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(duration));
            
            // Actualizar el sponsor en Supabase
            const { error } = await supabase
                .from('sponsors')
                .update({
                    status: 'active',
                    active: true,
                    duration: parseInt(duration),
                    expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);
            
            if (error) throw error;
            
            await VV.admin.load();
            VV.banner.init();
            VV.utils.showSuccess(`Anunciante aprobado por ${duration} días`);
            
        } catch (error) {
            console.error('Error aprobando anunciante:', error);
            alert('Error al aprobar el anunciante: ' + error.message);
        }
    },
    
    // Rechazar solicitud
    async rejectSponsorRequest(requestId) {
        if (!confirm('¿Rechazar esta solicitud?')) return;
        
        try {
            const { error } = await supabase
                .from('sponsors')
                .update({
                    status: 'rejected',
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);
            
            if (error) throw error;
            
            await VV.admin.load();
            VV.utils.showSuccess('Solicitud rechazada');
            
        } catch (error) {
            console.error('Error rechazando solicitud:', error);
            alert('Error al rechazar la solicitud: ' + error.message);
        }
    },
    
    // Cargar anunciantes
    async loadSponsors() {
        const container = document.getElementById('sponsors-management');
        
        // Recargar sponsors desde Supabase
        try {
            const { data: sponsors, error } = await supabase
                .from('sponsors')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            VV.data.sponsors = sponsors || [];
        } catch (error) {
            console.error('Error cargando sponsors:', error);
        }
        
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
                <h4>${sponsor.business_name || sponsor.name}</h4>
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
                        ${!sponsor.neighborhoods || sponsor.neighborhoods === 'all'
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
    async showSponsorForm(sponsorId = null) {
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
                        <input type="text" id="sponsor-name" value="${sponsor?.business_name || sponsor?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Descripción *</label>
                        <input type="text" id="sponsor-description" value="${sponsor?.description || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Logo / Icono *</label>
                        <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">
                            <input type="text" id="sponsor-logo" value="${sponsor?.logo || '🏪'}" 
                                   style="width: 80px; font-size: 2rem; text-align: center;" 
                                   placeholder="🏪" required readonly>
                            <button type="button" class="btn-secondary" onclick="VV.admin.showEmojiPicker()" 
                                    style="padding: 0.5rem 1rem;">
                                <i class="fas fa-smile"></i> Elegir Emoji
                            </button>
                        </div>
                        <div id="emoji-picker" style="display: none; background: white; border: 2px solid var(--gray-300); border-radius: 8px; padding: 1rem; margin-top: 0.5rem; max-height: 200px; overflow-y: auto;">
                            <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: var(--gray-700);">Selecciona un emoji:</p>
                            <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 0.5rem;">
                                ${['🏪', '🍕', '🍔', '☕', '🍰', '🥖', '🥗', '🍜', '🏥', '💊', '🔧', '🔨', '⚡', '💡', '🚗', '🚕', '🏠', '🏡', '🎨', '🎭', '🎪', '🎬', '📚', '📖', '✂️', '💇', '💅', '👔', '👗', '👟', '⚽', '🏋️', '🎯', '🎮', '🎸', '🎹', '📱', '💻', '🖨️', '📷', '🎥', '🌮', '🌯', '🥙', '🍱', '🍛', '🍝', '🍣', '🍤', '🍦', '🧁', '🍩', '🍪', '🎂', '🍷', '🍺', '🥂', '☕', '🧃', '🥤', '🧋'].map(emoji => 
                                    `<button type="button" onclick="VV.admin.selectEmoji('${emoji}')" 
                                             style="font-size: 2rem; padding: 0.5rem; border: 2px solid var(--gray-200); border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s;"
                                             onmouseover="this.style.transform='scale(1.2)'; this.style.borderColor='var(--primary-blue)';"
                                             onmouseout="this.style.transform='scale(1)'; this.style.borderColor='var(--gray-200)';">
                                        ${emoji}
                                    </button>`
                                ).join('')}
                            </div>
                        </div>
                        <p style="font-size: 0.85rem; color: var(--gray-600); margin-top: 0.5rem;">
                            <i class="fas fa-info-circle"></i> El emoji se mostrará si no subes una imagen
                        </p>
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
                    <div class="form-group">
                        <label>Teléfono *</label>
                        <input type="tel" id="sponsor-contact" value="${sponsor?.contact || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Sitio web</label>
                        <input type="url" id="sponsor-website" value="${sponsor?.website || ''}" placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label>Imagen del banner (opcional - recomendado)</label>
                        <div style="background: var(--gray-50); border: 2px dashed var(--gray-300); border-radius: 8px; padding: 1rem; text-align: center;">
                            <input type="file" id="sponsor-image" accept="image/*" 
                                   onchange="VV.admin.previewImage(this)"
                                   style="display: none;">
                            <button type="button" class="btn-secondary" 
                                    onclick="document.getElementById('sponsor-image').click()"
                                    style="margin-bottom: 0.5rem;">
                                <i class="fas fa-upload"></i> Subir Imagen
                            </button>
                            <p style="font-size: 0.85rem; color: var(--gray-600); margin: 0.5rem 0;">
                                Formatos: JPG, PNG, GIF (máx 5MB)<br>
                                Tamaño recomendado: 400x200px
                            </p>
                            ${sponsor?.imageUrl ? `
                                <div style="margin-top: 0.5rem;">
                                    <img src="${sponsor.imageUrl}" alt="Preview" 
                                         style="max-width: 200px; max-height: 100px; border-radius: 8px; border: 2px solid var(--success-green);">
                                    <p style="font-size: 0.85rem; color: var(--success-green); margin-top: 0.5rem;">
                                        <i class="fas fa-check"></i> Imagen actual
                                    </p>
                                </div>
                            ` : ''}
                            <div id="image-preview" style="margin-top: 0.5rem;"></div>
                        </div>
                        <p style="font-size: 0.85rem; color: var(--primary-blue); margin-top: 0.5rem;">
                            <i class="fas fa-lightbulb"></i> <strong>Tip:</strong> Si no subes imagen, se mostrará el emoji seleccionado
                        </p>
                    </div>
                    <div class="form-group">
                        <label>Mostrar en barrios *</label>
                        <select id="sponsor-visibility" onchange="VV.admin.toggleNeighborhoodSelection()">
                            <option value="all" ${!sponsor?.neighborhoods ? 'selected' : ''}>Todos los barrios</option>
                            <option value="specific" ${sponsor?.neighborhoods && Array.isArray(sponsor.neighborhoods) && sponsor.neighborhoods.length > 0 ? 'selected' : ''}>Barrios específicos</option>
                        </select>
                    </div>
                    <div class="form-group" id="neighborhoods-selection" style="display: ${sponsor?.neighborhoods && Array.isArray(sponsor.neighborhoods) && sponsor.neighborhoods.length > 0 ? 'block' : 'none'};">

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
        await VV.admin.loadNeighborhoodCheckboxes(sponsor);
        
        document.getElementById('sponsor-form').onsubmit = (e) => {
            e.preventDefault();
            VV.admin.saveSponsor(sponsor);
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.admin.closeSponsorForm();
        };
    },
    
    // Cargar checkboxes de barrios
    async loadNeighborhoodCheckboxes(sponsor) {
        const container = document.getElementById('neighborhoods-checkboxes');
        const neighborhoods = await VV.auth.getExistingNeighborhoods();
        
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
            imageUrl: existing?.image_url || ''
        };
        
        if (!formData.name || !formData.description || !formData.logo || !formData.tier || !formData.contact) {
            alert('Completa todos los campos obligatorios');
            return;
        }
        
        // Procesar imagen si existe
        const imageInput = document.getElementById('sponsor-image');
        if (imageInput.files && imageInput.files[0]) {
            const file = imageInput.files[0];
            
            try {
                // Subir imagen a Supabase Storage
                const fileName = `sponsor-${Date.now()}-${file.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('sponsor-images')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (uploadError) {
                    console.error('❌ Error subiendo imagen:', uploadError);
                    console.error('❌ Mensaje:', uploadError.message);
                    console.error('❌ Detalles:', uploadError.error);
                    alert('Error al subir la imagen: ' + uploadError.message + '. Continuando sin imagen...');
                } else {
                    // Obtener URL pública
                    const { data: urlData } = supabase.storage
                        .from('sponsor-images')
                        .getPublicUrl(fileName);
                    
                    formData.imageUrl = urlData.publicUrl;
                    console.log('✅ Imagen subida:', formData.imageUrl);
                }
            } catch (error) {
                console.error('Error procesando imagen:', error);
                alert('Error al procesar la imagen. Continuando sin imagen...');
            }
        }
        
        VV.admin.saveSponsorData(existing, formData);
    },
    
    // Guardar datos del anunciante (helper) - MIGRADO A SUPABASE
    async saveSponsorData(existing, formData) {
        console.log('💾 Guardando anunciante:', formData);
        
        try {
            if (existing) {
                // Actualizar anunciante existente
                const updateData = {
                    business_name: formData.name,
                    description: formData.description,
                    contact: formData.contact,
                    website: formData.website,
                    tier: formData.tier,
                    logo: formData.logo,
                    neighborhoods: formData.neighborhoods === 'all' ? null : formData.neighborhoods,
                    active: formData.active
                };
                
                // Solo actualizar image_url si hay una nueva
                if (formData.imageUrl) {
                    updateData.image_url = formData.imageUrl;
                }
                
                const { error } = await supabase
                    .from('sponsors')
                    .update(updateData)
                    .eq('id', existing.id);
                
                if (error) throw error;
                
                const index = VV.data.sponsors.findIndex(s => s.id === existing.id);
                VV.data.sponsors[index] = { ...existing, ...formData };
            } else {
                // Crear nuevo anunciante (ajustar nombres de columnas a Supabase)
                const newSponsor = {
                    business_name: formData.name,
                    description: formData.description,
                    contact: formData.contact,
                    website: formData.website,
                    tier: formData.tier,
                    logo: formData.logo,
                    image_url: formData.imageUrl || null,
                    neighborhoods: formData.neighborhoods === 'all' ? null : formData.neighborhoods,
                    active: formData.active,
                    views: 0,
                    clicks: 0
                };
                
                console.log('📤 Intentando insertar:', newSponsor);
                
                const { data, error } = await supabase
                    .from('sponsors')
                    .insert(newSponsor)
                    .select()
                    .single();
                
                if (error) {
                    console.error('❌ Error de Supabase:', error);
                    console.error('❌ Mensaje:', error.message);
                    console.error('❌ Detalles:', error.details);
                    console.error('❌ Hint:', error.hint);
                    throw error;
                }
                
                console.log('✅ Anunciante creado:', data);
                VV.data.sponsors.push(data);
            }
            
            VV.admin.closeSponsorForm();
            
            // Recargar todo
            await VV.admin.loadSponsors();
            await VV.banner.init();
            
            VV.utils.showSuccess(existing ? 'Anunciante actualizado' : 'Anunciante creado');
            
        } catch (error) {
            console.error('Error guardando anunciante:', error);
            alert('Error al guardar el anunciante: ' + error.message);
        }
    },
    
    // Toggle anunciante - MIGRADO A SUPABASE
    async toggleSponsor(sponsorId) {
        const sponsor = VV.data.sponsors.find(s => s.id === sponsorId);
        if (!sponsor) return;
        
        try {
            const newActive = !sponsor.active;
            
            const { error } = await supabase
                .from('sponsors')
                .update({ active: newActive })
                .eq('id', sponsorId);
            
            if (error) throw error;
            
            sponsor.active = newActive;
            VV.admin.loadSponsors();
            VV.banner.init();
            VV.utils.showSuccess(sponsor.active ? 'Anunciante activado' : 'Anunciante pausado');
            
        } catch (error) {
            console.error('Error actualizando anunciante:', error);
        }
    },
    
    // Eliminar anunciante - MIGRADO A SUPABASE
    async deleteSponsor(sponsorId) {
        if (!confirm('¿Eliminar este anunciante?')) return;
        
        try {
            const { error } = await supabase
                .from('sponsors')
                .delete()
                .eq('id', sponsorId);
            
            if (error) throw error;
            
            VV.data.sponsors = VV.data.sponsors.filter(s => s.id !== sponsorId);
            VV.admin.loadSponsors();
            VV.banner.init();
            VV.utils.showSuccess('Anunciante eliminado');
            
        } catch (error) {
            console.error('Error eliminando anunciante:', error);
            alert('Error al eliminar el anunciante: ' + error.message);
        }
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
    async loadUsers(filterNeighborhood = 'all') {
        if (!VV.utils.isAdmin()) {
            alert('No tienes permisos');
            return;
        }
        
        const container = document.getElementById('users-management-list');
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">Cargando usuarios...</p>';
        
        // Obtener usuarios desde Supabase
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('neighborhood', { ascending: true })
            .order('name', { ascending: true });
        
        if (error) {
            console.error('Error cargando usuarios:', error);
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: red;">Error cargando usuarios</p>';
            return;
        }
        
        // Obtener barrios únicos
        const neighborhoods = [...new Set(users.map(u => u.neighborhood))].sort();
        
        // Filtrar usuarios si hay filtro
        const filteredUsers = filterNeighborhood === 'all' 
            ? users 
            : users.filter(u => u.neighborhood === filterNeighborhood);
        
        // Agrupar usuarios por barrio
        const usersByNeighborhood = {};
        filteredUsers.forEach(user => {
            if (!usersByNeighborhood[user.neighborhood]) {
                usersByNeighborhood[user.neighborhood] = [];
            }
            usersByNeighborhood[user.neighborhood].push(user);
        });
        
        // Selector de barrio
        let html = `
            <div style="grid-column: 1/-1; margin-bottom: 1rem; padding: 1rem; background: white; border-radius: 8px; box-shadow: var(--shadow-sm);">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--gray-700);">
                    <i class="fas fa-filter"></i> Filtrar por barrio:
                </label>
                <select onchange="VV.admin.loadUsers(this.value)" style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: 8px; font-size: 1rem;">
                    <option value="all" ${filterNeighborhood === 'all' ? 'selected' : ''}>📍 Todos los barrios (${users.length} usuarios)</option>
                    ${neighborhoods.map(n => `
                        <option value="${n}" ${filterNeighborhood === n ? 'selected' : ''}>
                            ${n} (${users.filter(u => u.neighborhood === n).length} usuarios)
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
        
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
    async toggleModerator(userId) {
        try {
            // Obtener usuario actual
            const { data: user, error: fetchError } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();
            
            if (fetchError) throw fetchError;
            
            const newRole = user.role === 'moderator' ? 'user' : 'moderator';
            
            // Actualizar rol
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);
            
            if (updateError) throw updateError;
            
            VV.admin.loadUsers();
            VV.utils.showSuccess(`Usuario ${newRole === 'moderator' ? 'promovido a' : 'degradado de'} moderador`);
        } catch (error) {
            console.error('Error cambiando rol:', error);
            alert('Error al cambiar el rol del usuario');
        }
    },
    
    // Eliminar usuario
    async deleteUser(userId) {
        if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
        
        try {
            // Eliminar de Supabase (cascada eliminará sus productos, servicios, etc.)
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);
            
            if (error) throw error;
            
            VV.admin.loadUsers();
            VV.utils.showSuccess('Usuario eliminado');
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            alert('Error al eliminar el usuario');
        }
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
                    <button type="button" class="btn-save" onclick="window.submitSponsorRequest()">
                        <i class="fas fa-paper-plane"></i> Enviar Solicitud
                    </button>
                </div>
            </form>
        </div>
    `;
    
    overlay.classList.add('active');
    
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    };
}

// Función global para enviar solicitud de anunciante
window.submitSponsorRequest = async function() {
    console.log('🚀 Enviando solicitud de anunciante...');
    
    const businessName = document.getElementById('request-name').value.trim();
    const description = document.getElementById('request-description').value.trim();
    const logo = document.getElementById('request-logo').value.trim();
    const tier = document.getElementById('request-tier').value;
    const contact = document.getElementById('request-contact').value.trim();
    const website = document.getElementById('request-website').value.trim();
    
    if (!businessName || !description || !logo || !tier || !contact) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('sponsors')
            .insert({
                business_name: businessName,
                description: description,
                logo: logo,
                tier: tier,
                contact: contact,
                website: website,
                user_id: VV.data.user.id,
                user_name: VV.data.user.name,
                neighborhood: VV.data.neighborhood,
                status: 'pending',
                active: false
            });
        
        if (error) throw error;
        
        console.log('✅ Solicitud de anunciante enviada exitosamente');
        
        document.getElementById('sponsor-request-overlay').classList.remove('active');
        VV.utils.showSuccess('Solicitud enviada. El administrador la revisará pronto.');
        
    } catch (error) {
        console.error('❌ Error enviando solicitud de anunciante:', error);
        alert('Error al enviar la solicitud: ' + error.message);
    }
}

// ========== FUNCIONES GLOBALES PARA ADMIN ==========

VV.admin.loadAllNeighborhoods = async function() {
    if (!VV.utils.isAdmin()) return;
    
    const container = document.getElementById('admin-neighborhoods-list');
    container.innerHTML = '<p style="text-align: center; padding: 2rem;">Cargando barrios...</p>';
    
    try {
        // Obtener todos los usuarios desde Supabase
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .neq('neighborhood', 'Administrador');
        
        if (usersError) throw usersError;
        
        // Obtener todos los barrios con usuarios
        const neighborhoods = new Map();
        
        users.forEach(user => {
            if (user.neighborhood) {
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
    } catch (error) {
        console.error('Error cargando barrios:', error);
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: red;">Error cargando barrios</p>';
    }
};

VV.admin.loadAllProducts = async function() {
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
    
    // Obtener usuarios
    const allUsers = await VV.auth.getAllUsers();
    
    listContainer.innerHTML = filtered.map(product => {
        const seller = allUsers.find(u => u.id === product.sellerId);
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

VV.admin.loadAllImprovements = async function() {
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
    
    // Estadísticas (basadas en los datos FILTRADOS)
    const statsContainer = document.getElementById('admin-improvements-stats');
    const pending = filtered.filter(i => i.status === 'pending').length;
    const inProgress = filtered.filter(i => i.status === 'in-progress').length;
    const completed = filtered.filter(i => i.status === 'completed').length;
    const filteredNeighborhoods = [...new Set(filtered.map(i => i.neighborhood))].length;
    
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
                <p class="stat-number">${filteredNeighborhoods}</p>
            </div>
        </div>
    `;
    
    // Lista de mejoras
    const listContainer = document.getElementById('admin-improvements-list');
    if (filtered.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay mejoras</p>';
        return;
    }
    
    // Obtener usuarios
    const allUsers = await VV.auth.getAllUsers();
    
    listContainer.innerHTML = filtered.map(improvement => {
        const author = allUsers.find(u => u.id === improvement.authorId);
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

// ========== GESTIÓN DE OFERTAS DESTACADAS ==========

VV.admin.loadFeaturedRequests = async function() {
    try {
        // Cargar solicitudes pendientes desde Supabase
        const { data: requests, error } = await supabase
            .from('featured_offers')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log('📋 Solicitudes de ofertas destacadas:', requests);
        
        const container = document.getElementById('featured-requests-container');
        const list = document.getElementById('featured-requests-list');
        
        if (!requests || requests.length === 0) {
            console.log('⚠️ No hay solicitudes pendientes');
            container.style.display = 'none';
            return;
        }
        
        console.log(`✅ ${requests.length} solicitud(es) pendiente(s)`);
        container.style.display = 'block';
        
        list.innerHTML = requests.map(req => `
            <div class="sponsor-request-card" style="border-left: 4px solid var(--warning-orange);">
                <div class="request-header">
                    <div>
                        <h4><i class="fas fa-star"></i> ${req.title}</h4>
                        <p style="color: var(--gray-600); font-size: 0.85rem; margin-top: 0.25rem;">
                            Solicitado por: ${req.user_name} #${req.user_number} (${req.neighborhood})
                        </p>
                    </div>
                    <span class="request-tier-badge" style="background: var(--warning-orange);">${req.duration} DÍAS</span>
                </div>
                <div class="request-info">
                    <p><strong>Título:</strong> ${req.title}</p>
                    ${req.description ? `<p><strong>Descripción:</strong> ${req.description}</p>` : ''}
                    <p><strong>Duración solicitada:</strong> ${req.duration} días</p>
                    <p><strong>Fecha de solicitud:</strong> ${new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <div class="request-actions">
                    <input type="number" id="duration-${req.id}" value="${req.duration}" min="1" max="90" style="width: 80px; padding: 0.5rem; margin-right: 0.5rem; border: 1px solid var(--gray-300); border-radius: 4px;">
                    <label style="margin-right: 1rem; color: var(--gray-600);">días</label>
                    <button class="btn-approve" onclick="VV.admin.approveFeaturedRequest('${req.id}')">
                        <i class="fas fa-check"></i> Aprobar
                    </button>
                    <button class="btn-reject" onclick="VV.admin.rejectFeaturedRequest('${req.id}')">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando solicitudes de destacados:', error);
    }
};

VV.admin.approveFeaturedRequest = async function(requestId) {
    try {
        // Obtener la duración personalizada del input
        const durationInput = document.getElementById(`duration-${requestId}`);
        const customDuration = durationInput ? parseInt(durationInput.value) : null;
        
        if (!customDuration || customDuration < 1 || customDuration > 90) {
            alert('Por favor ingresa una duración válida (1-90 días)');
            return;
        }
        
        // Calcular fecha de expiración
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + customDuration);
        
        // Actualizar la oferta en Supabase
        const { error } = await supabase
            .from('featured_offers')
            .update({
                status: 'active',
                duration: customDuration,
                expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);
        
        if (error) throw error;
        
        VV.admin.load();
        VV.utils.showSuccess(`Oferta destacada aprobada por ${customDuration} días`);
        
    } catch (error) {
        console.error('Error aprobando oferta:', error);
        alert('Error al aprobar la oferta: ' + error.message);
    }
};

VV.admin.rejectFeaturedRequest = async function(requestId) {
    if (!confirm('¿Rechazar esta solicitud?')) return;
    
    try {
        // Actualizar el estado a rechazado en Supabase
        const { error } = await supabase
            .from('featured_offers')
            .update({
                status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);
        
        if (error) throw error;
        
        VV.admin.load();
        VV.utils.showSuccess('Solicitud rechazada');
        
    } catch (error) {
        console.error('Error rechazando oferta:', error);
        alert('Error al rechazar la oferta: ' + error.message);
    }
};

VV.admin.loadFeaturedOffers = function() {
    const allFeatured = JSON.parse(localStorage.getItem('featuredOffers') || '[]');
    const container = document.getElementById('featured-management');
    
    if (allFeatured.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay ofertas destacadas</p>';
        return;
    }
    
    // Agrupar por estado
    const active = allFeatured.filter(f => f.status === 'active' && !f.blocked && new Date(f.expiresAt) > new Date());
    const expired = allFeatured.filter(f => new Date(f.expiresAt) <= new Date());
    const blocked = allFeatured.filter(f => f.blocked);
    
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h4 style="color: var(--success-green);"><i class="fas fa-check-circle"></i> Activas (${active.length})</h4>
            <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                ${active.length > 0 ? active.map(f => VV.admin.renderFeaturedCard(f)).join('') : '<p style="color: var(--gray-600);">No hay ofertas activas</p>'}
            </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h4 style="color: var(--error-red);"><i class="fas fa-ban"></i> Bloqueadas (${blocked.length})</h4>
            <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                ${blocked.length > 0 ? blocked.map(f => VV.admin.renderFeaturedCard(f)).join('') : '<p style="color: var(--gray-600);">No hay ofertas bloqueadas</p>'}
            </div>
        </div>
        
        <div>
            <h4 style="color: var(--gray-600);"><i class="fas fa-clock"></i> Expiradas (${expired.length})</h4>
            <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                ${expired.length > 0 ? expired.map(f => VV.admin.renderFeaturedCard(f)).join('') : '<p style="color: var(--gray-600);">No hay ofertas expiradas</p>'}
            </div>
        </div>
    `;
};

VV.admin.renderFeaturedCard = function(offer) {
    const daysLeft = Math.ceil((new Date(offer.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft <= 0;
    
    return `
        <div style="background: white; border-radius: 8px; padding: 1rem; border-left: 4px solid ${offer.blocked ? 'var(--error-red)' : isExpired ? 'var(--gray-400)' : 'var(--warning-orange)'};">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <div style="flex: 1;">
                    <h5 style="margin: 0 0 0.25rem 0;">${offer.title}</h5>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--gray-600);">
                        ${offer.userName} #${offer.userNumber} - ${offer.neighborhood}
                    </p>
                </div>
                ${offer.blocked ? `
                    <span style="background: var(--error-red); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                        BLOQUEADA
                    </span>
                ` : isExpired ? `
                    <span style="background: var(--gray-400); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                        EXPIRADA
                    </span>
                ` : `
                    <span style="background: var(--success-green); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                        ACTIVA
                    </span>
                `}
            </div>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;"><strong>Producto:</strong> ${offer.productName || offer.product?.product || 'N/A'}</p>
            <div style="display: flex; gap: 1rem; margin: 0.5rem 0; font-size: 0.85rem;">
                <span><i class="fas fa-thumbs-up" style="color: var(--success-green);"></i> ${offer.goodVotes || 0}</span>
                <span><i class="fas fa-thumbs-down" style="color: var(--error-red);"></i> ${offer.badVotes || 0}</span>
                <span><i class="fas fa-clock"></i> ${isExpired ? 'Expirada' : `${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}</span>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                ${!offer.blocked && !isExpired ? `
                    <button class="btn-delete" onclick="VV.admin.deactivateFeatured('${offer.id}')" style="flex: 1;">
                        <i class="fas fa-ban"></i> Desactivar
                    </button>
                ` : ''}
                <button class="btn-delete" onclick="VV.admin.deleteFeatured('${offer.id}')" style="flex: 1;">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
};

VV.admin.deactivateFeatured = function(offerId) {
    if (!confirm('¿Desactivar esta oferta destacada?')) return;
    
    const allFeatured = JSON.parse(localStorage.getItem('featuredOffers') || '[]');
    const offerIndex = allFeatured.findIndex(f => f.id === offerId);
    
    if (offerIndex !== -1) {
        allFeatured[offerIndex].status = 'inactive';
        allFeatured[offerIndex].blocked = true;
        localStorage.setItem('featuredOffers', JSON.stringify(allFeatured));
        VV.admin.loadFeaturedOffers();
        VV.utils.showSuccess('Oferta desactivada');
    }
};

VV.admin.deleteFeatured = function(offerId) {
    if (!confirm('¿Eliminar esta oferta destacada permanentemente?')) return;
    
    const allFeatured = JSON.parse(localStorage.getItem('featuredOffers') || '[]');
    const filtered = allFeatured.filter(f => f.id !== offerId);
    localStorage.setItem('featuredOffers', JSON.stringify(filtered));
    VV.admin.loadFeaturedOffers();
    VV.utils.showSuccess('Oferta eliminada');
};

// ========== GESTIÓN DE AVATARES ==========

VV.admin.loadAvatarsManagement = async function() {
    if (!VV.utils.isAdmin()) return;
    
    const container = document.getElementById('avatars-management');
    container.innerHTML = '<p style="text-align: center; padding: 2rem;">Cargando avatares...</p>';
    
    // Obtener usuarios desde Supabase
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin')
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error cargando usuarios:', error);
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: red;">Error cargando usuarios</p>';
        return;
    }
    
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
                            <option value="${u.id}">${u.name} #${u.unique_number} - ${u.neighborhood}</option>
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
                    const unlockedAvatars = user.unlocked_avatars || [];
                    const totalPremium = premiumAvatars.length;
                    const unlockedPremium = unlockedAvatars.length;
                    
                    return `
                        <div style="background: white; border-radius: 12px; padding: 1.5rem; border-left: 4px solid var(--primary-blue); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary-blue), var(--primary-purple)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                                    ${avatar.emoji}
                                </div>
                                <div style="flex: 1;">
                                    <h5 style="margin: 0 0 0.25rem 0;">${user.name} #${user.unique_number}</h5>
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

VV.admin.showUserAvatars = async function(userId) {
    // Obtener usuario desde Supabase
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error || !user) {
        console.error('Error obteniendo usuario:', error);
        return;
    }
    
    const unlockedAvatars = user.unlocked_avatars || [];
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

// Funciones auxiliares para selector de emojis
VV.admin.showEmojiPicker = function() {
    const picker = document.getElementById('emoji-picker');
    if (picker) {
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    }
};

VV.admin.selectEmoji = function(emoji) {
    const logoInput = document.getElementById('sponsor-logo');
    if (logoInput) {
        logoInput.value = emoji;
    }
    VV.admin.showEmojiPicker(); // Cerrar el picker
};

VV.admin.previewImage = function(input) {
    const preview = document.getElementById('image-preview');
    if (!preview) return;
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `
                <div style="margin-top: 0.5rem;">
                    <img src="${e.target.result}" alt="Preview" 
                         style="max-width: 200px; max-height: 100px; border-radius: 8px; border: 2px solid var(--primary-blue);">
                    <p style="font-size: 0.85rem; color: var(--success-green); margin-top: 0.5rem;">
                        <i class="fas fa-check"></i> Nueva imagen seleccionada
                    </p>
                </div>
            `;
        };
        
        reader.readAsDataURL(input.files[0]);
    }
};

console.log('✅ Módulo ADMIN cargado');
