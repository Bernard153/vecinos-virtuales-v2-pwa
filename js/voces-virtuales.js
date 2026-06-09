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
        // ============================================================
    // 9. SUBIDA A SUPABASE STORAGE + BASE DE DATOS (Integrado)
    // ============================================================
    
    uploadVideo: async function(blob, metadataObra) {
        if (!blob) { 
            alert("No hay ninguna grabación de video válida."); 
            return; 
        }

        const btnPublicar = document.getElementById('vv-btn-publicar');
        const btnDescartar = document.getElementById('vv-btn-descartar');
        const contenedorProgreso = document.getElementById('vv-contenedor-progreso');
        const barraProgreso = document.getElementById('vv-barra-progreso');
        const textoProgreso = document.getElementById('vv-texto-progreso');
        const porcentajeProgreso = document.getElementById('vv-porcentaje-progreso');

        // Obtener usuario real
        const user = VV_ROLES ? VV_ROLES.getCurrentUser() : null;
        if (!user || !user.id) {
            alert("Debes estar logueado para publicar.");
            return;
        }

        // Bloquear interfaz
        if (btnPublicar) btnPublicar.disabled = true;
        if (btnDescartar) btnDescartar.disabled = true;
        if (contenedorProgreso) contenedorProgreso.style.display = 'block';
        if (barraProgreso) barraProgreso.style.width = '5%';
        if (textoProgreso) textoProgreso.textContent = 'Preparando subida...';

        try {
            // Generar nombre único
            const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
            const nombreArchivo = `video_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
            const filePath = `voces-virtuales/${nombreArchivo}`;

            // PASO 1: Subir a Supabase Storage con progreso real
            if (textoProgreso) textoProgreso.textContent = 'Subiendo video al barrio...';
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('barrio-media')
                .upload(filePath, blob, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: blob.type || 'video/webm',
                    onProgress: (progress) => {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        const displayPercent = Math.min(percent, 99);
                        if (barraProgreso) barraProgreso.style.width = displayPercent + '%';
                        if (porcentajeProgreso) porcentajeProgreso.textContent = displayPercent + '%';
                        if (textoProgreso) textoProgreso.textContent = `Subiendo video al barrio... ${displayPercent}%`;
                    }
                });

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('barrio-media')
                .getPublicUrl(filePath);

            if (barraProgreso) barraProgreso.style.width = '100%';
            if (porcentajeProgreso) porcentajeProgreso.textContent = '100%';
            if (textoProgreso) textoProgreso.textContent = '¡Subido! Guardando datos...';

            // PASO 2: Insertar metadata en tabla karaoke_videos
            const { error: dbError } = await supabase
                .from('karaoke_videos')
                .insert([{
                    user_id: user.id,
                    user_name: user.name || user.nickname || 'Anónimo',
                    title: metadataObra.title || 'Sin título',
                    video_url: publicUrl,
                    track_id: metadataObra.track_id || null,
                    track_title: metadataObra.track_title || null,
                    is_duet: metadataObra.is_duet || false,
                    parent_video_id: metadataObra.parent_video_id || null,
                    is_original: metadataObra.is_original || false,
                    visible: true,
                    created_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            // Éxito total
            if (textoProgreso) textoProgreso.textContent = '¡Publicado con éxito!';
            
            // Trackear acción para VIP
            if (VV_ROLES) VV_ROLES.trackAction('karaoke');

            setTimeout(() => {
                alert(`🎉 ¡Tu obra "${metadataObra.title}" fue publicada en el barrio!`);
                this.discardRecording(); // Limpiar sin recargar la página
            }, 500);

        } catch (error) {
            console.error('Error en subida:', error);
            alert('❌ Error al publicar: ' + (error.message || 'Error desconocido'));
            this.restablecerUIControles();
        }
    },

    // Función auxiliar para restaurar controles si falla
    restablecerUIControles: function() {
        const btnPublicar = document.getElementById('vv-btn-publicar');
        const btnDescartar = document.getElementById('vv-btn-descartar');
        const contenedorProgreso = document.getElementById('vv-contenedor-progreso');
        const barraProgreso = document.getElementById('vv-barra-progreso');
        
        if (btnPublicar) btnPublicar.disabled = false;
        if (btnDescartar) btnDescartar.disabled = false;
        if (contenedorProgreso) contenedorProgreso.style.display = 'none';
        if (barraProgreso) barraProgreso.style.width = '0%';
    }

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
        const apiKey = 'AIzaSyBV75vgH2KWvNgGn-OuNldrSHIignAkisA'; // Tu clave o dejar vacío
        if (apiKey && !apiKey.includes('Dummy')) {
            try {
                const url = `https://youtube-proxy.cibernico01.workers.dev/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
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
    // ============================================================
    // NAVEGACIÓN Y UTILIDADES
    // ============================================================
    
    switchTab: function(tabName) {
        const crear = document.getElementById('vv-tab-crear');
        const ensayo = document.getElementById('vv-tab-ensayo');
        if (tabName === 'ensayo') {
            crear.style.display = 'none';
            ensayo.style.display = 'block';
        } else {
            ensayo.style.display = 'none';
            crear.style.display = 'block';
        }
    },
    
    onAudioSelected: function() {
        const file = document.getElementById('vv-upload-audio').files[0];
        document.getElementById('vv-audio-name').textContent = file ? `🎵 ${file.name}` : '';
        this.checkCanLoad();
    },
    
    onLyricSelected: function() {
        const file = document.getElementById('vv-upload-letra').files[0];
        document.getElementById('vv-letra-name').textContent = file ? `📄 ${file.name}` : '';
    },
    
    checkCanLoad: function() {
        const hasAudio = document.getElementById('vv-upload-audio').files.length > 0;
        const btn = document.getElementById('vv-btn-cargar-estudio');
        btn.disabled = !hasAudio;
    },
    
    loadLocalTrackFromInputs: function() {
        const audioFile = document.getElementById('vv-upload-audio').files[0];
        const lrcFile = document.getElementById('vv-upload-letra').files[0];
        if (!audioFile) return;
        this.loadLocalTrack(audioFile, lrcFile);
    },
    
    toggleRecording: function() {
        if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    },
    
    // ============================================================
    // MODO ENSAYO (YouTube)
    // ============================================================
    
    searchYouTube: async function(query) {
        if (!query) return;
        const container = document.getElementById('vv-resultados-ensayo');
        if (!container) return;
        
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;"><i class="fas fa-spinner fa-spin"></i> Buscando...</p>';
        
        try {
            const res = await fetch(`https://youtube-proxy.cibernico01.workers.dev/youtube/search?q=${encodeURIComponent(query)}&maxResults=8`);
            const data = await res.json();
            
            if (data.items && data.items.length > 0) {
                container.innerHTML = data.items.map(item => `
                    <div class="vv-result-item" onclick="VV_VOCES.loadYouTubeTrack('${item.id.videoId}', '${item.snippet.title.replace(/'/g, "\\'")}')">
                        <div class="vv-result-thumb">🎵</div>
                        <div class="vv-result-info">
                            <p class="vv-result-title">${item.snippet.title}</p>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;">Sin resultados</p>';
            }
        } catch(e) {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;">Error en búsqueda</p>';
        }
    },
    
    loadYouTubeTrack: function(videoId, title) {
        const container = document.getElementById('vv-youtube-embed');
        if (!container) return;
        
        container.style.display = 'block';
        container.innerHTML = `
            <h3><i class="fas fa-play-circle"></i> ${title}</h3>
            <iframe width="100%" height="200" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0" 
                frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen style="border-radius:0.75rem;">
            </iframe>
            <p style="color:#94a3b8;font-size:0.8rem;margin-top:0.5rem;"><i class="fas fa-headphones"></i> Usá auriculares y cantá mientras suena la pista.</p>
            <button class="vv-btn-primary" onclick="VV_VOCES.startPracticeRecording('${title.replace(/'/g, "\\'")}', '${videoId}')" style="margin-top:0.75rem;">
                <i class="fas fa-circle"></i> Grabar Mi Ensayo
            </button>
        `;
    },
    
    startPracticeRecording: async function(title, videoId) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.streamCamaraMicro = stream;
            
            const options = { mimeType: 'video/webm;codecs=vp8,opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/mp4';
            }
            
            this.fragmentosVideo = [];
            this.mediaRecorder = new MediaRecorder(stream, options);
            
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) this.fragmentosVideo.push(e.data);
            };
            
            this.mediaRecorder.onstop = () => {
                this.videoGrabadoBlob = new Blob(this.fragmentosVideo, { type: options.mimeType });
                const confirmar = confirm('¿Querés guardar este ensayo?');
                if (confirmar) {
                    this.savePracticeRecording(title, videoId);
                }
                stream.getTracks().forEach(t => t.stop());
            };
            
            this.mediaRecorder.start();
            alert('🎤 Grabando ensayo...\n\nCantá mientras suena la pista.\nTocá Aceptar para detener.');
            
            // El usuario toca Aceptar en el alert para detener
            setTimeout(() => {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                }
            }, 100); // El alert bloquea, así que esto corre después
            
        } catch(err) {
            alert('Error: ' + err.message);
        }
    },
    
    savePracticeRecording: function(title, videoId) {
        if (!this.videoGrabadoBlob) return;
        
        const perms = VV_ROLES ? VV_ROLES.getPermissions() : {};
        if (!perms.canFullKaraoke) {
            alert('Necesitás ser vecino verificado para guardar ensayos.');
            return;
        }
        
        if (this.uploadVideo) {
            this.uploadVideo(this.videoGrabadoBlob, {
                title: `Ensayo: ${title}`,
                is_original: false,
                track_id: videoId
            });
        } else {
            alert('Sistema de subida no disponible.');
        }
    }

};
