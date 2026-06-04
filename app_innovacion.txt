// ============================================================
// CORE PRINCIPAL DE LA APP - ENRUTADOR RÁPIDO V6 BYPASS
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V6 - Inicializando...');
    
    // Bypass automático de términos
    try {
        localStorage.setItem('termsAccepted', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    } catch (e) { console.error(e); }
    
    // BYPASS DIRECTO - Saltar loading infinito
    setTimeout(() => {
        console.log("✅ Bypass activado - Mostrando dashboard...");
        
        // Inicializar VV si no existe
        if (!window.VV) window.VV = {};
        if (!window.VV.geo) window.VV.geo = {};
        window.VV.geo.currentBarrio = "Lomas de Tafí";
        
        // Ocultar pantalla de carga
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) loadingScreen.style.display = 'none';
        
        // Mostrar app principal
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.display = 'flex';
            mainApp.classList.add('active');
        }
        
        // Si hay hash #karaoke, mostrar karaoke
        if (window.location.hash === '#karaoke') {
            conmutarVistasPro('#karaoke');
        } else {
            // Mostrar dashboard
            const dashboard = document.getElementById('dashboard');
            if (dashboard) dashboard.classList.add('active');
        }
        
        console.log("✅ Dashboard listo");
    }, 800);

    // Control de navegación del menú
    document.addEventListener('click', function(e) {
        try {
            const menuItem = e.target.closest('.menu-item') || e.target.closest('a[href^="#"]');
            if (menuItem) {
                const href = menuItem.getAttribute('href') || menuItem.dataset.section;
                
                // Manejo de Karaoke
                if (href === '#karaoke' || href === 'karaoke') {
                    e.preventDefault();
                    conmutarVistasPro('#karaoke');
                    return;
                }
                
                // Manejo de Dashboard
                if (href === '#dashboard' || href === 'dashboard' || href === 'dashboard') {
                    e.preventDefault();
                    conmutarVistasPro('#dashboard');
                    return;
                }
                
                // Otras secciones
                if (href) {
                    e.preventDefault();
                    mostrarSeccion(href);
                }
            }
        } catch (err) { console.error(err); }
    });
});

// Conmutador de vistas - Karaoke vs Dashboard
function conmutarVistasPro(destino) {
    try {
        const capaKaraoke = document.getElementById('modulo-karaoke-container');
        const mainApp = document.getElementById('main-app');
        const loadingScreen = document.getElementById('loading-screen');
        
        // Ocultar loading
        if (loadingScreen) loadingScreen.style.display = 'none';
        
        if (destino === '#karaoke') {
            // Mostrar Karaoke
            if (capaKaraoke) {
                capaKaraoke.style.setProperty('display', 'block', 'important');
                capaKaraoke.classList.add('active');
            }
            if (mainApp) mainApp.style.setProperty('display', 'none', 'important');
            
            window.location.hash = '#karaoke';
            console.log("🎤 Karaoke activado");
            
            // Inicializar Karaoke si existe
            if (window.VV_KARAOKE && typeof window.VV_KARAOKE.init === 'function') {
                setTimeout(() => VV_KARAOKE.init(), 100);
            }
        } else {
            // Mostrar Dashboard
            if (capaKaraoke) {
                capaKaraoke.style.setProperty('display', 'none', 'important');
                capaKaraoke.classList.remove('active');
            }
            if (mainApp) {
                mainApp.style.setProperty('display', 'flex', 'important');
                mainApp.classList.add('active');
            }
            
            // Mostrar sección
            const secciones = document.querySelectorAll('.content-section');
            secciones.forEach(s => s.classList.remove('active'));
            
            const dashboard = document.getElementById('dashboard');
            if (dashboard) dashboard.classList.add('active');
            
            window.location.hash = '#dashboard';
            console.log("📊 Dashboard activado");
        }
    } catch (err) {
        console.error("Error en conmutador:", err);
    }
}

// Mostrar sección específica
function mostrarSeccion(seccion) {
    try {
        // Limpiar hash
        seccion = seccion.replace('#', '').replace('data-section=', '');
        
        // Ocultar todas las secciones
        const secciones = document.querySelectorAll('.content-section');
        secciones.forEach(s => s.classList.remove('active'));
        
        // Mostrar sección específica
        const target = document.getElementById(seccion);
        if (target) {
            target.classList.add('active');
            console.log(`📄 Sección ${seccion} activada`);
        }
    } catch (err) {
        console.error('Error al mostrar sección:', err);
    }
}

console.log('✅ Enrutador V6 cargado - Listo para Karaoke');

// ============================================================
// 🎙️ INICIALIZACIÓN DE YOUTUBE API
// ============================================================

function onYouTubeIframeAPIReady() {
    console.log('✅ YouTube API lista');
    if (document.getElementById('youtube-player')) {
        try {
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
            console.log('✅ YouTube Player inicializado');
        } catch (err) {
            console.error('Error inicializando YouTube Player:', err);
        }
    }
}
