// ========== MÓDULO SERVICIOS ==========

VV.services = {
    // Servicios por defecto (disponibles en todos los barrios)
    defaultServices: [
        { id: 'emergency-1', serviceName: '🚑 Ambulancia', category: 'Emergencia', description: 'Servicio de emergencias médicas', providerName: 'SAME', contact: '107', availability: '24/7', price: 'Gratuito', rating: 5, isDefault: true, isEmergency: true },
        { id: 'emergency-2', serviceName: '🚒 Bomberos', category: 'Emergencia', description: 'Servicio de bomberos', providerName: 'Bomberos', contact: '100', availability: '24/7', price: 'Gratuito', rating: 5, isDefault: true, isEmergency: true },
        { id: 'emergency-3', serviceName: '👮 Policía', category: 'Emergencia', description: 'Servicio policial', providerName: 'Policía', contact: '911', availability: '24/7', price: 'Gratuito', rating: 5, isDefault: true, isEmergency: true },
        { id: 'default-1', serviceName: 'Plomería de Emergencia', category: 'Plomería', description: 'Servicio de plomería 24/7', providerName: 'Servicio Municipal', contact: '911', availability: '24/7', price: 'Según trabajo', rating: 5, isDefault: true },
        { id: 'default-2', serviceName: 'Electricidad', category: 'Electricidad', description: 'Instalaciones y reparaciones eléctricas', providerName: 'Servicio Municipal', contact: '911', availability: 'Lun-Vie 8-18hs', price: 'Según trabajo', rating: 5, isDefault: true },
        { id: 'default-3', serviceName: 'Recolección de Residuos', category: 'Limpieza', description: 'Servicio de recolección de basura', providerName: 'Municipalidad', contact: '147', availability: 'Según calendario', price: 'Gratuito', rating: 5, isDefault: true }
    ],
    
    // Obtener servicios de emergencia personalizados
    getEmergencyServices() {
        const saved = localStorage.getItem('emergencyServices');
        return saved ? JSON.parse(saved) : [];
    },
    
    // Guardar servicios de emergencia
    saveEmergencyServices(services) {
        localStorage.setItem('emergencyServices', JSON.stringify(services));
    },
    
    // Cargar servicios
    load() {
        const container = document.getElementById('services-list');
        
        // Combinar servicios por defecto con servicios del barrio
        const neighborhoodServices = VV.data.services.filter(s => 
            !s.neighborhood || s.neighborhood === VV.data.neighborhood
        );
        
        // Combinar servicios de emergencia personalizados
        const customEmergency = VV.services.getEmergencyServices();
        
        const allServices = [...VV.services.defaultServices, ...customEmergency, ...neighborhoodServices];
        
        container.innerHTML = allServices.map(service => {
            const isOwner = service.provider_id === VV.data.user.id;
            const canModerate = VV.utils.canModerate();
            const canEdit = isOwner && !service.isDefault;
            
            return `
            <div class="service-card">
                <div class="card-header">
                    <h3>${service.service_name || service.serviceName}${service.isDefault ? ' <span style="font-size: 0.7rem; color: var(--primary-blue);">★ OFICIAL</span>' : ''}</h3>
                    <div style="display: flex; align-items: center; gap: 0.25rem; color: var(--warning-orange);">
                        ${VV.services.generateStars(service.rating || 5)}
                        <span style="margin-left: 0.25rem; font-weight: 600;">${service.rating || 5}</span>
                    </div>
                </div>
                <p><strong>Proveedor:</strong> ${service.provider_name || service.providerName}</p>
                <p><strong>Categoría:</strong> ${service.category}</p>
                <p style="color: var(--gray-700); margin: 0.5rem 0;">${service.description}</p>
                <div style="margin: 1rem 0; padding: 1rem; background: var(--gray-50); border-radius: 8px;">
                    <p style="margin-bottom: 0.5rem;"><i class="fas fa-clock"></i> ${service.availability}</p>
                    <p style="margin-bottom: 0.5rem;"><i class="fas fa-phone"></i> ${service.contact}</p>
                    ${service.price ? `<p><i class="fas fa-dollar-sign"></i> ${service.price}</p>` : ''}
                </div>
                ${canEdit ? `
                    <div class="card-actions" style="margin-bottom: 0.5rem;">
                        <button class="btn-edit" onclick="VV.services.showForm('${service.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete" onclick="VV.services.delete('${service.id}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                ` : canModerate && !service.isDefault ? `
                    <button class="btn-delete" onclick="VV.services.delete('${service.id}')" style="width: 100%; margin-bottom: 0.5rem;">
                        <i class="fas fa-trash"></i> Eliminar (Moderador)
                    </button>
                ` : ''}
                <button class="btn-primary" onclick="VV.services.contact('${service.contact}')" style="width: 100%;">
                    <i class="fas fa-phone"></i> Contactar
                </button>
            </div>
        `;
        }).join('');
    },
    
    // Generar estrellas
    generateStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < full; i++) stars += '<i class="fas fa-star"></i>';
        if (half) stars += '<i class="fas fa-star-half-alt"></i>';
        for (let i = 0; i < 5 - Math.ceil(rating); i++) stars += '<i class="far fa-star"></i>';
        
        return stars;
    },
    
    // Mostrar formulario
    showForm(serviceId = null) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const service = serviceId ? VV.data.services.find(s => s.id === serviceId) : null;
        const isEdit = service !== null;
        
        let overlay = document.getElementById('service-form-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'service-form-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-${isEdit ? 'edit' : 'briefcase'}"></i> ${isEdit ? 'Editar' : 'Ofrecer'} Servicio</h3>
                <form id="service-form">
                    <div class="form-group">
                        <label>Nombre del servicio *</label>
                        <input type="text" id="service-name" value="${service?.serviceName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Categoría *</label>
                        <select id="service-category" required>
                            <option value="">Seleccionar</option>
                            <option value="Plomería" ${service?.category === 'Plomería' ? 'selected' : ''}>Plomería</option>
                            <option value="Electricidad" ${service?.category === 'Electricidad' ? 'selected' : ''}>Electricidad</option>
                            <option value="Carpintería" ${service?.category === 'Carpintería' ? 'selected' : ''}>Carpintería</option>
                            <option value="Limpieza" ${service?.category === 'Limpieza' ? 'selected' : ''}>Limpieza</option>
                            <option value="Jardinería" ${service?.category === 'Jardinería' ? 'selected' : ''}>Jardinería</option>
                            <option value="Tecnología" ${service?.category === 'Tecnología' ? 'selected' : ''}>Tecnología</option>
                            <option value="Educación" ${service?.category === 'Educación' ? 'selected' : ''}>Educación</option>
                            <option value="Otros" ${service?.category === 'Otros' ? 'selected' : ''}>Otros</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción *</label>
                        <textarea id="service-description" rows="3" required>${service?.description || ''}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Teléfono *</label>
                            <input type="tel" id="service-contact" value="${service?.contact || VV.data.user?.phone || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Precio (opcional)</label>
                            <input type="text" id="service-price" value="${service?.price || ''}" placeholder="Ej: Desde $2000">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Disponibilidad *</label>
                        <input type="text" id="service-availability" value="${service?.availability || ''}" placeholder="Ej: Lunes a Viernes 9-18hs" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.services.closeForm()">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-save"></i> ${isEdit ? 'Actualizar' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('service-form').onsubmit = (e) => {
            e.preventDefault();
            VV.services.save(service);
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.services.closeForm();
        };
    },
    
    // Cerrar formulario
    closeForm() {
        const overlay = document.getElementById('service-form-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Guardar servicio (MIGRADO A SUPABASE)
    async save(existing) {
        const formData = {
            service_name: document.getElementById('service-name').value.trim(),
            category: document.getElementById('service-category').value,
            description: document.getElementById('service-description').value.trim(),
            contact: document.getElementById('service-contact').value.trim(),
            price: document.getElementById('service-price').value.trim(),
            availability: document.getElementById('service-availability').value.trim()
        };
        
        if (!formData.service_name || !formData.category || !formData.description || !formData.contact || !formData.availability) {
            alert('Completa todos los campos obligatorios');
            return;
        }
        
        try {
            if (existing) {
                // Actualizar servicio existente
                const { error } = await supabase
                    .from('services')
                    .update(formData)
                    .eq('id', existing.id);
                
                if (error) throw error;
                
                const index = VV.data.services.findIndex(s => s.id === existing.id);
                VV.data.services[index] = { ...existing, ...formData };
            } else {
                // Crear nuevo servicio
                const { data, error } = await supabase
                    .from('services')
                    .insert({
                        ...formData,
                        provider_id: VV.data.user.id,
                        provider_name: VV.data.user.name,
                        neighborhood: VV.data.neighborhood,
                        rating: 0
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                VV.data.services.push(data);
            }
            
            VV.services.closeForm();
            VV.services.load();
            VV.utils.showSuccess(existing ? 'Servicio actualizado' : 'Servicio publicado');
            
        } catch (error) {
            console.error('Error guardando servicio:', error);
            alert('Error al guardar el servicio: ' + error.message);
        }
    },
    
    // Contactar servicio
    contact(phone) {
        window.open(`tel:${phone}`, '_blank');
    },
    
    // Buscar servicios
    search() {
        const searchInput = document.getElementById('service-search');
        const categorySelect = document.getElementById('service-category-filter');
        const container = document.getElementById('services-list');
        
        if (!searchInput || !categorySelect) return;
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        const categoryFilter = categorySelect.value;
        
        // Combinar servicios por defecto con servicios del barrio
        const neighborhoodServices = VV.data.services.filter(s => 
            !s.neighborhood || s.neighborhood === VV.data.neighborhood
        );
        
        // Combinar servicios de emergencia personalizados
        const customEmergency = VV.services.getEmergencyServices();
        
        let allServices = [...VV.services.defaultServices, ...customEmergency, ...neighborhoodServices];
        
        // Si no hay filtros, mostrar todos
        if (!searchTerm && !categoryFilter) {
            VV.services.renderServices(allServices, container);
            return;
        }
        
        // Filtrar por búsqueda
        if (searchTerm) {
            allServices = allServices.filter(s => 
                (s.serviceName && s.serviceName.toLowerCase().includes(searchTerm)) ||
                (s.description && s.description.toLowerCase().includes(searchTerm)) ||
                (s.providerName && s.providerName.toLowerCase().includes(searchTerm)) ||
                (s.category && s.category.toLowerCase().includes(searchTerm))
            );
        }
        
        // Filtrar por categoría
        if (categoryFilter) {
            allServices = allServices.filter(s => s.category === categoryFilter);
        }
        
        VV.services.renderServices(allServices, container);
    },
    
    // Renderizar servicios
    renderServices(services, container) {
        if (services.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray-600);">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No se encontraron servicios</h3>
                    <p>Intenta con otros términos de búsqueda</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = services.map(service => `
            <div class="service-card">
                <div class="card-header">
                    <h3>${service.serviceName}${service.isDefault ? ' <span style="font-size: 0.7rem; color: var(--primary-blue);">★ OFICIAL</span>' : ''}</h3>
                    <div style="display: flex; align-items: center; gap: 0.25rem; color: var(--warning-orange);">
                        ${VV.services.generateStars(service.rating || 5)}
                        <span style="margin-left: 0.25rem; font-weight: 600;">${service.rating || 5}</span>
                    </div>
                </div>
                <p><strong>Proveedor:</strong> ${service.providerName}</p>
                <p><strong>Categoría:</strong> ${service.category}</p>
                <p style="color: var(--gray-700); margin: 0.5rem 0;">${service.description}</p>
                <div style="margin: 1rem 0; padding: 1rem; background: var(--gray-50); border-radius: 8px;">
                    <p style="margin-bottom: 0.5rem;"><i class="fas fa-clock"></i> ${service.availability}</p>
                    <p style="margin-bottom: 0.5rem;"><i class="fas fa-phone"></i> ${service.contact}</p>
                    ${service.price ? `<p><i class="fas fa-dollar-sign"></i> ${service.price}</p>` : ''}
                </div>
                <button class="btn-primary" onclick="VV.services.contact('${service.contact}')" style="width: 100%;">
                    <i class="fas fa-phone"></i> Contactar
                </button>
            </div>
        `).join('');
    },
    
    // Eliminar servicio (MIGRADO A SUPABASE)
    async delete(serviceId) {
        const service = VV.data.services.find(s => s.id === serviceId);
        if (!service) return;
        
        const isOwner = service.provider_id === VV.data.user.id;
        const canModerate = VV.utils.canModerate();
        
        if (!isOwner && !canModerate) {
            alert('No tienes permisos para eliminar este servicio');
            return;
        }
        
        if (!confirm('¿Eliminar este servicio?')) return;
        
        try {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceId);
            
            if (error) throw error;
            
            VV.data.services = VV.data.services.filter(s => s.id !== serviceId);
            
            // Registrar acción de moderador si aplica
            if (canModerate && !isOwner) {
                VV.utils.logModeratorAction('ELIMINAR_SERVICIO', {
                    serviceId: serviceId,
                    serviceName: service.service_name,
                    providerName: service.provider_name
                });
            }
            
            VV.services.load();
            VV.utils.showSuccess('Servicio eliminado');
            
        } catch (error) {
            console.error('Error eliminando servicio:', error);
            alert('Error al eliminar el servicio: ' + error.message);
        }
    },
    
    // Mostrar configuración de teléfonos de emergencia (admin/moderador)
    showEmergencyConfig() {
        if (!VV.utils.canModerate()) {
            alert('No tienes permisos para esta acción');
            return;
        }
        
        const customEmergency = VV.services.getEmergencyServices();
        
        let overlay = document.getElementById('emergency-config-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'emergency-config-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 700px;">
                <h3><i class="fas fa-phone-alt"></i> Teléfonos de Emergencia del Barrio</h3>
                <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                    Configura los teléfonos de emergencia específicos de tu barrio. Estos se mostrarán junto a los servicios de emergencia nacionales.
                </p>
                
                <div id="emergency-list" style="margin-bottom: 1.5rem;">
                    ${customEmergency.length === 0 ? `
                        <p style="text-align: center; color: var(--gray-600); padding: 2rem; background: var(--gray-50); border-radius: 8px;">
                            No hay teléfonos de emergencia personalizados para este barrio
                        </p>
                    ` : customEmergency.map(service => `
                        <div style="background: white; border: 2px solid var(--error-red); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1;">
                                    <h4 style="margin: 0 0 0.5rem 0; color: var(--error-red);">${service.serviceName}</h4>
                                    <p style="margin: 0 0 0.25rem 0;"><strong>Teléfono:</strong> ${service.contact}</p>
                                    <p style="margin: 0; color: var(--gray-600);">${service.description}</p>
                                </div>
                                <button class="btn-delete" onclick="VV.services.deleteEmergencyService('${service.id}')" style="margin-left: 1rem;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <button class="btn-primary" onclick="VV.services.addEmergencyService()" style="width: 100%; margin-bottom: 1rem;">
                    <i class="fas fa-plus"></i> Agregar Teléfono de Emergencia
                </button>
                
                <button class="btn-secondary" onclick="VV.services.closeEmergencyConfig()" style="width: 100%;">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        `;
        
        overlay.classList.add('active');
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.services.closeEmergencyConfig();
        };
    },
    
    addEmergencyService() {
        const name = prompt('Nombre del servicio (ej: Policía Local, Bomberos Voluntarios):');
        if (!name) return;
        
        const contact = prompt('Teléfono de contacto:');
        if (!contact) return;
        
        const description = prompt('Descripción breve:');
        if (!description) return;
        
        const customEmergency = VV.services.getEmergencyServices();
        const newService = {
            id: VV.utils.generateId(),
            serviceName: name,
            category: 'Emergencia',
            description: description,
            providerName: VV.data.neighborhood,
            contact: contact,
            availability: '24/7',
            price: 'Gratuito',
            rating: 5,
            isEmergency: true,
            neighborhood: VV.data.neighborhood
        };
        
        customEmergency.push(newService);
        VV.services.saveEmergencyServices(customEmergency);
        VV.services.showEmergencyConfig();
        VV.utils.showSuccess('Teléfono de emergencia agregado');
    },
    
    deleteEmergencyService(serviceId) {
        if (!confirm('¿Eliminar este teléfono de emergencia?')) return;
        
        const customEmergency = VV.services.getEmergencyServices();
        const filtered = customEmergency.filter(s => s.id !== serviceId);
        VV.services.saveEmergencyServices(filtered);
        VV.services.showEmergencyConfig();
        VV.services.load();
        VV.utils.showSuccess('Teléfono eliminado');
    },
    
    closeEmergencyConfig() {
        const overlay = document.getElementById('emergency-config-overlay');
        if (overlay) overlay.classList.remove('active');
        VV.services.load();
    }
};

console.log('✅ Módulo SERVICES cargado');
