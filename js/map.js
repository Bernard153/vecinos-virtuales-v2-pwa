// ========== MÓDULO DE MAPA INTERACTIVO ==========

VV.map = {
    mapInstance: null,
    layers: {
        vendors: null,
        services: null,
        alerts: null,
        roadblocks: null,
        businesses: null,
        events: null
    },
    userMarker: null,
    
    // Inicializar mapa
    async init() {
        console.log('🗺️ Inicializando mapa interactivo...');
        
        const container = document.getElementById('map-container');
        if (!container) {
            console.warn('⚠️ Contenedor de mapa no encontrado');
            return;
        }
        
        // Obtener ubicación del usuario
        const userLocation = VV.data.user.current_location || 
                           VV.geo.neighborhoods[VV.data.user.current_neighborhood]?.center ||
                           { lat: -34.6037, lng: -58.3816 }; // Buenos Aires por defecto
        
        // Crear mapa
        VV.map.mapInstance = L.map('map-container').setView([userLocation.lat, userLocation.lng], 15);
        
        // Agregar capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(VV.map.mapInstance);
        
        // Crear grupos de capas
        VV.map.layers.vendors = L.layerGroup().addTo(VV.map.mapInstance);
        VV.map.layers.services = L.layerGroup().addTo(VV.map.mapInstance);
        VV.map.layers.alerts = L.layerGroup().addTo(VV.map.mapInstance);
        VV.map.layers.roadblocks = L.layerGroup().addTo(VV.map.mapInstance);
        VV.map.layers.businesses = L.layerGroup();
        VV.map.layers.events = L.layerGroup();
        
        // Agregar marcador del usuario
        VV.map.userMarker = L.marker([userLocation.lat, userLocation.lng], {
            icon: L.divIcon({
                className: 'user-marker',
                html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20]
            })
        }).addTo(VV.map.mapInstance);
        
        VV.map.userMarker.bindPopup(`
            <div style="text-align: center;">
                <strong>📍 Tu ubicación</strong><br>
                <span style="font-size: 0.85rem;">${VV.data.user.current_neighborhood}</span>
            </div>
        `);
        
        // Cargar datos
        await VV.map.loadAllMarkers();
        
        console.log('✅ Mapa inicializado');
    },
    
    // Cargar todos los marcadores
    async loadAllMarkers() {
        await Promise.all([
            VV.map.loadVendors(),
            VV.map.loadServices(),
            VV.map.loadAlerts(),
            VV.map.loadRoadblocks()
        ]);
    },
    
    // Cargar vendedores activos
    async loadVendors() {
        VV.map.layers.vendors.clearLayers();
        
        // Obtener productos con geolocalización activa
        const { data: products, error } = await supabase
            .from('products')
            .select('*, users(name)')
            .eq('is_geolocated', true)
            .eq('neighborhood', VV.data.user.current_neighborhood)
            .not('location', 'is', null);
        
        if (error) {
            console.error('Error cargando vendedores:', error);
            return;
        }
        
        products?.forEach(product => {
            if (!product.location) return;
            
            const marker = L.marker([product.location.lat, product.location.lng], {
                icon: L.divIcon({
                    className: 'vendor-marker',
                    html: '<div style="background: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [16, 16]
                })
            });
            
            const distance = VV.geo.calculateDistance(
                VV.data.user.current_location || VV.geo.neighborhoods[VV.data.user.current_neighborhood].center,
                product.location
            );
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: var(--primary-blue);">🛒 ${product.name}</h4>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem;">${product.description}</p>
                    <p style="margin: 0.5rem 0; font-weight: 600; color: var(--success-green);">$${product.price}</p>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--gray-600);">
                        <i class="fas fa-user"></i> ${product.users?.name || 'Vendedor'}
                    </p>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--gray-600);">
                        <i class="fas fa-map-marker-alt"></i> A ${VV.geo.formatDistance(distance)}
                    </p>
                    <button onclick="VV.marketplace.showProductDetail('${product.id}')" style="width: 100%; margin-top: 0.5rem; padding: 0.5rem; background: var(--primary-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        Ver Detalles
                    </button>
                </div>
            `);
            
            marker.addTo(VV.map.layers.vendors);
        });
        
        console.log(`✅ ${products?.length || 0} vendedores cargados`);
    },
    
    // Cargar servicios
    async loadServices() {
        VV.map.layers.services.clearLayers();
        
        // Obtener servicios del barrio actual
        const services = VV.data.services.filter(s => 
            s.neighborhood === VV.data.user.current_neighborhood && s.location
        );
        
        services.forEach(service => {
            const marker = L.marker([service.location.lat, service.location.lng], {
                icon: L.divIcon({
                    className: 'service-marker',
                    html: '<div style="background: #f59e0b; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [16, 16]
                })
            });
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: var(--warning-orange);">⚙️ ${service.title}</h4>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem;">${service.description}</p>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--gray-600);">
                        <i class="fas fa-user"></i> ${service.provider}
                    </p>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--gray-600);">
                        <i class="fas fa-phone"></i> ${service.contact}
                    </p>
                </div>
            `);
            
            marker.addTo(VV.map.layers.services);
        });
        
        console.log(`✅ ${services.length} servicios cargados`);
    },
    
    // Cargar alertas de seguridad
    async loadAlerts() {
        VV.map.layers.alerts.clearLayers();
        
        // Obtener alertas de las últimas 24 horas
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { data: alerts, error } = await supabase
            .from('community_alerts')
            .select('*')
            .eq('neighborhood', VV.data.user.current_neighborhood)
            .eq('type', 'security')
            .gte('created_at', yesterday.toISOString())
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error cargando alertas:', error);
            return;
        }
        
        alerts?.forEach(alert => {
            if (!alert.location) return;
            
            const marker = L.marker([alert.location.lat, alert.location.lng], {
                icon: L.divIcon({
                    className: 'alert-marker',
                    html: '<div style="background: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>',
                    iconSize: [16, 16]
                })
            });
            
            const timeAgo = VV.utils.timeAgo(alert.created_at);
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: var(--error-red);">⚠️ ${alert.title}</h4>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem;">${alert.description}</p>
                    <p style="margin: 0.5rem 0; font-size: 0.75rem; color: var(--gray-600);">
                        <i class="fas fa-clock"></i> Hace ${timeAgo}
                    </p>
                    <p style="margin: 0; font-size: 0.75rem; color: var(--gray-500); font-style: italic;">
                        Reportado por la comunidad
                    </p>
                </div>
            `);
            
            marker.addTo(VV.map.layers.alerts);
        });
        
        console.log(`✅ ${alerts?.length || 0} alertas cargadas`);
    },
    
    // Cargar cortes de calle
    async loadRoadblocks() {
        VV.map.layers.roadblocks.clearLayers();
        
        // Obtener cortes activos
        const { data: roadblocks, error } = await supabase
            .from('community_alerts')
            .select('*')
            .eq('neighborhood', VV.data.user.current_neighborhood)
            .eq('type', 'roadblock')
            .eq('active', true)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error cargando cortes:', error);
            return;
        }
        
        roadblocks?.forEach(roadblock => {
            if (!roadblock.location) return;
            
            const marker = L.marker([roadblock.location.lat, roadblock.location.lng], {
                icon: L.divIcon({
                    className: 'roadblock-marker',
                    html: '<div style="background: #f59e0b; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [16, 16]
                })
            });
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #f59e0b;">🚧 ${roadblock.title}</h4>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem;">${roadblock.description}</p>
                    ${roadblock.end_time ? `
                        <p style="margin: 0.5rem 0; font-size: 0.75rem; color: var(--gray-600);">
                            <i class="fas fa-clock"></i> Hasta: ${new Date(roadblock.end_time).toLocaleString('es-AR')}
                        </p>
                    ` : ''}
                </div>
            `);
            
            marker.addTo(VV.map.layers.roadblocks);
        });
        
        console.log(`✅ ${roadblocks?.length || 0} cortes cargados`);
    },
    
    // Toggle de capas
    toggleLayer(layerName) {
        const checkbox = document.getElementById(`layer-${layerName}`);
        const layer = VV.map.layers[layerName];
        
        if (!layer) return;
        
        if (checkbox.checked) {
            layer.addTo(VV.map.mapInstance);
            console.log(`✅ Capa ${layerName} activada`);
        } else {
            VV.map.mapInstance.removeLayer(layer);
            console.log(`❌ Capa ${layerName} desactivada`);
        }
    },
    
    // Refrescar mapa
    async refreshMap() {
        console.log('🔄 Refrescando mapa...');
        await VV.map.loadAllMarkers();
        VV.utils.showSuccess('Mapa actualizado');
    },
    
    // Reportar alerta de seguridad
    reportAlert() {
        if (!VV.data.user.current_location) {
            alert('Activa la geolocalización para reportar alertas');
            return;
        }
        
        let overlay = document.getElementById('alert-report-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'alert-report-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 500px;">
                <h3><i class="fas fa-exclamation-triangle"></i> Reportar Alerta de Seguridad</h3>
                
                <form id="alert-report-form">
                    <div class="form-group">
                        <label>Tipo de Alerta *</label>
                        <select id="alert-type" required>
                            <option value="">Seleccionar...</option>
                            <option value="theft">🚨 Robo/Hurto</option>
                            <option value="suspicious">👀 Actividad Sospechosa</option>
                            <option value="accident">🚗 Accidente</option>
                            <option value="fire">🔥 Incendio</option>
                            <option value="other">⚠️ Otro</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Descripción *</label>
                        <textarea id="alert-description" rows="4" required placeholder="Describe lo que está sucediendo..."></textarea>
                    </div>
                    
                    <div style="background: var(--info-blue); color: white; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem;">
                        <i class="fas fa-info-circle"></i> Tu ubicación actual será registrada con este reporte
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="submit" class="btn-primary" style="flex: 1;">
                            <i class="fas fa-paper-plane"></i> Enviar Reporte
                        </button>
                        <button type="button" class="btn-cancel" onclick="VV.map.closeAlertReport()">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('alert-report-form').onsubmit = async (e) => {
            e.preventDefault();
            await VV.map.submitAlert();
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.map.closeAlertReport();
        };
    },
    
    // Enviar alerta
    async submitAlert() {
        const type = document.getElementById('alert-type').value;
        const description = document.getElementById('alert-description').value;
        
        try {
            const { error } = await supabase
                .from('community_alerts')
                .insert({
                    type: 'security',
                    subtype: type,
                    title: document.querySelector(`#alert-type option[value="${type}"]`).textContent,
                    description: description,
                    location: VV.data.user.current_location,
                    neighborhood: VV.data.user.current_neighborhood,
                    reported_by: VV.data.user.id,
                    active: true
                });
            
            if (error) throw error;
            
            VV.utils.showSuccess('Alerta reportada correctamente');
            VV.map.closeAlertReport();
            await VV.map.loadAlerts();
            
        } catch (error) {
            console.error('Error reportando alerta:', error);
            alert('Error al reportar la alerta');
        }
    },
    
    closeAlertReport() {
        const overlay = document.getElementById('alert-report-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Reportar corte de calle
    reportRoadblock() {
        if (!VV.data.user.current_location) {
            alert('Activa la geolocalización para reportar cortes');
            return;
        }
        
        let overlay = document.getElementById('roadblock-report-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'roadblock-report-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 500px;">
                <h3><i class="fas fa-road"></i> Reportar Corte de Calle</h3>
                
                <form id="roadblock-report-form">
                    <div class="form-group">
                        <label>Motivo del Corte *</label>
                        <select id="roadblock-reason" required>
                            <option value="">Seleccionar...</option>
                            <option value="works">🚧 Obras</option>
                            <option value="protest">📢 Manifestación</option>
                            <option value="event">🎉 Evento</option>
                            <option value="accident">🚗 Accidente</option>
                            <option value="other">⚠️ Otro</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Descripción *</label>
                        <textarea id="roadblock-description" rows="3" required placeholder="Ej: Corte total en Av. Corrientes entre Pueyrredón y Medrano"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Duración Estimada</label>
                        <select id="roadblock-duration">
                            <option value="">No especificado</option>
                            <option value="1">1 hora</option>
                            <option value="3">3 horas</option>
                            <option value="6">6 horas</option>
                            <option value="12">12 horas</option>
                            <option value="24">24 horas</option>
                        </select>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="submit" class="btn-primary" style="flex: 1;">
                            <i class="fas fa-paper-plane"></i> Reportar Corte
                        </button>
                        <button type="button" class="btn-cancel" onclick="VV.map.closeRoadblockReport()">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('roadblock-report-form').onsubmit = async (e) => {
            e.preventDefault();
            await VV.map.submitRoadblock();
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.map.closeRoadblockReport();
        };
    },
    
    // Enviar corte
    async submitRoadblock() {
        const reason = document.getElementById('roadblock-reason').value;
        const description = document.getElementById('roadblock-description').value;
        const duration = document.getElementById('roadblock-duration').value;
        
        let endTime = null;
        if (duration) {
            endTime = new Date();
            endTime.setHours(endTime.getHours() + parseInt(duration));
        }
        
        try {
            const { error } = await supabase
                .from('community_alerts')
                .insert({
                    type: 'roadblock',
                    subtype: reason,
                    title: document.querySelector(`#roadblock-reason option[value="${reason}"]`).textContent + ' - Corte de Calle',
                    description: description,
                    location: VV.data.user.current_location,
                    neighborhood: VV.data.user.current_neighborhood,
                    reported_by: VV.data.user.id,
                    active: true,
                    end_time: endTime?.toISOString()
                });
            
            if (error) throw error;
            
            VV.utils.showSuccess('Corte reportado correctamente');
            VV.map.closeRoadblockReport();
            await VV.map.loadRoadblocks();
            
        } catch (error) {
            console.error('Error reportando corte:', error);
            alert('Error al reportar el corte');
        }
    },
    
    closeRoadblockReport() {
        const overlay = document.getElementById('roadblock-report-overlay');
        if (overlay) overlay.classList.remove('active');
    }
};

// Agregar animación de pulso para alertas
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
    }
`;
document.head.appendChild(style);

console.log('✅ Módulo MAP cargado');
