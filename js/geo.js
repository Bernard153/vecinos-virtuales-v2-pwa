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
    
    // Detectar en qué barrio está el usuario usando API
    async detectNeighborhood() {
        try {
            const location = await VV.geo.getCurrentLocation();
            
            console.log('🔍 Detectando barrio para:', location);
            
            // MÉTODO 1: Usar API de Nominatim (OpenStreetMap) - MÁS PRECISO
            try {
                const neighborhood = await VV.geo.detectNeighborhoodFromAPI(location);
                if (neighborhood) {
                    console.log('✅ Barrio detectado por API:', neighborhood);
                    return {
                        neighborhood: neighborhood,
                        location: location,
                        method: 'api'
                    };
                }
            } catch (apiError) {
                console.warn('⚠️ API falló, usando método local:', apiError);
            }
            
            // MÉTODO 2: Buscar en barrios locales (fallback)
            for (const [name, data] of Object.entries(VV.geo.neighborhoods)) {
                if (VV.geo.isPointInPolygon(location.lat, location.lng, data.bounds)) {
                    console.log('✅ Barrio detectado localmente:', name);
                    return {
                        neighborhood: name,
                        location: location,
                        method: 'local'
                    };
                }
            }
            
            // MÉTODO 3: Buscar el más cercano
            const nearest = VV.geo.findNearestNeighborhood(location);
            console.log('⚠️ Usando barrio más cercano:', nearest);
            return {
                neighborhood: nearest,
                location: location,
                isNearby: true,
                method: 'nearest'
            };
            
        } catch (error) {
            console.error('❌ Error detectando barrio:', error);
            throw error;
        }
    },
    
    // Detectar barrio usando API de Nominatim (OpenStreetMap)
    async detectNeighborhoodFromAPI(location) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=16&addressdetails=1`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'VecinosVirtuales/1.0'
                }
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            console.log('📍 Respuesta API:', data);
            
            // Extraer barrio de la respuesta
            const address = data.address;
            
            // Prioridad de búsqueda:
            // 1. suburb (barrio)
            // 2. neighbourhood (vecindario)
            // 3. quarter (cuartel)
            // 4. city_district (distrito)
            const neighborhood = address.suburb || 
                               address.neighbourhood || 
                               address.quarter ||
                               address.city_district ||
                               address.village ||
                               address.town;
            
            if (neighborhood) {
                // Limpiar y formatear nombre
                return VV.geo.formatNeighborhoodName(neighborhood);
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Error en API de geolocalización:', error);
            throw error;
        }
    },
    
    // Formatear nombre de barrio (normalizado sin tildes)
    formatNeighborhoodName(name) {
    if (!name) return '';
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita tildes
        .replace(/[^a-zA-Z0-9\s]/g, '')  // quita caracteres raros
        .toUpperCase()
        .trim();
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
    
    // Activar geolocalización con modal de confirmación
    async activateGeo() {
        try {
            // Mostrar modal de carga
            VV.geo.showDetectionModal();
            
            const result = await VV.geo.detectNeighborhood();
            
            // Mostrar resultado y permitir confirmar o buscar manualmente
            VV.geo.showConfirmationModal(result);
            
        } catch (error) {
            console.error('Error activando geolocalización:', error);
            VV.geo.closeDetectionModal();
            alert('Error: ' + error.message + '\n\n¿Deseas buscar tu barrio manualmente?');
            VV.geo.showManualSearch();
        }
    },
    
    // Mostrar modal de detección
    showDetectionModal() {
        let overlay = document.getElementById('geo-detection-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'geo-detection-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 400px; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📍</div>
                <h3>Detectando tu ubicación...</h3>
                <p style="color: var(--gray-600); margin: 1rem 0;">
                    Estamos buscando tu barrio usando GPS
                </p>
                <div class="loading-spinner" style="margin: 2rem auto;">
                    <div style="border: 4px solid var(--gray-200); border-top: 4px solid var(--primary-blue); border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
    },
    
    // Mostrar modal de confirmación
    showConfirmationModal(result) {
        const overlay = document.getElementById('geo-detection-overlay');
        if (!overlay) return;
        
        const methodText = result.method === 'api' ? 'GPS preciso' : 
                          result.method === 'local' ? 'Base de datos local' :
                          'Barrio más cercano';
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 500px;">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="font-size: 4rem; margin-bottom: 0.5rem;">
                        ${result.isNearby ? '📍' : '✅'}
                    </div>
                    <h3>${result.isNearby ? '¿Es este tu barrio?' : 'Barrio detectado'}</h3>
                </div>
                
                <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 1.5rem; border-radius: 12px; text-align: center; margin-bottom: 1.5rem;">
                    <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">
                        ${result.neighborhood}
                    </div>
                    <div style="font-size: 0.9rem; opacity: 0.9;">
                        Detectado por: ${methodText}
                    </div>
                    ${result.isNearby ? '<div style="font-size: 0.85rem; opacity: 0.8; margin-top: 0.5rem;">⚠️ No estás exactamente en este barrio, pero es el más cercano</div>' : ''}
                </div>
                
                <div style="background: var(--gray-100); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <p style="margin: 0; font-size: 0.9rem; color: var(--gray-700);">
                        <strong>📍 Coordenadas:</strong><br>
                        Lat: ${result.location.lat.toFixed(6)}<br>
                        Lng: ${result.location.lng.toFixed(6)}<br>
                        Precisión: ${Math.round(result.location.accuracy)}m
                    </p>
                </div>
                
                <div style="display: flex; gap: 0.75rem; flex-direction: column;">
                    <button class="btn-primary" onclick="VV.geo.confirmNeighborhood('${result.neighborhood}', ${JSON.stringify(result.location).replace(/"/g, '&quot;')})" style="width: 100%; padding: 1rem; font-size: 1.1rem;">
                        <i class="fas fa-check-circle"></i> Sí, activar en ${result.neighborhood}
                    </button>
                    <button class="btn-secondary" onclick="VV.geo.showManualSearch()" style="width: 100%;">
                        <i class="fas fa-search"></i> Buscar otro barrio
                    </button>
                    <button class="btn-cancel" onclick="VV.geo.closeDetectionModal()" style="width: 100%;">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
    },
    
    // Confirmar barrio y activar
    async confirmNeighborhood(neighborhood, location) {
        try {
            // Actualizar usuario
            VV.data.user.isGeoActive = true;
            VV.data.user.currentNeighborhood = neighborhood;
            VV.data.user.currentLocation = location;
            
            // Guardar en Supabase
            await supabase
                .from('users')
                .update({
                    is_geo_active: true,
                    current_neighborhood: neighborhood,
                    current_location: location,
                    location_updated_at: new Date().toISOString()
                })
                .eq('id', VV.data.user.id);
            
            // Iniciar tracking
            VV.geo.startTracking();
            
            VV.geo.closeDetectionModal();
            VV.utils.showSuccess(`📍 Geolocalización activada en ${neighborhood}`);
            
            // Actualizar UI
            VV.geo.updateLocationUI();
            
            // Recargar productos del nuevo barrio
            if (typeof VV.marketplace !== 'undefined') {
                VV.marketplace.loadShopping();
            }
            
        } catch (error) {
            console.error('Error confirmando barrio:', error);
            alert('Error al activar geolocalización');
        }
    },
    
    // Cerrar modal
    closeDetectionModal() {
        const overlay = document.getElementById('geo-detection-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },
    
    // Mostrar búsqueda manual
    showManualSearch() {
        const overlay = document.getElementById('geo-detection-overlay');
        if (!overlay) return;
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 500px;">
                <h3><i class="fas fa-search"></i> Buscar tu barrio</h3>
                
                <div class="form-group">
                    <label>Escribe el nombre de tu barrio</label>
                    <input type="text" id="manual-neighborhood-search" placeholder="Ej: Palermo, Villa Crespo..." style="width: 100%; padding: 0.75rem; font-size: 1rem;">
                    <p style="font-size: 0.85rem; color: var(--gray-600); margin-top: 0.5rem;">
                        💡 Escribe al menos 3 letras para buscar
                    </p>
                </div>
                
                <div id="neighborhood-results" style="max-height: 300px; overflow-y: auto; margin: 1rem 0;"></div>
                
                <div style="background: #e0f2fe; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                    <p style="margin: 0; font-size: 0.9rem; color: #075985;">
                        <strong>¿No encuentras tu barrio?</strong><br>
                        Puedes crear uno nuevo y serás el primer vecino virtual de tu zona.
                    </p>
                </div>
                
                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn-secondary" onclick="VV.geo.showCreateNeighborhood()" style="flex: 1;">
                        <i class="fas fa-plus"></i> Crear barrio nuevo
                    </button>
                    <button class="btn-cancel" onclick="VV.geo.closeDetectionModal()" style="flex: 1;">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        // Agregar evento de búsqueda
        const searchInput = document.getElementById('manual-neighborhood-search');
        searchInput.focus();
        searchInput.oninput = () => VV.geo.searchNeighborhoods(searchInput.value);
    },
    
    // Buscar barrios
    async searchNeighborhoods(query) {
        const resultsDiv = document.getElementById('neighborhood-results');
        
        if (query.length < 3) {
            resultsDiv.innerHTML = '';
            return;
        }
        
        resultsDiv.innerHTML = '<p style="text-align: center; color: var(--gray-600);">Buscando...</p>';
        
        try {
            // Buscar en Nominatim
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=10`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'VecinosVirtuales/1.0'
                }
            });
            
            const data = await response.json();
            
            if (data.length === 0) {
                resultsDiv.innerHTML = '<p style="text-align: center; color: var(--gray-600);">No se encontraron resultados</p>';
                return;
            }
            
            // Filtrar solo barrios/ciudades
            const neighborhoods = data.filter(item => 
                item.address && (item.address.suburb || item.address.neighbourhood || item.address.city_district || item.address.city)
            );
            
            resultsDiv.innerHTML = neighborhoods.map(item => {
                const name = item.address.suburb || item.address.neighbourhood || item.address.city_district || item.address.city;
                const city = item.address.city || item.address.town || '';
                const state = item.address.state || '';
                
                return `
                    <div class="neighborhood-result" onclick="VV.geo.selectManualNeighborhood('${name}', ${item.lat}, ${item.lon})" style="padding: 1rem; border: 1px solid var(--gray-300); border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s;">
                        <div style="font-weight: bold; font-size: 1.1rem;">${name}</div>
                        <div style="font-size: 0.85rem; color: var(--gray-600);">${city}${state ? ', ' + state : ''}</div>
                    </div>
                `;
            }).join('');
            
            // Agregar hover effect
            document.querySelectorAll('.neighborhood-result').forEach(el => {
                el.onmouseenter = () => el.style.background = 'var(--gray-100)';
                el.onmouseleave = () => el.style.background = 'white';
            });
            
        } catch (error) {
            console.error('Error buscando barrios:', error);
            resultsDiv.innerHTML = '<p style="text-align: center; color: var(--error-red);">Error en la búsqueda</p>';
        }
    },
    
    // Seleccionar barrio manualmente
    async selectManualNeighborhood(name, lat, lng) {
        const location = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            accuracy: 0,
            timestamp: new Date().toISOString()
        };
        
        // Normalizar nombre antes de confirmar
        const normalizedName = VV.geo.formatNeighborhoodName(name);
        await VV.geo.confirmNeighborhood(normalizedName, location);
    },
    
    // Mostrar formulario para crear barrio nuevo
    showCreateNeighborhood() {
        const overlay = document.getElementById('geo-detection-overlay');
        if (!overlay) return;
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 500px;">
                <h3><i class="fas fa-plus-circle"></i> Crear barrio nuevo</h3>
                
                <form id="create-neighborhood-form" onsubmit="event.preventDefault(); VV.geo.submitNewNeighborhood();">
                    <div class="form-group">
                        <label>Nombre del barrio *</label>
                        <input type="text" id="new-neighborhood-name" required placeholder="Ej: Villa del Parque">
                    </div>
                    
                    <div class="form-group">
                        <label>Ciudad *</label>
                        <input type="text" id="new-neighborhood-city" required placeholder="Ej: Buenos Aires">
                    </div>
                    
                    <div class="form-group">
                        <label>Provincia/Estado</label>
                        <input type="text" id="new-neighborhood-state" placeholder="Ej: Buenos Aires">
                    </div>
                    
                    <div class="form-group">
                        <label>País *</label>
                        <input type="text" id="new-neighborhood-country" required placeholder="Ej: Argentina">
                    </div>
                    
                    <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                        <p style="margin: 0; font-size: 0.9rem; color: #92400e;">
                            <strong>📌 Importante:</strong><br>
                            Serás el primer vecino virtual de este barrio. Otros usuarios podrán unirse después.
                        </p>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.geo.showManualSearch()">Volver</button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-check"></i> Crear y activar
                        </button>
                    </div>
                </form>
            </div>
        `;
    },
    
    // Enviar nuevo barrio
    async submitNewNeighborhood() {
        const name = document.getElementById('new-neighborhood-name').value.trim();
        const city = document.getElementById('new-neighborhood-city').value.trim();
        const state = document.getElementById('new-neighborhood-state').value.trim();
        const country = document.getElementById('new-neighborhood-country').value.trim();
        
        if (!name || !city || !country) {
            alert('Por favor completa todos los campos obligatorios');
            return;
        }
        
        try {
            // Obtener ubicación actual
            const location = await VV.geo.getCurrentLocation();
            
            // Normalizar nombres (sin tildes, capitalizado)
            const normalizedName = VV.geo.formatNeighborhoodName(name);
            const normalizedCity = VV.geo.formatNeighborhoodName(city);
            
            // Crear nombre completo del barrio
            const fullName = `${normalizedName}, ${normalizedCity}`;
            
            // Confirmar y activar
            await VV.geo.confirmNeighborhood(fullName, location);
            
            VV.utils.showSuccess(`🎉 ¡Felicitaciones! Eres el primer vecino virtual de ${normalizedName}`);
            
        } catch (error) {
            console.error('Error creando barrio:', error);
            alert('Error al crear el barrio. Intenta nuevamente.');
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
    // Dentro de VV.auth.selectNeighborhood, reemplazá la lógica final por:
selectNeighborhood(neighborhood) {
    VV.data.neighborhood = neighborhood;
    
    const neighborhoodElement = document.getElementById('selected-neighborhood');
    if (neighborhoodElement) {
        neighborhoodElement.textContent = neighborhood;
    }
    
    // FLUJO NUEVO: Si viene del registro por celular, saltar directo
    if (VV.data.pendingRegistration) {
        delete VV.data.pendingRegistration;
        VV.authCelular.onNeighborhoodSelected(neighborhood);
        return;
    }
    
    // FLUJO VIEJO (compatibilidad para usuarios ya registrados)
    if (neighborhood === 'Administrador') {
        VV.utils.showScreen('login-screen');
    } else {
        VV.auth.showAuthOptions();
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
