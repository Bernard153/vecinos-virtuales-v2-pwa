// ========== INICIALIZACIÓN DE LA APLICACIÓN ==========

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Vecinos Virtuales V2 - Iniciando...');
    
    VV.utils.showScreen('loading-screen');
    
    // Pequeña pausa para que se vea el logo
    await new Promise(r => setTimeout(r, 800));
    
    // Verificar sesión existente
    const hasSession = await VV.auth.checkExistingUser();
    
    if (hasSession) {
        // Usuario logueado → dashboard directo
        console.log('👤 Sesión activa, iniciando app...');
        VV.auth.startApp();
        
        // ACTIVAR MÓDULO FOLLETO
        if (VV.utils.activarFolleto) {
            VV.utils.activarFolleto();
        }
        
        // Inicializar geolocalización
        await VV.geo.init();
        VV.geo.updateLocationUI();
        
    } else {
        // Usuario nuevo → landing vitrina
        console.log('👋 Nuevo usuario, mostrando landing...');
        VV.landing.init();
    }
    
    // Setup navegación del menú (siempre, para cuando esté en dashboard)
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

console.log('✅ Módulo APP cargado correctamente');
