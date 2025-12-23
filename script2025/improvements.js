// ========== MÓDULO MEJORAS DEL BARRIO ==========

VV.improvements = {
    galleryInterval: null,
    
    // Cargar mejoras
    load() {
        const container = document.getElementById('improvements-list');
        const statsContainer = document.getElementById('improvements-stats');
        
        // Actualizar nombre del barrio en el título
        const neighborhoodTitle = document.getElementById('improvements-neighborhood');
        if (neighborhoodTitle) {
            neighborhoodTitle.textContent = VV.data.neighborhood;
        }
        
        // Verificar si el usuario está en su barrio principal
        const homeNeighborhood = VV.data.user.home_neighborhood || VV.data.user.neighborhood;
        const currentNeighborhood = VV.data.user.current_neighborhood || VV.data.user.neighborhood;
        
        if (homeNeighborhood !== currentNeighborhood) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: var(--gray-50); border-radius: 12px;">
                    <i class="fas fa-lock" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--gray-700); margin-bottom: 0.5rem;">Acceso Restringido</h3>
                    <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                        Solo puedes proponer y votar mejoras en tu barrio principal: <strong>${homeNeighborhood}</strong>
                    </p>
                    <p style="color: var(--gray-500); font-size: 0.9rem;">
                        Actualmente estás visitando: <strong>${currentNeighborhood}</strong>
                    </p>
                    <button onclick="VV.geo.showNeighborhoodSelector()" class="btn-primary" style="margin-top: 1rem;">
                        <i class="fas fa-map-marker-alt"></i> Volver a ${homeNeighborhood}
                    </button>
                </div>
            `;
            statsContainer.innerHTML = '';
            return;
        }
        
        // Filtrar solo mejoras del mismo barrio
        const neighborhoodImprovements = VV.data.improvements.filter(i => 
            !i.neighborhood || i.neighborhood === VV.data.neighborhood
        );
        
        // Calcular estadísticas
        const total = neighborhoodImprovements.length;
        const completadas = neighborhoodImprovements.filter(i => i.status === 'completed' || i.status === 'Completado').length;
        const pendientes = neighborhoodImprovements.filter(i => i.status === 'pending' || i.status === 'Pendiente').length;
        const enProceso = neighborhoodImprovements.filter(i => i.status === 'in_progress' || i.status === 'En Proceso').length;
        const conFotos = neighborhoodImprovements.filter(i => i.photo_url || i.photoUrl || i.completed_photo_url || i.completedPhotoUrl).length;
        
        // Mostrar estadísticas
        if (total > 0) {
            statsContainer.innerHTML = `
                <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 1.5rem; border-radius: 12px;">
                    <div style="font-size: 2rem; font-weight: 700;">${total}</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;"><i class="fas fa-lightbulb"></i> Total Propuestas</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 1.5rem; border-radius: 12px;">
                    <div style="font-size: 2rem; font-weight: 700;">${completadas}</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;"><i class="fas fa-check-circle"></i> Realizadas</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 1.5rem; border-radius: 12px;">
                    <div style="font-size: 2rem; font-weight: 700;">${pendientes}</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;"><i class="fas fa-clock"></i> Pendientes</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 1.5rem; border-radius: 12px;">
                    <div style="font-size: 2rem; font-weight: 700;">${conFotos}</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;"><i class="fas fa-camera"></i> Con Evidencia</div>
                </div>
            `;
        } else {
            statsContainer.innerHTML = '';
        }
        
        if (neighborhoodImprovements.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray-600);">
                    <i class="fas fa-tools" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No hay mejoras propuestas</h3>
                    <p>Sé el primero en proponer una mejora</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = neighborhoodImprovements.map(imp => `
            <div class="improvement-card">
                <div class="card-header">
                    <h3>${imp.title}</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <span class="badge status-${imp.status.toLowerCase().replace(' ', '-')}">${imp.status}</span>
                        <span class="badge priority-${imp.priority.toLowerCase()}">${imp.priority}</span>
                        ${imp.photoUrl || imp.completedPhotoUrl ? '<span class="badge" style="background: var(--primary-blue);"><i class="fas fa-camera"></i></span>' : ''}
                    </div>
                </div>
                <p style="color: var(--gray-700); margin: 0.5rem 0;">${imp.description}</p>
                ${(imp.photo_url || imp.photoUrl) ? `
                    <div style="margin: 0.5rem 0;">
                        <img src="${imp.photo_url || imp.photoUrl}" onclick="VV.improvements.viewPhoto('${imp.photo_url || imp.photoUrl}')" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; cursor: pointer;" alt="Foto del problema">
                        <p style="font-size: 0.75rem; color: var(--gray-600); margin-top: 0.25rem;"><i class="fas fa-camera"></i> Problema documentado</p>
                    </div>
                ` : ''}
                ${(imp.completed_photo_url || imp.completedPhotoUrl) ? `
                    <div style="margin: 0.5rem 0;">
                        <img src="${imp.completed_photo_url || imp.completedPhotoUrl}" onclick="VV.improvements.viewPhoto('${imp.completed_photo_url || imp.completedPhotoUrl}')" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid var(--success-green);" alt="Foto de mejora realizada">
                        <p style="font-size: 0.75rem; color: var(--success-green); margin-top: 0.25rem;"><i class="fas fa-check-circle"></i> Mejora realizada</p>
                    </div>
                ` : ''}
                <div style="font-size: 0.85rem; color: var(--gray-600); margin: 0.5rem 0;">
                    <i class="fas fa-calendar"></i> Propuesta: ${new Date(imp.createdAt || Date.now()).toLocaleDateString('es-AR')}
                    ${imp.status === 'Completado' && imp.completedAt ? `<br><i class="fas fa-check-circle"></i> Realizada: ${new Date(imp.completedAt).toLocaleDateString('es-AR')} por ${imp.completedBy}` : ''}
                </div>
                <div class="card-footer">
                    <span style="color: var(--gray-600);"><i class="fas fa-tag"></i> ${imp.category}</span>
                    ${VV.improvements.renderVoteButton(imp)}
                </div>
                ${(VV.utils.canModerate() && imp.status !== 'Completado') ? `
                    <button class="btn-primary" onclick="VV.improvements.markAsCompleted('${imp.id}')" style="width: 100%; margin-top: 0.5rem;">
                        <i class="fas fa-check"></i> Marcar como Realizada
                    </button>
                ` : ''}
            </div>
        `).join('');
        
        // Cargar galería de fotos
        VV.improvements.loadGallery(neighborhoodImprovements);
    },
    
    // Cargar galería de fotos
    loadGallery(improvements) {
        const galleryContainer = document.getElementById('gallery-photos');
        
        // Recolectar todas las fotos
        const allPhotos = [];
        improvements.forEach(imp => {
            const photoUrl = imp.photo_url || imp.photoUrl;
            const completedPhotoUrl = imp.completed_photo_url || imp.completedPhotoUrl;
            
            if (photoUrl) {
                allPhotos.push({
                    url: photoUrl,
                    title: imp.title,
                    type: 'Problema',
                    date: imp.created_at || imp.createdAt,
                    status: imp.status
                });
            }
            if (completedPhotoUrl) {
                allPhotos.push({
                    url: completedPhotoUrl,
                    title: imp.title,
                    type: 'Realizada',
                    date: imp.completed_at || imp.completedAt,
                    status: 'Completado'
                });
            }
        });
        
        if (allPhotos.length === 0) {
            galleryContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--gray-600);">
                    <i class="fas fa-camera" style="font-size: 2rem; opacity: 0.3; margin-bottom: 0.5rem;"></i>
                    <p style="font-size: 0.9rem;">No hay fotos aún</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">Las fotos de mejoras aparecerán aquí</p>
                </div>
            `;
            return;
        }
        
        // Mezclar aleatoriamente y tomar las primeras 5
        const shuffled = allPhotos.sort(() => Math.random() - 0.5);
        const photosToShow = shuffled.slice(0, 5);
        
        galleryContainer.innerHTML = photosToShow.map(photo => `
            <div onclick="VV.improvements.viewPhoto('${photo.url}')" style="cursor: pointer; border-radius: 8px; overflow: hidden; position: relative; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                <img src="${photo.url}" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 1rem 0.75rem 0.75rem; color: white;">
                    <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">${photo.title}</div>
                    <div style="font-size: 0.75rem; opacity: 0.9;">
                        <span class="badge" style="background: ${photo.type === 'Realizada' ? 'var(--success-green)' : 'var(--warning-orange)'}; padding: 0.25rem 0.5rem; font-size: 0.7rem;">
                            ${photo.type === 'Realizada' ? '✓ Realizada' : '⚠ Problema'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Rotar fotos cada 8 segundos
        if (VV.improvements.galleryInterval) clearInterval(VV.improvements.galleryInterval);
        VV.improvements.galleryInterval = setInterval(() => {
            VV.improvements.loadGallery(improvements);
        }, 8000);
    },
    
    // Mostrar formulario
    showForm(improvementId = null) {
        // Verificar si el usuario está en su barrio principal
        const homeNeighborhood = VV.data.user.home_neighborhood || VV.data.user.neighborhood;
        const currentNeighborhood = VV.data.user.current_neighborhood || VV.data.user.neighborhood;
        
        if (homeNeighborhood !== currentNeighborhood) {
            alert(`Solo puedes proponer mejoras en tu barrio principal: ${homeNeighborhood}\n\nActualmente estás visitando: ${currentNeighborhood}`);
            return;
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const improvement = improvementId ? VV.data.improvements.find(i => i.id === improvementId) : null;
        const isEdit = improvement !== null;
        
        let overlay = document.getElementById('improvement-form-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'improvement-form-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-${isEdit ? 'edit' : 'lightbulb'}"></i> ${isEdit ? 'Editar' : 'Proponer'} Mejora</h3>
                <form id="improvement-form">
                    <div class="form-group">
                        <label>Título *</label>
                        <input type="text" id="improvement-title" value="${improvement?.title || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Descripción *</label>
                        <textarea id="improvement-description" rows="4" required>${improvement?.description || ''}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Categoría *</label>
                            <select id="improvement-category" required>
                                <option value="">Seleccionar</option>
                                <option value="Infraestructura" ${improvement?.category === 'Infraestructura' ? 'selected' : ''}>Infraestructura</option>
                                <option value="Seguridad" ${improvement?.category === 'Seguridad' ? 'selected' : ''}>Seguridad</option>
                                <option value="Limpieza" ${improvement?.category === 'Limpieza' ? 'selected' : ''}>Limpieza</option>
                                <option value="Espacios Verdes" ${improvement?.category === 'Espacios Verdes' ? 'selected' : ''}>Espacios Verdes</option>
                                <option value="Otros" ${improvement?.category === 'Otros' ? 'selected' : ''}>Otros</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Prioridad *</label>
                            <select id="improvement-priority" required>
                                <option value="">Seleccionar</option>
                                <option value="Alta" ${improvement?.priority === 'Alta' ? 'selected' : ''}>Alta</option>
                                <option value="Media" ${improvement?.priority === 'Media' ? 'selected' : ''}>Media</option>
                                <option value="Baja" ${improvement?.priority === 'Baja' ? 'selected' : ''}>Baja</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Foto (opcional) <span style="font-size: 0.85rem; color: var(--gray-600);">- Documenta el problema si es posible</span></label>
                        <input type="file" id="improvement-photo" accept="image/*" style="padding: 0.5rem;">
                        ${improvement?.photoUrl ? `<div style="margin-top: 0.5rem;"><img src="${improvement.photoUrl}" style="max-width: 200px; border-radius: 8px;"></div>` : ''}
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.improvements.closeForm()">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-save"></i> ${isEdit ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('improvement-form').onsubmit = (e) => {
            e.preventDefault();
            VV.improvements.save(improvement);
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.improvements.closeForm();
        };
    },
    
    // Cerrar formulario
    closeForm() {
        const overlay = document.getElementById('improvement-form-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Guardar mejora
    save(existing) {
        const formData = {
            title: document.getElementById('improvement-title').value.trim(),
            description: document.getElementById('improvement-description').value.trim(),
            category: document.getElementById('improvement-category').value,
            priority: document.getElementById('improvement-priority').value
        };
        
        if (!formData.title || !formData.description || !formData.category || !formData.priority) {
            alert('Completa todos los campos');
            return;
        }
        
        // Manejar foto opcional
        const photoInput = document.getElementById('improvement-photo');
        if (photoInput.files && photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                formData.photoUrl = e.target.result;
                VV.improvements.saveData(existing, formData);
            };
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            // Si no hay foto nueva, mantener la existente
            if (existing && existing.photoUrl) {
                formData.photoUrl = existing.photoUrl;
            }
            VV.improvements.saveData(existing, formData);
        }
    },
    
    // Guardar datos de mejora - MIGRADO A SUPABASE
    async saveData(existing, formData) {
        try {
            if (existing) {
                // Actualizar mejora existente
                const { error } = await supabase
                    .from('improvements')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        category: formData.category,
                        priority: formData.priority,
                        photo_url: formData.photoUrl
                    })
                    .eq('id', existing.id);
                
                if (error) throw error;
                
                const index = VV.data.improvements.findIndex(i => i.id === existing.id);
                VV.data.improvements[index] = { ...existing, ...formData };
            } else {
                // Crear nueva mejora
                const { data, error } = await supabase
                    .from('improvements')
                    .insert({
                        title: formData.title,
                        description: formData.description,
                        category: formData.category,
                        priority: formData.priority,
                        photo_url: formData.photoUrl,
                        status: 'pending',
                        votes: 0,
                        author_id: VV.data.user.id,
                        author_name: VV.data.user.name,
                        author_number: VV.data.user.unique_number,
                        neighborhood: VV.data.neighborhood
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                VV.data.improvements.push(data);
            }
            
            VV.improvements.closeForm();
            VV.improvements.load();
            VV.utils.showSuccess(existing ? 'Mejora actualizada' : 'Mejora propuesta');
            
        } catch (error) {
            console.error('Error guardando mejora:', error);
            alert('Error al guardar la mejora: ' + error.message);
        }
    },
    
    // Renderizar botón de voto
    renderVoteButton(improvement) {
        const votedBy = improvement.voted_by || [];
        const hasVoted = votedBy.includes(VV.data.user.id);
        
        if (hasVoted) {
            return `
                <button class="vote-btn" disabled style="opacity: 0.6; cursor: not-allowed;">
                    <i class="fas fa-thumbs-up" style="color: var(--primary-blue);"></i> ${improvement.votes} (Ya votaste)
                </button>
            `;
        }
        
        return `
            <button class="vote-btn" onclick="VV.improvements.vote('${improvement.id}')">
                <i class="fas fa-thumbs-up"></i> ${improvement.votes}
            </button>
        `;
    },
    
    // Votar mejora - MIGRADO A SUPABASE
    async vote(improvementId) {
        // Verificar si el usuario está en su barrio principal
        const homeNeighborhood = VV.data.user.home_neighborhood || VV.data.user.neighborhood;
        const currentNeighborhood = VV.data.user.current_neighborhood || VV.data.user.neighborhood;
        
        if (homeNeighborhood !== currentNeighborhood) {
            alert(`Solo puedes votar mejoras en tu barrio principal: ${homeNeighborhood}`);
            return;
        }
        
        const improvement = VV.data.improvements.find(i => i.id === improvementId);
        if (!improvement) return;
        
        // Verificar si ya votó
        const votedBy = improvement.voted_by || [];
        if (votedBy.includes(VV.data.user.id)) {
            alert('Ya votaste por esta mejora');
            return;
        }
        
        try {
            const newVotes = improvement.votes + 1;
            const newVotedBy = [...votedBy, VV.data.user.id];
            
            const { error } = await supabase
                .from('improvements')
                .update({ 
                    votes: newVotes,
                    voted_by: newVotedBy
                })
                .eq('id', improvementId);
            
            if (error) throw error;
            
            improvement.votes = newVotes;
            improvement.voted_by = newVotedBy;
            VV.improvements.load();
            VV.utils.showSuccess('¡Voto registrado!');
            
        } catch (error) {
            console.error('Error votando mejora:', error);
            alert('Error al votar. Intenta nuevamente.');
        }
    },
    
    // Marcar mejora como completada (solo moderadores y admins)
    markAsCompleted(improvementId) {
        if (!VV.utils.canModerate()) {
            alert('No tienes permisos para realizar esta acción');
            return;
        }
        
        const improvement = VV.data.improvements.find(i => i.id === improvementId);
        if (!improvement) return;
        
        // Mostrar formulario para agregar foto opcional de completado
        let overlay = document.getElementById('complete-improvement-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'complete-improvement-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-check-circle"></i> Marcar como Realizada</h3>
                <p style="margin-bottom: 1rem;"><strong>${improvement.title}</strong></p>
                <form id="complete-form">
                    <div class="form-group">
                        <label>Foto de la mejora realizada (opcional)</label>
                        <p style="font-size: 0.85rem; color: var(--gray-600); margin-bottom: 0.5rem;">Documenta el resultado si es posible</p>
                        <input type="file" id="completed-photo" accept="image/*" style="padding: 0.5rem;">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="document.getElementById('complete-improvement-overlay').classList.remove('active')">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-check"></i> Confirmar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('complete-form').onsubmit = (e) => {
            e.preventDefault();
            
            const photoInput = document.getElementById('completed-photo');
            if (photoInput.files && photoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    improvement.completedPhotoUrl = e.target.result;
                    VV.improvements.completeImprovement(improvement);
                };
                reader.readAsDataURL(photoInput.files[0]);
            } else {
                VV.improvements.completeImprovement(improvement);
            }
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        };
    },
    
    // Completar mejora
    completeImprovement(improvement) {
        improvement.status = 'Completado';
        improvement.completedAt = new Date().toISOString();
        improvement.completedBy = VV.data.user.name;
        
        // Guardar en localStorage
        localStorage.setItem('vecinosVirtuales_improvements', JSON.stringify(VV.data.improvements));
        
        // Registrar acción de moderador
        VV.utils.logModeratorAction('COMPLETAR_MEJORA', {
            mejoraId: improvement.id,
            mejoraTitulo: improvement.title,
            motivo: 'Mejora realizada'
        });
        
        document.getElementById('complete-improvement-overlay').classList.remove('active');
        VV.improvements.load();
        VV.utils.showSuccess('Mejora marcada como realizada');
    },
    
    // Ver foto en tamaño completo
    viewPhoto(photoUrl) {
        let overlay = document.getElementById('photo-viewer-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'photo-viewer-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 2rem;">
                <div style="position: relative; max-width: 90%; max-height: 90%;">
                    <button onclick="document.getElementById('photo-viewer-overlay').classList.remove('active')" style="position: absolute; top: -40px; right: 0; background: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                    <img src="${photoUrl}" style="max-width: 100%; max-height: 80vh; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        };
    }
};

console.log('✅ Módulo IMPROVEMENTS cargado');
