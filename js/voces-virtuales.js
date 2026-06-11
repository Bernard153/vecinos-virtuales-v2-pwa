// ============================================================
// 🎤 VOCES VIRTUALES V2
// ============================================================

window.VV_VOCES = {
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
    modoAcustico: false,
    youtubeEmbedHTML: null,
    
    CATALOGO_LOCAL: [
        { id: 'XW5U8pWJqK4', title: 'Soda Stereo - De Música Ligera (Karaoke)', genre: 'rock' },
        { id: 'M7X9XyVfSgA', title: 'Chaqueño Palavecino - Amor Salvaje (Karaoke)', genre: 'folclore' },
        { id: '3wVw86mI6N0', title: 'Gilda - No me arrepiento de este amor (Karaoke)', genre: 'cumbia' },
        { id: 'dLHtK9UVaaA', title: 'Los Fabulosos Cadillacs - Matador de Matadores', genre: 'rock' },
        { id: 'qqfQaWRAyfo', title: 'Mercedes Sosa - Gracias a la Vida (Karaoke)', genre: 'folclore' }
    ],
    
    init: function() {
        console.log('🎤 Voces Virtuales V2 inicializado');
    },
    
    switchTab: function(tabName) {
        var crear = document.getElementById('vv-tab-crear');
        var ensayo = document.getElementById('vv-tab-ensayo');
        if (!crear || !ensayo) return;
        if (tabName === 'ensayo') {
            crear.style.display = 'none';
            ensayo.style.display = 'block';
        } else {
            ensayo.style.display = 'none';
            crear.style.display = 'block';
        }
    },
    
    onAudioSelected: function() {
        var file = document.getElementById('vv-upload-audio').files[0];
        var nameEl = document.getElementById('vv-audio-name');
        if (nameEl) nameEl.textContent = file ? '🎵 ' + file.name : '';
        this.checkCanLoad();
    },
    
    onLyricSelected: function() {
        var file = document.getElementById('vv-upload-letra').files[0];
        var nameEl = document.getElementById('vv-letra-name');
        if (nameEl) nameEl.textContent = file ? '📄 ' + file.name : '';
    },
    
    checkCanLoad: function() {
        var hasAudio = document.getElementById('vv-upload-audio').files.length > 0;
        var btn = document.getElementById('vv-btn-cargar-estudio');
        if (btn) {
            btn.disabled = !hasAudio;
            btn.style.opacity = hasAudio ? '1' : '0.5';
        }
    },
    
    loadLocalTrackFromInputs: function() {
        var audioFile = document.getElementById('vv-upload-audio').files[0];
        var lrcFile = document.getElementById('vv-upload-letra').files[0];
        if (!audioFile) { alert('Seleccioná una pista de audio primero.'); return; }
        this.loadLocalTrack(audioFile, lrcFile);
    },
    
    loadLocalTrack: function(audioFile, lrcFile) {
        if (!audioFile) return;
        var self = this;
        var readerAudio = new FileReader();
        readerAudio.onload = function(e) {
            self.audioTrackBlobURL = URL.createObjectURL(new Blob([e.target.result], {type: audioFile.type}));
            var audioEl = document.getElementById('vv-pista-audio');
            if (audioEl) {
                audioEl.src = self.audioTrackBlobURL;
                audioEl.style.display = 'block';
            }
            var zonaSubida = document.getElementById('vv-zona-subida');
            var zonaGrabacion = document.getElementById('vv-zona-grabacion');
            if (zonaSubida) zonaSubida.style.display = 'none';
            if (zonaGrabacion) zonaGrabacion.style.display = 'block';
        };
        readerAudio.readAsArrayBuffer(audioFile);
        
        if (lrcFile) {
            var readerLetra = new FileReader();
            readerLetra.onload = function(e) {
                var texto = e.target.result;
                if (lrcFile.name.toLowerCase().endsWith('.lrc')) {
                    self.parsearLRC(texto);
                } else {
                    self.isLRC = false;
                    var container = document.getElementById('vv-letra-container');
                    if (container) container.innerHTML = texto.replace(/\n/g, '<br>');
                }
            };
            readerLetra.readAsText(lrcFile);
        } else {
            this.isLRC = false;
            var container = document.getElementById('vv-letra-container');
            if (container) container.innerHTML = '<p class="vv-letra-placeholder">Canción Original<br>(Sin letra sincronizada)</p>';
        }
    },
    
    irAGrabarSinPista: function() {
        this.modoAcustico = true;
        this.currentTrack = null;
        this.audioTrackBlobURL = null;
        var zonaSubida = document.getElementById('vv-zona-subida');
        var zonaGrabacion = document.getElementById('vv-zona-grabacion');
        var letraContainer = document.getElementById('vv-letra-container');
        var audioEl = document.getElementById('vv-pista-audio');
        if (zonaSubida) zonaSubida.style.display = 'none';
        if (zonaGrabacion) zonaGrabacion.style.display = 'block';
        if (audioEl) audioEl.style.display = 'none';
        if (letraContainer) {
            letraContainer.innerHTML = '<div style="text-align:center;"><span style="font-size:3rem;display:block;margin-bottom:0.5rem;">🎸</span><p style="font-size:1.2rem;color:#fbbf24;font-weight:700;">Modo Acústico en Vivo</p><p style="font-size:0.9rem;color:#94a3b8;">Tocá tu instrumento y cantá.<br>La grabación captura todo.</p></div>';
        }
        this.prepararCamara();
    },
    
    prepararCamara: async function() {
        try {
            this.streamCamaraMicro = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } },
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            var camaraPreview = document.getElementById('vv-camara-preview');
            if (camaraPreview) camaraPreview.srcObject = this.streamCamaraMicro;
        } catch (err) {
            console.error('Error preparando cámara:', err);
        }
    },
    
    parsearLRC: function(texto) {
        this.lrcLineas = [];
        this.isLRC = true;
        var lineas = texto.split('\n');
        var regexTiempo = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
        for (var i = 0; i < lineas.length; i++) {
            var match = regexTiempo.exec(lineas[i]);
            if (match) {
                var minutos = parseInt(match[1]);
                var segundos = parseInt(match[2]);
                var milisegundos = parseInt(match[3]);
                var divisorMs = match[3].length === 2 ? 100 : 1000;
                var tiempoTotal = (minutos * 60) + segundos + (milisegundos / divisorMs);
                var textoLinea = lineas[i].replace(regexTiempo, '').trim();
                this.lrcLineas.push({ tiempo: tiempoTotal, texto: textoLinea });
            }
        }
        if (this.lrcLineas.length > 0) {
            var container = document.getElementById('vv-letra-container');
            if (container) container.innerHTML = '<span class="linea-activa">' + this.lrcLineas[0].texto + '</span>';
        }
        var audioEl = document.getElementById('vv-pista-audio');
        var self = this;
        if (audioEl) {
            audioEl.addEventListener('timeupdate', function() {
                self.sincronizarLetras(audioEl.currentTime);
            });
        }
    },
    
    sincronizarLetras: function(currentTime) {
        if (!this.isLRC || this.lrcLineas.length === 0) return;
        var lineaActiva = this.lrcLineas[0];
        for (var i = 0; i < this.lrcLineas.length; i++) {
            if (currentTime >= this.lrcLineas[i].tiempo) {
                lineaActiva = this.lrcLineas[i];
            } else {
                break;
            }
        }
        var container = document.getElementById('vv-letra-container');
        if (container && container.innerText !== lineaActiva.texto) {
            container.innerHTML = '<span class="linea-activa">' + lineaActiva.texto + '</span>';
        }
    },
    
    toggleRecording: function() {
        if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    },
    
    startRecording: async function() {
        var btnRec = document.getElementById('vv-btn-rec-action');
        var audioComponent = document.getElementById('vv-pista-audio');
        try {
            this.streamCamaraMicro = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            var camaraPreview = document.getElementById('vv-camara-preview');
            if (camaraPreview) camaraPreview.srcObject = this.streamCamaraMicro;
            var opcionesCodec = { mimeType: 'video/webm;codecs=vp8,opus' };
            if (!MediaRecorder.isTypeSupported(opcionesCodec.mimeType)) {
                opcionesCodec = { mimeType: 'video/mp4' };
            }
            this.mediaRecorder = new MediaRecorder(this.streamCamaraMicro, opcionesCodec);
            this.fragmentosVideo = [];
            var self = this;
            this.mediaRecorder.ondataavailable = function(e) {
                if (e.data && e.data.size > 0) self.fragmentosVideo.push(e.data);
            };
            this.mediaRecorder.onstop = function() {
                self.videoGrabadoBlob = new Blob(self.fragmentosVideo, { type: opcionesCodec.mimeType });
                var previewEl = document.getElementById('vv-preview-grabacion');
                if (previewEl) previewEl.src = URL.createObjectURL(self.videoGrabadoBlob);
                var zonaGrabacion = document.getElementById('vv-zona-grabacion');
                var zonaPost = document.getElementById('vv-zona-post-grabacion');
                if (zonaGrabacion) zonaGrabacion.style.display = 'none';
                if (zonaPost) zonaPost.style.display = 'block';
            };
            if (btnRec) btnRec.classList.add('grabando');
            this.mediaRecorder.start();
            if (audioComponent && audioComponent.src && !this.modoAcustico) {
                audioComponent.currentTime = 0;
                audioComponent.play();
            }
        } catch (err) {
            alert("Fallo de hardware de cámara/micrófono: " + err.message);
        }
    },
    
    stopRecording: function() {
        var btnRec = document.getElementById('vv-btn-rec-action');
        if (btnRec) btnRec.classList.remove('grabando');
        if (this.mediaRecorder) this.mediaRecorder.stop();
        var audioComponent = document.getElementById('vv-pista-audio');
        if (audioComponent) audioComponent.pause();
        if (this.streamCamaraMicro) {
            this.streamCamaraMicro.getTracks().forEach(function(track) { track.stop(); });
        }
    },
    
    discardRecording: function() {
        this.videoGrabadoBlob = null;
        this.fragmentosVideo = [];
        this.mediaRecorder = null;
        this.modoAcustico = false;
        var inputTitulo = document.getElementById('vv-input-titulo-obra');
        var checkDerechos = document.getElementById('vv-check-derechos');
        var zonaPost = document.getElementById('vv-zona-post-grabacion');
        var zonaGrabacion = document.getElementById('vv-zona-grabacion');
        var zonaSubida = document.getElementById('vv-zona-subida');
        var contenedorProgreso = document.getElementById('vv-contenedor-progreso');
        var barraProgreso = document.getElementById('vv-barra-progreso');
        var audioEl = document.getElementById('vv-pista-audio');
        if (inputTitulo) inputTitulo.value = "";
        if (checkDerechos) checkDerechos.checked = false;
        if (zonaPost) zonaPost.style.display = 'none';
        if (zonaGrabacion) zonaGrabacion.style.display = 'none';
        if (zonaSubida) zonaSubida.style.display = 'block';
        if (contenedorProgreso) contenedorProgreso.style.display = 'none';
        if (barraProgreso) barraProgreso.style.width = '0%';
        if (audioEl) {
            audioEl.pause();
            audioEl.src = '';
            audioEl.style.display = 'block';
        }
        var camaraPreview = document.getElementById('vv-camara-preview');
        if (camaraPreview) camaraPreview.srcObject = null;
        var letraContainer = document.getElementById('vv-letra-container');
        if (letraContainer) letraContainer.innerHTML = '<p class="vv-letra-placeholder">La letra aparecerá aquí...</p>';
    },
    
    descargarLocal: function() {
        if (!this.videoGrabadoBlob) return;
        var url = URL.createObjectURL(this.videoGrabadoBlob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'VocesVirtuales_' + Date.now() + '.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('📥 Video guardado en tu celular.');
    },
    
    publishOriginal: function() {
        var titleInput = document.getElementById('vv-input-titulo-obra');
        var checkDerechos = document.getElementById('vv-check-derechos');
        var title = titleInput ? titleInput.value.trim() : '';
        var isAuthor = checkDerechos ? checkDerechos.checked : false;
        if (!title) { alert('Por favor, ingresá el título de tu obra.'); return; }
        if (!isAuthor) { alert('Debés confirmar que sos el autor.'); return; }
        var perms = VV_ROLES ? VV_ROLES.getPermissions() : {};
        if (!perms.canFullKaraoke) { alert('Necesitás ser vecino verificado.'); return; }
        if (!this.videoGrabadoBlob) { alert('No hay grabación.'); return; }
        this.uploadVideo(this.videoGrabadoBlob, {
            title: title,
            is_original: true,
            track_id: this.currentTrack ? this.currentTrack.id : null,
            track_title: this.currentTrack ? this.currentTrack.title : null
        });
    },
    
    uploadVideo: async function(blob, metadataObra) {
        if (!blob) { alert('No hay video.'); return; }
        var btnPublicar = document.getElementById('vv-btn-publicar');
        var btnDescartar = document.getElementById('vv-btn-descartar');
        var contenedorProgreso = document.getElementById('vv-contenedor-progreso');
        var barraProgreso = document.getElementById('vv-barra-progreso');
        var textoProgreso = document.getElementById('vv-texto-progreso');
        var porcentajeProgreso = document.getElementById('vv-porcentaje-progreso');
        var user = VV_ROLES ? VV_ROLES.getCurrentUser() : null;
        if (!user || !user.id) { alert('Debes estar logueado.'); return; }
        if (btnPublicar) btnPublicar.disabled = true;
        if (btnDescartar) btnDescartar.disabled = true;
        if (contenedorProgreso) contenedorProgreso.style.display = 'block';
        if (barraProgreso) barraProgreso.style.width = '5%';
        if (textoProgreso) textoProgreso.textContent = 'Preparando...';
        try {
            var extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
            var nombreArchivo = 'video_' + Date.now() + '_' + Math.floor(Math.random() * 1000) + '.' + extension;
            var filePath = 'voces-virtuales/' + nombreArchivo;
            if (textoProgreso) textoProgreso.textContent = 'Subiendo...';
            var uploadResult = await supabase.storage.from('barrio-media').upload(filePath, blob, {
                cacheControl: '3600',
                upsert: false,
                contentType: blob.type || 'video/webm'
            });
            if (uploadResult.error) throw uploadResult.error;
            var urlResult = supabase.storage.from('barrio-media').getPublicUrl(filePath);
            var publicUrl = urlResult.data.publicUrl;
            if (barraProgreso) barraProgreso.style.width = '100%';
            if (porcentajeProgreso) porcentajeProgreso.textContent = '100%';
            if (textoProgreso) textoProgreso.textContent = 'Guardando datos...';
            var dbResult = await supabase.from('karaoke_videos').insert([{
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
            if (dbResult.error) throw dbResult.error;
            if (VV_ROLES) VV_ROLES.trackAction('karaoke');
            setTimeout(function() {
                alert('🎉 ¡Tu obra fue publicada!');
                VV_VOCES.discardRecording();
            }, 500);
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error: ' + (error.message || 'Error desconocido'));
            if (btnPublicar) btnPublicar.disabled = false;
            if (btnDescartar) btnDescartar.disabled = false;
        }
    },
    
    searchYouTube: async function(query) {
        if (!query) return;
        var container = document.getElementById('vv-resultados-ensayo');
        if (!container) return;
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;">🔍 Buscando...</p>';
        try {
            var res = await fetch('https://youtube-proxy.cibernico01.workers.dev/youtube/search?q=' + encodeURIComponent(query) + '&maxResults=8');
            var data = await res.json();
            if (data.items && data.items.length > 0) {
                container.innerHTML = data.items.map(function(item) {
                    return '<div class="vv-result-item" onclick="VV_VOCES.loadYouTubeTrack(\'' + item.id.videoId + '\', \'' + item.snippet.title.replace(/'/g, "\\'") + '\')">' +
                        '<div class="vv-result-thumb">🎵</div>' +
                        '<div class="vv-result-info"><p class="vv-result-title">' + item.snippet.title + '</p></div>' +
                    '</div>';
                }).join('');
            } else {
                container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;">Sin resultados</p>';
            }
        } catch(e) {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;">Error de conexión</p>';
        }
    },
    
    loadYouTubeTrack: function(videoId, title) {
        var container = document.getElementById('vv-youtube-embed');
        if (!container) return;
        container.style.display = 'block';
        this.currentYouTubeId = videoId;
        this.currentYouTubeTitle = title;
        container.innerHTML = '<h3><i class="fas fa-play-circle"></i> ' + title + '</h3>' +
            '<iframe width="100%" height="200" src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&controls=1&modestbranding=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:0.75rem;"></iframe>' +
            '<p style="color:#94a3b8;font-size:0.8rem;margin-top:0.5rem;"><i class="fas fa-headphones"></i> Usá auriculares.</p>' +
            '<button id="vv-btn-grabar-ensayo" class="vv-btn-primary" onclick="VV_VOCES.startPracticeRecording()" style="margin-top:0.75rem;"><i class="fas fa-circle"></i> Grabar Mi Ensayo</button>';
    },
    
    startPracticeRecording: async function() {
        try {
            var stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.streamCamaraMicro = stream;
            this.fragmentosVideo = [];
            var options = { mimeType: 'video/webm;codecs=vp8,opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/mp4';
            }
            this.mediaRecorder = new MediaRecorder(stream, options);
            var self = this;
            this.mediaRecorder.ondataavailable = function(e) {
                if (e.data && e.data.size > 0) self.fragmentosVideo.push(e.data);
            };
            this.mediaRecorder.onstop = function() {
                self.videoGrabadoBlob = new Blob(self.fragmentosVideo, { type: options.mimeType });
                self.mostrarPreviewEnsayo();
            };
            this.mediaRecorder.start(1000);
            var btn = document.getElementById('vv-btn-grabar-ensayo');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-stop"></i> Detener Grabación';
                btn.style.background = '#dc2626';
                btn.onclick = function() { self.stopPracticeRecording(); };
            }
            this.mostrarIndicadorGrabacion();
        } catch(err) {
            alert('Error: ' + err.message);
        }
    },
    
    mostrarIndicadorGrabacion: function() {
        var indicador = document.getElementById('vv-indicador-grabando');
        if (!indicador) {
            indicador = document.createElement('div');
            indicador.id = 'vv-indicador-grabando';
            indicador.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#dc2626;color:white;padding:8px 16px;border-radius:20px;font-size:0.85rem;font-weight:700;z-index:10000;display:none;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
            document.body.appendChild(indicador);
        }
        indicador.innerHTML = '<span style="width:10px;height:10px;background:white;border-radius:50%;display:inline-block;"></span> 🔴 Grabando ensayo...';
        indicador.style.display = 'flex';
    },
    
    ocultarIndicadorGrabacion: function() {
        var indicador = document.getElementById('vv-indicador-grabando');
        if (indicador) indicador.style.display = 'none';
    },
    
    stopPracticeRecording: function() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        this.ocultarIndicadorGrabacion();
        var youtubeContainer = document.getElementById('vv-youtube-embed');
        if (youtubeContainer) {
            this.youtubeEmbedHTML = youtubeContainer.innerHTML;
            youtubeContainer.style.display = 'none';
            youtubeContainer.innerHTML = '';
        }
        if (this.streamCamaraMicro) {
            this.streamCamaraMicro.getTracks().forEach(function(t) { t.stop(); });
        }
        var btn = document.getElementById('vv-btn-grabar-ensayo');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-circle"></i> Grabar Mi Ensayo';
            btn.style.background = '';
            var self = this;
            btn.onclick = function() { self.startPracticeRecording(); };
        }
    },
    
    mostrarPreviewEnsayo: function() {
        if (!this.videoGrabadoBlob) return;
        var modal = document.getElementById('vv-modal-preview-ensayo');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'vv-modal-preview-ensayo';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:10001;display:none;flex-direction:column;justify-content:center;align-items:center;padding:1rem;';
            modal.innerHTML = '<div style="background:#1e293b;border-radius:1rem;padding:1.5rem;max-width:500px;width:100%;">' +
                '<h3 style="margin:0 0 0.5rem 0;color:#f8fafc;text-align:center;">🎤 Revisá tu Ensayo</h3>' +
                '<div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:0.5rem;padding:0.75rem;margin-bottom:1rem;font-size:0.8rem;color:#fcd34d;">' +
                '<i class="fas fa-info-circle"></i> <strong>Nota:</strong> Esta grabación captura solo tu voz. La pista de YouTube no se graba por limitaciones del navegador.</div>' +
                '<video id="vv-preview-video-ensayo" controls style="width:100%;border-radius:0.75rem;background:#000;margin-bottom:1rem;max-height:250px;"></video>' +
                '<p id="vv-preview-titulo-ensayo" style="color:#94a3b8;text-align:center;font-size:0.9rem;margin-bottom:1rem;"></p>' +
                '<div style="display:flex;gap:0.75rem;">' +
                '<button id="vv-btn-guardar-ensayo" style="flex:1;padding:1rem;border-radius:0.75rem;border:none;background:linear-gradient(135deg,#10b981,#059669);color:white;font-weight:700;cursor:pointer;"><i class="fas fa-save"></i> Guardar</button>' +
                '<button id="vv-btn-descartar-ensayo" style="flex:1;padding:1rem;border-radius:0.75rem;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#94a3b8;font-weight:600;cursor:pointer;"><i class="fas fa-trash"></i> Descartar</button>' +
                '</div></div>';
            document.body.appendChild(modal);
        }
        var videoEl = document.getElementById('vv-preview-video-ensayo');
        if (videoEl) videoEl.src = URL.createObjectURL(this.videoGrabadoBlob);
        var tituloEl = document.getElementById('vv-preview-titulo-ensayo');
        if (tituloEl) tituloEl.textContent = this.currentYouTubeTitle || 'Mi Ensayo';
        var self = this;
        var btnGuardar = document.getElementById('vv-btn-guardar-ensayo');
        var btnDescartar = document.getElementById('vv-btn-descartar-ensayo');
        if (btnGuardar) btnGuardar.onclick = function() { self.savePracticeRecording(); self.cerrarModalEnsayo(); self.restaurarYouTube(); };
        if (btnDescartar) btnDescartar.onclick = function() { self.videoGrabadoBlob = null; self.cerrarModalEnsayo(); self.restaurarYouTube(); };
        modal.style.display = 'flex';
    },
    
    cerrarModalEnsayo: function() {
        var modal = document.getElementById('vv-modal-preview-ensayo');
        if (modal) modal.style.display = 'none';
        var videoEl = document.getElementById('vv-preview-video-ensayo');
        if (videoEl) { videoEl.pause(); videoEl.src = ''; }
    },
    
    restaurarYouTube: function() {
        var youtubeContainer = document.getElementById('vv-youtube-embed');
        if (youtubeContainer && this.youtubeEmbedHTML) {
            youtubeContainer.innerHTML = this.youtubeEmbedHTML;
            youtubeContainer.style.display = 'block';
        }
    },
    
    savePracticeRecording: function() {
        if (!this.videoGrabadoBlob) return;
        var perms = VV_ROLES ? VV_ROLES.getPermissions() : {};
        if (!perms.canFullKaraoke) { alert('Necesitás ser vecino verificado.'); return; }
        if (this.uploadVideo) {
            this.uploadVideo(this.videoGrabadoBlob, {
                title: 'Ensayo: ' + (this.currentYouTubeTitle || 'Sin título'),
                is_original: false,
                track_id: this.currentYouTubeId || null,
                track_title: this.currentYouTubeTitle || null
            });
        }
    }
};

window.addEventListener('DOMContentLoaded', function() {
    if (window.VV_VOCES) VV_VOCES.init();
});
