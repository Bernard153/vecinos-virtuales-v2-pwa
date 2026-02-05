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
    
    async init() {
        if (!navigator.geolocation || !VV.data.user) return false;
        if (VV.data.user.is_geo_active) await VV.geo.startTracking();
        return true;
    },
    
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, timestamp: new Date().toISOString() };
                    VV.geo.lastLocation = location;
                    resolve(location);
                },
                (error) => reject(new Error('Error ubicación'))
            );
        });
    },
    
    async detectNeighborhood() {
        try {
            const location = await VV.geo.getCurrentLocation();
            const neighborhood = await VV.geo.detectNeighborhoodFromAPI(location);
            if (neighborhood) return { neighborhood, location, method: 'api' };
            
            for (const [name, data] of Object.entries(VV.geo.neighborhoods)) {
                if (VV.geo.isPointInPolygon(location.lat, location.lng, data.bounds)) {
                    return { neighborhood: name, location, method: 'local' };
                }
            }
            return { neighborhood: VV.geo.findNearestNeighborhood(location), location, isNearby: true, method: 'nearest' };
        } catch (error) { throw error; }
    },
    
    async detectNeighborhoodFromAPI(location) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=16&addressdetails=1`;
        try {
            const response = await fetch(url, { headers: { 'User-Agent': 'VecinosVirtuales/1.0' } });
            const data = await response.json();
            const address = data.address;
            const neighborhood = address.suburb || address.neighbourhood || address.quarter || address.city_district;
            return neighborhood ? VV.geo.formatNeighborhoodName(neighborhood) : null;
        } catch (error) { return null; }
    },
    
    formatNeighborhoodName(name) {
        return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ').trim();
    },
    
    isPointInPolygon(lat, lng, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].lat, yi = polygon[i].lng;
            const xj = polygon[j].lat, yj = polygon[j].lng;
            const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    },
    
    findNearestNeighborhood(location) {
        let nearest = null; let minDistance = Infinity;
        for (const [name, data] of Object.entries(VV.geo.neighborhoods)) {
            const distance = VV.geo.calculateDistance(location, data.center);
            if (distance < minDistance) { minDistance = distance; nearest = name; }
        }
        return nearest;
    },
    
    calculateDistance(point1, point2) {
        const R = 6371;
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLng = (point2.lng - point1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
    
    async activateGeo() {
        try {
            const result = await VV.geo.detectNeighborhood();
            await VV.geo.confirmNeighborhood(result.neighborhood, result.location);
        } catch (error) { VV.geo.manualLocation(); }
    },
    
    async confirmNeighborhood(neighborhood, location) {
        VV.data.user.current_neighborhood = neighborhood;
        VV.data.user.is_geo_active = true;
        await supabase.from('users').update({ current_neighborhood: neighborhood, is_geo_active: true, current_location: location }).eq('id', VV.data.user.id);
        VV.geo.updateLocationUI();
    },

    updateLocationUI() {
        const container = document.getElementById('geo-status');
        if (!container || !VV.data.user) return;
        const n = VV.data.user.current_neighborhood || VV.data.user.neighborhood;
        container.innerHTML = `<div style="padding:10px; background:#e0f2fe; border-radius:8px;">📍 Barrio actual: <strong>${n}</strong></div>`;
    }
};

console.log('✅ Módulo GEO original cargado');
