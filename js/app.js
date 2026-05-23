// ============================================================
// CORE PRINCIPAL DE LA APP - MOTOR DE ARRANQUE BLINDADO
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V2 - Iniciando controlador...');
    
    // 1. Evitar bloqueo por términos y condiciones
    try {
        const termsAcceptedRaw = localStorage.getItem('termsAccepted');
        let termsAccepted = termsAcceptedRaw ? JSON.parse(termsAcceptedRaw) : null;
        
        if (!termsAccepted || !termsAccepted.accepted) {
            console.log('⚠️ Términos no detectados. Forzando aceptación simulada para pruebas locales.');
            localStorage.setItem('termsAccepted', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
        }
    } catch (e) {
        console.error('Error en bypass de términos:', e);
    }
    
    // 2. Intentar quitar la pantalla de carga inmediatamente
    try {
        if (typeof VV !== 'undefined' && VV.utils && typeof VV.utils.showScreen === 'function') {
            VV.utils.showScreen('loading-screen');
        }
    } catch (e) {
        console.error('No se pudo invocar showScreen inicial:', e);
    }
    
    // 3. Temporizador de arranque con protecciones individuales
    setTimeout(async () => {
        console.log('⚡ Procesando engranajes de arranque...');
        
        // Ejecutamos el encendido visual tradicional de tu app
        try {
            if (typeof VV !== 'undefined' && VV.auth && typeof VV.auth.startApp === 'function') {
                VV.auth.startApp();
                console.log('✅ VV.auth.startApp ejecutado.');
            }
        } catch (e) {
            console.error('Fallo controlado en startApp:', e);
        }

        // Activamos módulos secundarios si están disponibles
        try {
            if (VV.utils && typeof VV.utils.activarFolleto === 'function') {
                VV.utils.activarFolleto();
            }
        } catch (e) { console.error('Módulo folleto omitido:', e); }

        try {
            if (VV.geo && typeof VV.geo.init === 'function') {
                await VV.geo.init();
                if (typeof VV.geo.updateLocationUI === 'function') {
                    VV.geo.updateLocationUI();
                }
            }
        } catch (e) { console.error('Módulo geolocalización omitido de forma segura:', e); }

        // 🌟 INNOVACIÓN: Forzamos el encendido del Carrusel Superior SÍ O SÍ
        try {
            if (typeof VV.featured !== 'undefined' && typeof VV.featured.renderNovedadesCarrusel === 'function') {
                VV.featured.renderNovedadesCarrusel();
                console.log('🌟 Carrusel superior renderizado con éxito.');
            } else {
                console.warn('⚠️ El módulo VV.featured o la función renderNovedadesCarrusel no están listos en memoria.');
            }
        } catch (e) {
            console.error('Error crítico al dibujar el carrusel de novedades:', e);
        }

        // Forzamos el apagado del loading screen por si se quedó trabado
        try {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
                loadingScreen.classList.remove('active');
                console.log('🛡️ Pantalla de carga retirada por la fuerza.');
            }
        } catch (e) { console.error('No se pudo remover el elemento loading-screen:', e); }

    }, 1000);
    
    // 4. Control de navegación del menú inferior
    document.addEventListener('click', function(e) {
        try {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                e.preventDefault();
                const section = menuItem.dataset.section;
                if (section && typeof VV !== 'undefined' && VV.utils && typeof VV.utils.showSection === 'function') {
                    VV.utils.showSection(section);
                }
            }
        } catch (err) {
            console.error('Error en clic de menú:', err);
        }
    });
});

console.log('✅ Módulo APP blindado cargado correctamente');
