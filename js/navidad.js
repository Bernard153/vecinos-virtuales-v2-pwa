/* ============================================================
   Tema navideño — activación automática + nieve.
   Consola:
     VV_NAVIDAD.activar()    → encender
     VV_NAVIDAD.desactivar() → apagar
     VV_NAVIDAD.auto()       → volver a la fecha
   ============================================================ */
(function () {
    'use strict';

    var MES_INICIO = 11, DIA_INICIO = 1;
    var MES_FIN    = 1,  DIA_FIN    = 7;

    function enTemporada(d) {
        var m = d.getMonth() + 1;
        var dia = d.getDate();
        if (m === MES_INICIO) return dia >= DIA_INICIO;
        if (m === MES_FIN)    return dia <= DIA_FIN;
        return false;
    }

    function nieve(activo) {
        var el = document.getElementById('nav-nieve');

        if (activo && !el) {
            el = document.createElement('div');
            el.id = 'nav-nieve';
            el.className = 'nav-nieve';
            el.setAttribute('aria-hidden', 'true');
            document.body.appendChild(el);
        } else if (!activo && el) {
            el.remove();
        }
    }

    function aplicar() {
        var forzar = localStorage.getItem('navidad');
        var activo = forzar === 'on'  ? true
                   : forzar === 'off' ? false
                   : enTemporada(new Date());

        document.body.classList.toggle('tema-navidad', activo);
        nieve(activo);
        return activo;
    }

    window.VV_NAVIDAD = {
        activar:    function () { localStorage.setItem('navidad', 'on');  aplicar(); },
        desactivar: function () { localStorage.setItem('navidad', 'off'); aplicar(); },
        auto:       function () { localStorage.removeItem('navidad');     aplicar(); },
        estado:     function () { return document.body.classList.contains('tema-navidad'); }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicar);
    } else {
        aplicar();
    }
})();
