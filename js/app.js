// ============================================================
// CORE PRINCIPAL DE LA APP - INICIALIZACIÓN DE LA APLICACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V2 - Iniciando...');
    
    const termsAccepted = JSON.parse(localStorage.getItem('termsAccepted') || 'null');
    
    if (!termsAccepted || !termsAccepted.accepted) {
        console.log('⚠️ Términos no aceptados. Redirigiendo...');
        window.location.href = 'terminos.html';
        return;
    }
    
    if (typeof VV !== 'undefined' && VV.utils && typeof VV.utils.showScreen === 'function') {
        VV.utils.showScreen('loading-screen');
    }
    
    setTimeout(async () => {
        if (typeof VV !== 'undefined' && VV.auth && typeof VV.auth.checkExistingUser === 'function') {
            const hasSession = await VV.auth.checkExistingUser();
            
            if (hasSession) {
                // LOGIN EXITOSO - ARRANCAR APP TRADICIONAL
                VV.auth.startApp();
                
                // ACTIVAR MÓDULO FOLLETO SOLO AQUÍ
                if (VV.utils && typeof VV.utils.activarFolleto === 'function') {
                    VV.utils.activarFolleto();
                }
                
                if (VV.geo && typeof VV.geo.init === 'function') {
                    await VV.geo.init();
                    VV.geo.updateLocationUI();
                }

                // 🌟 ORDEN DE ENCENDIDO: Activamos el carrusel de avances superior en el inicio
                if (typeof VV.featured !== 'undefined' && typeof VV.featured.renderNovedadesCarrusel === 'function') {
                    VV.featured.renderNovedadesCarrusel();
                }
                
            } else {
                if (VV.utils && typeof VV.utils.showScreen === 'function') {
                    VV.utils.showScreen('location-screen');
                }
                if (VV.auth && typeof VV.auth.requestGeolocation === 'function') {
                    VV.auth.requestGeolocation();
                }
            }
        }
    }, 1500);
    
    // Setup navegación del menú
    document.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            e.preventDefault();
            const section = menuItem.dataset.section;
            if (section && typeof VV !== 'undefined' && VV.utils && typeof VV.utils.showSection === 'function') {
                VV.utils.showSection(section);
            }
        }
    });
});

console.log('✅ Módulo APP cargado correctamente con engranaje de innovaciones');
