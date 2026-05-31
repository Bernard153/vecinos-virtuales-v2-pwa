// ============================================================
// CORE PRINCIPAL DE LA APP - ENRUTADOR RÁPIDO V6 ASÍNCRONO
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V6 - Sincronizando enrutador con el Core...');
    
    // Bypass automático de términos y condiciones
    try {
        localStorage.setItem('termsAccepted', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    } catch (e) { console.error(e); }
    
    // Ejecución sincronizada con Core V5 y Supabase
    setTimeout(async () => {
        let hasSession = false;
        
        try {
            if (window.VV && window.VV.auth && typeof window.VV.auth.checkExistingUser === 'function') {
                hasSession = await window.VV.auth.checkExistingUser();
            }
        } catch (errSession) { console.error(errSession); }
        
        try {
            if (hasSession) {
                console.log("👤 Usuario registrado detectado.");
                if (window.VV && window.VV.auth && typeof window.VV.auth.startApp === 'function') {
                    window.VV.auth.startApp();
                }
            } else {
                console.log("🚀 Modo Invitado Activo: Levantando telón de Lomas de Tafí.");
                
                // Fijamos el entorno geográfico de la aplicación
                if (!window.VV) window.VV = {};
                if (!window.VV.geo) window.VV.geo = {};
                window.VV.geo.currentBarrio = "Lomas de Tafí";

                // 🔄 ESTRATEGIA DE INYECCIÓN ASÍNCRONA: Espera a que Supabase monte los módulos
                let intentos = 0;
                const forzarArranque = setInterval(() => {
                    intentos++;
                    
                    // Comprobamos si el motor comercial del Core V5 está listo en memoria
                    const coreListo = (window.VV && window.VV.featured && typeof window.VV.featured.init === 'function') || (typeof initFeatured === 'function');
                    
                    if (coreListo) {
                        clearInterval(forzarArranque);
                        
                        // 1. Forzamos la visibilidad de los contenedores clave del HTML
                        const idsDashboard = ['dashboard', 'panel-dashboard', 'main-dashboard', 'stats-dashboard'];
                        idsDashboard.forEach(id => {
                            const el = document.getElementById(id);
                            if (el) el.style.setProperty('display', 'block', 'important');
                        });

                        // 2. Le ordenamos al enrutador gráfico abrir la sección principal
                        if (window.VV && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                            window.VV.utils.showSection('dashboard');
                        } else if (typeof window.showSection === 'function') {
                            window.showSection('dashboard');
                        }
                        
                        // 3. Inicializamos las ofertas y anuncios destacados descargados de Supabase
                        if (window.VV && window.VV.featured && typeof window.VV.featured.init === 'function') {
                            window.VV.featured.init();
                        } else if (typeof initFeatured === 'function') {
                            initFeatured();
                        }
                        console.log("⚡ Cartelera comercial de Lomas de Tafí acoplada y renderizada.");
                    }
                    
                    // Límite de seguridad (2 segundos) para que la app no quede colgada si falla la red
                    if (intentos > 20) {
                        clearInterval(forzarArranque);
                        const elBase = document.getElementById('dashboard') || document.getElementById('panel-dashboard');
                        if (elBase) elBase.style.display = 'block';
                        if (window.VV && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                            window.VV.utils.showSection('dashboard');
                        }
                    }
                }, 100); // Revisa la memoria del navegador cada 100 milisegundos
            }
        } catch (errRoute) {
            console.error('Error en el ruteo de inicio:', errRoute);
        }
    }, 400); // Margen de tiempo para permitir la carga fluida de configuraciones previas

    // Control de navegación interactiva del menú inferior
    document.addEventListener('click', function(e) {
        try {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                e.preventDefault();
                const section = menuItem.dataset.section;
                if (section && window.VV && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                    window.VV.utils.showSection(section);
                }
            }
        } catch (err) { console.error(err); }
    });
});

console.log('✅ Enrutador rápido V6 acoplado de forma óptima.');
