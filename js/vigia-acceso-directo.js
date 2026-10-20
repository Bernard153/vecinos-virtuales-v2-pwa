// ===== ACCESO DIRECTO A ALERTA VIGÍA =====
// Detecta ?alerta=1 en la URL y dispara la alerta automáticamente
// después de que la app esté lista (con sesión o tras login).
// Este bloque es 100% aditivo: si no hay ?alerta=1 en la URL, no hace nada.
(function() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('alerta') === '1') {
        sessionStorage.setItem('vigia_alerta_directa', '1');
    }

    var startAppOriginal = VV.auth.startApp;

    VV.auth.startApp = async function() {
        await startAppOriginal.apply(this, arguments);

        if (sessionStorage.getItem('vigia_alerta_directa') === '1') {
            sessionStorage.removeItem('vigia_alerta_directa');
            setTimeout(function() {
                if (VV.alertas && typeof VV.alertas.startAlert === 'function') {
                    VV.alertas.startAlert();
                }
            }, 500);
        }
    };
})();
