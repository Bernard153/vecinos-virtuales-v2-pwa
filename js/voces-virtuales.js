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
            
            if (audioComponent) {
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
            title: title,
            is_original: true,
            track_id: this.currentTrack ? this.currentTrack.id : null,
            track_title: this.currentTrack ? this.currentTrack.title : null
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
            
            setTimeout(() => {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                }
            }, 100);
            
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

// Inicializar al cargar la PWA
window.addEventListener('DOMContentLoaded', () => {
    if (window.VV_VOCES) VV_VOCES.init();
});
