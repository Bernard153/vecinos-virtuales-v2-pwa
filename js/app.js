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
