// ============================================================
// CORE PRINCIPAL DE LA APP - MOTOR DE ARRANQUE NATIVO V4
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V4 - Iniciando motor de arranque nativo SPA...');
    
    // 1. Bypass estricto de términos y condiciones para agilizar
    try {
        localStorage.setItem('termsAccepted', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    } catch (e) {
        console.error('Error en bypass de términos:', e);
    }
    
    // 2. Temporizador de arranque limpio calibrado con tu arquitectura
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
        
        // ENRUTAMIENTO DIRECTO USANDO TUS PROPIAS FUNCIONES SPA
        try {
            if (hasSession) {
                // CASO A: USUARIO REGISTRADO LOGUEADO
                console.log("👤 Usuario registrado detectado. Acoplando panel nativo...");
                if (typeof window.VV !== 'undefined' && window.VV.auth && typeof window.VV.auth.startApp === 'function') {
                    window.VV.auth.startApp();
                } else if (typeof window.startApp === 'function') {
                    window.startApp();
                }
            } else {
                // ============================================================
                // CASO B: VECINO INVITADO ANÓNIMO (ACCESO MAESTRO SIN FORMULARIOS)
                // ============================================================
                console.log("🚀 Invitado detectado. Inyectando Lomas de Tafí y ejecutando disparadores SPA.");
                
                if (typeof window.VV === 'undefined') window.VV = {};
                if (!window.VV.geo) window.VV.geo = {};
                
                // Fijamos el barrio de forma estricta en todo el entorno comercial
                window.VV.geo.currentBarrio = "Lomas de Tafí";
                if (window.VV.data && window.VV.data.user) {
                    window.VV.data.user.barrio = "Lomas de Tafí";
                }

                // 🚀 SISTEMA DE APAGADO DE CARGA NATIVO: Llamamos a tus propias herramientas del Core
                if (window.VV.utils) {
                    // Forzamos la apertura de la pantalla del Dashboard borrando la de carga
                    if (typeof window.VV.utils.showScreen === 'function') {
                        window.VV.utils.showScreen('dashboard-screen');
                        window.VV.utils.showScreen('main-screen');
                    }
                    // Forzamos el renderizado de la sección del muro de inicio
                    if (typeof window.VV.utils.showSection === 'function') {
                        window.VV.utils.showSection('dashboard');
                    }
                } else {
                    // Red de seguridad si utils no cargó: buscamos las funciones globales sueltas
                    if (typeof window.showScreen === 'function') window.showScreen('dashboard-screen');
                    if (typeof window.showSection === 'function') window.showSection('dashboard');
                }
            }
        } catch (errRoute) {
            console.error('Error en el enrutamiento nativo de arranque:', errRoute);
        }

        // 📺 RENDERIZADO OBLIGATORIO DE LA CARTELERA COMERCIAL CRUDA Y DIRECTA
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

console.log('✅ Módulo APP blindado en V4 acoplado al ruteo SPA con éxito.');
