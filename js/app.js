// ========== INICIALIZACIÓN DE LA APLICACIÓN ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V2 - Iniciando...');
    
    const termsAccepted = JSON.parse(localStorage.getItem('termsAccepted') || 'null');
    
    if (!termsAccepted || !termsAccepted.accepted) {
        console.log('⚠️ Términos no aceptados. Redirigiendo...');
        window.location.href = 'terminos.html';
        return;
    }
    
    VV.utils.showScreen('loading-screen');
    
    setTimeout(async () => {
        const hasSession = await VV.auth.checkExistingUser();
        if (hasSession) {
            // LOGIN EXITOSO
            VV.auth.startApp();
            
            // ACTIVAR MÓDULO FOLLETO SOLO AQUÍ
            if (VV.utils.activarFolleto) {
                VV.utils.activarFolleto();
            }
            
            await VV.geo.init();
            VV.geo.updateLocationUI();
        } else {
            VV.utils.showScreen('location-screen');
            VV.auth.requestGeolocation();
        }
    }, 1500);
    
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
// Mostrar onboarding para nuevos usuarios
if (window.VV_ONBOARDING && VV_ROLES && VV_ROLES.shouldShowOnboarding()) {
    VV_ONBOARDING.init();
}
console.log('✅ Módulo APP cargado correctamente');
