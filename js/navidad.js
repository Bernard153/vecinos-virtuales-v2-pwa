/* ============================================================
   Activa el tema navideño del 1 de diciembre al 6 de enero.
   Se puede forzar desde la consola:
     VV_NAVIDAD.activar()    → encender
     VV_NAVIDAD.desactivar() → apagar
     VV_NAVIDAD.auto()       → volver a la fecha
   ============================================================ */
(function () {
    'use strict';

    var MES_INICIO = 12, DIA_INICIO = 1;
    var MES_FIN    = 1,  DIA_FIN    = 6;

    function enTemporada(d) {
        var m = d.getMonth() + 1;
        var dia = d.getDate();
        if (m === MES_INICIO) return dia >= DIA_INICIO;
        if (m === MES_FIN)    return dia <= DIA_FIN;
        return false;
    }

    function aplicar() {
        var forzar = localStorage.getItem('navidad');
        var activo = forzar === 'on'  ? true
                   : forzar === 'off' ? false
                   : enTemporada(new Date());

        document.body.classList.toggle('tema-navidad', activo);
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
