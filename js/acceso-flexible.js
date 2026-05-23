// ============================================================
// MODULO REAL: ACCESO FLEXIBLE CONFIGURADO PARA LOMAS DE TAFÍ
// ============================================================

const BARRIOS_RESPALDO_LOCAL = [
    { id: "1", nombre: "Lomas de Tafí", lat: -26.778, lng: -65.234 },
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
                
                // INYECTAMOS TU BARRIO REAL DE PRUEBAS CON INTERACCIONES
                if (!VV.data.user) {
                    VV.data.user = {
                        id: "anonimo-invitado-pwa",
                        name: "Vecino Invitado",
                        role: "vecino",
                        neighborhood: "Lomas de Tafí", // 🌟 Cambiado de forma óptima
                        home_neighborhood: "Lomas de Tafí",
                        current_neighborhood: "Lomas de Tafí"
                    };
                }
                
                // Sincronizamos el barrio global del sistema
                VV.data.neighborhood = "Lomas de Tafí";

                // Le ordenamos a tu base de datos que descargue los datos de Lomas de Tafí
                if (typeof VV.data.loadFromSupabase === 'function') {
                    await VV.data.loadFromSupabase();
                }

                console.log("✅ Entorno de Invitado sincronizado con: Lomas de Tafí");

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

console.log('✅ Módulo ACCESO-FLEXIBLE calibrado para Lomas de Tafí con éxito');
