// ========== INICIALIZACIÓN DE LA APLICACIÓN ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V2 - Iniciando...');
    
    // 1. Verificar términos
    const termsAccepted = JSON.parse(localStorage.getItem('termsAccepted') || 'null');
    if (!termsAccepted || !termsAccepted.accepted) {
        window.location.href = 'terminos.html';
        return;
    }
    
    // 2. Mostrar pantalla de carga
    VV.utils.showScreen('loading-screen');
    
    // 3. Lógica de inicio (Async)
    setTimeout(async () => {
        const hasSession = await VV.auth.checkExistingUser();
        
        if (hasSession) {
            VV.auth.startApp();
            await VV.geo.init();
            VV.geo.updateLocationUI();
        } else {
            VV.utils.showScreen('location-screen');
            VV.auth.requestGeolocation();
        }

        // 4. CARGA DEL VISOR (Momento ideal)
        // Solo lo llamamos aquí para asegurar que VV ya existe y la sesión está clara
        if (window.VV && VV.featured && typeof VV.featured.loadFeaturedOffers === 'function') {
            console.log('✨ Cargando visor de destacados...');
            await VV.featured.loadFeaturedOffers();
        }

    }, 1500);
    
    console.log('✅ Aplicación inicializada correctamente');
});
    
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

console.log('✅ Módulo APP cargado');
