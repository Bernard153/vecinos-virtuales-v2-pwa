// ============================================================
// MODULO REAL: ACCESO FLEXIBLE E INTEGRACIÓN DE BARRIO INVITADO
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
                console.log("👤 Vecino navegando en modo 'Invitado'. Sincronizando entorno...");
                
                // INYECTAMOS UN USUARIO SIMULADO PARA ENGAÑAR A TU CORE BASE
                if (!VV.data.user) {
                    VV.data.user = {
                        id: "anonimo-invitado-pwa",
                        name: "Vecino Invitado",
                        role: "vecino",
                        neighborhood: "Barrio San Martín", // 🌟 Tu barrio base de pruebas
                        home_neighborhood: "Barrio San Martín",
                        current_neighborhood: "Barrio San Martín"
                    };
                }
                
                // Forzamos la asignación del barrio global
                VV.data.neighborhood = "Barrio San Martín";

                // Le ordenamos a tu base de datos que descargue los productos y baches de este barrio
                if (typeof VV.data.loadFromSupabase === 'function') {
                    await VV.data.loadFromSupabase();
                }

                console.log("✅ Entorno de Invitado sincronizado con: Barrio San Martín");

            } else {
                console.log("🔑 Vecino autenticado detectado. ID:", session.user.id);
            }
        }
    } catch (err) {
        console.error("Fallo en el control de acceso flexible:", err.message);
    }
}

window.addEventListener('online', evaluarAccesoVecino);
window.addEventListener('offline', evaluarAccesoVecino);

document.addEventListener('DOMContentLoaded', evaluarAccesoVecino);

console.log('✅ Módulo ACCESO-FLEXIBLE integrado con motor de sincronización de barrios');
