/* ============================================================
   js/instalar.js — Instalación de la PWA y compartir el link
   ============================================================ */
(function () {
    'use strict';

    var URL_APP = 'https://vecinos-virtuales-v2-pwa.pages.dev';
    var deferredPrompt = null;

    function yaInstalada() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }

    function ocultarBoton() {
        var b = document.getElementById('vv-instalar-btn');
        if (b) b.remove();
    }

    function mostrarBoton() {
        if (yaInstalada()) return;
        if (document.getElementById('vv-instalar-btn')) return;

        var b = document.createElement('button');
        b.id = 'vv-instalar-btn';
        b.innerHTML = '📲 Instalar app';
        b.style.cssText =
            'position:fixed;bottom:16px;left:16px;z-index:9000;' +
            'padding:0.6rem 1rem;border-radius:50px;border:none;' +
            'background:linear-gradient(135deg,#c084fc,#8b5cf6);color:white;' +
            'font-weight:700;font-size:0.85rem;cursor:pointer;' +
            'box-shadow:0 4px 14px rgba(139,92,246,.45);';

               b.onclick = async function () {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                var r = await deferredPrompt.userChoice;
                if (r.outcome === 'accepted') ocultarBoton();
                deferredPrompt = null;
                return;
            }

            // Sin prompt nativo (iPhone, o Chrome aún no habilitó la instalación):
            // mostrar las instrucciones paso a paso
            VV.instalar.mostrar();
        };

        document.body.appendChild(b);
    }

    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredPrompt = e;
        mostrarBoton();
    });

    window.addEventListener('appinstalled', function () {
        ocultarBoton();
        deferredPrompt = null;
    });

    window.VV = window.VV || {};
    window.VV.instalar = {
        url: URL_APP,

        compartir: async function () {
            var texto = 'Sumate a Vecinos Virtuales, la app de tu barrio';

            if (navigator.share) {
                try {
                    await navigator.share({ title: 'Vecinos Virtuales', text: texto, url: URL_APP });
                    return;
                } catch (e) {
                    // el usuario canceló
                }
            }

            try {
                await navigator.clipboard.writeText(URL_APP);
                alert('Link copiado:\n' + URL_APP);
            } catch (e) {
                prompt('Copiá este link:', URL_APP);
            }
        },

        mostrar: function () {
            var el = document.getElementById('vv-instalar-overlay');
            if (el) el.remove();

            el = document.createElement('div');
            el.id = 'vv-instalar-overlay';
            el.className = 'modal-overlay active';
            el.style.zIndex = '9999';
            el.innerHTML =
                '<div class="modal-form" style="max-width:460px;text-align:center;">' +
                    '<h3 style="margin-top:0;">📲 Instalá la app</h3>' +
                    '<p style="color:#64748b;font-size:0.9rem;">' +
                        'Agregala a tu pantalla de inicio y entrá con un toque, sin buscar en el navegador.' +
                    '</p>' +
                    '<div style="background:#f1f5f9;border-radius:10px;padding:0.75rem;margin:1rem 0;font-size:0.8rem;color:#334155;word-break:break-all;">' +
                        URL_APP +
                    '</div>' +
                    '<button onclick="VV.instalar.compartir()" style="width:100%;padding:0.7rem;border-radius:10px;border:none;background:linear-gradient(135deg,#c084fc,#8b5cf6);color:white;font-weight:700;cursor:pointer;margin-bottom:0.5rem;">' +
                        '📤 Compartir el link' +
                    '</button>' +
                    '<div style="text-align:left;font-size:0.8rem;color:#475569;margin-top:1rem;line-height:1.6;">' +
                        '<strong>Android:</strong> menú ⋮ → "Instalar aplicación"<br>' +
                        '<strong>iPhone:</strong> Safari → Compartir → "Agregar a inicio"<br>' +
                        '<strong>PC:</strong> ícono de instalar en la barra de direcciones' +
                    '</div>' +
                    '<button onclick="document.getElementById(\'vv-instalar-overlay\').remove()" style="width:100%;margin-top:1rem;padding:0.6rem;border-radius:10px;border:1px solid #cbd5e1;background:white;cursor:pointer;">Cerrar</button>' +
                '</div>';

            document.body.appendChild(el);
            el.onclick = function (e) { if (e.target === el) el.remove(); };
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mostrarBoton);
    } else {
        mostrarBoton();
    }
})();
