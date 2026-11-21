/* ============================================================
   admin-web-secciones.js
   Textos editables por sección de la landing (panel admin).
   Se engancha a VV.adminWeb sin tocar admin-web.js.
   ============================================================ */
(function () {
  'use strict';

  var SECCIONES = [
    { slug: 'barrios',  emoji: '📍', nombre: 'Explora los Barrios', defecto: 'Elegí tu barrio y mirá qué está pasando cerca tuyo.' },
    { slug: 'folletos', emoji: '🏪', nombre: 'Folletos del barrio', defecto: 'Ofertas y promos de los comercios de tu zona, en un solo lugar.' },
    { slug: 'ofertas',  emoji: '⭐', nombre: 'Ofertas destacadas',  defecto: 'Los descuentos que los vecinos están usando esta semana.' },
    { slug: 'eventos',  emoji: '🎭', nombre: 'Próximos eventos',    defecto: 'Fechas, ferias y actividades de la comunidad.' },
    { slug: 'voces',    emoji: '🎤', nombre: 'Voces Virtuales',     defecto: 'Lo que dicen los vecinos y los avisos de la comunidad.' }
  ];

  function render(cont) {
    cont.innerHTML = SECCIONES.map(function (s) {
      return '<div style="border:1px solid #e2e8f0;border-radius:10px;padding:0.9rem;background:#f8fafc;">' +
        '<div style="font-weight:600;color:#1e293b;margin-bottom:0.6rem;">' + s.emoji + ' ' + s.nombre + '</div>' +
        '<input type="text" id="web-sec-' + s.slug + '-titulo" placeholder="' + s.nombre + '" ' +
          'style="width:100%;padding:0.6rem;border-radius:8px;border:1px solid #cbd5e1;margin-bottom:0.5rem;">' +
        '<input type="text" id="web-sec-' + s.slug + '-subtitulo" maxlength="140" placeholder="' + s.defecto + '" ' +
          'style="width:100%;padding:0.6rem;border-radius:8px;border:1px solid #cbd5e1;">' +
      '</div>';
    }).join('');
  }

  async function loadSecciones() {
    var cont = document.getElementById('web-secciones-list');
    if (!cont) return false;

    render(cont);

    try {
      var res = await supabase.from('landing_content').select('key, value');
      if (res.error) throw res.error;

      (res.data || []).forEach(function (r) {
        if (!r.key || r.key.indexOf('sec_') !== 0) return;
        var el = document.getElementById('web-' + r.key.replace(/_/g, '-'));
        if (el) el.value = r.value || '';
      });
    } catch (e) {
      console.error('Error cargando secciones:', e);
    }
    return true;
  }

  async function saveSecciones() {
    try {
      var items = [];
      SECCIONES.forEach(function (s) {
        var t = document.getElementById('web-sec-' + s.slug + '-titulo');
        var b = document.getElementById('web-sec-' + s.slug + '-subtitulo');
        items.push({ key: 'sec_' + s.slug + '_titulo', value: ((t && t.value) || '').trim() });
        items.push({ key: 'sec_' + s.slug + '_subtitulo', value: ((b && b.value) || '').trim() });
      });

      for (var i = 0; i < items.length; i++) {
        var res = await supabase.from('landing_content')
          .upsert({ key: items[i].key, value: items[i].value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (res.error) throw res.error;
      }

      if (VV.utils && VV.utils.showSuccess) VV.utils.showSuccess('Textos de sección guardados');
      else alert('Textos de sección guardados');

    } catch (e) {
      console.error('Error guardando secciones:', e);
      alert('Error al guardar');
    }
  }

  function attach() {
    if (!window.VV || !VV.adminWeb) { setTimeout(attach, 200); return; }

    VV.adminWeb.SECCIONES = SECCIONES;
    VV.adminWeb.loadSecciones = loadSecciones;
    VV.adminWeb.saveSecciones = saveSecciones;

    var origInit = VV.adminWeb.init;
    VV.adminWeb.init = async function () {
      if (typeof origInit === 'function') await origInit.call(this);

      var ok = await loadSecciones();
      var tries = 0;
      (function retry() {
        if (ok || tries++ > 10) return;
        setTimeout(async function () {
          ok = await loadSecciones();
          retry();
        }, 300);
      })();
    };

    console.log('admin-web-secciones: enganchado');
  }

  attach();
})();
