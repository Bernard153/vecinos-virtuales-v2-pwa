// ============================================================
// CORE PRINCIPAL DE LA APP - INICIALIZACIÓN DE LA APLICACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V2 - Iniciando...');
    
    // Leemos de forma segura la aceptación de términos
    const termsAcceptedRaw = localStorage.getItem('termsAccepted');
    let termsAccepted = null;
    
    try {
        if (termsAcceptedRaw) {
            termsAccepted = JSON.parse(termsAcceptedRaw);
        }
    } catch (e) {
        console.error('Error leyendo localStorage:', e);
    }
    
    if (!termsAccepted || !termsAccepted.accepted) {
        console.log('⚠️ Términos no aceptados. Redirigiendo...');
        window.location.href = 'terminos.html';
        return;
    }
    
    // Intentamos mostrar la pantalla de carga de forma segura
    if (typeof VV !== 'undefined' && VV.utils && typeof VV.utils.showScreen === 'function') {
        VV.utils.showScreen('loading-screen');
    }
    
    setTimeout(async () => {
        if (typeof VV !== 'undefined' && VV.auth && typeof VV.auth.checkExistingUser === 'function') {
            const hasSession = await VV.auth.checkExistingUser();
            
            if (hasSession) {
                // LOGIN EXITOSO - ARRANCAR APP
                VV.auth.startApp();
                
                // Activar módulos secundarios si existen
                if (VV.utils && typeof VV.utils.activarFolleto === 'function') {
                    VV.utils.activarFolleto();
                }
                
                if (VV.geo && typeof VV.geo.init === 'function') {
                    await VV.geo.init();
                    VV.geo.updateLocationUI();
                }

                // 🌟 ORDEN DE ENCENDIDO: Activamos el carrusel de avances superior
                if (typeof VV.featured !== 'undefined' && typeof VV.featured.renderNovedadesCarrusel === 'function') {
                    VV.featured.renderNovedadesCarrusel();
                }
                
            } else {
                // Si no hay sesión, mostramos la pantalla de ubicación tradicional
                if (VV.utils && typeof VV.utils.showScreen === 'function') {
                    VV.utils.showScreen('location-screen');
                }
                if (VV.auth && typeof VV.auth.requestGeolocation === 'function') {
                    VV.auth.requestGeolocation();
                }
            }
        }
    }, 1500);
    
    // Control de clics en el menú inferior
    document.addEventListener('click', function(e) {
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

console.log('✅ Módulo APP cargado correctamente y listo para innovaciones');
