// ============================================================
// 🎤 MÓDULO KARAOKE PRO - FUNCIONALIDAD COMPLETA
// ============================================================

const VV_KARAOKE = {
    // Configuración
    YOUTUBE_API_KEY: 'AIzaSyBV75vgH2KWvNgGn-OuNldrSHIignAkisA', // REEMPLAZA CON TU CLAVE REAL
    
    CATALOGO_LOCAL: [
        { id: 'XW5U8pWJqK4', title: 'Soda Stereo - De Música Ligera (Karaoke)', genre: 'rock' },
        { id: 'M7X9XyVfSgA', title: 'Chaqueño Palavecino - Amor Salvaje (Karaoke)', genre: 'folclore' },
        { id: '3wVw86mI6N0', title: 'Gilda - No me arrepiento de este amor (Karaoke)', genre: 'cumbia' },
        { id: 'dLHtK9UVaaA', title: 'Los Fabulosos Cadillacs - Matador de Matadores', genre: 'rock' },
        { id: 'qqfQaWRAyfo', title: 'Mercedes Sosa - Gracias a la Vida (Karaoke)', genre: 'folclore' }
    ],
    
    // Estados globales
    player: null,
    mediaRecorder: null,
    audioChunks: [],
    estaGrabando: false,
    audioCtx: null,
    micStream: null,
    source: null,
    gainNode: null,
    delayNode: null,
    feedbackNode: null,
    cancionActual: null,
    
    // Inicializar módulo
    init: function() {
        console.log('🎤 Inicializando módulo Karaoke...');
        this.cargarCatalogo();
        this.configurarEventos();
    },
    
    // Cargar catálogo inicial
    cargarCatalogo: function() {
        const resultsContainer = document.getElementById('karaoke-results');
        if (!resultsContainer) return;
        resultsContainer.innerHTML = '';
        this.CATALOGO_LOCAL.forEach(cancion => {
            this.agregarCancionAlResultado(cancion, resultsContainer);
        });
    },
    
    // Agregar canción al contenedor de resultados
    agregarCancionAlResultado: function(cancion, container) {
        const div = document.createElement('div');
        div.className = 'karaoke-track-item';
        div.innerHTML = `
            <div class="karaoke-track-thumb">🎵</div>
            <div class="karaoke-track-info">
                <div class="karaoke-track-title">${cancion.title}</div>
                <div class="karaoke-track-genre">${cancion.genre}</div>
            </div>
        `;
        div.onclick = () => this.seleccionarCancion(cancion.id, cancion.title);
        container.appendChild(div);
    },
    
    // Buscar canciones - FUNCIONA CON CUALQUIER CANCIÓN
    buscar: async function() {
        const input = document.getElementById('karaoke-search-input');
        if (!input) return;
        
        const consulta = input.value.trim().toLowerCase();
        const contenedor = document.getElementById('karaoke-results');
        
        if (!consulta) {
            this.cargarCatalogo();
            return;
        }
        
        // Primero buscar en el catálogo local
        const resultadosLocales = this.CATALOGO_LOCAL.filter(cancion => 
            cancion.title.toLowerCase().includes(consulta) ||
            cancion.genre.toLowerCase().includes(consulta)
        );
        
        contenedor.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">🔍 Buscando canciones...</p>';
        
        // Si hay resultados locales, mostrarlos
        if (resultadosLocales.length > 0) {
            contenedor.innerHTML = '';
            resultadosLocales.forEach(cancion => this.agregarCancionAlResultado(cancion, contenedor));
            return;
        }
        
        // Si no hay resultados locales, buscar en YouTube (si tienes API KEY)
        if (this.YOUTUBE_API_KEY && !this.YOUTUBE_API_KEY.includes('Dummy')) {
            await this.buscarEnYouTube(consulta, contenedor);
        } else {
            contenedor.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">❌ No se encontraron canciones. Configura tu YouTube API KEY para más resultados.</p>';
        }
    },
    
    // Buscar en YouTube
    buscarEnYouTube: async function(consulta, contenedor) {
        try {
            const url = `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(consulta + " karaoke")}&type=video&key=${this.YOUTUBE_API_KEY}&maxResults=10&part=snippet`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                contenedor.innerHTML = '';
                data.items.forEach(item => {
                    const cancion = {
                        id: item.id.videoId,
                        title: item.snippet.title,
                        genre: 'YouTube'
                    };
                    this.agregarCancionAlResultado(cancion, contenedor);
                });
            } else {
                contenedor.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No se encontraron resultados en YouTube</p>';
            }
        } catch (error) {
            console.error('Error buscando en YouTube:', error);
            contenedor.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Error en la búsqueda. Intenta nuevamente.</p>';
        }
    },
    
    // Seleccionar canción - FUNCIONA CON CUALQUIER VIDEO DE YOUTUBE
    seleccionarCancion: function(id, titulo) {
        console.log(`🎵 Seleccionada: ${titulo}`);
        
        this.cancionActual = { id, titulo };
        
        const studioConsole = document.getElementById('karaoke-studio-console');
        const consoleTitle = document.getElementById('karaoke-console-title');
        const playerContainer = document.getElementById('youtube-player');
        
        if (studioConsole && consoleTitle) {
            studioConsole.style.display = 'block';
            consoleTitle.innerText = titulo;
        }
        
        // Cargar video en YouTube player
        if (window.player && window.player.loadVideoById) {
            window.player.loadVideoById(id);
            console.log('✅ Video cargado:', id);
        } else if (playerContainer) {
            // Si no existe player, crear uno dinámicamente
            playerContainer.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${id}?autoplay=0&controls=1" frameborder="0" allowfullscreen></iframe>`;
        }
        
        // Scroll automático
        setTimeout(() => {
            studioConsole?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    },
    
    // Inicializar audio procesado
    inicializarAudio: async function() {
        if (this.audioCtx) return;
        
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            this.source = this.audioCtx.createMediaStreamSource(this.micStream);
            this.gainNode = this.audioCtx.createGain();
            this.delayNode = this.audioCtx.createDelay();
            this.feedbackNode = this.audioCtx.createGain();
            
            // Configurar parámetros
            this.delayNode.delayTime.value = 0.3;
            this.feedbackNode.gain.value = this.getVolumenEco();
            this.gainNode.gain.value = this.getVolumenMic();
            
            // Conectar nodos
            this.source.connect(this.gainNode);
            this.gainNode.connect(this.delayNode);
            this.delayNode.connect(this.feedbackNode);
            this.feedbackNode.connect(this.delayNode);
            this.gainNode.connect(this.audioCtx.destination);
            this.delayNode.connect(this.audioCtx.destination);
            
            // Configurar grabador
            this.mediaRecorder = new MediaRecorder(this.micStream);
            this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
            this.mediaRecorder.onstop = () => this.onGrabacionFinalizada();
            
            console.log('✅ Audio inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al acceder al micrófono:', error);
            alert('⚠️ Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.');
            throw error;
        }
    },
    
    // Toggle grabación
    toggleGrabacion: async function() {
        const btn = document.getElementById('karaoke-rec-btn');
        const statusText = document.getElementById('karaoke-rec-status');
        const statusBox = document.getElementById('karaoke-status-box');
        
        if (!this.estaGrabando) {
            // Iniciar grabación
            if (!this.cancionActual) {
                alert('⚠️ Por favor, selecciona una canción primero');
                return;
            }
            
            try {
                await this.inicializarAudio();
                this.audioChunks = [];
                
                if (this.audioCtx.state === 'suspended') {
                    await this.audioCtx.resume();
                }
                
                this.mediaRecorder.start();
                if (window.player && window.player.playVideo) {
                    window.player.playVideo();
                }
                
                this.estaGrabando = true;
                btn.classList.add('karaoke-recording');
                btn.innerHTML = '<i class="fas fa-stop"></i> DETENER';
                statusText.innerText = '🎤 ¡Estás al aire! Canta con confianza...';
                statusText.style.color = '#22c55e';
                
                if (statusBox) statusBox.style.display = 'none';
                console.log('🔴 Grabación iniciada');
            } catch (err) {
                console.error('Error iniciando grabación:', err);
                if (statusBox) {
                    statusBox.style.display = 'block';
                    statusBox.innerText = '⚠️ Error: Activa los permisos de micrófono para poder cantar.';
                }
            }
        } else {
            // Detener grabación
            this.mediaRecorder.stop();
            if (window.player && window.player.pauseVideo) {
                window.player.pauseVideo();
            }
            
            this.estaGrabando = false;
            btn.classList.remove('karaoke-recording');
            btn.innerHTML = '<i class="fas fa-microphone"></i> GRABAR';
            statusText.innerText = '✅ Canción finalizada. Escucha y guarda tu voz abajo.';
            statusText.style.color = '#9ca3af';
            console.log('⏹️ Grabación detenida');
        }
    },
    
    // Cuando se finaliza la grabación
    onGrabacionFinalizada: function() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const preview = document.getElementById('karaoke-audio-preview');
        const downloadLink = document.getElementById('karaoke-download-link');
        
        if (preview) {
            preview.src = audioUrl;
            preview.style.display = 'block';
        }
        
        if (downloadLink) {
            downloadLink.href = audioUrl;
            downloadLink.download = `VecinosVirtuales_Karaoke_${new Date().getTime()}.webm`;
            downloadLink.style.display = 'inline-flex';
        }
        
        console.log('💾 Grabación guardada');
    },
    
    // Obtener volumen del micrófono
    getVolumenMic: function() {
        const slider = document.getElementById('karaoke-vol-mic');
        return slider ? parseFloat(slider.value) : 0.5;
    },
    
    // Obtener volumen del eco
    getVolumenEco: function() {
        const slider = document.getElementById('karaoke-vol-eco');
        return slider ? parseFloat(slider.value) : 0.3;
    },
    
    // Actualizar volumen del micrófono en tiempo real
    actualizarVolumenMic: function() {
        if (this.gainNode) {
            this.gainNode.gain.value = this.getVolumenMic();
        }
    },
    
    // Actualizar volumen del eco en tiempo real
    actualizarVolumenEco: function() {
        if (this.feedbackNode) {
            this.feedbackNode.gain.value = this.getVolumenEco();
        }
    },
    
    // Configurar eventos
    configurarEventos: function() {
        const searchBtn = document.getElementById('karaoke-search-btn');
        const searchInput = document.getElementById('karaoke-search-input');
        const recBtn = document.getElementById('karaoke-rec-btn');
        const volMic = document.getElementById('karaoke-vol-mic');
        const volEco = document.getElementById('karaoke-vol-eco');
        
        if (searchBtn) searchBtn.addEventListener('click', () => this.buscar());
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.buscar();
            });
        }
        if (recBtn) recBtn.addEventListener('click', () => this.toggleGrabacion());
        if (volMic) volMic.addEventListener('input', () => this.actualizarVolumenMic());
        if (volEco) volEco.addEventListener('input', () => this.actualizarVolumenEco());
    },
    
    // Limpiar recursos
    limpiar: function() {
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
        }
        this.audioChunks = [];
        console.log('🧹 Recursos de Karaoke limpiados');
    }
};

// Inicializar cuando el documento está listo
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('karaoke-results')) {
        VV_KARAOKE.init();
    }
});
