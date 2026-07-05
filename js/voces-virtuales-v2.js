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

// Inicializar al cargar
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('modulo-voces-virtuales')) {
        VV_VOCES_V2.init();
    }
});
