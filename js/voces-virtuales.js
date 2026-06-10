// ============================================================
// 🎤 VOCES VIRTUALES V2 — Estudio de Creación + Ensayo
// ============================================================

window.VV_VOCES = {
    
    // ============================================================
    // ESTADO INTERNO
    // ============================================================
    
    audioTrackBlobURL: null,
    lrcLineas: [],
    isLRC: false,
    mediaRecorder: null,
    fragmentosVideo: [],
    streamCamaraMicro: null,
    videoGrabadoBlob: null,
    currentTrack: null,
    currentYouTubeId: null,
    currentYouTubeTitle: null,
    
    CATALOGO_LOCAL: [
        { id: 'XW5U8pWJqK4', title: 'Soda Stereo - De Música Ligera (Karaoke)', genre: 'rock' },
        { id: 'M7X9XyVfSgA', title: 'Chaqueño Palavecino - Amor Salvaje (Karaoke)', genre: 'folclore' },
        { id: '3wVw86mI6N0', title: 'Gilda - No me arrepiento de este amor (Karaoke)', genre: 'cumbia' },
        { id: 'dLHtK9UVaaA', title: 'Los Fabulosos Cadillacs - Matador de Matadores', genre: 'rock' },
        { id: 'qqfQaWRAyfo', title: 'Mercedes Sosa - Gracias a la Vida (Karaoke)', genre: 'folclore' }
    ],
    
    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    
    init: function() {
        this.cacheElements();
        this.bindEvents();
        console.log('🎤 Voces Virtuales V2 inicializado');
    },
    
    cacheElements: function() {
        // Cachear elementos principales si es necesario
    },
    
    bindEvents: function() {
        // Eventos principales ya están en el HTML inline (onclick)
        // o se pueden agregar aquí si se prefiere
    },
    
    // ============================================================
    // NAVEGACIÓN DE TABS
    // ============================================================
    
    switchTab: function(tabName) {
        const crear = document.getElementById('vv-tab-crear');
        const ensayo = document.getElementById('vv-tab-ensayo');
        if (!crear || !ensayo) return;
        
        if (tabName === 'ensayo') {
            crear.style.display = 'none';
            ensayo.style.display = 'block';
        } else {
            ensayo.style.display = 'none';
            crear.style.display = 'block';
        }
    },
    
    // ============================================================
    // ZONA DE SUBIDA (Modo Artista)
    // ============================================================
    
    onAudioSelected: function() {
        const file = document.getElementById('vv-upload-audio').files[0];
        const nameEl = document.getElementById('vv-audio-name');
        if (nameEl) nameEl.textContent = file ? `🎵 ${file.name}` : '';
        this.checkCanLoad();
    },
    
    onLyricSelected: function() {
        const file = document.getElementById('vv-upload-letra').files[0];
        const nameEl = document.getElementById('vv-letra-name');
        if (nameEl) nameEl.textContent = file ? `📄 ${file.name}` : '';
    },
    
    checkCanLoad: function() {
        const hasAudio = document.getElementById('vv-upload-audio').files.length > 0;
        const btn = document.getElementById('vv-btn-cargar-estudio');
        if (btn) {
            btn.disabled = !hasAudio;
            btn.style.opacity = hasAudio ? '1' : '0.5';
        }
    },
    
    loadLocalTrackFromInputs: function() {
        const audioFile = document.getElementById('vv-upload-audio').files[0];
        const lrcFile = document.getElementById('vv-upload-letra').files[0];
        if (!audioFile) {
            alert('Seleccioná una pista de audio primero.');
            return;
        }
        this.loadLocalTrack(audioFile, lrcFile);
    },
    
    loadLocalTrack: function(audioFile, lrcFile) {
        if (!audioFile) return;

        const readerAudio = new FileReader();
        readerAudio.onload = (e) => {
            this.audioTrackBlobURL = URL.createObjectURL(new Blob([e.target.result], {type: audioFile.type}));
            const audioEl = document.getElementById('vv-pista-audio');
            if (audioEl) audioEl.src = this.audioTrackBlobURL;
            
            const zonaSubida = document.getElementById('vv-zona-subida');
            const zonaGrabacion = document.getElementById('vv-zona-grabacion');
            if (zonaSubida) zonaSubida.style.display = 'none';
            if (zonaGrabacion) zonaGrabacion.style.display = 'block';
        };
        readerAudio.readAsArrayBuffer(audioFile);

        if (lrcFile) {
            const readerLetra = new FileReader();
            readerLetra.onload = (e) => {
                const texto = e.target.result;
                if (lrcFile.name.toLowerCase().endsWith('.lrc')) {
                    this.parsearLRC(texto);
                } else {
                    this.isLRC = false;
                    const container = document.getElementById('vv-letra-container');
                    if (container) container.innerHTML = texto.replace(/\n/g, '<br>');
                }
            };
            readerLetra.readAsText(lrcFile);
        } else {
            this.isLRC = false;
            const container = document.getElementById('vv-letra-container');
            if (container) container.innerHTML = '<p class="vv-letra-placeholder">Canción Original<br>(Sin letra sincronizada)</p>';
        }
    },
    
    // ============================================================
    // PARSER LRC Y SINCRONIZACIÓN
    // ============================================================
    
    parsearLRC: function(texto) {
        this.lrcLineas = [];
        this.isLRC = true;
        const lineas = texto.split('\n');
        const regexTiempo = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

        lineas.forEach(linea => {
            const match = regexTiempo.exec(linea);
            if (match) {
                const minutos = parseInt(match[1]);
                const segundos = parseInt(match[2]);
                const milisegundos = parseInt(match[3]);
                const divisorMs = match[3].length === 2 ? 100 : 1000;
                const tiempoTotal = (minutos * 60) + segundos + (milisegundos / divisorMs);
                const textoLinea = linea.replace(regexTiempo, '').trim();
                this.lrcLineas.push({ tiempo: tiempoTotal, texto: textoLinea });
            }
        });
        
        if (this.lrcLineas.length > 0) {
            const container = document.getElementById('vv-letra-container');
            if (container) container.innerHTML = `<span class="linea-activa">${this.lrcLineas[0].texto}</span>`;
        }
        
        const audioEl = document.getElementById('vv-pista-audio');
        if (audioEl) {
            audioEl.addEventListener('timeupdate', () => {
                this.sincronizarLetras(audioEl.currentTime);
            });
        }
    },
    
    sincronizarLetras: function(currentTime) {
        if (!this.isLRC || this.lrcLineas.length === 0) return;
        
        let lineaActiva = this.lrcLineas[0];
        for (let i = 0; i < this.lrcLineas.length; i++) {
            if (currentTime >= this.lrcLineas[i].tiempo) {
                lineaActiva = this.lrcLineas[i];
            } else {
                break;
            }
        }
        
        const container = document.getElementById('vv-letra-container');
        if (container && container.innerText !== lineaActiva.texto) {
            container.innerHTML = `<span class="linea-activa">${lineaActiva.texto}</span>`;
        }
    },
        // ============================================================
    // MODO ACÚSTICO (sin pista subida)
    // ============================================================
    
    irAGrabarSinPista: function() {
        this.modoAcustico = true;
        this.currentTrack = null;
        this.audioTrackBlobURL = null;
        
        const zonaSubida = document.getElementById('vv-zona-subida');
        const zonaGrabacion = document.getElementById('vv-zona-grabacion');
        const letraContainer = document.getElementById('vv-letra-container');
        const audioEl = document.getElementById('vv-pista-audio');
        
        if (zonaSubida) zonaSubida.style.display = 'none';
        if (zonaGrabacion) zonaGrabacion.style.display = 'block';
        
        // Ocultar reproductor de pista (no hay pista)
        if (audioEl) audioEl.style.display = 'none';
        
        // Mostrar mensaje de modo acústico
        if (letraContainer) {
            letraContainer.innerHTML = `
                <div style="text-align: center;">
                    <span style="font-size: 3rem; display: block; margin-bottom: 0.5rem;">🎸</span>
                    <p style="font-size: 1.2rem; color: #fbbf24; font-weight: 700;">Modo Acústico en Vivo</p>
                    <p style="font-size: 0.9rem; color: #94a3b8;">Tocá tu instrumento y cantá.<br>La grabación captura todo.</p>
                </div>
            `;
        }
        
        // Iniciar cámara de inmediato para que se vea
        this.prepararCamara();
    },
    
    prepararCamara: async function() {
        try {
            this.streamCamaraMicro = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            const camaraPreview = document.getElementById('vv-camara-preview');
            if (camaraPreview) {
                camaraPreview.srcObject = this.streamCamaraMicro;
            }
        } catch (err) {
            console.error('Error preparando cámara:', err);
        }
    },

    // ============================================================
    // GRABACIÓN (Modo Artista)
    // ============================================================
    
    toggleRecording: function() {
        if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    },
        startRecording: async function() {
        const btnRec = document.getElementById('vv-btn-rec-action');
        const audioComponent = document.getElementById('vv-pista-audio');

        try {
            this.streamCamaraMicro = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            const camaraPreview = document.getElementById('vv-camara-preview');
            if (camaraPreview) camaraPreview.srcObject = this.streamCamaraMicro;

            let opcionesCodec = { mimeType: 'video/webm;codecs=vp8,opus' };
            if (!MediaRecorder.isTypeSupported(opcionesCodec.mimeType)) {
                opcionesCodec = { mimeType: 'video/mp4' };
            }

            this.mediaRecorder = new MediaRecorder(this.streamCamaraMicro, opcionesCodec);
            this.fragmentosVideo = [];
            
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) this.fragmentosVideo.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                this.videoGrabadoBlob = new Blob(this.fragmentosVideo, { type: opcionesCodec.mimeType });
                const previewEl = document.getElementById('vv-preview-grabacion');
                if (previewEl) previewEl.src = URL.createObjectURL(this.videoGrabadoBlob);
                
                const zonaGrabacion = document.getElementById('vv-zona-grabacion');
                const zonaPost = document.getElementById('vv-zona-post-grabacion');
                if (zonaGrabacion) zonaGrabacion.style.display = 'none';
                if (zonaPost) zonaPost.style.display = 'block';
            };

            if (btnRec) btnRec.classList.add('grabando');
            this.mediaRecorder.start();
            
            // Si hay pista de audio, reproducirla (si no, no pasa nada)
            if (audioComponent && audioComponent.src && !this.modoAcustico) {
                audioComponent.currentTime = 0;
                audioComponent.play();
            }

        } catch (err) {
            alert("Fallo de hardware de cámara/micrófono: " + err.message);
        }
    },
        
    stopRecording: function() {
        const btnRec = document.getElementById('vv-btn-rec-action');
        if (btnRec) btnRec.classList.remove('grabando');
        
        if (this.mediaRecorder) this.mediaRecorder.stop();
        
        const audioComponent = document.getElementById('vv-pista-audio');
        if (audioComponent) audioComponent.pause();
        
        if (this.streamCamaraMicro) {
            this.streamCamaraMicro.getTracks().forEach(track => track.stop());
        }
    },
    
    playPreview: function() {
        const previewEl = document.getElementById('vv-preview-grabacion');
        if (previewEl) previewEl.play();
    },
    
    discardRecording: function() {
        this.videoGrabadoBlob = null;
        this.fragmentosVideo = [];
        this.mediaRecorder = null;
        
        const inputTitulo = document.getElementById('vv-input-titulo-obra');
        const checkDerechos = document.getElementById('vv-check-derechos');
        const zonaPost = document.getElementById('vv-zona-post-grabacion');
        const zonaGrabacion = document.getElementById('vv-zona-grabacion');
        const contenedorProgreso = document.getElementById('vv-contenedor-progreso');
        const barraProgreso = document.getElementById('vv-barra-progreso');
        
        if (inputTitulo) inputTitulo.value = "";
        if (checkDerechos) checkDerechos.checked = false;
        if (zonaPost) zonaPost.style.display = 'none';
        if (zonaGrabacion) zonaGrabacion.style.display = 'block';
        if (contenedorProgreso) contenedorProgreso.style.display = 'none';
        if (barraProgreso) barraProgreso.style.width = '0%';
        
        const camaraPreview = document.getElementById('vv-camara-preview');
        if (camaraPreview) {
            camaraPreview.srcObject = null;
        }
    },
    
    // ============================================================
    // PUBLICACIÓN Y SUBIDA A SUPABASE
    // ============================================================
    
        publishOriginal: function() {
        const titleInput = document.getElementById('vv-input-titulo-obra');
        const checkDerechos = document.getElementById('vv-check-derechos');
        
        const title = titleInput ? titleInput.value.trim() : '';
        const isAuthor = checkDerechos ? checkDerechos.checked : false;
        
        if (!title) {
            alert('Por favor, ingresá el título de tu obra.');
            return;
        }
        if (!isAuthor) {
            alert('Debés confirmar que sos el autor de la obra para publicarla.');
            return;
        }
        
        const perms = VV_ROLES ? VV_ROLES.getPermissions() : {};
        if (!perms.canFullKaraoke) {
            alert('Necesitás ser vecino verificado para publicar obras.');
            return;
        }
        
        if (!this.videoGrabadoBlob) {
            alert('No hay grabación para subir.');
            return;
        }
        
        this.uploadVideo(this.videoGrabadoBlob, {
            title: title + (this.modoAcustico ? ' (Acústico en Vivo)' : ''),
            is_original: true,
            track_id: this.currentTrack ? this.currentTrack.id : null,
            track_title: this.currentTrack ? this.currentTrack.title : null,
            is_acoustic: this.modoAcustico || false
        });
    },
    
    uploadVideo: async function(blob, metadataObra) {
        if (!blob) {
            alert('No hay video para subir.');
            return;
        }

        const btnPublicar = document.getElementById('vv-btn-publicar');
        const btnDescartar = document.getElementById('vv-btn-descartar');
        const contenedorProgreso = document.getElementById('vv-contenedor-progreso');
        const barraProgreso = document.getElementById('vv-barra-progreso');
        const textoProgreso = document.getElementById('vv-texto-progreso');
        const porcentajeProgreso = document.getElementById('vv-porcentaje-progreso');

        const user = VV_ROLES ? VV_ROLES.getCurrentUser() : null;
        if (!user || !user.id) {
            alert('Debes estar logueado para publicar.');
            return;
        }

        if (btnPublicar) btnPublicar.disabled = true;
        if (btnDescartar) btnDescartar.disabled = true;
        if (contenedorProgreso) contenedorProgreso.style.display = 'block';
        if (barraProgreso) barraProgreso.style.width = '5%';
        if (textoProgreso) textoProgreso.textContent = 'Preparando subida...';

        try {
            const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
            const nombreArchivo = `video_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
            const filePath = `voces-virtuales/${nombreArchivo}`;

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

            const { data: { publicUrl } } = supabase.storage
                .from('barrio-media')
                .getPublicUrl(filePath);

            if (barraProgreso) barraProgreso.style.width = '100%';
            if (porcentajeProgreso) porcentajeProgreso.textContent = '100%';
            if (textoProgreso) textoProgreso.textContent = '¡Subido! Guardando datos...';

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

            if (VV_ROLES) VV_ROLES.trackAction('karaoke');

            setTimeout(() => {
                alert(`🎉 ¡Tu obra "${metadataObra.title}" fue publicada en el barrio!`);
                this.discardRecording();
            }, 500);

        } catch (error) {
            console.error('Error en subida:', error);
            alert('❌ Error al publicar: ' + (error.message || 'Error desconocido'));
            this.restablecerUIControles();
        }
    },
    
    restablecerUIControles: function() {
        const btnPublicar = document.getElementById('vv-btn-publicar');
        const btnDescartar = document.getElementById('vv-btn-descartar');
        const contenedorProgreso = document.getElementById('vv-contenedor-progreso');
        const barraProgreso = document.getElementById('vv-barra-progreso');
        
        if (btnPublicar) btnPublicar.disabled = false;
        if (btnDescartar) btnDescartar.disabled = false;
        if (contenedorProgreso) contenedorProgreso.style.display = 'none';
        if (barraProgreso) barraProgreso.style.width = '0%';
    },
    
    // ============================================================
    // MODO ENSAYO (YouTube)
    // ============================================================
    
        searchYouTube: async function(query) {
        if (!query) return;
        const container = document.getElementById('vv-resultados-ensayo');
        if (!container) return;
        
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;">🔍 Buscando...</p>';
        
        try {
            // Usar 'no-cors' como fallback o bypass del service worker
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const res = await fetch(
                `https://youtube-proxy.cibernico01.workers.dev/youtube/search?q=${encodeURIComponent(query)}&maxResults=8`,
                { 
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                }
            );
            
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${res.status}`);
            }
            
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
            console.error('Error búsqueda:', e);
            container.innerHTML = `<p style="text-align:center;color:#94a3b8;padding:1rem;">❌ Error de conexión.<br><small>${e.message}</small></p>`;
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
        // ============================================================
    // MODO ENSAYO — Grabación con Preview (sin alerts bloqueantes)
    // ============================================================
        startPracticeRecording: async function(title, videoId) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            this.streamCamaraMicro = stream;
            this.fragmentosVideo = [];
            this.currentYouTubeTitle = title;
            this.currentYouTubeId = videoId;
            
            // Mostrar cámara del usuario en pantalla
            let camOverlay = document.getElementById('vv-ensayo-camara');
            if (!camOverlay) {
                camOverlay = document.createElement('div');
                camOverlay.id = 'vv-ensayo-camara';
                camOverlay.style.cssText = 'position:fixed;bottom:80px;right:10px;width:120px;height:90px;z-index:9999;border-radius:12px;overflow:hidden;border:2px solid #ef4444;box-shadow:0 4px 12px rgba(0,0,0,0.5);';
                
                const vid = document.createElement('video');
                vid.id = 'vv-ensayo-video';
                vid.autoplay = true;
                vid.muted = true;
                vid.playsInline = true;
                vid.style.cssText = 'width:100%;height:100%;object-fit:cover;transform:scaleX(-1);background:#000;';
                
                camOverlay.appendChild(vid);
                document.body.appendChild(camOverlay);
            }
            
            const vidEl = document.getElementById('vv-ensayo-video');
            if (vidEl) vidEl.srcObject = stream;
            if (camOverlay) camOverlay.style.display = 'block';
            
            // CAMBIO CLAVE: Buscar el botón por ID en vez de event.target
            const btn = document.getElementById('vv-btn-grabar-ensayo');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-stop"></i> Detener Grabación';
                btn.style.background = '#dc2626';
                btn.onclick = () => this.stopPracticeRecording();
            }
            
            // Iniciar MediaRecorder
            const options = { mimeType: 'video/webm;codecs=vp8,opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/mp4';
            }
            
            this.mediaRecorder = new MediaRecorder(stream, options);
            this.fragmentosVideo = [];
            
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) this.fragmentosVideo.push(e.data);
            };
            
            this.mediaRecorder.onstop = () => {
                this.videoGrabadoBlob = new Blob(this.fragmentosVideo, { type: options.mimeType });
                this.mostrarPreviewEnsayo();
            };
            
            this.mediaRecorder.start(1000);
            this.mostrarIndicadorGrabacion();
            
        } catch(err) {
            alert('Error al acceder a cámara/micrófono: ' + err.message);
        }
    },
    
    mostrarIndicadorGrabacion: function() {
        // Crear un indicador flotante pequeño arriba
        let indicador = document.getElementById('vv-indicador-grabando');
        if (!indicador) {
            indicador = document.createElement('div');
            indicador.id = 'vv-indicador-grabando';
            indicador.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#dc2626;color:white;padding:8px 16px;border-radius:20px;font-size:0.85rem;font-weight:700;z-index:10000;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
            document.body.appendChild(indicador);
        }
        indicador.innerHTML = '<span style="width:10px;height:10px;background:white;border-radius:50%;animation:pulse 1s infinite;"></span> 🔴 Grabando ensayo...';
        indicador.style.display = 'flex';
    },
    
    ocultarIndicadorGrabacion: function() {
        const indicador = document.getElementById('vv-indicador-grabando');
        if (indicador) indicador.style.display = 'none';
    },
    
    stopPracticeRecording: function() {
        // Detener grabación
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        
        // Ocultar indicador
        this.ocultarIndicadorGrabacion();
        
        // Ocultar cámara overlay
        const camOverlay = document.getElementById('vv-ensayo-camara');
        if (camOverlay) camOverlay.style.display = 'none';
        
        // Detener stream
        if (this.streamCamaraMicro) {
            this.streamCamaraMicro.getTracks().forEach(t => t.stop());
        }
        
        // Restaurar botón (si existe)
        const youtubeContainer = document.getElementById('vv-youtube-embed');
        if (youtubeContainer) {
            const btn = youtubeContainer.querySelector('button');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-circle"></i> Grabar Mi Ensayo';
                btn.style.background = '';
                btn.onclick = () => this.startPracticeRecording(this.currentYouTubeTitle, this.currentYouTubeId);
            }
        }
    },
    
    mostrarPreviewEnsayo: function() {
        if (!this.videoGrabadoBlob) return;
        
        // Crear modal de preview
        let modal = document.getElementById('vv-modal-preview-ensayo');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'vv-modal-preview-ensayo';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:10001;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:1rem;';
            
            modal.innerHTML = `
                <div style="background:#1e293b;border-radius:1rem;padding:1.5rem;max-width:500px;width:100%;">
                    <h3 style="margin:0 0 1rem 0;color:#f8fafc;text-align:center;">🎤 Revisá tu Ensayo</h3>
                    <video id="vv-preview-video-ensayo" controls style="width:100%;border-radius:0.75rem;background:#000;margin-bottom:1rem;"></video>
                    <p id="vv-preview-titulo-ensayo" style="color:#94a3b8;text-align:center;font-size:0.9rem;margin-bottom:1rem;"></p>
                    <div style="display:flex;gap:0.75rem;">
                        <button id="vv-btn-guardar-ensayo" style="flex:1;padding:1rem;border-radius:0.75rem;border:none;background:linear-gradient(135deg,#10b981,#059669);color:white;font-weight:700;cursor:pointer;">
                            <i class="fas fa-save"></i> Guardar Ensayo
                        </button>
                        <button id="vv-btn-descartar-ensayo" style="flex:1;padding:1rem;border-radius:0.75rem;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#94a3b8;font-weight:600;cursor:pointer;">
                            <i class="fas fa-trash"></i> Descartar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
        
        // Configurar video
        const videoEl = document.getElementById('vv-preview-video-ensayo');
        if (videoEl) videoEl.src = URL.createObjectURL(this.videoGrabadoBlob);
        
        // Configurar título
        const tituloEl = document.getElementById('vv-preview-titulo-ensayo');
        if (tituloEl) tituloEl.textContent = this.currentYouTubeTitle || 'Mi Ensayo';
        
        // Configurar botones
        const btnGuardar = document.getElementById('vv-btn-guardar-ensayo');
        const btnDescartar = document.getElementById('vv-btn-descartar-ensayo');
        
        if (btnGuardar) {
            btnGuardar.onclick = () => {
                this.savePracticeRecording(this.currentYouTubeTitle, this.currentYouTubeId);
                this.cerrarModalEnsayo();
            };
        }
        
        if (btnDescartar) {
            btnDescartar.onclick = () => {
                this.videoGrabadoBlob = null;
                this.cerrarModalEnsayo();
            };
        }
        
        modal.style.display = 'flex';
    },
    
    cerrarModalEnsayo: function() {
        const modal = document.getElementById('vv-modal-preview-ensayo');
        if (modal) modal.style.display = 'none';
        
        // Limpiar video
        const videoEl = document.getElementById('vv-preview-video-ensayo');
        if (videoEl) {
            videoEl.pause();
            videoEl.src = '';
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
                title: `Ensayo: ${title || 'Sin título'}`,
                is_original: false,
                track_id: videoId || null,
                track_title: title || null
            });
        } else {
            alert('Sistema de subida no disponible.');
        }
    }

};

// Inicializar al cargar la PWA
window.addEventListener('DOMContentLoaded', () => {
    if (window.VV_VOCES) VV_VOCES.init();
});
