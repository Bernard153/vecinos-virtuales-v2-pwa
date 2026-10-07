// ============================================================
// SISTEMA DE ALERTAS VECINALES
// ============================================================

VV.alertas = {
    isActive: false,
    startTime: null,
    timerInterval: null,
    countdownInterval: null,
    photoInterval: null,
    gpsInterval: null,
    mediaRecorder: null,
    audioChunks: [],
    photos: [],
    gpsPoints: [],
    alertaId: null,
    stream: null,
    audioStream: null,
    audioContext: null,
    MAX_PHOTOS: 30,
    MAX_DURATION: 180,
    PHOTO_INTERVAL: 2000,
    GPS_INTERVAL: 5000,

    init() {
        const btn = document.getElementById('alerta-flotante');
        if (btn) {
            btn.style.display = 'flex';
            btn.onclick = () => this.startAlert();
        }
        const enviarBtn = document.getElementById('alerta-enviar');
        if (enviarBtn) enviarBtn.onclick = () => this.sendAlert();
        const detenerBtn = document.getElementById('alerta-detener');
        if (detenerBtn) detenerBtn.onclick = () => this.showCodeModal();
        const codigoConfirmar = document.getElementById('alerta-codigo-confirmar');
        if (codigoConfirmar) codigoConfirmar.onclick = () => this.verifyCode();
        const codigoCancelar = document.getElementById('alerta-codigo-cancelar');
        if (codigoCancelar) codigoCancelar.onclick = () => this.hideCodeModal();
        const resultadoSusto = document.getElementById('alerta-resultado-susto');
        if (resultadoSusto) resultadoSusto.onclick = () => this.handleResult('susto');
        const resultadoNada = document.getElementById('alerta-resultado-nada');
        if (resultadoNada) resultadoNada.onclick = () => this.handleResult('nada');
        const resultadoEnviar = document.getElementById('alerta-resultado-enviar');
        if (resultadoEnviar) resultadoEnviar.onclick = () => this.handleResult('enviar');
        const configGuardar = document.getElementById('alerta-config-guardar');
        if (configGuardar) configGuardar.onclick = () => this.saveCode();
        const configCancelar = document.getElementById('alerta-config-cancelar');
        if (configCancelar) configCancelar.onclick = () => this.hideConfigModal();
        this.checkExistingCode();
    },

    async checkExistingCode() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('alertas_codigos')
                .select('codigo')
                .eq('user_id', user.id)
                .maybeSingle();
            if (error) throw error;
            if (!data) { this.showConfigModal(); }
        } catch (err) { console.error('Error verificando código:', err); }
    },

    showConfigModal() {
        const modal = document.getElementById('alerta-config-modal');
        if (modal) modal.style.display = 'flex';
    },

    hideConfigModal() {
        const modal = document.getElementById('alerta-config-modal');
        if (modal) modal.style.display = 'none';
        for (let i = 1; i <= 3; i++) {
            const input = document.getElementById('config-code-' + i);
            if (input) input.value = '';
        }
    },

    moveConfigInput(index, input) {
        if (input.value.length === 1 && index < 3) {
            const next = document.getElementById('config-code-' + (index + 1));
            if (next) next.focus();
        }
    },

    async saveCode() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) return;
        const code = [1, 2, 3].map(i => document.getElementById('config-code-' + i).value).join('');
        if (code.length < 3) { alert('El código debe tener 3 dígitos'); return; }
        try {
            const { error } = await supabase
                .from('alertas_codigos')
                .upsert({ user_id: user.id, codigo: code });
            if (error) throw error;
            this.hideConfigModal();
            VV.utils.showSuccess('Código guardado correctamente');
        } catch (err) {
            console.error('Error guardando código:', err);
            alert('Error al guardar el código: ' + err.message);
        }
    },

    async startAlert() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) { alert('Debés iniciar sesión para usar el sistema de alertas'); return; }
        if (this.isActive) return;
        try {
            const { data, error } = await supabase
                .from('alertas_codigos')
                .select('codigo')
                .eq('user_id', user.id)
                .maybeSingle();
            if (error) throw error;
            if (!data) { this.showConfigModal(); return; }
        } catch (err) { console.error('Error:', err); return; }

        this.isActive = true;
        this.startTime = Date.now();
        this.photos = [];
        this.gpsPoints = [];
        this.audioChunks = [];

        try {
            const { data, error } = await supabase
                .from('alertas_vecinales')
                .insert({
                    user_id: user.id,
                    user_name: user.name,
                    neighborhood: user.neighborhood || VV.data.neighborhood,
                    alert_type: 'robo',
                    status: 'pending',
                    is_auto: false
                })
                .select()
                .single();
            if (error) throw error;
            this.alertaId = data.id;
        } catch (err) {
            console.error('Error creando alerta:', err);
            alert('Error al iniciar la alerta: ' + err.message);
            this.isActive = false;
            return;
        }

        const modal = document.getElementById('alerta-modal');
        if (modal) modal.style.display = 'flex';
        await this.startPhotoCapture();
        await this.startAudioCapture();
        this.startGPSCapture();
        this.startTimer();
        this.startCountdown();
    },

    async startPhotoCapture() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });

            const video = document.createElement('video');
            video.srcObject = this.stream;
            video.muted = true;
            video.play();

            this.photoInterval = setInterval(async () => {
                if (this.photos.length >= this.MAX_PHOTOS) return;
                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 480;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.7));
                if (blob) {
                    const fileName = 'alerta-' + this.alertaId + '-' + Date.now() + '.jpg';
                    try {
                        const { error: uploadError } = await supabase.storage
                            .from('alertas-photos')
                            .upload(fileName, blob);
                        if (!uploadError) {
                            const { data: urlData } = supabase.storage
                                .from('alertas-photos')
                                .getPublicUrl(fileName);
                            this.photos.push(urlData.publicUrl);
                            const countEl = document.getElementById('alerta-fotos-count');
                            if (countEl) countEl.textContent = this.photos.length;
                            await supabase
                                .from('alertas_vecinales')
                                .update({ photos: this.photos })
                                .eq('id', this.alertaId);
                        }
                    } catch (e) { console.error('Error subiendo foto:', e); }
                }
            }, this.PHOTO_INTERVAL);
        } catch (err) {
            console.error('Error accediendo a la cámara:', err);
        }
    },

    async startAudioCapture() {
        try {
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new AudioContext({ latencyHint: 'interactive' });
            const destination = this.audioContext.createMediaStreamDestination();
            const source = this.audioContext.createMediaStreamSource(this.audioStream);
            source.connect(destination);
            let opciones = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported('audio/webm')) { opciones = {}; }
            this.mediaRecorder = new MediaRecorder(destination.stream, opciones.mimeType ? opciones : undefined);
            this.audioChunks = [];
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
            };
            this.mediaRecorder.start(1000);
        } catch (err) {
            console.error('Error accediendo al micrófono:', err);
            const audioStatus = document.getElementById('alerta-audio-status');
            if (audioStatus) audioStatus.textContent = 'No disponible';
        }
    },

    startGPSCapture() {
        const updateGPS = () => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const point = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: Date.now()
                    };
                    this.gpsPoints.push(point);
                    supabase
                        .from('alertas_vecinales')
                        .update({ gps_points: this.gpsPoints })
                        .eq('id', this.alertaId)
                        .then(({ error }) => {
                            if (error) console.error('Error actualizando GPS:', error);
                        });
                },
                (err) => { console.error('Error GPS:', err); },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        };
        updateGPS();
        this.gpsInterval = setInterval(updateGPS, this.GPS_INTERVAL);
    },

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            const timeEl = document.getElementById('alerta-tiempo');
            if (timeEl) timeEl.textContent = mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
        }, 1000);
    },

    startCountdown() {
        let remaining = this.MAX_DURATION;
        this.countdownInterval = setInterval(() => {
            remaining--;
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            const countdownEl = document.getElementById('alerta-countdown');
            if (countdownEl) countdownEl.textContent = mins + ':' + secs.toString().padStart(2, '0');
            if (remaining <= 0) {
                clearInterval(this.countdownInterval);
                this.autoSendAlert();
            }
        }, 1000);
    },

    async sendAlert() {
        if (!this.isActive) return;
        await this.finalizeAlert(false);
    },

    async autoSendAlert() {
        if (!this.isActive) return;
        await this.finalizeAlert(true);
    },

    async finalizeAlert(isAuto) {
        this.stopCapture();
        let audioUrl = null;
        if (this.audioChunks.length > 0) {
            try {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const fileName = 'alerta-audio-' + this.alertaId + '.webm';
                const { error: uploadError } = await supabase.storage
                    .from('alertas-photos')
                    .upload(fileName, audioBlob);
                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('alertas-photos')
                        .getPublicUrl(fileName);
                    audioUrl = urlData.publicUrl;
                }
            } catch (e) { console.error('Error subiendo audio:', e); }
        }
        try {
            await supabase
                .from('alertas_vecinales')
                .update({
                    status: 'pending',
                    is_auto: isAuto,
                    audio_url: audioUrl,
                    photos: this.photos,
                    gps_points: this.gpsPoints
                })
                .eq('id', this.alertaId);
        } catch (err) { console.error('Error finalizando alerta:', err); }
        const modal = document.getElementById('alerta-modal');
        if (modal) modal.style.display = 'none';
        this.isActive = false;
        this.alertaId = null;
        if (isAuto) { VV.utils.showSuccess('Alerta enviada automáticamente'); }
        else { VV.utils.showSuccess('Alerta enviada'); }
    },

    showCodeModal() {
        const modal = document.getElementById('alerta-codigo-modal');
        if (modal) modal.style.display = 'flex';
        for (let i = 1; i <= 3; i++) {
            const input = document.getElementById('codigo-' + i);
            if (input) input.value = '';
        }
        const first = document.getElementById('codigo-1');
        if (first) first.focus();
    },

    hideCodeModal() {
        const modal = document.getElementById('alerta-codigo-modal');
        if (modal) modal.style.display = 'none';
    },

    moveCodeInput(index, input) {
        if (input.value.length === 1 && index < 3) {
            const next = document.getElementById('codigo-' + (index + 1));
            if (next) next.focus();
        }
    },

    async verifyCode() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) return;
        const code = [1, 2, 3].map(i => document.getElementById('codigo-' + i).value).join('');
        if (code.length < 3) { alert('Ingresa los 3 dígitos'); return; }
        try {
            const { data, error } = await supabase
                .from('alertas_codigos')
                .select('codigo')
                .eq('user_id', user.id)
                .maybeSingle();
            if (error) throw error;
            if (data && data.codigo === code) {
                this.hideCodeModal();
                this.stopCapture();
                this.showResultModal();
            } else {
                alert('Código incorrecto');
                for (let i = 1; i <= 3; i++) {
                    const input = document.getElementById('codigo-' + i);
                    if (input) input.value = '';
                }
                const first = document.getElementById('codigo-1');
                if (first) first.focus();
            }
        } catch (err) {
            console.error('Error verificando código:', err);
            alert('Error: ' + err.message);
        }
    },

    showResultModal() {
        const modal = document.getElementById('alerta-resultado-modal');
        if (modal) modal.style.display = 'flex';
    },

    hideResultModal() {
        const modal = document.getElementById('alerta-resultado-modal');
        if (modal) modal.style.display = 'none';
    },

    async handleResult(result) {
        this.hideResultModal();
        if (result === 'susto' || result === 'nada') {
            await this.deleteAlert();
            if (result === 'susto') { VV.utils.showSuccess('Alerta cancelada. Fue un susto.'); }
            else { VV.utils.showSuccess('Alerta cancelada y borrada.'); }
        } else if (result === 'enviar') {
            await this.finalizeAlert(false);
        }
    },

    async deleteAlert() {
        if (!this.alertaId) return;
        for (const photoUrl of this.photos) {
            try {
                const fileName = photoUrl.split('/').pop();
                await supabase.storage.from('alertas-photos').remove([fileName]);
            } catch (e) { console.error('Error borrando foto:', e); }
        }
        if (this.audioChunks.length > 0) {
            try {
                const fileName = 'alerta-audio-' + this.alertaId + '.webm';
                await supabase.storage.from('alertas-photos').remove([fileName]);
            } catch (e) { console.error('Error borrando audio:', e); }
        }
        try {
            await supabase.from('alertas_vecinales').delete().eq('id', this.alertaId);
        } catch (e) { console.error('Error borrando alerta:', e); }
        const modal = document.getElementById('alerta-modal');
        if (modal) modal.style.display = 'none';
        this.isActive = false;
        this.alertaId = null;
    },

    stopCapture() {
        if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
        if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
        if (this.photoInterval) { clearInterval(this.photoInterval); this.photoInterval = null; }
        if (this.gpsInterval) { clearInterval(this.gpsInterval); this.gpsInterval = null; }
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') { this.mediaRecorder.stop(); }
        if (this.stream) { this.stream.getTracks().forEach(track => track.stop()); this.stream = null; }
        if (this.audioStream) { this.audioStream.getTracks().forEach(track => track.stop()); this.audioStream = null; }
        if (this.audioContext) { try { this.audioContext.close(); } catch (e) {} this.audioContext = null; }
    }
};
// ============================================================
// NOTIFICACIONES A VECINOS - MODO VIGILANCIA
// ============================================================

// Verificar alertas aprobadas en el barrio
VV.alertas.verificarAlertasPublicas = async function() {
    const user = VV_ROLES.getCurrentUser();
    if (!user) return;

    var barrio = user.neighborhood || VV.data.neighborhood;
    if (!barrio) return;

    try {
        var { data: alertas, error } = await supabase
            .from('alertas_vecinales')
            .select('*')
            .eq('status', 'approved')
            .eq('neighborhood', barrio)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        if (!alertas || alertas.length === 0) return;

        var alerta = alertas[0];
        var yaVista = localStorage.getItem('alerta_vista_' + alerta.id);

        if (!yaVista) {
            VV.alertas.mostrarNotificacion(alerta);
        }
    } catch (err) {
        console.error('Error verificando alertas publicas:', err);
    }
};

// Mostrar notificacion flotante
VV.alertas.mostrarNotificacion = function(alerta) {
    var notif = document.getElementById('alerta-notificacion');
    if (!notif) return;

    var titulo = document.getElementById('alerta-notif-titulo');
    var detalle = document.getElementById('alerta-notif-detalle');

    if (titulo) titulo.textContent = 'Alerta en ' + (alerta.neighborhood || 'tu barrio');
    if (detalle) detalle.textContent = 'Toca para ver la evidencia';

    notif.style.display = 'flex';

    // Sonido de notificacion
    VV.alertas.reproducirSonido();

    // Guardar alerta actual
    VV.alertas.alertaPublicaActual = alerta;

    // Auto-ocultar despues de 15 segundos
    setTimeout(function() {
        if (notif.style.display !== 'none') {
            notif.style.display = 'none';
        }
    }, 15000);
};

// Reproducir sonido simple
VV.alertas.reproducirSonido = function() {
    try {
        var silenciado = localStorage.getItem('alerta_sonido_silenciado');
        if (silenciado === 'true') return;

        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var oscillator = ctx.createOscillator();
        var gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);

        // Segundo beep despues de 600ms
        setTimeout(function() {
            var ctx2 = new (window.AudioContext || window.webkitAudioContext)();
            var osc2 = ctx2.createOscillator();
            var gain2 = ctx2.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx2.destination);
            osc2.frequency.value = 1000;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, ctx2.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx2.currentTime + 0.5);
            osc2.start(ctx2.currentTime);
            osc2.stop(ctx2.currentTime + 0.5);
        }, 600);
    } catch (e) {
        console.error('Error reproduciendo sonido:', e);
    }
};

// Abrir alerta publica
VV.alertas.abrirAlertaPublica = function() {
    var notif = document.getElementById('alerta-notificacion');
    if (notif) notif.style.display = 'none';

    var alerta = VV.alertas.alertaPublicaActual;
    if (!alerta) return;

    localStorage.setItem('alerta_vista_' + alerta.id, 'true');

    var modal = document.getElementById('alerta-publica-modal');
    var contenido = document.getElementById('alerta-publica-contenido');
    var titulo = document.getElementById('alerta-publica-titulo');

    if (titulo) titulo.textContent = 'Alerta en ' + (alerta.neighborhood || 'tu barrio');

    var photos = alerta.photos || [];
    var gpsPoints = alerta.gps_points || [];
    var time = new Date(alerta.created_at).toLocaleString('es-AR');

    var html = '';

    // Info del vecino
    html += '<div style="background: #fef2f2; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">';
    html += '<p style="margin: 0 0 0.25rem 0; color: #1e293b; font-weight: bold;">' + (alerta.user_name || 'Vecino') + '</p>';
    html += '<p style="margin: 0 0 0.25rem 0; color: #64748b; font-size: 0.85rem;">' + time + (alerta.is_auto ? ' (AUTO-ENVIADA)' : '') + '</p>';
    html += '<p style="margin: 0; color: #64748b; font-size: 0.85rem;">' + (alerta.neighborhood || 'Sin barrio') + '</p>';
    html += '</div>';

    // Fotos
    html += '<h3 style="color: #1e293b; font-size: 1rem; margin-bottom: 0.5rem;">Fotos (' + photos.length + ')</h3>';
    if (photos.length > 0) {
        html += '<div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem;">';
        for (var i = 0; i < photos.length; i++) {
            html += '<img src="' + photos[i] + '" style="width: 200px; height: 150px; object-fit: cover; border-radius: 8px; cursor: pointer;" onclick="window.open(\'' + photos[i] + '\', \'_blank\')">';
        }
        html += '</div>';
    } else {
        html += '<p style="color: #64748b;">No hay fotos</p>';
    }

    html += '<hr style="margin: 1rem 0; border: none; border-top: 1px solid #e2e8f0;">';

    // Audio
    html += '<h3 style="color: #1e293b; font-size: 1rem; margin-bottom: 0.5rem;">Audio</h3>';
    if (alerta.audio_url) {
        html += '<audio controls src="' + alerta.audio_url + '" style="width: 100%; margin-bottom: 0.5rem;"></audio>';
    } else {
        html += '<p style="color: #64748b;">No hay audio</p>';
    }

    html += '<hr style="margin: 1rem 0; border: none; border-top: 1px solid #e2e8f0;">';

    // GPS
    html += '<h3 style="color: #1e293b; font-size: 1rem; margin-bottom: 0.5rem;">Ubicacion GPS (' + gpsPoints.length + ' puntos)</h3>';
    if (gpsPoints.length > 0) {
        var lastPoint = gpsPoints[gpsPoints.length - 1];
        var mapsUrl = 'https://www.google.com/maps?q=' + lastPoint.lat + ',' + lastPoint.lng;
        html += '<a href="' + mapsUrl + '" target="_blank" style="display: block; background: #3b82f6; color: white; padding: 0.5rem; border-radius: 8px; text-align: center; text-decoration: none; font-size: 0.85rem; font-weight: bold;">Ver ubicacion en el mapa</a>';
    } else {
        html += '<p style="color: #64748b;">No hay datos GPS</p>';
    }

    html += '<hr style="margin: 1rem 0; border: none; border-top: 1px solid #e2e8f0;">';

    // Seccion de avistajes
    html += '<h3 style="color: #1e293b; font-size: 1rem; margin-bottom: 0.5rem;">Aportar informacion</h3>';
    html += '<p style="color: #64748b; font-size: 0.85rem; margin-bottom: 0.75rem;">Si viste algo o podes ayudar, aportá una foto o un mensaje.</p>';

    html += '<div style="background: #f8fafc; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.75rem;">';
    html += '<input type="file" id="avistaje-foto" accept="image/*" capture="environment" style="margin-bottom: 0.5rem; width: 100%;">';
    html += '<textarea id="avistaje-nota" placeholder="Ej: Vi a la persona ir hacia..." style="width: 100%; padding: 0.5rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem; resize: vertical;" rows="2"></textarea>';
    html += '<button onclick="VV.alertas.enviarAvistaje(\'' + alerta.id + '\')" style="width: 100%; background: #10b981; color: white; padding: 0.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 0.5rem;">Enviar avistaje</button>';
    html += '</div>';

    // Avistajes existentes
    html += '<div id="avistajes-lista" style="margin-top: 0.5rem;"></div>';

    if (contenido) contenido.innerHTML = html;
    if (modal) modal.style.display = 'flex';

    // Cargar avistajes existentes
    VV.alertas.cargarAvistajes(alerta.id);
};

// Enviar avistaje
VV.alertas.enviarAvistaje = async function(alertaId) {
    var user = VV_ROLES.getCurrentUser();
    if (!user) { alert('Debes iniciar sesion'); return; }

    var fotoInput = document.getElementById('avistaje-foto');
    var nota = document.getElementById('avistaje-nota');
    var notaTexto = nota ? nota.value.trim() : '';

    if (!fotoInput.files[0] && !notaTexto) {
        alert('Agrega una foto o un mensaje');
        return;
    }

    var photoUrl = null;

    // Subir foto si existe
    if (fotoInput.files[0]) {
        try {
            var file = fotoInput.files[0];
            // Comprimir imagen
            var canvas = document.createElement('canvas');
            var img = new Image();
            var compressedBlob = await new Promise(function(resolve) {
                img.onload = function() {
                    canvas.width = 640;
                    canvas.height = 480;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 640, 480);
                    canvas.toBlob(resolve, 'image/jpeg', 0.6);
                };
                img.src = URL.createObjectURL(file);
            });

            if (compressedBlob) {
                var fileName = 'avistaje-' + alertaId + '-' + Date.now() + '.jpg';
                var { error: uploadError } = await supabase.storage
                    .from('alertas-photos')
                    .upload(fileName, compressedBlob);

                if (!uploadError) {
                    var { data: urlData } = supabase.storage
                        .from('alertas-photos')
                        .getPublicUrl(fileName);
                    photoUrl = urlData.publicUrl;
                }
            }
        } catch (e) {
            console.error('Error subiendo foto de avistaje:', e);
        }
    }

    // Guardar avistaje
    try {
        var { error } = await supabase
            .from('alertas_avistajes')
            .insert({
                alerta_id: alertaId,
                user_id: user.id,
                user_name: user.name,
                photo_url: photoUrl,
                note: notaTexto
            });

        if (error) throw error;

        // Limpiar
        if (nota) nota.value = '';
        if (fotoInput) fotoInput.value = '';

        VV.utils.showSuccess('Avistaje enviado');
        VV.alertas.cargarAvistajes(alertaId);
    } catch (err) {
        console.error('Error enviando avistaje:', err);
        alert('Error: ' + err.message);
    }
};

// Cargar avistajes
VV.alertas.cargarAvistajes = async function(alertaId) {
    var container = document.getElementById('avistajes-lista');
    if (!container) return;

    container.innerHTML = '<p style="color: #94a3b8; font-size: 0.85rem;">Cargando avistajes...</p>';

    try {
        var { data: avistajes, error } = await supabase
            .from('alertas_avistajes')
            .select('*')
            .eq('alerta_id', alertaId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!avistajes || avistajes.length === 0) {
            container.innerHTML = '<p style="color: #94a3b8; font-size: 0.85rem;">Aun no hay avistajes. Se el primero en aportar.</p>';
            return;
        }

        var html = '<h4 style="color: #1e293b; font-size: 0.9rem; margin-bottom: 0.5rem;">Avistajes (' + avistajes.length + ')</h4>';

        for (var i = 0; i < avistajes.length; i++) {
            var av = avistajes[i];
            var avTime = new Date(av.created_at).toLocaleString('es-AR');
            html += '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem;">';
            html += '<p style="margin: 0 0 0.25rem 0; font-weight: bold; color: #1e293b; font-size: 0.85rem;">' + (av.user_name || 'Vecino') + '</p>';
            html += '<p style="margin: 0 0 0.25rem 0; color: #94a3b8; font-size: 0.75rem;">' + avTime + '</p>';
            if (av.photo_url) {
                html += '<img src="' + av.photo_url + '" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 0.25rem; cursor: pointer;" onclick="window.open(\'' + av.photo_url + '\', \'_blank\')">';
            }
            if (av.note) {
                html += '<p style="margin: 0; color: #475569; font-size: 0.85rem;">' + av.note + '</p>';
            }
            html += '</div>';
        }

        container.innerHTML = html;
    } catch (err) {
        console.error('Error cargando avistajes:', err);
        container.innerHTML = '<p style="color: #ef4444; font-size: 0.85rem;">Error cargando avistajes.</p>';
    }
};

// Iniciar verificacion periodica de alertas
VV.alertas.iniciarVerificacion = function() {
    // Verificar cada 30 segundos
    setInterval(function() {
        VV.alertas.verificarAlertasPublicas();
    }, 30000);

    // Verificar inmediatamente
    VV.alertas.verificarAlertasPublicas();
};

setTimeout(() => {
    if (typeof VV_ROLES !== 'undefined' && VV_ROLES.getCurrentUser()) {
        VV.alertas.init();
    }
}, 2000);
