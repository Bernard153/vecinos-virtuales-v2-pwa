// ============================================================
// CORE PRINCIPAL DE LA APP - ENRUTADOR RÁPIDO V6 ORIGINAL NATIVO
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V6 - Sincronizando enrutador con el Core...');
    
    // Bypass automático de términos
    try {
        localStorage.setItem('termsAccepted', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    } catch (e) { console.error(e); }
    
    // Ejecución inmediata sincronizada con Core V5
    setTimeout(async () => {
        let hasSession = false;
        
        try {
            if (window.VV && window.VV.auth && typeof window.VV.auth.checkExistingUser === 'function') {
                hasSession = await window.VV.auth.checkExistingUser();
            }
        } catch (errSession) { console.error(errSession); }
        
        try {
            if (hasSession) {
                console.log("👤 Usuario registrado detectado.");
                if (window.VV && window.VV.auth && typeof window.VV.auth.startApp === 'function') {
                    window.VV.auth.startApp();
                }
            } else {
                console.log("🚀 Modo Invitado Activo: Levantando telón de Lomas de Tafí.");
                
                // Fijamos el entorno geográfico
                if (!window.VV) window.VV = {};
                if (!window.VV.geo) window.VV.geo = {};
                window.VV.geo.currentBarrio = "Lomas de Tafí";

                // Evaluamos si el navegador solicita el nuevo espacio de entretenimiento
                if (window.location.hash === '#karaoke') {
                    conmutarVistasPro('#karaoke');
                } else {
                    // Forzamos al enrutador nativo del Core V5 a tomar el control visual
                    if (window.VV && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                        window.VV.utils.showSection('dashboard');
                    } else if (typeof window.showSection === 'function') {
                        window.showSection('dashboard');
                    }
                }
            }
        } catch (errRoute) {
            console.error('Error en el ruteo:', errRoute);
        }
    }, 300);

    // Control de navegación del menú inferior e interactivo
    document.addEventListener('click', function(e) {
        try {
            const menuItem = e.target.closest('.menu-item') || e.target.closest('a[href^="#"]');
            if (menuItem) {
                const href = menuItem.getAttribute('href') || menuItem.dataset.section;
                if (href === '#karaoke' || href === 'karaoke') {
                    e.preventDefault();
                    conmutarVistasPro('#karaoke');
                } else if (href === '#dashboard' || href === 'dashboard') {
                    e.preventDefault();
                    conmutarVistasPro('#dashboard');
                }
            }
        } catch (err) { console.error(err); }
    });
});

// Conmutador atómico de capas para compatibilidad total con Core V5
function conmutarVistasPro(destino) {
    try {
        const capaKaraoke = document.getElementById('modulo-karaoke-container');
        
        if (destino === '#karaoke') {
            // Ocultamos las secciones nativas usando el motor inyector del Core
            if (window.VV && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                window.VV.utils.showSection('');
            }
            // Ocultamos el main-app
            const mainApp = document.getElementById('main-app');
            if (mainApp) mainApp.style.setProperty('display', 'none', 'important');
            
            if (capaKaraoke) {
                capaKaraoke.style.setProperty('display', 'block', 'important');
            }
            window.location.hash = '#karaoke';
            console.log("🎤 Cambiado a: Estudio Karaoke Pro");
        } else {
            if (capaKaraoke) capaKaraoke.style.setProperty('display', 'none', 'important');
            const mainApp = document.getElementById('main-app');
            if (mainApp) mainApp.style.setProperty('display', 'flex', 'important');
            
            if (window.VV && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                window.VV.utils.showSection('dashboard');
            }
            window.location.hash = '#dashboard';
        }
    } catch (err) {
        console.error("Error en conmutador nativo:", err);
    }
}

console.log('✅ Enrutador rápido V6 acoplado de forma óptima.');

// ============================================================
// 🎙️ INICIALIZACIÓN DE YOUTUBE API
// ============================================================

function onYouTubeIframeAPIReady() {
    console.log('✅ YouTube API lista');
    if (document.getElementById('youtube-player')) {
        window.player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: '',
            playerVars: {
                'autoplay': 0,
                'controls': 1,
                'modestbranding': 1,
                'rel': 0
            }
        });
    }
}
