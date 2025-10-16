// ========== MÓDULO DE MAPA INTERACTIVO ==========

VV.map = {
    mapInstance: null,
    layers: {
        commerce: null,      // Comercios y Vendedores
        emergency: null,     // Emergencias y Servicios
        security: null,      // Inseguridad (reportes)
        events: null,        // Cortes y Eventos
        transport: null      // Transporte público
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
        
        // Crear mapa con opciones para móvil
        VV.map.mapInstance = L.map('map-container', {
            zoomControl: true,
            touchZoom: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            tap: true,
            tapTolerance: 15
        }).setView([userLocation.lat, userLocation.lng], 15);
        
        // Agregar capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(VV.map.mapInstance);
        
        // Crear grupos de capas (activadas por defecto las primeras 4)
        VV.map.layers.commerce = L.layerGroup().addTo(VV.map.mapInstance);
        VV.map.layers.emergency = L.layerGroup().addTo(VV.map.mapInstance);
        VV.map.layers.security = L.layerGroup().addTo(VV.map.mapInstance);
        VV.map.layers.events = L.layerGroup().addTo(VV.map.mapInstance);
        VV.map.layers.transport = L.layerGroup(); // Desactivada por defecto
        
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
            VV.map.loadCommerce(),
            VV.map.loadEmergency(),
            VV.map.loadSecurity(),
            VV.map.loadEvents(),
            VV.map.loadTransport()
        ]);
    },
    
    // CAPA 1: Comercios y Vendedores (productos + anunciantes)
    async loadCommerce() {
        VV.map.layers.commerce.clearLayers();
        
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
            
            let distance = 0;
            try {
                distance = VV.geo.calculateDistance(
                    VV.data.user.current_location || VV.geo.neighborhoods[VV.data.user.current_neighborhood]?.center || { lat: 0, lng: 0 },
                    product.location
                );
            } catch (e) {
                console.warn('Error calculando distancia:', e);
            }
            
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
            
            marker.addTo(VV.map.layers.commerce);
        });
        
        console.log(`✅ ${products?.length || 0} comercios cargados`);
    },
    
    // CAPA 2: Emergencias y Servicios (teléfonos de emergencia + servicios profesionales)
    async loadEmergency() {
        VV.map.layers.emergency.clearLayers();
        
        // Puntos de emergencia predefinidos por barrio
        const emergencyPoints = {
            "Lomas de Tafí": [
                { lat: -26.8241, lng: -65.2226, name: "Comisaría Lomas", type: "police", phone: "911", description: "Comisaría del barrio" },
                { lat: -26.8250, lng: -65.2200, name: "Hospital Lomas", type: "hospital", phone: "107", description: "Centro de salud" }
            ],
            "Belgrano": [
                { lat: -34.5600, lng: -58.4500, name: "Comisaría 13", type: "police", phone: "911", description: "Av. Cabildo 1234" },
                { lat: -34.5650, lng: -58.4450, name: "Hospital Pirovano", type: "hospital", phone: "107", description: "Monroe 3555" }
            ],
            "Palermo": [
                { lat: -34.5800, lng: -58.4200, name: "Comisaría 14", type: "police", phone: "911", description: "Av. Santa Fe 4321" },
                { lat: -34.5850, lng: -58.4150, name: "Hospital Fernández", type: "hospital", phone: "107", description: "Cerviño 3356" }
            ]
        };
        
        // Agregar puntos de emergencia del barrio actual
        const currentEmergency = emergencyPoints[VV.data.user.current_neighborhood] || [];
        currentEmergency.forEach(point => {
            const icons = {
                police: '🚔',
                hospital: '🏥',
                fire: '🚒'
            };
            
            const marker = L.marker([point.lat, point.lng], {
                icon: L.divIcon({
                    className: 'emergency-marker',
                    html: '<div style="background: #ef4444; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
                    iconSize: [18, 18]
                })
            });
            
            marker.bindPopup(`
                <div style="min-width: 220px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #ef4444;">${icons[point.type]} ${point.name}</h4>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem;">${point.description}</p>
                    <p style="margin: 0.5rem 0; font-size: 1rem; font-weight: 600; color: #ef4444;">
                        <i class="fas fa-phone"></i> ${point.phone}
                    </p>
                </div>
            `);
            
            marker.addTo(VV.map.layers.emergency);
        });
        
        // Obtener servicios profesionales del barrio actual
        const services = VV.data.services.filter(s => 
            s.neighborhood === VV.data.user.current_neighborhood && s.location
        );
        
        services.forEach(service => {
            const marker = L.marker([service.location.lat, service.location.lng], {
                icon: L.divIcon({
                    className: 'emergency-marker',
                    html: '<div style="background: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [16, 16]
                })
            });
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #ef4444;">🚨 ${service.title}</h4>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem;">${service.description}</p>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--gray-600);">
                        <i class="fas fa-user"></i> ${service.provider}
                    </p>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--gray-600);">
                        <i class="fas fa-phone"></i> ${service.contact}
                    </p>
                </div>
            `);
            
            marker.addTo(VV.map.layers.emergency);
        });
        
        console.log(`✅ ${currentEmergency.length + services.length} puntos de emergencia cargados`);
    },
    
    // CAPA 3: Inseguridad (reportes vecinales de las últimas 48 horas)
    async loadSecurity() {
        VV.map.layers.security.clearLayers();
        
        // Obtener alertas de las últimas 48 horas
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        const { data: alerts, error } = await supabase
            .from('community_alerts')
            .select('*')
            .eq('neighborhood', VV.data.user.current_neighborhood)
            .eq('type', 'security')
            .gte('created_at', twoDaysAgo.toISOString())
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error cargando alertas:', error);
            return;
        }
        
        alerts?.forEach(alert => {
            if (!alert.location) return;
            
            const marker = L.marker([alert.location.lat, alert.location.lng], {
                icon: L.divIcon({
                    className: 'security-marker',
                    html: '<div style="background: #f59e0b; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>',
                    iconSize: [16, 16]
                })
            });
            
            const timeAgo = VV.utils.timeAgo(alert.created_at);
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #f59e0b;">⚠️ ${alert.title}</h4>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem;">${alert.description}</p>
                    <p style="margin: 0.5rem 0; font-size: 0.75rem; color: var(--gray-600);">
                        <i class="fas fa-clock"></i> Hace ${timeAgo}
                    </p>
                    <p style="margin: 0; font-size: 0.75rem; color: var(--gray-500); font-style: italic;">
                        Reportado por vecinos
                    </p>
                </div>
            `);
            
            marker.addTo(VV.map.layers.security);
        });
        
        console.log(`✅ ${alerts?.length || 0} reportes de inseguridad cargados`);
    },
    
    // CAPA 4: Cortes y Eventos (cortes de calle + eventos comunitarios)
    async loadEvents() {
        VV.map.layers.events.clearLayers();
        
        // Obtener cortes activos y eventos
        const { data: items, error } = await supabase
            .from('community_alerts')
            .select('*')
            .eq('neighborhood', VV.data.user.current_neighborhood)
            .in('type', ['roadblock', 'event'])
            .eq('active', true)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error cargando cortes:', error);
            return;
        }
        
        items?.forEach(item => {
            if (!item.location) return;
            
            const isEvent = item.type === 'event';
            const color = isEvent ? '#8b5cf6' : '#f59e0b';
            const icon = isEvent ? '🎉' : '🚧';
            
            const marker = L.marker([item.location.lat, item.location.lng], {
                icon: L.divIcon({
                    className: 'event-marker',
                    html: `<div style="background: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [16, 16]
                })
            });
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: ${color};">${icon} ${item.title}</h4>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem;">${item.description}</p>
                    ${item.end_time ? `
                        <p style="margin: 0.5rem 0; font-size: 0.75rem; color: var(--gray-600);">
                            <i class="fas fa-clock"></i> ${isEvent ? 'Fecha:' : 'Hasta:'} ${new Date(item.end_time).toLocaleString('es-AR')}
                        </p>
                    ` : ''}
                </div>
            `);
            
            marker.addTo(VV.map.layers.events);
        });
        
        console.log(`✅ ${items?.length || 0} cortes y eventos cargados`);
    },
    
    // CAPA 5: Transporte Público (paradas de bus, taxis, remises)
    async loadTransport() {
        VV.map.layers.transport.clearLayers();
        
        // Puntos de transporte predefinidos por barrio
        const transportPoints = {
            "Lomas de Tafí": [
                { lat: -26.8241, lng: -65.2226, name: "Parada Principal", type: "bus", description: "Av. Principal y Ruta 9", lines: ["101", "102"] },
                { lat: -26.8250, lng: -65.2200, name: "Remisería Lomas", type: "taxi", description: "Servicio 24hs", phone: "381-4567890" }
            ],
            "Belgrano": [
                { lat: -34.5600, lng: -58.4500, name: "Parada Cabildo", type: "bus", description: "Av. Cabildo y Juramento", lines: ["60", "152", "194"] },
                { lat: -34.5620, lng: -58.4480, name: "Estación Belgrano C", type: "train", description: "Línea Mitre", lines: ["Mitre"] },
                { lat: -34.5650, lng: -58.4450, name: "Radio Taxi Belgrano", type: "taxi", description: "Servicio 24hs", phone: "4788-8888" }
            ],
            "Palermo": [
                { lat: -34.5800, lng: -58.4200, name: "Parada Santa Fe", type: "bus", description: "Av. Santa Fe y Pueyrredón", lines: ["39", "152", "111"] },
                { lat: -34.5850, lng: -58.4150, name: "Estación Palermo", type: "train", description: "Línea San Martín", lines: ["San Martín"] },
                { lat: -34.5820, lng: -58.4180, name: "Remisería Palermo", type: "taxi", description: "Servicio 24hs", phone: "4777-7777" }
            ]
        };
        
        // Agregar puntos de transporte del barrio actual
        const currentTransport = transportPoints[VV.data.user.current_neighborhood] || [];
        
        currentTransport.forEach(point => {
            const icons = {
                bus: '🚌',
                train: '🚆',
                taxi: '🚕'
            };
            
            const marker = L.marker([point.lat, point.lng], {
                icon: L.divIcon({
                    className: 'transport-marker',
                    html: '<div style="background: #06b6d4; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [16, 16]
                })
            });
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #06b6d4;">${icons[point.type]} ${point.name}</h4>
                    <p style="margin: 0.25rem 0; font-size: 0.85rem;">${point.description}</p>
                    ${point.lines ? `
                        <p style="margin: 0.5rem 0; font-size: 0.85rem; color: var(--gray-600);">
                            <i class="fas fa-route"></i> Líneas: ${point.lines.join(', ')}
                        </p>
                    ` : ''}
                    ${point.phone ? `
                        <p style="margin: 0.5rem 0; font-size: 0.85rem; color: var(--gray-600);">
                            <i class="fas fa-phone"></i> ${point.phone}
                        </p>
                    ` : ''}
                </div>
            `);
            
            marker.addTo(VV.map.layers.transport);
        });
        
        console.log(`✅ ${currentTransport.length} puntos de transporte cargados`);
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
    
    // Reportar inseguridad
    reportSecurity() {
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
                <h3><i class="fas fa-exclamation-triangle"></i> Reportar Inseguridad</h3>
                
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
            
            VV.utils.showSuccess('Reporte de inseguridad enviado');
            VV.map.closeAlertReport();
            await VV.map.loadSecurity();
            
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
            await VV.map.loadEvents();
            
        } catch (error) {
            console.error('Error reportando corte:', error);
            alert('Error al reportar el corte');
        }
    },
    
    closeRoadblockReport() {
        const overlay = document.getElementById('roadblock-report-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Reportar evento comunitario
    reportEvent() {
        if (!VV.data.user.current_location) {
            alert('Activa la geolocalización para publicar eventos');
            return;
        }
        
        let overlay = document.getElementById('event-report-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'event-report-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 500px;">
                <h3><i class="fas fa-calendar"></i> Publicar Evento Comunitario</h3>
                
                <form id="event-report-form">
                    <div class="form-group">
                        <label>Nombre del Evento *</label>
                        <input type="text" id="event-title" required placeholder="Ej: Feria del Barrio">
                    </div>
                    
                    <div class="form-group">
                        <label>Descripción *</label>
                        <textarea id="event-description" rows="3" required placeholder="Describe el evento..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Fecha y Hora</label>
                        <input type="datetime-local" id="event-datetime">
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="submit" class="btn-primary" style="flex: 1;">
                            <i class="fas fa-paper-plane"></i> Publicar Evento
                        </button>
                        <button type="button" class="btn-cancel" onclick="VV.map.closeEventReport()">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('event-report-form').onsubmit = async (e) => {
            e.preventDefault();
            await VV.map.submitEvent();
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.map.closeEventReport();
        };
    },
    
    // Enviar evento
    async submitEvent() {
        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').value;
        const datetime = document.getElementById('event-datetime').value;
        
        try {
            const { error } = await supabase
                .from('community_alerts')
                .insert({
                    type: 'event',
                    subtype: 'community',
                    title: title,
                    description: description,
                    location: VV.data.user.current_location,
                    neighborhood: VV.data.user.current_neighborhood,
                    reported_by: VV.data.user.id,
                    active: true,
                    end_time: datetime ? new Date(datetime).toISOString() : null
                });
            
            if (error) throw error;
            
            VV.utils.showSuccess('Evento publicado correctamente');
            VV.map.closeEventReport();
            await VV.map.loadEvents();
            
        } catch (error) {
            console.error('Error publicando evento:', error);
            alert('Error al publicar el evento');
        }
    },
    
    closeEventReport() {
        const overlay = document.getElementById('event-report-overlay');
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
