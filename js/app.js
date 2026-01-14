// ========== INICIALIZACIÓN DE LA APLICACIÓN ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V2 - Iniciando...');
    
    // Verificar aceptación de términos y condiciones
    const termsAccepted = JSON.parse(localStorage.getItem('termsAccepted') || 'null');
    
    if (!termsAccepted || !termsAccepted.accepted) {
        // Redirigir a página de términos
        console.log('⚠️ Términos no aceptados. Redirigiendo...');
        window.location.href = 'terminos.html';
        return;
    }
    
    // Mostrar pantalla de carga
    VV.utils.showScreen('loading-screen');
    
    // Verificar usuario existente (async con Supabase)
    setTimeout(async () => {
        const hasSession = await VV.auth.checkExistingUser();
        if (hasSession) {
            // Usuario ya registrado
            VV.auth.startApp();
            // Inicializar geolocalización
            await VV.geo.init();
            VV.geo.updateLocationUI();
        } else {
            // Nuevo usuario
            VV.utils.showScreen('location-screen');
            VV.auth.requestGeolocation();
        }
        // Cargamos el visor de destacados al iniciar la app
            if (window.VV && VV.featured) {
                console.log('✨ Cargando visor de destacados...');
                await VV.featured.loadFeaturedOffers();

                // --- BLOQUE PARA DETENER EL CARRUSEL ---
                // Importante: Reemplaza '.featured-container' por la clase real de tu carrusel
                const featuredContainer = document.querySelector('.featured-container'); 
                
                if (featuredContainer) {
                    featuredContainer.addEventListener('mousedown', () => {
                        // Probamos las funciones de pausa más comunes en objetos de este tipo
                        if (typeof VV.featured.stop === 'function') {
                            VV.featured.stop();
                        } else if (typeof VV.featured.pause === 'function') {
                            VV.featured.pause();
                        }
                        console.log('⏸️ Carrusel pausado por el usuario');
                    });
                }
                // ----------------------------------------
            }
    }, 1500);
    
    console.log('✅ Aplicación inicializada correctamente');
    
    // Setup navegación del menú
    document.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            e.preventDefault();
            const section = menuItem.dataset.section;
            if (section) {
                VV.utils.showSection(section);
            }
        }
    });
});

console.log('✅ Módulo APP cargado');
