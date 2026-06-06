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
    
        // Iniciar grabación (solo cámara + micrófono, pista por YouTube)
    startRecording: async function() {
        if (!this.currentTrack) {
            alert('Seleccioná una canción primero');
            return;
        }
        
        try {
            // 1. Mostrar reproductor de YouTube con la pista
            this.loadYouTubePlayer(this.currentTrack.id);
            
            // 2. Capturar cámara y micrófono del usuario
            const constraints = {
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };
            
            this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Mostrar preview en espejo
            if (this.elements.videoPreview) {
                this.elements.videoPreview.srcObject = this.micStream;
                this.elements.videoPreview.style.transform = 'scaleX(-1)';
            }
            
            // 3. MediaRecorder con solo el stream del usuario
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? 'video/webm;codecs=vp9'
                : 'video/webm';
            
            const chunks = [];
            this.mediaRecorder = new MediaRecorder(this.micStream, { mimeType });
            
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };
            
            this.mediaRecorder.onstop = () => {
                this.recordingBlob = new Blob(chunks, { type: mimeType });
                this.onRecordingReady();
            };
            
            // Iniciar grabación
            this.mediaRecorder.start(250);
            this.isRecording = true;
            
            // Reproducir pista de YouTube con delay para sincronización
            setTimeout(() => {
                if (this.ytPlayer && this.ytPlayer.playVideo) {
                    this.ytPlayer.playVideo();
                }
            }, 500);
            
            this.updateUIRecording(true);
            
        } catch (err) {
            console.error('Error iniciando grabación:', err);
            
            if (err.name === 'NotFoundError' || err.message.includes('device')) {
                alert('⚠️ No se detectó cámara o micrófono.\n\nPara usar Voces Virtuales necesitás:\n• Celular con cámara frontal\n• O auriculares con micrófono\n\n💡 Abrí esta app desde tu celular para la mejor experiencia.');
            } else if (err.name === 'NotAllowedError') {
                alert('⚠️ Permiso denegado.\n\nPor favor permití el acceso a cámara y micrófono.');
            } else {
                alert('Error: ' + err.message);
            }
        }
    },
    
    // Cargar reproductor de YouTube
    ytPlayer: null,
    
    loadYouTubePlayer: function(videoId) {
        // Si ya existe el reproductor, cargar nuevo video
        if (this.ytPlayer && this.ytPlayer.loadVideoById) {
            this.ytPlayer.loadVideoById(videoId);
            return;
        }
        
        // Crear contenedor si no existe
        let playerContainer = document.getElementById('vv-youtube-player');
        if (!playerContainer) {
            playerContainer = document.createElement('div');
            playerContainer.id = 'vv-youtube-player';
            playerContainer.style.cssText = 'position:absolute;top:10px;right:10px;width:160px;height:90px;z-index:100;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.5);';
            
            const videoArea = document.querySelector('.vv-video-area');
            if (videoArea) videoArea.appendChild(playerContainer);
        }
        
        // Crear player de YouTube
        if (window.YT && window.YT.Player) {
            this.ytPlayer = new YT.Player('vv-youtube-player', {
                width: '160',
                height: '90',
                videoId: videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0
                }
            });
        }
    },
    
        // Detener grabación
    stopRecording: function() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
        }
        if (this.ytPlayer && this.ytPlayer.pauseVideo) {
            this.ytPlayer.pauseVideo();
        }
        
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
    // 🔍 BÚSQUEDA DE CANCIONES
    // ============================================================
    
    CATALOGO_LOCAL: [
        { id: 'XW5U8pWJqK4', title: 'Soda Stereo - De Música Ligera (Karaoke)', genre: 'rock' },
        { id: 'M7X9XyVfSgA', title: 'Chaqueño Palavecino - Amor Salvaje (Karaoke)', genre: 'folclore' },
        { id: '3wVw86mI6N0', title: 'Gilda - No me arrepiento de este amor (Karaoke)', genre: 'cumbia' },
        { id: 'dLHtK9UVaaA', title: 'Los Fabulosos Cadillacs - Matador de Matadores', genre: 'rock' },
        { id: 'qqfQaWRAyfo', title: 'Mercedes Sosa - Gracias a la Vida (Karaoke)', genre: 'folclore' }
    ],
    
    searchTracks: async function() {
        const input = document.getElementById('vv-search-input');
        const container = document.getElementById('vv-search-results');
        if (!input || !container) return;
        
        const query = input.value.trim().toLowerCase();
        if (!query) {
            this.showCatalog(container);
            return;
        }
        
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;">🔍 Buscando...</p>';
        
        // Buscar en catálogo local
        const local = this.CATALOGO_LOCAL.filter(t => 
            t.title.toLowerCase().includes(query) || 
            t.genre.toLowerCase().includes(query)
        );
        
        if (local.length > 0) {
            this.renderResults(container, local);
            return;
        }
        
        // Buscar en YouTube si hay API key
        const apiKey = 'AIzaSydfghdasdffasd--dfghdf'; // Tu clave o dejar vacío
        if (apiKey && !apiKey.includes('Dummy')) {
            try {
                const url = `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(query + ' karaoke')}&type=video&key=${apiKey}&maxResults=8&part=snippet`;
                const res = await fetch(url);
                const data = await res.json();
                
                if (data.items) {
                    const results = data.items.map(item => ({
                        id: item.id.videoId,
                        title: item.snippet.title,
                        genre: 'YouTube'
                    }));
                    this.renderResults(container, results);
                }
            } catch(e) {
                console.error('Error YouTube:', e);
            }
        } else {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;">No se encontraron resultados locales.</p>';
        }
    },
    
    showCatalog: function(container) {
        this.renderResults(container, this.CATALOGO_LOCAL);
    },
    
    renderResults: function(container, tracks) {
        if (!tracks.length) {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;">Sin resultados</p>';
            return;
        }
        
        container.innerHTML = tracks.map(t => `
            <div class="vv-result-item" onclick="VV_VOCES.selectTrack('${t.id}', '${t.title.replace(/'/g, "\\'")}')">
                <div class="vv-result-thumb">🎵</div>
                <div class="vv-result-info">
                    <p class="vv-result-title">${t.title}</p>
                    <p class="vv-result-genre">${t.genre}</p>
                </div>
            </div>
        `).join('');
    },
    
    selectTrack: function(trackId, trackTitle) {
        // Construir URL del audio (usamos YouTube como fuente, pero en producción deberías tener MP3)
        const trackUrl = `https://www.youtube.com/watch?v=${trackId}`;
        
        this.setup(trackId, trackUrl, trackTitle, this.currentMode, this.parentVideo);
        
        document.getElementById('vv-search-results').innerHTML = '';
        document.getElementById('vv-search-input').value = '';
        
        alert(`🎵 Pista seleccionada: ${trackTitle}\n\nAhora podés iniciar la grabación.`);
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
    init: function() {
        this.cacheElements();
        this.bindEvents();
        
        // Mostrar catálogo al inicio
        const resultsContainer = document.getElementById('vv-search-results');
        if (resultsContainer) this.showCatalog(resultsContainer);
        
        console.log('🎤 Voces Virtuales V2 inicializado');
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
