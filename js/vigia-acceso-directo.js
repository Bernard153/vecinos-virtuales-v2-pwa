// ===== ACCESO DIRECTO A ALERTA VIGÍA =====
// Detecta ?alerta=1 en la URL y muestra un botón grande para activar
// la alerta de forma consciente (no auto-inicia).
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
                if (VV.alertas && typeof VV.alertas.init === 'function') {
                    VV.alertas.init();
                }
                mostrarPantallaAlerta();
            }, 500);
        }
    };

    function mostrarPantallaAlerta() {
        if (document.getElementById('vigia-overlay')) return;

        var overlay = document.createElement('div');
        overlay.id = 'vigia-overlay';
        overlay.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
            'background:rgba(26,26,64,0.95)', 'display:flex',
            'flex-direction:column', 'align-items:center', 'justify-content:center',
            'z-index:99999'
        ].join(';');

        overlay.innerHTML =
            '<div style="text-align:center;color:white;padding:2rem;max-width:90%;">' +
                '<div style="font-size:4rem;margin-bottom:1rem;">🛡️</div>' +
                '<h2 style="font-size:1.5rem;margin:0 0 0.5rem;">Vigía</h2>' +
                '<p style="opacity:0.7;margin:0 0 2rem;font-size:0.9rem;">' +
                    'Tocá el botón para activar la alerta de seguridad<br>' +
                    'Se capturarán fotos, audio y ubicación GPS' +
                '</p>' +
                '<button id="vigia-btn-activar" style="' +
                    'background:#FFB627;border:none;color:#1a1a40;' +
                    'padding:1.2rem 3rem;border-radius:50px;' +
                    'font-size:1.2rem;font-weight:bold;cursor:pointer;' +
                    'box-shadow:0 4px 20px rgba(255,182,39,0.5);">' +
                    '🚨 ACTIVAR ALERTA' +
                '</button>' +
                '<button id="vigia-btn-cancelar" style="' +
                    'margin-top:1.5rem;background:none;' +
                    'border:1px solid rgba(255,255,255,0.3);' +
                    'color:white;padding:0.6rem 2rem;' +
                    'border-radius:50px;cursor:pointer;font-size:0.9rem;">' +
                    'Cancelar' +
                '</button>' +
            '</div>';

        document.body.appendChild(overlay);

        document.getElementById('vigia-btn-activar').onclick = function() {
            overlay.remove();
            if (VV.alertas && typeof VV.alertas.startAlert === 'function') {
                VV.alertas.startAlert();
            }
        };

        document.getElementById('vigia-btn-cancelar').onclick = function() {
            overlay.remove();
        };
    }
})();
