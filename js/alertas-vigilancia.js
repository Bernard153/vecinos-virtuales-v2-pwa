// MODO VIGILANCIA - Notificacion a vecinos
// ============================================================

// Esperar a que VV.alertas exista
function initVigilancia() {
    if (typeof VV === 'undefined' || !VV.alertas) {
        setTimeout(initVigilancia, 500);
        return;
    }

// Cargar alerta activa del barrio
VV.alertas.cargarAlertaActiva = async function() {

    var user = VV_ROLES.getCurrentUser();
    if (!user) return;

    try {
        var { data: alertas, error } = await supabase
            .from('alertas_vecinales')
            .select('*')
            .eq('status', 'approved')
            .eq('neighborhood', user.neighborhood || VV.data.neighborhood)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error || !alertas || alertas.length === 0) {
            var notif = document.getElementById('alerta-vigilancia-bar');
            if (notif) notif.style.display = 'none';
            return;
        }

        var alerta = alertas[0];
        window.alertaVecinalActual = alerta;

        // Crear barra de notificacion
        var bar = document.getElementById('alerta-vigilancia-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'alerta-vigilancia-bar';
            bar.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:linear-gradient(135deg,#dc2626,#991b1b);color:white;padding:0.75rem;z-index:9998;cursor:pointer;display:none;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
            document.body.appendChild(bar);
        }

        bar.innerHTML = '<div style="max-width:600px;margin:0 auto;display:flex;align-items:center;gap:0.5rem;">' +
            '<i class="fas fa-shield-alt" style="font-size:1.3rem;"></i>' +
            '<div style="flex:1;">' +
            '<p style="margin:0;font-weight:bold;font-size:0.9rem;">Alerta de seguridad en tu barrio</p>' +
            '<p style="margin:0;font-size:0.75rem;opacity:0.9;">' + (alerta.user_name || 'Vecino') + ' - ' + (alerta.is_auto ? 'Envio automatico' : 'Alerta activa') + '</p>' +
            '</div>' +
            '<button onclick="event.stopPropagation();VV.alertas.silenciarAlerta();" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:0.4rem 0.6rem;border-radius:8px;cursor:pointer;font-size:0.75rem;">Silenciar</button>' +
            '<i class="fas fa-chevron-right" style="font-size:0.85rem;"></i>' +
            '</div>';

        bar.style.display = 'block';
        bar.onclick = function() { VV.alertas.abrirAlertaVecinal(); };

        // Sonido si no esta silenciada
        if (!localStorage.getItem('alerta_silenciada')) {
            VV.alertas.playAlertSound();
        }

    } catch (err) {
        console.error('Error cargando alerta activa:', err);
    }
};

// Sonido de alerta
VV.alertas.playAlertSound = function() {
    try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);

        setTimeout(function() {
            var osc2 = ctx.createOscillator();
            var gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = 880;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.3);
        }, 400);

        setTimeout(function() { ctx.close(); }, 2000);
    } catch(e) { console.error('Error sonido:', e); }
};

// Silenciar
VV.alertas.silenciarAlerta = function() {
    localStorage.setItem('alerta_silenciada', 'true');
    var bar = document.getElementById('alerta-vigilancia-bar');
    if (bar) {
        bar.innerHTML = '<div style="max-width:600px;margin:0 auto;display:flex;align-items:center;gap:0.5rem;">' +
            '<i class="fas fa-bell-slash" style="font-size:1.3rem;"></i>' +
            '<div style="flex:1;">' +
            '<p style="margin:0;font-weight:bold;font-size:0.9rem;">Alerta silenciada por 1 hora</p>' +
            '<p style="margin:0;font-size:0.75rem;opacity:0.9;">No recibiras mas sonidos de esta alerta</p>' +
            '</div></div>';
        bar.style.background = 'linear-gradient(135deg,#475569,#334155)';
        setTimeout(function() { bar.style.display = 'none'; }, 3000);
    }
    setTimeout(function() { localStorage.removeItem('alerta_silenciada'); }, 3600000);
};


// Abrir modal de alerta vecinal
VV.alertas.abrirAlertaVecinal = function() {
    var alerta = window.alertaVecinalActual;
    if (!alerta) return;

    var photos = alerta.photos || [];
    var gpsPoints = alerta.gps_points || [];
    var time = new Date(alerta.created_at).toLocaleString('es-AR');

    var overlay = document.getElementById('alerta-vigilancia-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'alerta-vigilancia-modal';
        document.body.appendChild(overlay);
    }

    var html = '<div style="background:white;border-radius:16px;max-width:500px;width:95%;max-height:90vh;overflow-y:auto;padding:1.5rem;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">';
    html += '<h2 style="margin:0;color:#dc2626;font-size:1.25rem;">Alerta en tu barrio</h2>';
    html += '<button onclick="document.getElementById(\'alerta-vigilancia-modal\').style.display=\'none\';" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#64748b;">X</button>';
    html += '</div>';

    // Info
    html += '<div style="background:#fef2f2;border-radius:8px;padding:0.75rem;margin-bottom:1rem;">';
    html += '<p style="margin:0 0 0.25rem 0;font-weight:bold;color:#1e293b;">' + (alerta.user_name || 'Vecino') + '</p>';
    html += '<p style="margin:0 0 0.25rem 0;color:#64748b;font-size:0.85rem;">' + time + (alerta.is_auto ? ' (AUTO-ENVIADA)' : '') + '</p>';
    html += '<p style="margin:0;color:#64748b;font-size:0.85rem;">' + (alerta.neighborhood || 'Sin barrio') + '</p>';
    html += '</div>';

    // Fotos
    html += '<h3 style="color:#1e293b;font-size:1rem;margin-bottom:0.5rem;">Fotos (' + photos.length + ')</h3>';
    if (photos.length > 0) {
        html += '<div style="display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem;">';
        for (var i = 0; i < photos.length; i++) {
            html += '<img src="' + photos[i] + '" style="width:150px;height:120px;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="window.open(\'' + photos[i] + '\', \'_blank\')">';
        }
        html += '</div>';
    } else {
        html += '<p style="color:#64748b;">No hay fotos</p>';
    }

    // Audio
    html += '<hr style="margin:1rem 0;border:none;border-top:1px solid #e2e8f0;">';
    html += '<h3 style="color:#1e293b;font-size:1rem;margin-bottom:0.5rem;">Audio</h3>';
    if (alerta.audio_url) {
        html += '<audio controls src="' + alerta.audio_url + '" style="width:100%;margin-bottom:0.5rem;"></audio>';
    } else {
        html += '<p style="color:#64748b;">No hay audio</p>';
    }

    // GPS
    html += '<hr style="margin:1rem 0;border:none;border-top:1px solid #e2e8f0;">';
    html += '<h3 style="color:#1e293b;font-size:1rem;margin-bottom:0.5rem;">Ubicacion</h3>';
    if (gpsPoints.length > 0) {
        var lastPoint = gpsPoints[gpsPoints.length - 1];
        var mapsUrl = 'https://www.google.com/maps?q=' + lastPoint.lat + ',' + lastPoint.lng;
        html += '<a href="' + mapsUrl + '" target="_blank" style="display:block;background:#3b82f6;color:white;padding:0.5rem;border-radius:8px;text-align:center;text-decoration:none;font-size:0.85rem;font-weight:bold;">Ver en mapa</a>';
    } else {
        html += '<p style="color:#64748b;">No hay datos GPS</p>';
    }

    // Colaborar
    html += '<hr style="margin:1rem 0;border:none;border-top:1px solid #e2e8f0;">';
    html += '<h3 style="color:#1e293b;font-size:1rem;margin-bottom:0.5rem;">Podes ayudar?</h3>';
    html += '<p style="color:#64748b;font-size:0.85rem;margin-bottom:0.75rem;">Si viste algo o tenes informacion, colabora:</p>';
    html += '<div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;">';
    html += '<button onclick="VV.alertas.tomarFotoAvistaje()" style="flex:1;background:#3b82f6;color:white;padding:0.75rem;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:0.85rem;">Tomar foto</button>';
    html += '<button onclick="VV.alertas.reportarAvistaje()" style="flex:1;background:#8b5cf6;color:white;padding:0.75rem;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:0.85rem;">Reportar avistaje</button>';
    html += '</div>';
    html += '<div id="avistajes-lista"></div>';
    html += '</div>';

    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.zIndex = '10005';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    // Cargar avistajes existentes
    VV.alertas.cargarAvistajes(alerta.id);
};

// Cargar avistajes
VV.alertas.cargarAvistajes = async function(alertaId) {
    try {
        var { data: avistajes, error } = await supabase
            .from('alertas_avistajes')
            .select('*')
            .eq('alerta_id', alertaId)
            .order('created_at', { ascending: false });

        var container = document.getElementById('avistajes-lista');
        if (!container) return;

        if (error || !avistajes || avistajes.length === 0) {
            container.innerHTML = '';
            return;
        }

        var html = '<h4 style="color:#1e293b;font-size:0.9rem;margin-bottom:0.5rem;">Aportes de vecinos (' + avistajes.length + ')</h4>';
        for (var i = 0; i < avistajes.length; i++) {
            var av = avistajes[i];
            html += '<div style="background:#f8fafc;border-radius:8px;padding:0.5rem;margin-bottom:0.5rem;">';
            html += '<p style="margin:0;font-size:0.8rem;font-weight:bold;color:#475569;">' + (av.user_name || 'Vecino') + '</p>';
            if (av.note) html += '<p style="margin:0.25rem 0;font-size:0.8rem;color:#64748b;">' + av.note + '</p>';
            if (av.photo_url) html += '<img src="' + av.photo_url + '" style="width:100%;max-height:150px;object-fit:cover;border-radius:4px;margin-top:0.25rem;">';
            html += '<p style="margin:0.25rem 0 0 0;font-size:0.7rem;color:#94a3b8;">' + new Date(av.created_at).toLocaleString('es-AR') + '</p>';
            html += '</div>';
        }
        container.innerHTML = html;
    } catch (err) {
        console.error('Error cargando avistajes:', err);
    }
};

// Tomar foto de avistaje
VV.alertas.tomarFotoAvistaje = async function() {
    var alerta = window.alertaVecinalActual;
    if (!alerta) return;
    var user = VV_ROLES.getCurrentUser();
    if (!user) return;

    try {
        var stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });

        var video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        await video.play();
        await new Promise(function(r) { setTimeout(r, 500); });

        var canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        stream.getTracks().forEach(function(t) { t.stop(); });

        var blob = await new Promise(function(r) { canvas.toBlob(r, 'image/jpeg', 0.6); });
        if (!blob) return;

        var fileName = 'avistaje-' + alerta.id + '-' + Date.now() + '.jpg';
        var { error: upErr } = await supabase.storage.from('alertas-photos').upload(fileName, blob);
        if (upErr) throw upErr;

        var { data: urlData } = supabase.storage.from('alertas-photos').getPublicUrl(fileName);

        var { error: insErr } = await supabase
            .from('alertas_avistajes')
            .insert({
                alerta_id: alerta.id,
                user_id: user.id,
                user_name: user.name,
                photo_url: urlData.publicUrl
            });

        if (insErr) throw insErr;
        VV.utils.showSuccess('Foto enviada');
        VV.alertas.cargarAvistajes(alerta.id);
    } catch (err) {
        console.error('Error foto avistaje:', err);
        alert('Error: ' + err.message);
    }
};

// Reportar avistaje (texto + GPS)
VV.alertas.reportarAvistaje = async function() {
    var alerta = window.alertaVecinalActual;
    if (!alerta) return;
    var user = VV_ROLES.getCurrentUser();
    if (!user) return;

    var note = prompt('Describi lo que viste:');
    if (!note || !note.trim()) return;

    var location = null;
    if (navigator.geolocation) {
        try {
            var pos = await new Promise(function(r, rej) {
                navigator.geolocation.getCurrentPosition(r, rej, { timeout: 5000 });
            });
            location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch(e) {}
    }

    try {
        var { error } = await supabase
            .from('alertas_avistajes')
            .insert({
                alerta_id: alerta.id,
                user_id: user.id,
                user_name: user.name,
                note: note.trim(),
                location: location
            });

        if (error) throw error;
        VV.utils.showSuccess('Avistaje reportado');
        VV.alertas.cargarAvistajes(alerta.id);
    } catch (err) {
        console.error('Error avistaje:', err);
        alert('Error: ' + err.message);
    }
};

// Iniciar polling cada 30 segundos
setTimeout(function() {
    if (typeof VV_ROLES !== 'undefined' && VV_ROLES.getCurrentUser()) {
        VV.alertas.cargarAlertaActiva();
        setInterval(function() {
            if (typeof VV_ROLES !== 'undefined' && VV_ROLES.getCurrentUser()) {
                VV.alertas.cargarAlertaActiva();
            }
        }, 30000);
    }
}, 3000);
}

// Inicializar
initVigilancia();

// Cargar alertas cada 30 segundos
setInterval(function() {
    if (typeof VV !== 'undefined' && VV.alertas && VV.alertas.cargarAlertaActiva) {
        VV.alertas.cargarAlertaActiva();
    }
}, 30000);

