// ============================================================
// CORE PRINCIPAL DE LA APP - MOTOR DE ARRANQUE BLINDADO
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V2 - Iniciando controlador...');
    
    // 1. Evitar bloqueo por términos y condiciones
    try {
        const termsAcceptedRaw = localStorage.getItem('termsAccepted');
        let termsAccepted = termsAcceptedRaw ? JSON.parse(termsAcceptedRaw) : null;
        
        if (!termsAccepted || !termsAccepted.accepted) {
            console.log('⚠️ Términos no detectados. Forzando aceptación simulada para pruebas locales.');
            localStorage.setItem('termsAccepted', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
        }
    } catch (e) {
        console.error('Error en bypass de términos:', e);
    }
    
    // 2. Intentar quitar la pantalla de carga inmediatamente
    try {
        if (typeof VV !== 'undefined' && VV.utils && typeof VV.utils.showScreen === 'function') {
            VV.utils.showScreen('loading-screen');
        }
    } catch (e) {
        console.error('No se pudo invocar showScreen inicial:', e);
    }
    
    // 3. Temporizador de arranque con protecciones individuales
        setTimeout(async () => {
        if (typeof VV !== 'undefined' && VV.auth && typeof VV.auth.checkExistingUser === 'function') {
            const hasSession = await VV.auth.checkExistingUser();
            
            if (hasSession) {
                // CASO A: USUARIO REGISTRADO
                VV.auth.startApp();
                if (VV.utils && typeof VV.utils.activarFolleto === 'function') { VV.utils.activarFolleto(); }
                if (VV.geo && typeof VV.geo.init === 'function') {
                    await VV.geo.init();
                    VV.geo.updateLocationUI();
                }
            } else {
                // CASO B: VECINO INVITADO ANÓNIMO
                if (VV.utils && typeof VV.utils.showScreen === 'function') {
                    VV.utils.showScreen('location-screen');
                }
                if (VV.auth && typeof VV.auth.requestGeolocation === 'function') {
                    VV.auth.requestGeolocation();
                }
            }

            // 🌟 ORDEN INDEPENDIENTE: El carrusel se enciende SÍ O SÍ para registrados e invitados
            if (typeof VV.featured !== 'undefined' && typeof VV.featured.renderNovedadesCarrusel === 'function') {
                VV.featured.renderNovedadesCarrusel();
            }
        }
    }, 1500);   
    // 4. Control de navegación del menú inferior
    document.addEventListener('click', function(e) {
        try {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                e.preventDefault();
                const section = menuItem.dataset.section;
                if (section && typeof VV !== 'undefined' && VV.utils && typeof VV.utils.showSection === 'function') {
                    VV.utils.showSection(section);
                }
            }
        } catch (err) {
            console.error('Error en clic de menú:', err);
        }
    });
});

console.log('✅ Módulo APP blindado cargado correctamente');
