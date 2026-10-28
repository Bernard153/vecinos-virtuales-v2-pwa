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
            
            // Cargar mensajes del admin
            if (typeof cargarMensajeAdmin === 'function') {
                cargarMensajeAdmin();
            }
            
            // ACTIVAR MÓDULO FOLLETO SOLO AQUÍ
            if (VV.utils.activarFolleto) {
                VV.utils.activarFolleto();
            }
            
            await VV.geo.init();
            VV.geo.updateLocationUI();
            // Anuncios flash — mostrar al iniciar sesión
            if (typeof VV.flash !== 'undefined') {
                VV.flash.init();
            }

            // Cargar tiers de usuarios (para ver atributos VIP)
            if (VV.avatars && VV.avatars.loadTierCache) {
                VV.avatars.loadTierCache();
            }

        } else {
            // VISITANTE: mostrar landing pública
            VV.utils.showScreen('landing-screen');
            if (typeof cargarLandingPublica === 'function') {
                cargarLandingPublica();
            }
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
// ===== ACCESO DIRECTO A ALERTA VIGÍA =====
// Detecta ?alerta=1 en la URL y dispara la alerta automáticamente
// después de que la app esté lista (con sesión o tras login)
(function() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('alerta') === '1') {
        sessionStorage.setItem('vigia_alerta_directa', '1');
    }

    // Envolver startApp para interceptar cuando la app está lista
    const startAppOriginal = VV.auth.startApp;
    VV.auth.startApp = async function() {
        await startAppOriginal.apply(this, arguments);
        if (sessionStorage.getItem('vigia_alerta_directa') === '1') {
            sessionStorage.removeItem('vigia_alerta_directa');
            // Pequeña espera para que los modales y alertas estén listos
            setTimeout(() => {
                if (VV.alertas && typeof VV.alertas.startAlert === 'function') {
                    VV.alertas.startAlert();
                }
            }, 500);
        }
    };
})();

console.log('✅ Módulo APP cargado correctamente');
