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
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.5));
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

setTimeout(() => {
    if (typeof VV_ROLES !== 'undefined' && VV_ROLES.getCurrentUser()) {
        VV.alertas.init();
    }
}, 2000);
