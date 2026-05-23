// ============================================================
// MODULO REAL REPARADO: ACCESO FLEXIBLE E INTELIGENCIA OFFLINE
// ============================================================

const BARRIOS_RESPALDO_LOCAL = [
    { id: "1", nombre: "Barrio San Martín", lat: -26.808, lng: -65.217 },
    { id: "2", nombre: "Barrio Centro", lat: -26.815, lng: -65.225 },
    { id: "3", nombre: "Barrio Las Acacias", lat: -26.801, lng: -65.210 }
];

async function evaluarAccesoVecino() {
    if (!navigator.onLine) {
        console.log("⚠️ Modo Fuera de Línea Activo de manera automática.");
        if (typeof navigator.geolocation !== 'undefined') {
            navigator.geolocation.getCurrentPosition(function(position) {
                const miLat = position.coords.latitude;
                const miLng = position.coords.longitude;
                if (typeof inicializarAppOffline === 'function') {
                    inicializarAppOffline(miLat, miLng, BARRIOS_RESPALDO_LOCAL);
                }
            });
        }
        return;
    }

    try {
        if (typeof supabase !== 'undefined') {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.log("👤 Vecino navegando en modo 'Invitado'. Acceso concedido.");
                if (typeof activarGeolocalizacionInvitado === 'function') {
                    activarGeolocalizacionInvitado();
                }
            } else {
                console.log("🔑 Vecino autenticado detectado. ID:", session.user.id);
            }
        }
    } catch (err) {
        console.error("Fallo en el control de acceso flexible:", err.message);
    }
}

// Escuchadores apuntando correctamente a la función del sistema
window.addEventListener('online', evaluarAccesoVecino);
window.addEventListener('offline', evaluarAccesoVecino);

document.addEventListener('DOMContentLoaded', evaluarAccesoVecino);

console.log('✅ Módulo ACCESO-FLEXIBLE cargado de manera óptima sin errores de cierre');
