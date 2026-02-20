// ========== INICIALIZACIÓN DE LA APLICACIÓN (Versión Estable 2026) ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V2 - Iniciando...');
    
    // 1. Protección de inicialización: Asegurar que VV existe
    if (!window.VV) window.VV = {};
    if (!VV.utils) {
        console.error('❌ Error crítico: Core.js no cargó correctamente.');
        // Forzamos una recarga limpia si el motor base no responde
        if (!window.location.search.includes('retry')) window.location.href += '?retry=1';
        return;
    }

    // 2. Verificar aceptación de términos
    const termsAccepted = JSON.parse(localStorage.getItem('termsAccepted') || 'null');
    if (!termsAccepted || !termsAccepted.accepted) {
        console.log('⚠️ Términos no aceptados.');
        // Si no tienes terminos.html, comenta la línea de abajo para que no se bloquee
        // window.location.href = 'terminos.html'; 
        // return;
    }
    
    // 3. Mostrar pantalla de carga con seguridad
    if (VV.utils.showScreen) VV.utils.showScreen('loading-screen');
    
    setTimeout(async () => {
        try {
            const hasSession = await VV.auth.checkExistingUser();
            if (hasSession) {
                VV.auth.startApp();
                if (VV.geo) {
                    await VV.geo.init();
                    VV.geo.updateLocationUI();
                }
            } else {
                if (VV.utils.showScreen) VV.utils.showScreen('location-screen');
                if (VV.auth.requestGeolocation) VV.auth.requestGeolocation();
            }
            
            // 4. Cargar Destacados (Con el nuevo nombre de clase)
            if (VV.featured && VV.featured.loadFeaturedOffers) {
                console.log('✨ Cargando visor de destacados...');
                await VV.featured.loadFeaturedOffers();
                
                // Lógica de pausa unificada para .vv-cards-grid
                const track = document.querySelector('.vv-cards-grid');
                if (track) {
                    track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
                    track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
                }
            }
        } catch (err) {
            console.error('❌ Error durante el arranque:', err);
        }
    }, 1000);
    
    console.log('✅ Aplicación inicializada correctamente');

    // NAVEGACIÓN
    document.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            e.preventDefault();
            const section = menuItem.dataset.section;
            if (section && VV.utils.showSection) {
                VV.utils.showSection(section);
            }
        }
    });
});
