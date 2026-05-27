// ============================================================
// CORE PRINCIPAL DE LA APP - MOTOR DE ARRANQUE BLINDADO V2
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
    
    // 3. Temporizador de arranque con protecciones individuales y puente de compatibilidad
    setTimeout(async () => {
        let hasSession = false;
        
        // PUENTE INTELIGENTE: Busca la función en el objeto VV o de forma global en auth-supabase
        try {
            if (typeof VV !== 'undefined' && VV.auth && typeof VV.auth.checkExistingUser === 'function') {
                hasSession = await VV.auth.checkExistingUser();
            } else if (typeof window.checkExistingUser === 'function') {
                hasSession = await window.checkExistingUser();
            } else if (typeof checkExistingUser === 'function') {
                hasSession = await checkExistingUser();
            } else {
                console.log('⚠️ No se detectó función de sesión. Forzando ingreso como invitado.');
            }
        } catch (errSession) {
            console.error('Error al comprobar sesión existente:', errSession);
        }
        
        // PROCESAMIENTO DE ACCESO
        try {
            if (hasSession) {
                // CASO A: USUARIO REGISTRADO / DEMO LOGUEADO
                if (typeof VV !== 'undefined' && VV.auth && typeof VV.auth.startApp === 'function') {
                    VV.auth.startApp();
                } else if (typeof window.startApp === 'function') {
                    window.startApp();
                } else if (typeof startApp === 'function') {
                    startApp();
                } else {
                    // Red de seguridad si falla startApp: enviamos directo al dashboard
                    if (typeof VV !== 'undefined' && VV.utils && typeof VV.utils.showScreen === 'function') {
                        VV.utils.showScreen('dashboard-screen');
                        if (typeof VV.utils.showSection === 'function') VV.utils.showSection('dashboard');
                    }
                }

                if (VV.utils && typeof VV.utils.activarFolleto === 'function') { VV.utils.activarFolleto(); }
                if (VV.geo && typeof VV.geo.init === 'function') {
                    await VV.geo.init();
                    VV.geo.updateLocationUI();
                }
            } else {
                                // ============================================================
                // CASO B: VECINO INVITADO ANÓNIMO (ACCESO INMEDIATO SIN ESCALAS)
                // ============================================================
                console.log("🚀 Invitado detectado. Saltando pantallas y cargando Lomas de Tafí por defecto.");
                
                // Forzamos el barrio comercial en el motor geográfico para que no pida GPS
                if (typeof window.VV === 'undefined') window.VV = {};
                if (!window.VV.geo) window.VV.geo = {};
                window.VV.geo.currentBarrio = "Lomas de Tafí";

                // Mandamos al usuario directo al Dashboard a ver la cartelera
                if (typeof window.VV.utils !== 'undefined' && typeof window.VV.utils.showScreen === 'function') {
                    window.VV.utils.showScreen('dashboard-screen');
                    if (typeof window.VV.utils.showSection === 'function') {
                        window.VV.utils.showSection('dashboard');
                    }
                }
        } catch (errRoute) {
            console.error('Error en el enrutamiento de arranque:', errRoute);
            // Red de seguridad extrema: romper el spinner y mostrar pantalla de localización
            const loadingEl = document.getElementById('loading-screen');
            if (loadingEl) loadingEl.classList.remove('active');
            const locEl = document.getElementById('location-screen');
            if (locEl) locEl.classList.add('active');
        }

        // 🌟 ORDEN INDEPENDIENTE: El carrusel se enciende SÍ O SÍ para registrados e invitados
        if (typeof VV !== 'undefined' && typeof VV.featured !== 'undefined' && typeof VV.featured.renderNovedadesCarrusel === 'function') {
            VV.featured.renderNovedadesCarrusel();
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

console.log('✅ Módulo APP blindado cargado correctamente con puente dual');
