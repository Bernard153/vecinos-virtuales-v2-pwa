// ============================================================
// CORE PRINCIPAL DE LA APP - ENRUTADOR RÁPIDO V6
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V6 - Sincronizando enrutador con el Core...');
    
    // Bypass automático de términos
    try {
        localStorage.setItem('termsAccepted', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    } catch (e) { console.error(e); }
    
    // Ejecución inmediata sincronizada con Core V5
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

                // 🌟 LLAMADA DIRECTA AL MOTOR DEL CORE V5: El encargado oficial de ordenar las pantallas
                if (window.VV && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                    window.VV.utils.showSection('dashboard');
                } else if (typeof window.showSection === 'function') {
                    window.showSection('dashboard');
                }

                // 🔥 CORRECCIÓN CRÍTICA: Forzar el renderizado de la cartelera comercial de Supabase
                try {
                    if (window.VV && window.VV.featured && typeof window.VV.featured.init === 'function') {
                        window.VV.featured.init();
                        console.log("⚡ Cartelera comercial encendida manualmente.");
                    } else if (typeof initFeatured === 'function') {
                        initFeatured();
                    }
                } catch (errFeatured) { 
                    console.error('Error al forzar la cartelera:', errFeatured); 
                }
            }

        } catch (errRoute) {
            console.error('Error en el ruteo:', errRoute);
        }
    }, 300); // Reducimos el tiempo a 300ms para un arranque instantáneo

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
