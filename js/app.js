// ============================================================
// CORE PRINCIPAL DE LA APP - MOTOR DE ARRANQUE DIRECTO V3
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V3 - Iniciando motor de arranque directo...');
    
    // 1. Bypass estricto de términos y condiciones para agilizar
    try {
        localStorage.setItem('termsAccepted', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    } catch (e) {
        console.error('Error en bypass de términos:', e);
    }
    
    // 2. Temporizador de arranque limpio e inmediato
    setTimeout(async () => {
        let hasSession = false;
        
        // Comprobar si hay una sesión activa de usuario registrado
        try {
            if (typeof window.VV !== 'undefined' && window.VV.auth && typeof window.VV.auth.checkExistingUser === 'function') {
                hasSession = await window.VV.auth.checkExistingUser();
            } else if (typeof window.checkExistingUser === 'function') {
                hasSession = await window.checkExistingUser();
            }
        } catch (errSession) {
            console.error('Error al comprobar sesión existente:', errSession);
        }
        
        // ENRUTAMIENTO DE ACCESO DIRECTO CRUDO
        try {
            if (hasSession) {
                // CASO A: USUARIO REGISTRADO LOGUEADO
                console.log("👤 Usuario registrado detectado. Iniciando panel...");
                if (typeof window.VV !== 'undefined' && window.VV.auth && typeof window.VV.auth.startApp === 'function') {
                    window.VV.auth.startApp();
                } else if (typeof window.startApp === 'function') {
                    window.startApp();
                } else {
                    // Red de seguridad directa
                    const loadingEl = document.getElementById('loading-screen');
                    if (loadingEl) loadingEl.style.display = 'none';
                    const dashEl = document.getElementById('dashboard-screen');
                    if (dashEl) dashEl.style.display = 'block';
                }
            } else {
                // Apagar el spinner de carga y encender el Dashboard de inmediato
                const loadingEl = document.getElementById('loading-screen') || document.querySelector('.loading-screen');
                if (loadingEl) {
                    loadingEl.style.display = 'none';
                    loadingEl.classList.remove('active');
                }

                // 🚀 CAMBIO DE LLAVE: Buscamos tu contenedor real del muro de inicio
                const dashScreen = document.getElementById('dashboard') || document.getElementById('main-screen');
                if (dashScreen) {
                    dashScreen.style.display = 'block';
                    dashScreen.classList.add('active');
                }

                // Forzar la inyección y el ruteo visual del muro principal
                if (typeof window.VV !== 'undefined' && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                    window.VV.utils.showSection('dashboard');
                } else if (typeof window.showSection === 'function') {
                    window.showSection('dashboard');
                }
            }
        } catch (errRoute) {
            console.error('Error en el enrutamiento de arranque:', errRoute);
            // Red de seguridad extrema para que nunca se quede congelado
            const loadingEl = document.getElementById('loading-screen');
            if (loadingEl) loadingEl.style.display = 'none';
        }

        // 🌟 RENDERIZADO OBLIGATORIO DE LA CARTELERA COMERCIAL
        try {
            if (typeof window.VV !== 'undefined' && window.VV.featured && typeof window.VV.featured.renderNovedadesCarrusel === 'function') {
                window.VV.featured.renderNovedadesCarrusel();
            }
        } catch (errFeatured) {
            console.error('Error renderizando la cartelera comercial:', errFeatured);
        }

    }, 1200);   

    // 3. Control de navegación del menú inferior
    document.addEventListener('click', function(e) {
        try {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                e.preventDefault();
                const section = menuItem.dataset.section;
                if (section && typeof window.VV !== 'undefined' && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                    window.VV.utils.showSection(section);
                }
            }
        } catch (err) {
            console.error('Error en clic de menú:', err);
        }
    });
});

console.log('✅ Módulo APP unificado y blindado en V3 cargado con éxito.');
