// ============================================================
// CORE PRINCIPAL DE LA APP - ENRUTADOR RÁPIDO V6 ORIGINAL + KARAOKE
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

                // Analizamos la ruta actual para saber si mostrar el Dashboard o el Karaoke
                const rutaActual = window.location.hash;
                if (rutaActual === '#karaoke' || rutaActual === '#modulo-karaoke-container') {
                    ejecutarEnrutadoEspecial('#karaoke');
                } else {
                    ejecutarEnrutadoEspecial('#dashboard');
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
                if (href) {
                    if (href === '#karaoke' || href === 'karaoke') {
                        e.preventDefault();
                        ejecutarEnrutadoEspecial('#karaoke');
                    } else if (href === '#dashboard' || href === 'dashboard') {
                        e.preventDefault();
                        ejecutarEnrutadoEspecial('#dashboard');
                    }
                }
            }
        } catch (err) { console.error(err); }
    });
});

// Función auxiliar de enrutado para evitar colisiones con el Core V5
function ejecutarEnrutadoEspecial(destino) {
    try {
        const panelDashboard = document.getElementById('dashboard') || document.getElementById('panel-dashboard');
        const panelKaraoke = document.getElementById('modulo-karaoke-container');

        if (destino === '#karaoke') {
            if (panelDashboard) panelDashboard.style.display = 'none';
            if (panelKaraoke) panelKaraoke.style.setProperty('display', 'block', 'important');
            window.location.hash = '#karaoke';
            console.log("🎤 Pantalla cambiada a: Estudio Karaoke Pro");
        } else {
            if (panelKaraoke) panelKaraoke.style.display = 'none';
            
            // Dejamos que el Core V5 maneje el encendido oficial del dashboard
            if (window.VV && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                window.VV.utils.showSection('dashboard');
            } else if (typeof window.showSection === 'function') {
                window.showSection('dashboard');
            }
            window.location.hash = '#dashboard';
        }
    } catch (err) {
        console.error("Error en enrutado especial:", err);
    }
}

console.log('✅ Enrutador rápido V6 acoplado de forma óptima.');
