// ============================================================
// CORE PRINCIPAL DE LA APP - ENRUTADOR RÁPIDO V6 BLINDADO
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V6 - Sincronizando enrutador con el Core...');
    
    // Bypass automático de términos
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
                
                // Fijamos el entorno geográfico
                if (!window.VV) window.VV = {};
                if (!window.VV.geo) window.VV.geo = {};
                window.VV.geo.currentBarrio = "Lomas de Tafí";

                // 🔥 MOTOR DE REINTENTO: Espera a que la cartelera comercial esté lista en memoria
                let intentos = 0;
                const verificarYEncender = setInterval(() => {
                    intentos++;
                    
                    // Comprobamos si el módulo comercial ya se cargó por completo
                    const carteleraLista = (window.VV && window.VV.featured && typeof window.VV.featured.init === 'function') || (typeof initFeatured === 'function');
                    
                    if (carteleraLista) {
                        clearInterval(verificarYEncender);
                        
                        // 1. Mostramos la sección visualmente
                        if (window.VV && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                            window.VV.utils.showSection('dashboard');
                        } else if (typeof window.showSection === 'function') {
                            window.showSection('dashboard');
                        }
                        
                        // 2. Inyectamos los datos comerciales descargados de Supabase
                        if (window.VV && window.VV.featured && typeof window.VV.featured.init === 'function') {
                            window.VV.featured.init();
                        } else if (typeof initFeatured === 'function') {
                            initFeatured();
                        }
                        console.log("⚡ Cartelera comercial acoplada con éxito tras sincronía.");
                    } 
                    
                    // Límite de seguridad: si pasa mucho tiempo, levanta igual para no congelar
                    if (intentos > 20) {
                        clearInterval(verificarYEncender);
                        if (window.VV && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                            window.VV.utils.showSection('dashboard');
                        }
                    }
                }, 100); // Revisa cada 100 milisegundos
            }
        } catch (errRoute) {
            console.error('Error en el ruteo:', errRoute);
        }
    }, 300);

    // Control de navegación del menú inferior
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
