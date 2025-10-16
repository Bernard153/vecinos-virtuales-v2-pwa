// ========== MÓDULO DE GEOLOCALIZACIÓN ==========

VV.geo = {
    // Definir límites de barrios (polígonos aproximados de Buenos Aires)
    neighborhoods: {
        "Palermo": {
            center: { lat: -34.5800, lng: -58.4200 },
            bounds: [
                { lat: -34.5600, lng: -58.4400 },
                { lat: -34.5600, lng: -58.4000 },
                { lat: -34.6000, lng: -58.4000 },
                { lat: -34.6000, lng: -58.4400 }
            ]
        },
        "Villa Crespo": {
            center: { lat: -34.5990, lng: -58.4380 },
            bounds: [
                { lat: -34.5900, lng: -58.4500 },
                { lat: -34.5900, lng: -58.4260 },
                { lat: -34.6080, lng: -58.4260 },
                { lat: -34.6080, lng: -58.4500 }
            ]
        },
        "Almagro": {
            center: { lat: -34.6050, lng: -58.4200 },
            bounds: [
                { lat: -34.5950, lng: -58.4350 },
                { lat: -34.5950, lng: -58.4050 },
                { lat: -34.6150, lng: -58.4050 },
                { lat: -34.6150, lng: -58.4350 }
            ]
        },
        "Caballito": {
            center: { lat: -34.6180, lng: -58.4380 },
            bounds: [
                { lat: -34.6080, lng: -58.4530 },
                { lat: -34.6080, lng: -58.4230 },
                { lat: -34.6280, lng: -58.4230 },
                { lat: -34.6280, lng: -58.4530 }
            ]
        },
        "Flores": {
            center: { lat: -34.6280, lng: -58.4650 },
            bounds: [
                { lat: -34.6180, lng: -58.4800 },
                { lat: -34.6180, lng: -58.4500 },
                { lat: -34.6380, lng: -58.4500 },
                { lat: -34.6380, lng: -58.4800 }
            ]
        },
        "Belgrano": {
            center: { lat: -34.5630, lng: -58.4580 },
            bounds: [
                { lat: -34.5530, lng: -58.4730 },
                { lat: -34.5530, lng: -58.4430 },
                { lat: -34.5730, lng: -58.4430 },
                { lat: -34.5730, lng: -58.4730 }
            ]
        }
    },
    
    trackingInterval: null,
    lastLocation: null,
    
    // Inicializar geolocalización
    async init() {
        console.log('🌍 Inicializando módulo de geolocalización...');
        
        // Verificar si el navegador soporta geolocalización
        if (!navigator.geolocation) {
            console.warn('⚠️ Geolocalización no soportada');
            return false;
        }
        
        // Verificar que el usuario esté cargado
        if (!VV.data.user) {
            console.warn('⚠️ Usuario no cargado aún');
            return false;
        }
        
        console.log('👤 Usuario:', VV.data.user.name);
        console.log('🏠 Barrio principal:', VV.data.user.neighborhood);
        console.log('📍 Geo activo:', VV.data.user.is_geo_active);
        
        // Cargar estado de geolocalización del usuario
        if (VV.data.user.is_geo_active) {
            console.log('🔄 Iniciando tracking automático...');
            await VV.geo.startTracking();
        }
        
        console.log('✅ Módulo geo inicializado');
        return true;
    },
    
    // Obtener ubicación actual
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    
                    VV.geo.lastLocation = location;
                    console.log('📍 Ubicación obtenida:', location);
                    resolve(location);
                },
                (error) => {
                    console.error('❌ Error obteniendo ubicación:', error);
                    let message = 'Error obteniendo ubicación';
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Permiso de ubicación denegado';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Ubicación no disponible';
                            break;
                        case error.TIMEOUT:
                            message = 'Tiempo de espera agotado';
                            break;
                    }
                    
                    reject(new Error(message));
                }
            );
        });
    },
    
    // Detectar en qué barrio está el usuario
    async detectNeighborhood() {
        try {
            const location = await VV.geo.getCurrentLocation();
            
            // Buscar en qué barrio está
            for (const [name, data] of Object.entries(VV.geo.neighborhoods)) {
                if (VV.geo.isPointInPolygon(location.lat, location.lng, data.bounds)) {
                    return {
                        neighborhood: name,
                        location: location
                    };
                }
            }
            
            // Si no está en ningún barrio registrado, buscar el más cercano
            const nearest = VV.geo.findNearestNeighborhood(location);
            return {
                neighborhood: nearest,
                location: location,
                isNearby: true
            };
            
        } catch (error) {
            console.error('Error detectando barrio:', error);
            throw error;
        }
    },
    
    // Verificar si un punto está dentro de un polígono (Ray Casting Algorithm)
    isPointInPolygon(lat, lng, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].lat, yi = polygon[i].lng;
            const xj = polygon[j].lat, yj = polygon[j].lng;
            
            const intersect = ((yi > lng) !== (yj > lng))
                && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    },
    
    // Encontrar el barrio más cercano
    findNearestNeighborhood(location) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const [name, data] of Object.entries(VV.geo.neighborhoods)) {
            const distance = VV.geo.calculateDistance(location, data.center);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = name;
            }
        }
        
        return nearest;
    },
    
    // Calcular distancia entre dos puntos (Haversine formula)
    calculateDistance(point1, point2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = VV.geo.toRad(point2.lat - point1.lat);
        const dLng = VV.geo.toRad(point2.lng - point1.lng);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(VV.geo.toRad(point1.lat)) * Math.cos(VV.geo.toRad(point2.lat)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return distance; // en km
    },
    
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    },
    
    // Formatear distancia para mostrar
    formatDistance(km) {
        if (km < 1) {
            return Math.round(km * 1000) + ' m';
        } else {
            return km.toFixed(1) + ' km';
        }
    },
    
    // Activar geolocalización
    async activateGeo() {
        try {
            const result = await VV.geo.detectNeighborhood();
            
            // Actualizar usuario
            VV.data.user.isGeoActive = true;
            VV.data.user.currentNeighborhood = result.neighborhood;
            VV.data.user.currentLocation = result.location;
            
            // Guardar en Supabase
            await supabase
                .from('users')
                .update({
                    is_geo_active: true,
                    current_neighborhood: result.neighborhood,
                    current_location: result.location,
                    location_updated_at: new Date().toISOString()
                })
                .eq('id', VV.data.user.id);
            
            // Iniciar tracking
            VV.geo.startTracking();
            
            VV.utils.showSuccess(`📍 Geolocalización activada en ${result.neighborhood}`);
            
            // Actualizar UI
            VV.geo.updateLocationUI();
            
            return result;
            
        } catch (error) {
            console.error('Error activando geolocalización:', error);
            alert('Error: ' + error.message);
            return null;
        }
    },
    
    // Desactivar geolocalización
    async deactivateGeo() {
        VV.data.user.isGeoActive = false;
        
        // Detener tracking
        if (VV.geo.trackingInterval) {
            clearInterval(VV.geo.trackingInterval);
            VV.geo.trackingInterval = null;
        }
        
        // Guardar en Supabase
        await supabase
            .from('users')
            .update({
                is_geo_active: false
            })
            .eq('id', VV.data.user.id);
        
        VV.utils.showSuccess('📍 Geolocalización desactivada');
        VV.geo.updateLocationUI();
    },
    
    // Iniciar tracking automático
    startTracking() {
        console.log('🔄 Iniciando tracking de ubicación...');
        
        // Actualizar cada 5 minutos
        VV.geo.trackingInterval = setInterval(async () => {
            if (VV.data.user.isGeoActive) {
                try {
                    const result = await VV.geo.detectNeighborhood();
                    
                    // Si cambió de barrio
                    if (result.neighborhood !== VV.data.user.currentNeighborhood) {
                        VV.geo.handleNeighborhoodChange(result);
                    } else {
                        // Solo actualizar ubicación
                        VV.data.user.currentLocation = result.location;
                        
                        await supabase
                            .from('users')
                            .update({
                                current_location: result.location,
                                location_updated_at: new Date().toISOString()
                            })
                            .eq('id', VV.data.user.id);
                    }
                } catch (error) {
                    console.error('Error en tracking:', error);
                }
            }
        }, 5 * 60 * 1000); // 5 minutos
    },
    
    // Manejar cambio de barrio
    async handleNeighborhoodChange(newLocation) {
        const oldNeighborhood = VV.data.user.currentNeighborhood;
        const newNeighborhood = newLocation.neighborhood;
        
        console.log(`🚶 Cambio de barrio detectado: ${oldNeighborhood} → ${newNeighborhood}`);
        
        // Preguntar al usuario
        const confirmed = confirm(
            `Detectamos que estás en ${newNeighborhood}.\n\n` +
            `¿Quieres cambiar tu ubicación activa?\n\n` +
            `• Tus productos se mostrarán en ${newNeighborhood}\n` +
            `• Podrás comprar/vender en este barrio`
        );
        
        if (confirmed) {
            VV.data.user.currentNeighborhood = newNeighborhood;
            VV.data.user.currentLocation = newLocation.location;
            
            // Actualizar en Supabase
            await supabase
                .from('users')
                .update({
                    current_neighborhood: newNeighborhood,
                    current_location: newLocation.location,
                    location_updated_at: new Date().toISOString()
                })
                .eq('id', VV.data.user.id);
            
            // Actualizar productos del usuario
            await VV.geo.updateUserProductsLocation(newNeighborhood, newLocation.location);
            
            VV.utils.showSuccess(`📍 Ahora estás en ${newNeighborhood}`);
            VV.geo.updateLocationUI();
            
            // Recargar marketplace si está visible
            if (VV.data.currentSection === 'marketplace') {
                VV.marketplace.load();
            }
        }
    },
    
    // Actualizar ubicación de productos del usuario
    async updateUserProductsLocation(neighborhood, location) {
        try {
            await supabase
                .from('products')
                .update({
                    neighborhood: neighborhood,
                    location: location,
                    location_updated_at: new Date().toISOString()
                })
                .eq('seller_id', VV.data.user.id)
                .eq('is_geolocated', true);
            
            console.log('✅ Productos actualizados a nuevo barrio');
        } catch (error) {
            console.error('Error actualizando productos:', error);
        }
    },
    
    // Actualizar UI de ubicación
    updateLocationUI() {
        const container = document.getElementById('geo-status');
        if (!container) {
            console.warn('⚠️ Contenedor geo-status no encontrado');
            return;
        }
        
        if (!VV.data.user) {
            console.warn('⚠️ Usuario no disponible para UI');
            return;
        }
        
        // Asegurar que tenemos los campos necesarios
        const homeNeighborhood = VV.data.user.home_neighborhood || VV.data.user.neighborhood;
        const currentNeighborhood = VV.data.user.current_neighborhood || VV.data.user.neighborhood;
        const isGeoActive = VV.data.user.is_geo_active || false;
        
        console.log('🎨 Actualizando UI:', { homeNeighborhood, currentNeighborhood, isGeoActive });
        
        if (isGeoActive) {
            const isVisiting = homeNeighborhood !== currentNeighborhood;
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.5rem 1rem; background: ${isVisiting ? 'var(--warning-orange)' : 'var(--success-green)'}; color: white; border-radius: 8px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${isVisiting ? 'Visitando' : 'En'}: <strong>${currentNeighborhood}</strong></span>
                        ${isVisiting ? 
                            `<span style="font-size: 0.85rem; opacity: 0.9;">(Tu barrio: ${homeNeighborhood})</span>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${isVisiting ? `
                            <button onclick="VV.geo.returnToHomeNeighborhood()" style="background: rgba(255,255,255,0.3); border: none; color: white; padding: 0.35rem 0.85rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                                <i class="fas fa-home"></i> Volver a ${homeNeighborhood}
                            </button>
                        ` : ''}
                        <button onclick="VV.geo.showNeighborhoodSelector()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                            <i class="fas fa-exchange-alt"></i> Cambiar
                        </button>
                        <button onclick="VV.geo.deactivateGeo()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            const isVisiting = homeNeighborhood !== currentNeighborhood;
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.5rem 1rem; background: ${isVisiting ? 'var(--warning-orange)' : 'var(--gray-200)'}; color: ${isVisiting ? 'white' : 'var(--gray-700)'}; border-radius: 8px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${isVisiting ? 'Visitando' : 'Barrio'}: <strong>${currentNeighborhood}</strong></span>
                        ${isVisiting ? 
                            `<span style="font-size: 0.85rem; opacity: 0.9;">(Tu barrio: ${homeNeighborhood})</span>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${isVisiting ? `
                            <button onclick="VV.geo.returnToHomeNeighborhood()" style="background: ${isVisiting ? 'rgba(255,255,255,0.3)' : 'var(--primary-blue)'}; border: none; color: white; padding: 0.35rem 0.85rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                                <i class="fas fa-home"></i> Volver a ${homeNeighborhood}
                            </button>
                        ` : ''}
                        <button onclick="VV.geo.activateGeo()" class="btn-primary" style="font-size: 0.85rem; padding: 0.35rem 0.85rem;">
                            <i class="fas fa-location-arrow"></i> Geolocalizar
                        </button>
                        <button onclick="VV.geo.showNeighborhoodSelector()" class="btn-secondary" style="font-size: 0.85rem; padding: 0.35rem 0.85rem;">
                            <i class="fas fa-map-pin"></i> Cambiar
                        </button>
                    </div>
                </div>
            `;
        }
    },
    
    // Mostrar selector de barrio
    showNeighborhoodSelector() {
        let overlay = document.getElementById('neighborhood-selector-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'neighborhood-selector-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        const neighborhoods = Object.keys(VV.geo.neighborhoods).sort();
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 500px;">
                <h3><i class="fas fa-map-marked-alt"></i> Seleccionar Barrio</h3>
                
                <div style="background: var(--info-blue); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <p style="margin: 0; font-size: 0.9rem;">
                        <i class="fas fa-info-circle"></i> 
                        Puedes usar geolocalización automática o seleccionar manualmente tu barrio.
                    </p>
                </div>
                
                <button onclick="VV.geo.activateGeo(); VV.geo.closeNeighborhoodSelector();" class="btn-primary" style="width: 100%; margin-bottom: 1rem;">
                    <i class="fas fa-location-arrow"></i> Usar Mi Ubicación Actual
                </button>
                
                <div style="text-align: center; margin: 1rem 0; color: var(--gray-600);">
                    <span>— o selecciona manualmente —</span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                    ${neighborhoods.map(n => `
                        <button onclick="VV.geo.selectNeighborhood('${n}')" class="btn-secondary" style="padding: 0.75rem;">
                            <i class="fas fa-map-pin"></i> ${n}
                        </button>
                    `).join('')}
                </div>
                
                <button onclick="VV.geo.closeNeighborhoodSelector()" class="btn-cancel" style="width: 100%; margin-top: 1rem;">
                    Cancelar
                </button>
            </div>
        `;
        
        overlay.classList.add('active');
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.geo.closeNeighborhoodSelector();
        };
    },
    
    // Seleccionar barrio manualmente
    async selectNeighborhood(neighborhood) {
        VV.data.user.currentNeighborhood = neighborhood;
        VV.data.user.isGeoActive = false;
        
        await supabase
            .from('users')
            .update({
                current_neighborhood: neighborhood,
                is_geo_active: false
            })
            .eq('id', VV.data.user.id);
        
        VV.utils.showSuccess(`📍 Barrio cambiado a ${neighborhood}`);
        VV.geo.closeNeighborhoodSelector();
        VV.geo.updateLocationUI();
        
        // Recargar contenido
        if (VV.data.currentSection === 'marketplace') {
            VV.marketplace.load();
        }
    },
    
    closeNeighborhoodSelector() {
        const overlay = document.getElementById('neighborhood-selector-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Volver al barrio principal
    async returnToHomeNeighborhood() {
        const homeNeighborhood = VV.data.user.home_neighborhood || VV.data.user.neighborhood;
        
        VV.data.user.current_neighborhood = homeNeighborhood;
        VV.data.user.is_geo_active = false;
        
        await supabase
            .from('users')
            .update({
                current_neighborhood: homeNeighborhood,
                is_geo_active: false
            })
            .eq('id', VV.data.user.id);
        
        VV.utils.showSuccess(`📍 De vuelta en ${homeNeighborhood}`);
        VV.geo.updateLocationUI();
        
        // Recargar contenido si está en alguna sección
        if (VV.data.currentSection === 'marketplace') {
            VV.marketplace.load();
        } else if (VV.data.currentSection === 'improvements') {
            VV.improvements.load();
        } else if (VV.data.currentSection === 'map-section') {
            VV.map.refreshMap();
        }
    }
};

console.log('✅ Módulo GEO cargado');
