// ========== INICIALIZACIÓN DE LA APLICACIÓN ==========

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Vecinos Virtuales V2 - Iniciando...');
    
    // ===== ACCESO ADMIN DIRECTO =====
    if (window.location.hash === '#admin-login') {
        VV.utils.showScreen('login-screen');
        return;
    }
    
    VV.utils.showScreen('loading-screen');
    await new Promise(r => setTimeout(r, 800));
    
    const hasSession = await VV.auth.checkExistingUser();
    
    if (hasSession) {
        console.log('👤 Sesión activa, iniciando app...');
        VV.auth.startApp();
        if (VV.utils.activarFolleto) VV.utils.activarFolleto();
        await VV.geo.init();
        VV.geo.updateLocationUI();
    } else {
        console.log('👋 Nuevo usuario, mostrando landing...');
        VV.landing.init();
    }
    
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

console.log('✅ Módulo APP cargado correctamente');
