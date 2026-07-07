// ============================================================
// 🎤 VOCES VIRTUALES V2 — Estudio de Creación + Ensayo
// Integración: Código IA Frontend + Correcciones Cloudflare
// ============================================================

window.VV_VOCES_V2 = {
    // Estado
    audioTrackBlobURL: null,
    lrcLineas: [],
    isLRC: false,
    mediaRecorder: null,
    fragmentosVideo: [],
    streamCamaraMicro: null,
    videoGrabadoBlob: null,
    currentMode: 'crear', // 'crear' | 'ensayo'
    currentTrack: null,
    parentVideo: null,

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    init: function() {
        this.bindEvents();
        console.log('🎤 Voces Virtuales V2 inicializado');
    },

    bindEvents: function() {
        const self = this;

        // --- TAB 1: CREAR ---
        const fileAudio = document.getElementById('vv-upload-audio');
        const fileLetra = document.getElementById('vv-upload-letra');
        const btnCargar = document.getElementById('vv-btn-cargar-estudio');
        const audioComponent = document.getElementById('vv-pista-audio');

        if (fileAudio && btnCargar) {
            fileAudio.addEventListener('change', () => {
                if (fileAudio.files.length > 0) {
                    btnCargar.disabled = false;
                    btnCargar.style.background = "#34c759";
                }
            });
        }

        if (btnCargar) {
            btnCargar.addEventListener('click', () => {
                const txtFile = fileLetra && fileLetra.files[0] ? fileLetra.files[0] : null;
                self.loadLocalTrack(fileAudio.files[0], txtFile);
            });
        }

        if (audioComponent) {
            audioComponent.addEventListener('timeupdate', () => {
                self.sincronizarLetras(audioComponent.currentTime);
            });
        }

        const btnRec = document.getElementById('vv-btn-rec-action');
        if (btnRec) {
            btnRec.addEventListener('click', () => {
                if (!self.mediaRecorder || self.mediaRecorder.state === "inactive") {
                    self.startRecording();
                } else {
                    self.stopRecording();
                }
            });
        }

        const btnDescartar = document.getElementById('vv-btn-descartar');
        if (btnDescartar) {
            btnDescartar.addEventListener('click', () => self.discardRecording());
        }

        const btnPublicar = document.getElementById('vv-btn-publicar');
        if (btnPublicar) {
            btnPublicar.addEventListener('click', () => {
                const titulo = document.getElementById('vv-input-titulo-obra').value.trim();
                const checkbox = document.getElementById('vv-check-derechos').checked;
                self.publishOriginal(titulo, checkbox);
            });
        }

        // --- TABS ---
        const btnIrEnsayo = document.getElementById('vv-btn-ir-ensayo');
        const btnVolverCrear = document.getElementById('vv-btn-volver-crear');
        
        if (btnIrEnsayo) {
            btnIrEnsayo.addEventListener('click', () => self.switchTab('ensayo'));
        }
        if (btnVolverCrear) {
            btnVolverCrear.addEventListener('click', () => self.switchTab('crear'));
        }

        // --- TAB 2: ENSAYO ---
        const btnSearch = document.getElementById('vv-btn-search-youtube');
        if (btnSearch) {
            btnSearch.addEventListener('click', () => self.searchYouTube());
        }

        const inputSearch = document.getElementById('vv-input-search-youtube');
        if (inputSearch) {
            inputSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') self.searchYouTube();
            });
        }

        const btnRecEnsayo = document.getElementById('vv-btn-rec-ensayo');
        if (btnRecEnsayo) {
            btnRecEnsayo.addEventListener('click', () => {
                if (!self.mediaRecorder || self.mediaRecorder.state === "inactive") {
                    self.startPracticeRecording();
                } else {
                    self.stopPracticeRecording();
                }
            });
        }

        const btnGuardarEnsayo = document.getElementById('vv-btn-guardar-ensayo');
        if (btnGuardarEnsayo) {
            btnGuardarEnsayo.addEventListener('click', () => self.savePracticeRecording());
        }

        const btnDescartarEnsayo = document.getElementById('vv-btn-descartar-ensayo');
        if (btnDescartarEnsayo) {
            btnDescartarEnsayo.addEventListener('click', () => self.discardPracticeRecording());
        }
    },

    switchTab: function(tab) {
        const tabCrear = document.getElementById('vv-tab-crear');
        const tabEnsayo = document.getElementById('vv-tab-ensayo');
        
        if (tab === 'ensayo') {
            if (tabCrear) tabCrear.classList.add('oculto');
            if (tabEnsayo) tabEnsayo.classList.remove('oculto');
            this.currentMode = 'ensayo';
        } else {
            if (tabEnsayo) tabEnsayo.classList.add('oculto');
            if (tabCrear) tabCrear.classList.remove('oculto');
            this.currentMode = 'crear';
        }
    },

    // ============================================================
    // TAB 1: MODO ARTISTA — Cargar pista local
    // ============================================================
    loadLocalTrack: function(audioFile, lrcFile) {
        if (!audioFile) return;

        const self = this;

        const readerAudio = new FileReader();
        readerAudio.onload = function(e) {
            self.audioTrackBlobURL = URL.createObjectURL(new Blob([e.target.result], {type: audioFile.type}));
            const audioComponent = document.getElementById('vv-pista-audio');
            if (audioComponent) audioComponent.src = self.audioTrackBlobURL;

            document.getElementById('vv-zona-subida').classList.add('oculto');
            document.getElementById('vv-zona-grabacion').classList.remove('oculto');
        };
        readerAudio.readAsArrayBuffer(audioFile);

        if (lrcFile) {
            const readerLetra = new FileReader();
            readerLetra.onload = function(e) {
                const texto = e.target.result;
                if (lrcFile.name.toLowerCase().endsWith('.lrc')) {
                    self.parsearLRC(texto);
                } else {
                    self.isLRC = false;
                    const container = document.getElementById('vv-letra-container');
                    if (container) container.innerHTML = texto.replace(/\n/g, '<br>');
                }
            };
            readerLetra.readAsText(lrcFile);
        } else {
            this.isLRC = false;
            const container = document.getElementById('vv-letra-container');
            if (container) container.innerHTML = "Canción Original<br>(Sin letra sincronizada)";
        }
    },

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
    // TAB 1: GRABACIÓN
    // ============================================================
    startRecording: async function() {
        this.fragmentosVideo = [];
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

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) this.fragmentosVideo.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                this.videoGrabadoBlob = new Blob(this.fragmentosVideo, { type: opcionesCodec.mimeType });
                const preview = document.getElementById('vv-preview-grabacion');
                if (preview) preview.src = URL.createObjectURL(this.videoGrabadoBlob);

                document.getElementById('vv-zona-grabacion').classList.add('oculto');
                document.getElementById('vv-zona-post-grabacion').classList.remove('oculto');
            };

            if (btnRec) btnRec.classList.add('grabando');
            this.mediaRecorder.start();
            
            if (audioComponent) {
                audioComponent.currentTime = 0;
                audioComponent.play();
            }

        } catch (err) {
            console.error('Error grabación:', err);
            alert("⚠️ Fallo de cámara/micrófono: " + err.message + "\n\nAsegurate de:\n• Usar Chrome o Safari actualizado\n• Permitir acceso a cámara y micrófono\n• Usar auriculares para mejor calidad");
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
        const preview = document.getElementById('vv-preview-grabacion');
        if (preview && preview.src) preview.play();
    },

    discardRecording: function() {
        this.videoGrabadoBlob = null;
        this.fragmentosVideo = [];
        
        const inputTitulo = document.getElementById('vv-input-titulo-obra');
        const checkDerechos = document.getElementById('vv-check-derechos');
        
        if (inputTitulo) inputTitulo.value = "";
        if (checkDerechos) checkDerechos.checked = false;

        document.getElementById('vv-zona-post-grabacion').classList.add('oculto');
        document.getElementById('vv-zona-grabacion').classList.remove('oculto');
    },

    publishOriginal: async function(title, isAuthor) {
        if (!title) {
            alert("Por favor, ingresá el título de tu obra.");
            return;
        }
        if (!isAuthor) {
            alert("Debés confirmar que poseés los derechos de autor de la obra para publicarla.");
            return;
        }

        // Validar permisos
        const perms = window.VV_ROLES ? VV_ROLES.getPermissions() : {};
        if (!perms.canFullKaraoke) {
            alert("Necesitás ser vecino verificado para publicar obras. Contactá a tu administrador de barrio.");
            return;
        }

        if (!this.videoGrabadoBlob) {
            alert("No hay grabación para publicar.");
            return;
        }

        try {
            // Llamar a la función existente de upload
            if (window.VV_VOCES && VV_VOCES.uploadVideo) {
                await VV_VOCES.uploadVideo(this.videoGrabadoBlob, {
                    title: title,
                    is_original: true,
                    author_name: perms.displayRole || 'Artista',
                    track_id: null
                });
                alert('🎉 ¡Tu obra fue publicada en Voces Virtuales!');
                this.discardRecording();
            } else {
                throw new Error('Sistema de subida no disponible');
            }
        } catch (err) {
            console.error('Error publicando:', err);
            alert('Error al publicar: ' + err.message);
        }
    },

    // ============================================================
    // TAB 2: MODO ENSAYO — YouTube
    // ============================================================
    searchYouTube: async function() {
        const input = document.getElementById('vv-input-search-youtube');
        const container = document.getElementById('vv-search-results-youtube');
        if (!input || !container) return;

        const query = input.value.trim();
        if (!query) {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;">Escribí una canción para buscar</p>';
            return;
        }

        container.innerHTML = '<p style="text-align:center;color:#94a3b8;">🔍 Buscando...</p>';

        try {
            const response = await fetch(`https://youtube-proxy.cibernico01.workers.dev/youtube/search?q=${encodeURIComponent(query)}&maxResults=8`);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                this.renderYouTubeResults(container, data.items);
            } else {
                container.innerHTML = '<p style="text-align:center;color:#94a3b8;">No se encontraron resultados</p>';
            }
        } catch (err) {
            console.error('Error buscando:', err);
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;">Error en la búsqueda. Intentá de nuevo.</p>';
        }
    },

    renderYouTubeResults: function(container, items) {
        container.innerHTML = items.map(item => `
            <div class="vv-youtube-result" onclick="VV_VOCES_V2.loadYouTubeTrack('${item.id.videoId}', '${item.snippet.title.replace(/'/g, "\\'")}')">
                <img src="${item.snippet.thumbnails.default.url}" alt="${item.snippet.title}" class="vv-yt-thumb">
                <div class="vv-yt-info">
                    <p class="vv-yt-title">${item.snippet.title}</p>
                    <p class="vv-yt-channel">${item.snippet.channelTitle}</p>
                </div>
            </div>
        `).join('');
    },

    loadYouTubeTrack: function(videoId, title) {
        this.currentTrack = { id: videoId, title: title };
        
        const embedContainer = document.getElementById('vv-youtube-embed');
        if (embedContainer) {
            embedContainer.innerHTML = `
                <iframe width="100%" height="200" 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0" 
                    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;
        }

        const btnRec = document.getElementById('vv-btn-rec-ensayo');
        if (btnRec) btnRec.disabled = false;

        const info = document.getElementById('vv-youtube-info');
        if (info) info.innerHTML = `<p>🎵 ${title}</p><p style="font-size:0.8rem;color:#94a3b8;">Tocá Grabar cuando estés listo. Usá auriculares.</p>`;
    },

    startPracticeRecording: async function() {
        this.fragmentosVideo = [];
        const btnRec = document.getElementById('vv-btn-rec-ensayo');

        try {
            this.streamCamaraMicro = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } },
                audio: { echoCancellation: true, noiseSuppression: true }
            });

            let opcionesCodec = { mimeType: 'video/webm;codecs=vp8,opus' };
            if (!MediaRecorder.isTypeSupported(opcionesCodec.mimeType)) {
                opcionesCodec = { mimeType: 'video/mp4' };
            }

            this.mediaRecorder = new MediaRecorder(this.streamCamaraMicro, opcionesCodec);

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) this.fragmentosVideo.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                this.videoGrabadoBlob = new Blob(this.fragmentosVideo, { type: opcionesCodec.mimeType });
                
                const preview = document.getElementById('vv-preview-ensayo');
                if (preview) preview.src = URL.createObjectURL(this.videoGrabadoBlob);

                document.getElementById('vv-zona-grabacion-ensayo').classList.add('oculto');
                document.getElementById('vv-zona-post-ensayo').classList.remove('oculto');
            };

            if (btnRec) {
                btnRec.classList.add('grabando');
                btnRec.innerHTML = '⏹️ Detener Ensayo';
            }
            this.mediaRecorder.start();

        } catch (err) {
            alert("⚠️ Error de cámara: " + err.message);
        }
    },

    stopPracticeRecording: function() {
        const btnRec = document.getElementById('vv-btn-rec-ensayo');
        if (btnRec) {
            btnRec.classList.remove('grabando');
            btnRec.innerHTML = '🔴 Grabar Mi Ensayo';
        }
        if (this.mediaRecorder) this.mediaRecorder.stop();
        if (this.streamCamaraMicro) {
            this.streamCamaraMicro.getTracks().forEach(track => track.stop());
        }
    },

    savePracticeRecording: async function() {
        if (!this.videoGrabadoBlob || !this.currentTrack) {
            alert("No hay grabación para guardar.");
            return;
        }

        const perms = window.VV_ROLES ? VV_ROLES.getPermissions() : {};
        if (!perms.canFullKaraoke) {
            alert("Necesitás ser vecino verificado para guardar ensayos.");
            return;
        }

        try {
            if (window.VV_VOCES && VV_VOCES.uploadVideo) {
                await VV_VOCES.uploadVideo(this.videoGrabadoBlob, {
                    title: `Ensayo: ${this.currentTrack.title}`,
                    is_original: false,
                    track_id: this.currentTrack.id
                });
                alert('🎤 ¡Ensayo guardado!');
                this.discardPracticeRecording();
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    },

    discardPracticeRecording: function() {
        this.videoGrabadoBlob = null;
        this.fragmentosVideo = [];
        this.currentTrack = null;

        document.getElementById('vv-zona-post-ensayo').classList.add('oculto');
        document.getElementById('vv-zona-grabacion-ensayo').classList.remove('oculto');

        const btnRec = document.getElementById('vv-btn-rec-ensayo');
        if (btnRec) {
            btnRec.disabled = true;
            btnRec.innerHTML = '🔴 Grabar Mi Ensayo';
        }

        const embed = document.getElementById('vv-youtube-embed');
        if (embed) embed.innerHTML = '';

        const info = document.getElementById('vv-youtube-info');
        if (info) info.innerHTML = '<p style="color:#94a3b8;">Buscá una canción arriba para empezar</p>';
    }
};
// ============================================================
// COMPATIBILIDAD: Alias VV_VOCES → VV_VOCES_V2 + métodos faltantes
// ============================================================
window.VV_VOCES = window.VV_VOCES_V2;

// Wrapper: cuando se selecciona un archivo de audio
VV_VOCES_V2.onAudioSelected = function() {
    const fileAudio = document.getElementById('vv-upload-audio');
    const btnCargar = document.getElementById('vv-btn-cargar-estudio');
    const nameDisplay = document.getElementById('vv-audio-name');
    if (fileAudio && fileAudio.files.length > 0) {
        if (btnCargar) {
            btnCargar.disabled = false;
            btnCargar.style.background = "#34c759";
        }
        if (nameDisplay) nameDisplay.textContent = '🎵 ' + fileAudio.files[0].name;
    }
};

// Wrapper: cuando se selecciona un archivo de letra
VV_VOCES_V2.onLyricSelected = function() {
    const fileLetra = document.getElementById('vv-upload-letra');
    const nameDisplay = document.getElementById('vv-letra-name');
    if (fileLetra && fileLetra.files.length > 0 && nameDisplay) {
        nameDisplay.textContent = '📄 ' + fileLetra.files[0].name;
    }
};

// Wrapper: cargar pista desde los inputs del HTML
VV_VOCES_V2.loadLocalTrackFromInputs = function() {
    const fileAudio = document.getElementById('vv-upload-audio');
    const fileLetra = document.getElementById('vv-upload-letra');
    const audioFile = fileAudio && fileAudio.files[0] ? fileAudio.files[0] : null;
    const lrcFile = fileLetra && fileLetra.files[0] ? fileLetra.files[0] : null;
    this.loadLocalTrack(audioFile, lrcFile);
};

// Wrapper: toggle grabación
VV_VOCES_V2.toggleRecording = function() {
    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        this.startRecording();
    } else {
        this.stopRecording();
    }
};

// Wrapper: publicar (lee del DOM como espera el HTML)
VV_VOCES_V2.publishOriginal = function() {
    const titulo = document.getElementById('vv-input-titulo-obra').value.trim();
    const checkbox = document.getElementById('vv-check-derechos').checked;
    
    if (!titulo) {
        alert("Por favor, ingresá el título de tu obra.");
        return;
    }
    if (!checkbox) {
        alert("Debés confirmar que poseés los derechos de autor de la obra para publicarla.");
        return;
    }
    if (!this.videoGrabadoBlob) {
        alert("No hay grabación para publicar.");
        return;
    }

    const perms = window.VV_ROLES ? VV_ROLES.getPermissions() : {};
    if (!perms.canFullKaraoke) {
        alert("Necesitás ser vecino verificado para publicar obras.");
        return;
    }

    if (window.VV_VOCES && VV_VOCES.uploadVideo) {
        VV_VOCES.uploadVideo(this.videoGrabadoBlob, {
            title: titulo,
            is_original: true,
            author_name: perms.displayRole || 'Artista',
            track_id: null
        }).then(() => {
            alert('🎉 ¡Tu obra fue publicada en Voces Virtuales!');
            this.discardRecording();
        }).catch(err => {
            console.error('Error publicando:', err);
            alert('Error al publicar: ' + err.message);
        });
    } else {
        alert('Sistema de subida no disponible');
    }
};

// Descargar grabación localmente
VV_VOCES_V2.descargarLocal = function() {
    if (!this.videoGrabadoBlob) {
        alert("No hay grabación para descargar.");
        return;
    }
    const url = URL.createObjectURL(this.videoGrabadoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi-grabacion-' + Date.now() + '.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Grabar sin pista (modo acústico)
VV_VOCES_V2.irAGrabarSinPista = function() {
    this.audioTrackBlobURL = null;
    this.isLRC = false;
    const container = document.getElementById('vv-letra-container');
    if (container) container.innerHTML = "🎵 Modo Acústico — Tocá grabar y empezá a tocar tu instrumento";
    
    document.getElementById('vv-zona-subida').classList.add('oculto');
    document.getElementById('vv-zona-grabacion').classList.remove('oculto');
};

// Stubs para explorar (si no existen aún)
VV_VOCES_V2.switchTab = function(tab) {
    if (tab === 'ensayo') {
        const tabCrear = document.getElementById('vv-tab-crear');
        const tabEnsayo = document.getElementById('vv-tab-ensayo');
        if (tabCrear) tabCrear.classList.add('oculto');
        if (tabEnsayo) tabEnsayo.classList.remove('oculto');
        this.currentMode = 'ensayo';
    } else if (tab === 'crear') {
        const tabEnsayo = document.getElementById('vv-tab-ensayo');
        const tabCrear = document.getElementById('vv-tab-crear');
        if (tabEnsayo) tabEnsayo.classList.add('oculto');
        if (tabCrear) tabCrear.classList.remove('oculto');
        this.currentMode = 'crear';
    } else if (tab === 'explorar') {
        // Si existe un tab explorar, mostrarlo; si no, alert
        const tabExplorar = document.getElementById('vv-tab-explorar');
        if (tabExplorar) {
            document.getElementById('vv-tab-crear').classList.add('oculto');
            tabExplorar.classList.remove('oculto');
        } else {
            console.log('Tab explorar no disponible aún');
        }
    }
};

VV_VOCES_V2.cargarFeed = function() {
    console.log('Cargar feed - no implementado aún');
};
// ============================================================
// SUBIDA DE VIDEOS A SUPABASE
// ============================================================
VV_VOCES_V2.uploadVideo = async function(videoBlob, metadata) {
    const user = VV_ROLES.getCurrentUser();
    if (!user) {
        throw new Error('Debés iniciar sesión para subir videos');
    }

    // Generar nombre único para el archivo
    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const fileName = `voces-virtuales/${user.id}_${Date.now()}.${ext}`;

    // 1. Subir el video a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('barrio-media')
        .upload(fileName, videoBlob, {
            contentType: videoBlob.type,
            cacheControl: '3600'
        });

    if (uploadError) {
        console.error('Error subiendo a Storage:', uploadError);
        throw new Error('No se pudo subir el video: ' + uploadError.message);
    }

    // 2. Obtener la URL pública
    const { data: urlData } = supabase.storage
        .from('barrio-media')
        .getPublicUrl(fileName);

    const videoUrl = urlData.publicUrl;

    // 3. Insertar el registro en la tabla karaoke_videos
    const registro = {
        user_id: user.id,
        user_name: user.name || user.email || 'Anónimo',
        title: metadata.title || 'Sin título',
        video_url: videoUrl,
        audio_url: this.audioTrackBlobURL || null,
        track_id: metadata.track_id || '',
        track_title: metadata.track_title || null,
        is_original: metadata.is_original || false,
        is_acoustic: !this.audioTrackBlobURL,
        is_duet: false,
        parent_video_id: null,
        visible: true,
        estado_moderacion: 'pendiente',
        reportado: false,
        likes_count: 0,
        views_count: 0
    };

    const { data: insertData, error: insertError } = await supabase
        .from('karaoke_videos')
        .insert([registro]);

    if (insertError) {
        console.error('Error insertando en tabla:', insertError);
        throw new Error('No se pudo registrar el video: ' + insertError.message);
    }

        console.log('✅ Video subido:', videoUrl);
    
    // Recompensa por subir video
    if (window.VV_WALLET) {
        VV_WALLET.rewardVideoUpload(user.id);
    }
    
    return { success: true, url: videoUrl, data: insertData };

};
// ============================================================
// TAB 3: EXPLORAR — Feed público de videos
// ============================================================
VV_VOCES_V2.cargarFeed = async function() {
    const container = document.getElementById('vv-feed-container');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:2rem;">Cargando obras del barrio...</p>';

    try {
        const { data, error } = await supabase
            .from('karaoke_videos')
            .select('*')
            .eq('visible', true)
            .eq('estado_moderacion', 'aprobado')
            .order('created_at', { ascending: false })
            .limit(24);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:3rem;color:#94a3b8;">
                    <i class="fas fa-microphone-slash" style="font-size:3rem;margin-bottom:1rem;"></i>
                    <p>Todavía no hay obras publicadas.</p>
                    <p style="font-size:0.85rem;">¡Sé el primero en compartir tu voz!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(video => this.renderVideoCard(video)).join('');

    } catch (err) {
        console.error('Error cargando feed:', err);
        container.innerHTML = '<p style="text-align:center;color:#ef4444;padding:2rem;">Error al cargar. Intentá de nuevo.</p>';
    }
};

VV_VOCES_V2.renderVideoCard = function(video) {
    const fecha = new Date(video.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    const tipo = video.is_original ? '✨ Original' : '🎵 Cover';
    const acustico = video.is_acoustic ? '🎸 Acústico' : '';

    return `
        <div class="vv-video-card" onclick="VV_VOCES_V2.openVideoPlayer('${video.id}')">
            <div class="vv-video-thumb">
                <video preload="metadata" muted>
                    <source src="${video.video_url}" type="video/webm">
                </video>
                <div class="vv-play-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="vv-video-info">
                <h4>${video.title || 'Sin título'}</h4>
                <p class="vv-video-author">${video.user_name || 'Anónimo'}</p>
                <div class="vv-video-meta">
                    <span>${tipo} ${acustico}</span>
                    <span>👍 ${video.likes_count || 0}</span>
                    <span>👁 ${video.views_count || 0}</span>
                    <span>${fecha}</span>
                </div>
            </div>
        </div>
    `;
};

VV_VOCES_V2.openVideoPlayer = async function(videoId) {
    let video = null;

    try {
        const { data, error } = await supabase
            .from('karaoke_videos')
            .select('*')
            .eq('id', videoId)
            .single();

        if (error) throw error;
        video = data;

        await supabase
            .from('karaoke_videos')
            .update({ views_count: (video.views_count || 0) + 1 })
            .eq('id', videoId);

    } catch (err) {
        console.error('Error abriendo video:', err);
        alert('No se pudo cargar el video');
        return;
    }

    const user = VV_ROLES.getCurrentUser();
    const canInteract = user && VV_ROLES.getPermissions().canFullKaraoke;

    const modal = document.createElement('div');
    modal.id = 'vv-video-modal';
    modal.className = 'vv-modal-overlay';
    modal.innerHTML = `
        <div class="vv-modal-content">
            <button class="vv-modal-close" onclick="VV_VOCES_V2.closeVideoPlayer()">✕</button>
            <video controls autoplay class="vv-modal-video">
                <source src="${video.video_url}" type="video/webm">
            </video>
            <div class="vv-modal-info">
                <h3>${video.title}</h3>
                <p class="vv-modal-author">${video.user_name || 'Anónimo'}</p>
                <div class="vv-modal-stats">
                    <span>👍 ${video.likes_count || 0}</span>
                    <span>👁 ${(video.views_count || 0) + 1}</span>
                    <span>${video.is_original ? '✨ Original' : '🎵 Cover'}</span>
                </div>
                <div class="vv-modal-actions">
                    ${canInteract ? `
                        <button class="vv-btn-like" onclick="VV_VOCES_V2.toggleLike('${video.id}')">
                            👍 Me gusta
                        </button>
                        <button class="vv-btn-comment" onclick="VV_VOCES_V2.showComments('${video.id}')">
                            💬 Comentar
                        </button>
                        <button class="vv-btn-gift" onclick="VV_VOCES_V2.showGiftPicker('${video.id}', '${video.user_id}')">
                            🎁 Regalar
                        </button>
                    ` : '<p style="color:#94a3b8;font-size:0.85rem;">Iniciá sesión para interactuar</p>'}
                </div>

                <div id="vv-comments-section" style="display:none;margin-top:1rem;"></div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

VV_VOCES_V2.closeVideoPlayer = function() {
    const modal = document.getElementById('vv-video-modal');
    if (modal) {
        const video = modal.querySelector('video');
        if (video) video.pause();
        modal.remove();
    }
};

VV_VOCES_V2.toggleLike = async function(videoId) {
    const user = VV_ROLES.getCurrentUser();
    if (!user) {
        alert('Iniciá sesión para dar like');
        return;
    }

    try {
        const { data: existing } = await supabase
            .from('karaoke_likes')
            .select('id')
            .eq('video_id', videoId)
            .eq('user_id', user.id)
            .single();

        if (existing) {
            await supabase.from('karaoke_likes').delete().eq('id', existing.id);
            const { data: video } = await supabase.from('karaoke_videos').select('likes_count').eq('id', videoId).single();
            await supabase.from('karaoke_videos').update({ likes_count: Math.max(0, (video.likes_count || 0) - 1) }).eq('id', videoId);
            const btn = document.querySelector('.vv-btn-like');
            if (btn) btn.style.background = '';
        } else {
            await supabase.from('karaoke_likes').insert([{ video_id: videoId, user_id: user.id }]);
            const { data: video } = await supabase.from('karaoke_videos').select('likes_count, user_id').eq('id', videoId).single();
            await supabase.from('karaoke_videos').update({ likes_count: (video.likes_count || 0) + 1 }).eq('id', videoId);
            const btn = document.querySelector('.vv-btn-like');
            if (btn) btn.style.background = 'rgba(52, 199, 89, 0.3)';
                        // Recompensa al dueño del video
            if (window.VV_WALLET && video.user_id) {
                VV_WALLET.rewardReceiveLike(video.user_id, videoId);
            }

        }

        this.cargarFeed();
    } catch (err) {
        console.error('Error en like:', err);
    }
};

VV_VOCES_V2.COMENTARIOS = {
    musical: ['¡Qué linda melodía!', 'La letra me llegó al corazón', 'Gran interpretación', 'Se nota el talento'],
    energia: ['¡A full!', 'Me hiciste bailar', 'Pura energía positiva', 'Esto levanta el ánimo'],
    emocional: ['Me emocionaste', 'Se siente de verdad', 'Tiene alma', 'Directo al corazón'],
    reconocimiento: ['Felicitaciones vecino!', 'El barrio te aplaude', 'Seguí así', 'Orgullo del barrio'],
    especial: ['Candidato al certamen', 'Esto merece un regalo', 'No paro de escucharlo', 'Lo compartí con todos']
};

VV_VOCES_V2.showComments = async function(videoId) {
    const section = document.getElementById('vv-comments-section');
    if (!section) return;

    if (section.style.display === 'none') {
        section.style.display = 'block';
        section.innerHTML = '<p style="color:#94a3b8;">Cargando comentarios...</p>';

        try {
            const { data: comments } = await supabase
                .from('video_comments')
                .select('*')
                .eq('video_id', videoId)
                .order('created_at', { ascending: false });

            const user = VV_ROLES.getCurrentUser();

            let html = '<div class="vv-comments-list">';

            if (comments && comments.length > 0) {
                html += comments.map(c => `
                    <div class="vv-comment-badge">
                        <span class="vv-comment-cat">${this.categoryEmoji(c.category)}</span>
                        <span>${c.comment_text}</span>
                    </div>
                `).join('');
            } else {
                html += '<p style="color:#94a3b8;font-size:0.85rem;">Sin comentarios aún</p>';
            }

            html += '</div>';

            if (user) {
                html += '<div class="vv-comment-picker">';
                html += '<p style="font-size:0.8rem;color:#94a3b8;margin-bottom:0.5rem;">Elegí un comentario:</p>';

                for (const [cat, textos] of Object.entries(this.COMENTARIOS)) {
                    html += `<div class="vv-comment-category">`;
                    html += `<span class="vv-comment-cat-label">${this.categoryEmoji(cat)} ${cat}</span>`;
                    textos.forEach((texto, i) => {
                        html += `<button class="vv-comment-btn" onclick="VV_VOCES_V2.postComment('${videoId}', '${cat}', '${texto.replace(/'/g, "\\'")}')">${texto}</button>`;
                    });
                    html += `</div>`;
                }
                html += '</div>';
            }

            section.innerHTML = html;

        } catch (err) {
            console.error('Error cargando comentarios:', err);
            section.innerHTML = '<p style="color:#ef4444;">Error al cargar comentarios</p>';
        }
    } else {
        section.style.display = 'none';
    }
};

VV_VOCES_V2.categoryEmoji = function(category) {
    const emojis = { musical: '🎵', energia: '🔥', emocional: '❤️', reconocimiento: '👏', especial: '🌟' };
    return emojis[category] || '💬';
};

VV_VOCES_V2.postComment = async function(videoId, category, text) {
    const user = VV_ROLES.getCurrentUser();
    if (!user) {
        alert('Iniciá sesión para comentar');
        return;
    }

    try {
        const { data: existing } = await supabase
            .from('karaoke_comments')
            .select('id')
            .eq('video_id', videoId)
            .eq('user_id', user.id)
            .single();

        if (existing) {
            await supabase
                .from('karaoke_comments')
                .update({ comment_code: category, comment_text: text, category: category })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('karaoke_comments')
                .insert([{
                    video_id: videoId,
                    user_id: user.id,
                    user_name: user.name || user.email || 'Anónimo',
                    emoji: VV_VOCES_V2.categoryEmoji(category),
                    video_timestamp: 0,
                    comment_text: text,
                    category: category
                }]);

        }

        document.getElementById('vv-comments-section').style.display = 'none';
        this.showComments(videoId);

    } catch (err) {
        console.error('Error posteando comentario:', err);
        alert('No se pudo enviar el comentario');
    }
};
// ============================================================
// SISTEMA DE REGALOS EN VIDEOS
// ============================================================
VV_VOCES_V2.showGiftPicker = async function(videoId, toUserId) {
    const user = VV_ROLES.getCurrentUser();
    if (!user) {
        alert('Iniciá sesión para regalar');
        return;
    }

    if (user.id === toUserId) {
        alert('No podés regalarte a vos mismo 😄');
        return;
    }

    if (!window.VV_WALLET) {
        alert('Sistema de billetera no disponible');
        return;
    }

    const { balance } = await VV_WALLET.getBalance(user.id);
    const items = await VV_WALLET.getShopItems('regalo');

    const modal = document.createElement('div');
    modal.id = 'vv-gift-modal';
    modal.className = 'vv-modal-overlay';
    modal.innerHTML = `
        <div class="vv-modal-content" style="max-width:400px;">
            <button class="vv-modal-close" onclick="document.getElementById('vv-gift-modal').remove()">✕</button>
            <div style="padding:1.25rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    <h3 style="margin:0;color:#f1f5f9;">🎁 Enviar Regalo</h3>
                    <div style="display:flex;align-items:center;gap:0.4rem;background:rgba(251,191,36,0.15);padding:0.4rem 0.8rem;border-radius:20px;">
                        <span>🪙</span>
                        <span style="font-weight:700;color:#fbbf24;">${balance}</span>
                    </div>
                </div>
                <p style="color:#94a3b8;font-size:0.8rem;margin-bottom:0.75rem;">Elegí un regalo para enviar:</p>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;">
                    ${items.map(item => `
                        <div onclick="VV_VOCES_V2.sendGiftToVideo('${videoId}', '${toUserId}', '${item.code}', '${item.nombre}', ${item.precio_monedas})" 
                             style="background:rgba(255,255,255,0.05);border-radius:10px;padding:0.75rem;text-align:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);transition:all 0.2s;"
                             onmouseover="this.style.background='rgba(251,191,36,0.1)';this.style.borderColor='rgba(251,191,36,0.3)'"
                             onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.borderColor='rgba(255,255,255,0.08)'">
                            <div style="font-size:2rem;margin-bottom:0.25rem;">${item.icono}</div>
                            <p style="margin:0;font-size:0.7rem;color:#cbd5e1;">${item.nombre}</p>
                            <p style="margin:0.2rem 0 0;font-size:0.8rem;color:#fbbf24;font-weight:700;">🪙 ${item.precio_monedas}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

VV_VOCES_V2.sendGiftToVideo = async function(videoId, toUserId, itemCode, itemName, price) {
    const result = await VV_WALLET.sendGift(toUserId, itemCode, videoId, 'video');
    
    if (result.success) {
        document.getElementById('vv-gift-modal').remove();
        alert(`🎉 ¡${itemName} enviado!`);
        // Actualizar saldo visible
        if (document.getElementById('wallet-balance-display')) {
            VV_WALLET.renderBalanceWidget('wallet-balance-display');
        }
    } else {
        alert('❌ ' + result.error);
    }
};


// Inicializar al cargar
// ============================================================
// WIDGET DASHBOARD — Preview de 3 videos
// ============================================================
VV_VOCES_V2.cargarWidgetDashboard = async function() {
    const container = document.getElementById('widget-vv-feed');
    if (!container) return;

    try {
        const { data, error } = await supabase
            .from('karaoke_videos')
            .select('*')
            .eq('visible', true)
            .eq('estado_moderacion', 'aprobado')
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;color:#94a3b8;grid-column:1/-1;padding:0.5rem;">
                    <p style="margin:0;font-size:0.85rem;">🎤 Sin obras aún</p>
                    <p style="margin:0;font-size:0.75rem;">¡Sé el primero en compartir tu voz!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(video => `
            <div class="widget-vv-card" onclick="conmutarVistasPro('#modulo-voces-virtuales'); VV_VOCES_V2.switchTab('explorar'); VV_VOCES_V2.cargarFeed(); setTimeout(() => VV_VOCES_V2.openVideoPlayer('${video.id}'), 300);" 
                 style="background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid rgba(255,255,255,0.08);"
                 onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
                 onmouseout="this.style.transform='';this.style.boxShadow=''">
                <div style="position:relative;aspect-ratio:16/9;background:#000;overflow:hidden;">
                    <video preload="metadata" muted style="width:100%;height:100%;object-fit:cover;">
                        <source src="${video.video_url}" type="video/webm">
                    </video>
                    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:36px;height:36px;background:rgba(0,0,0,0.6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.9rem;">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div style="padding:0.6rem;">
                    <p style="margin:0;font-size:0.85rem;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${video.title || 'Sin título'}</p>
                    <p style="margin:0.15rem 0 0;font-size:0.75rem;color:#94a3b8;">${video.user_name || 'Anónimo'} · 👍 ${video.likes_count || 0}</p>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error cargando widget:', err);
        if (container) container.innerHTML = '<p style="text-align:center;color:#94a3b8;grid-column:1/-1;font-size:0.85rem;">Error al cargar</p>';
    }
};

window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('modulo-voces-virtuales')) {
        VV_VOCES_V2.init();
    }
    if (document.getElementById('widget-vv-feed')) {
        VV_VOCES_V2.cargarWidgetDashboard();
    }
    // Inicializar billetera
    if (document.getElementById('wallet-balance-display') && window.VV_WALLET) {
        const user = VV_ROLES.getCurrentUser();
        if (user) {
            VV_WALLET.renderBalanceWidget('wallet-balance-display');
            VV_WALLET.rewardDailyLogin(user.id);
        } else {
            document.getElementById('wallet-balance-display').innerHTML = '<span style="color:#94a3b8;font-size:0.8rem;">Iniciá sesión</span>';
        }
    }
});


