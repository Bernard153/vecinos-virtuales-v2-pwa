// ============================================================
// MODULO REAL: ACCESO FLEXIBLE E INTELIGENCIA OFFLINE
// ============================================================

// 1. Lista de barrios preguardados en caso de emergencia sin internet
const BARRIOS_RESPALDO_LOCAL = [
    { id: "1", nombre: "Barrio San Martín", lat: -26.808, lng: -65.217 },
    { id: "2", nombre: "Barrio Centro", lat: -26.815, lng: -65.225 },
    { id: "3", nombre: "Barrio Las Acacias", lat: -26.801, lng: -65.210 }
];

async function evaluarAccesoVecino() {
    // CONTROL A: ¿El vecino está en la calle caminando y se quedó sin crédito o datos?
    if (!navigator.onLine) {
        console.log("⚠️ Modo Fuera de Línea Activo automáticamente.");
        
        // Ejecutamos el GPS nativo del teléfono
        navigator.geolocation.getCurrentPosition((position) => {
            const miLat = position.coords.latitude;
            const miLng = position.coords.longitude;
            
            // Aquí puedes lanzar visualmente un aviso a tu interfaz
            console.log(`GPS satelital offline capturado: Lat ${miLat}, Lng ${miLng}`);
            
            // Si tienes una lógica de inicio en js/app.js o js/geo.js, 
            // el sistema puede saltearse Supabase y renderizar los barrios locales.
            if (typeof inicializarAppOffline === 'function') {
                inicializarAppOffline(miLat, miLng, BARRIOS_RESPALDO_LOCAL);
            }
        }, (error) => {
            console.error("GPS offline no disponible.");
        });
        return; // Frenamos la carga online para que no tire errores de servidor
    }

    // CONTROL B: Si hay internet, verificamos el registro progresivo
    try {
        // Consultamos a tu cliente oficial de Supabase (inicializado previamente en js/supabase-config.js)
        if (typeof supabase !== 'undefined') {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // ¡Magia de la innovación! Si el vecino NO está registrado,
                // ya no lo bloqueamos ni lo mandamos a loguearse obligatoriamente.
                console.log("👤 Vecino navegando en modo 'Invitado'. Acceso concedido al muro.");
                
                // Forzamos a que tu geolocalización actual (que ya funciona bien en js/geo.js)
                // se ejecute para mostrarle las publicaciones de su zona de forma anónima.
                if (typeof activarGeolocalizacionInvitado === 'function') {
                    activarGeolocalizacionInvitado();
                }
            } else {
                console.log("🔑 Vecino autenticado detectado. ID:", session.user.id);
                // El flujo tradicional de tus archivos js/auth-supabase.js o js/app.js continúa normalmente
            }
        }
    } catch (err) {
        console.error("Fallo en el control de acceso flexible:", err.message);
    }
}

// Escuchamos si el teléfono pierde o recupera internet en tiempo real
window.addEventListener('online', verificarConexionInternet);
window.addEventListener('offline', verificarConexionInternet);

// Arrancamos el evaluador inteligente en cuanto la página index termina de cargarse
document.addEventListener('DOMContentLoaded', evaluarAccesoVecino);
