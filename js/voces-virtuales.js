// ============================================================
// 🎤 VOCES VIRTUALES V2 - Motor de Grabación Audio/Video
// ============================================================

window.VV_VOCES = {
    // Estado
    isRecording: false,
    recordingBlob: null,
    audioContext: null,
    mediaRecorder: null,
    micStream: null,
    audioSource: null,
    currentTrack: null,
    currentMode: 'solo', // 'solo' o 'dueto'
    parentVideo: null, // Para duetos
    
    // Referencias DOM
    elements: {},
    
    // Inicializar
    init: function() {
        this.cacheElements();
        this.bindEvents();
        console.log('🎤 Voces Virtuales V2 inicializado');
    },
    
    // Cachear elementos del DOM
    cacheElements: function() {
        this.elements = {
            container: document.getElementById('vv-estudio'),
            videoPreview: document.getElementById('vv-video-preview'),
            btnRecord: document.getElementById('vv-btn-record'),
            btnUpload: document.getElementById('vv-btn-upload'),
            trackTitle: document.getElementById('vv-track-title'),
            progressBar: document.getElementById('vv-upload-progress'),
            commentsContainer: document.getElementById('vv-comments-layer'),
            emojisPad: document.getElementById('vv-emojis-pad'),
            modeLabel: document.getElementById('vv-mode-label'),
            parentVideoContainer: document.getElementById('vv-parent-video')
        };
    },
    
    // Eventos
    bindEvents: function() {
        if (this.elements.btnRecord) {
            this.elements.btnRecord.addEventListener('click', () => this.toggleRecording());
        }
        if (this.elements.btnUpload) {
            this.elements.btnUpload.addEventListener('click', () => this.uploadVideo());
        }
    },
    
    // Configurar pista y modo
    setup: function(trackId, trackUrl, trackTitle, mode, parentVideoData) {
        this.currentTrack = { id: trackId, url: trackUrl, title: trackTitle };
        this.currentMode = mode || 'solo';
        this.parentVideo = parentVideoData || null;
        
        if (this.elements.trackTitle) {
            this.elements.trackTitle.textContent = trackTitle || 'Sin título';
        }
        
        if (this.elements.modeLabel) {
            this.elements.modeLabel.textContent = this.currentMode === 'dueto' 
                ? 'Modo Dueto Secuencial 👥' 
                : 'Modo Solista 🎤';
        }
        
        // Si es dueto, mostrar video padre
        if (this.currentMode === 'dueto' && this.parentVideo && this.elements.parentVideoContainer) {
            this.elements.parentVideoContainer.innerHTML = `
                <video src="${this.parentVideo.video_url}" muted playsinline autoplay loop 
                    style="width:100%;height:100%;object-fit:cover;"></video>
                <span style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,0.6);color:white;padding:4px 8px;border-radius:4px;font-size:12px;">Parte 1</span>
            `;
            this.elements.parentVideoContainer.style.display = 'block';
        }
    },
    
    // Iniciar/Detener grabación
    toggleRecording: async function() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    },
    
    // Iniciar grabación
    startRecording: async function() {
        if (!this.currentTrack) {
            alert('Seleccioná una canción primero');
            return;
        }
        
        try {
            // 1. AudioContext
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass({ sampleRate: 44100 });
            
            // 2. Descargar pista MP3
            const response = await fetch(this.currentTrack.url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // 3. Capturar cámara y micrófono
            const constraints = {
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };
            
            this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Mostrar preview
            if (this.elements.videoPreview) {
                this.elements.videoPreview.srcObject = this.micStream;
                this.elements.videoPreview.style.transform = 'scaleX(-1)'; // Espejo
            }
            
            // 4. Grafo de audio
            const destination = this.audioContext.createMediaStreamDestination();
            
            // Pista musical
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = audioBuffer;
            const trackGain = this.audioContext.createGain();
            trackGain.gain.value = 0.7;
            
            this.audioSource.connect(trackGain);
            trackGain.connect(destination);
            
            // Micrófono
            const micSource = this.audioContext.createMediaStreamSource(this.micStream);
            const micGain = this.audioContext.createGain();
            micGain.gain.value = 1.0;
            
            micSource.connect(micGain);
            micGain.connect(destination);
            
            // Monitoreo (solo con auriculares evita feedback)
            trackGain.connect(this.audioContext.destination);
            
            // 5. Combinar streams
            const combinedStream = new MediaStream();
            combinedStream.addTrack(this.micStream.getVideoTracks()[0]);
            combinedStream.addTrack(destination.stream.getAudioTracks()[0]);
            
            // 6. MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? 'video/webm;codecs=vp9'
                : 'video/webm';
            
            const chunks = [];
            this.mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
            
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };
            
            this.mediaRecorder.onstop = () => {
                this.recordingBlob = new Blob(chunks, { type: mimeType });
                this.onRecordingReady();
            };
            
            // Iniciar
            this.audioSource.start(0);
            this.mediaRecorder.start(250);
            this.isRecording = true;
            
            this.updateUIRecording(true);
            
        } catch (err) {
            console.error('Error iniciando grabación:', err);
            alert('Error al acceder a cámara/micrófono: ' + err.message);
        }
    },
    
    // Detener grabación
    stopRecording: function() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.audioSource) this.audioSource.stop();
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) this.audioContext.close();
        
        this.isRecording = false;
        this.updateUIRecording(false);
    },
    
    // Grabación lista
    onRecordingReady: function() {
        if (this.elements.btnUpload) {
            this.elements.btnUpload.style.display = 'block';
        }
        alert('¡Grabación lista! Podés reproducirla o publicarla.');
    },
    
    // Actualizar UI
    updateUIRecording: function(recording) {
        if (!this.elements.btnRecord) return;
        
        if (recording) {
            this.elements.btnRecord.innerHTML = '⏹️ Detener Grabación';
            this.elements.btnRecord.classList.add('recording');
        } else {
            this.elements.btnRecord.innerHTML = '🔴 Iniciar Grabación';
            this.elements.btnRecord.classList.remove('recording');
        }
    },
    
    // Subir video
    uploadVideo: async function() {
        if (!this.recordingBlob) return;
        
        const perms = VV_ROLES ? VV_ROLES.getPermissions() : {};
        if (!perms.canFullKaraoke) {
            alert('Necesitás ser vecino o VIP para publicar videos.');
            return;
        }
        
        try {
            this.elements.progressBar.parentElement.style.display = 'block';
            this.elements.progressBar.style.width = '30%';
            
            const fileExt = this.recordingBlob.type.includes('mp4') ? 'mp4' : 'webm';
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `voces-virtuales/${fileName}`;
            
            // Subir a Supabase Storage
            const { data, error } = await supabase.storage
                .from('barrio-media')
                .upload(filePath, this.recordingBlob, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            this.elements.progressBar.style.width = '70%';
            
            const { data: { publicUrl } } = supabase.storage
                .from('barrio-media')
                .getPublicUrl(filePath);
            
            // Guardar en DB
            const user = VV_ROLES ? VV_ROLES.getCurrentUser() : null;
            const { error: dbError } = await supabase.from('karaoke_videos').insert([{
                user_id: user ? user.id : null,
                user_name: user ? user.name || user.nickname : 'Anónimo',
                title: this.currentMode === 'dueto' 
                    ? `Dueto con ${this.parentVideo ? this.parentVideo.user_name : 'Otro'}` 
                    : this.currentTrack.title || 'Grabación Solo',
                video_url: publicUrl,
                track_id: this.currentTrack.id,
                track_title: this.currentTrack.title,
                is_duet: this.currentMode === 'dueto',
                parent_video_id: this.parentVideo ? this.parentVideo.id : null,
                visible: true
            }]);
            
            this.elements.progressBar.style.width = '100%';
            
            if (dbError) throw dbError;
            
            // Trackear acción para VIP
            if (VV_ROLES) VV_ROLES.trackAction('karaoke');
            
            alert('¡Video publicado en Voces Virtuales!');
            this.reset();
            
        } catch (err) {
            console.error('Error subiendo:', err);
            alert('Error al subir: ' + err.message);
        } finally {
            setTimeout(() => {
                if (this.elements.progressBar) {
                    this.elements.progressBar.parentElement.style.display = 'none';
                    this.elements.progressBar.style.width = '0%';
                }
            }, 2000);
        }
    },
    
    // Resetear
    reset: function() {
        this.recordingBlob = null;
        this.currentTrack = null;
        if (this.elements.btnUpload) this.elements.btnUpload.style.display = 'none';
        if (this.elements.videoPreview) {
            this.elements.videoPreview.srcObject = null;
            this.elements.videoPreview.style.transform = '';
        }
    },
    
    // ============================================================
    // 💬 SISTEMA DE COMENTARIOS BURBUJA
    // ============================================================
    
    comments: [],
    commentChannel: null,
    
    // Inicializar comentarios para un video
    initComments: function(videoId) {
        this.currentVideoId = videoId;
        this.comments = [];
        
        // Escuchar en tiempo real
        this.commentChannel = supabase
            .channel(`voces-comments-${videoId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'karaoke_comments',
                filter: `video_id=eq.${videoId}`
            }, (payload) => {
                this.showBubble(payload.new.emoji);
            })
            .subscribe();
    },
    
    // Mostrar burbuja flotante
    showBubble: function(emoji) {
        const container = this.elements.commentsContainer;
        if (!container) return;
        
        const bubble = document.createElement('div');
        bubble.className = 'vv-comment-bubble';
        bubble.textContent = emoji;
        
        // Posición aleatoria horizontal
        const randomX = Math.floor(Math.random() * 60) - 30;
        bubble.style.left = `calc(50% + ${randomX}px)`;
        bubble.style.bottom = '20px';
        
        container.appendChild(bubble);
        
        // Eliminar después de animación
        setTimeout(() => {
            if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
        }, 2000);
    },
    
    // Enviar emoji
    sendEmoji: async function(emoji) {
        if (!this.currentVideoId) return;
        
        // Mostrar localmente
        this.showBubble(emoji);
        
        // Guardar en DB
        try {
            const user = VV_ROLES ? VV_ROLES.getCurrentUser() : null;
            await supabase.from('karaoke_comments').insert([{
                video_id: this.currentVideoId,
                user_id: user ? user.id : null,
                user_name: user ? user.name || user.nickname : 'Anónimo',
                emoji: emoji,
                video_timestamp: 0
            }]);
        } catch (e) {
            console.error('Error enviando emoji:', e);
        }
    },
    
    // Limpiar comentarios
    cleanupComments: function() {
        if (this.commentChannel) {
            supabase.removeChannel(this.commentChannel);
            this.commentChannel = null;
        }
        this.currentVideoId = null;
    }
};
