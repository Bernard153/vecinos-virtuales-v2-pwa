// ============================================================
// CORE PRINCIPAL DE LA APP - ENRUTADOR RÁPIDO V6 + KARAOKE
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Vecinos Virtuales V6 - Sincronizando enrutador con el Core...');
    
    // Bypass automático de términos y condiciones
    try {
        localStorage.setItem('termsAccepted', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    } catch (e) { console.error(e); }
    
    // Ejecución inmediata sincronizada con Core V5
    setTimeout(async () => {
        let hasSession = false;
        
        try {
            if (window.VV && window.VV.auth && typeof window.VV.auth.checkExistingUser === 'function') {
                hasSession = await window.VV.auth.checkExistingUser();
            }
        } catch (errSession) { console.error(errSession); }
        
        try {
            if (hasSession) {
                console.log("👤 Usuario registrado detectado.");
                if (window.VV && window.VV.auth && typeof window.VV.auth.startApp === 'function') {
                    window.VV.auth.startApp();
                }
            } else {
                console.log("🚀 Modo Invitado Activo: Levantando telón de Lomas de Tafí.");
                
                // Fijamos el entorno geográfico
                if (!window.VV) window.VV = {};
                if (!window.VV.geo) window.VV.geo = {};
                window.VV.geo.currentBarrio = "Lomas de Tafí";

                // Analizamos la ruta actual para saber si mostrar el Dashboard o el Karaoke
                const rutaActual = window.location.hash;
                if (rutaActual === '#karaoke' || rutaActual === '#modulo-karaoke-container') {
                    ejecutarEnrutadoEspecial('#karaoke');
                } else {
                    ejecutarEnrutadoEspecial('#dashboard');
                }
            }
        } catch (errRoute) {
            console.error('Error en el ruteo:', errRoute);
        }
    }, 300);

    // Control de navegación del menú inferior e interactivo
    document.addEventListener('click', function(e) {
        try {
            const menuItem = e.target.closest('.menu-item') || e.target.closest('a[href^="#"]');
            if (menuItem) {
                const href = menuItem.getAttribute('href') || menuItem.dataset.section;
                if (href) {
                    if (href === '#karaoke' || href === 'karaoke') {
                        e.preventDefault();
                        ejecutarEnrutadoEspecial('#karaoke');
                    } else if (href === '#dashboard' || href === 'dashboard') {
                        e.preventDefault();
                        ejecutarEnrutadoEspecial('#dashboard');
                    }
                }
            }
        } catch (err) { console.error(err); }
    });
});

// Función auxiliar de enrutado para evitar colisiones con el Core V5
function ejecutarEnrutadoEspecial(destino) {
    try {
        const panelDashboard = document.getElementById('dashboard') || document.getElementById('panel-dashboard');
        const panelKaraoke = document.getElementById('modulo-karaoke-container');

        if (destino === '#karaoke') {
            if (panelDashboard) panelDashboard.style.display = 'none';
            if (panelKaraoke) panelKaraoke.style.setProperty('display', 'block', 'important');
            window.location.hash = '#karaoke';
            console.log("🎤 Pantalla cambiada a: Estudio Karaoke Pro");
        } else {
            if (panelKaraoke) panelKaraoke.style.display = 'none';
            
            // Dejamos que el Core V5 maneje el encendido oficial del dashboard
            if (window.VV && window.VV.utils && typeof window.VV.utils.showSection === 'function') {
                window.VV.utils.showSection('dashboard');
            } else if (typeof window.showSection === 'function') {
                window.showSection('dashboard');
            }
            window.location.hash = '#dashboard';
        }
    } catch (err) {
        console.error("Error en enrutado especial:", err);
    }
}

console.log('✅ Enrutador rápido V6 acoplado de forma óptima.');
// ============================================================
// 🎙️ LÓGICA INTERNA DEL ESTUDIO KARAOKE PRO (AL FINAL DEL ARCHIVO)
// ============================================================

const YOUTUBE_API_KEY = "AIzaSyBV75vgH2KWvNgGn-OuNldrSHIignAkisA"; // Coloca tu clave real de Google Cloud aquí

const CATALOGO_LOCAL = [
    { id: "XW5U8pWJqK4", title: "Soda Stereo - De Música Ligera (Karaoke)", genre: "rock" },
    { id: "M7X9XyVfSgA", title: "Chaqueño Palavecino - Amor Salvaje (Karaoke)", genre: "folclore" },
    { id: "3wVw86mI6N0", title: "Gilda - No me arrepiento de este amor (Karaoke)", genre: "cumbia" }
];

let player;            
let mediaRecorder;     
let audioChunks = [];  
let estaGrabando = false;
let audioCtx, micStream, source, gainNode, delayNode, feedbackNode;

// Inicialización automática del reproductor de YouTube
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '100%', width: '100%', videoId: '',
        playerVars: { 'autoplay': 0, 'controls': 1, 'modestbranding': 1, 'rel': 0 }
    });
}

// El motor de búsqueda que llama tu botón "Buscar"
function ejecutarBusquedaOficial() {
    const input = document.getElementById('search-input');
    const consulta = input.value.trim();
    const contenedorResultados = document.getElementById('results');

    if (!consulta) return;
    contenedorResultados.innerHTML = "";

    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "" || YOUTUBE_API_KEY.includes("AIzaSyBV75vgH2KWvNgGn-OuNldrSHIignAkisA")) {
        renderizarResultados(CATALOGO_LOCAL);
    } else {
        const urlGoogle = `https://googleapis.com{encodeURIComponent(consulta + " karaoke")}&type=video&key=${YOUTUBE_API_KEY}`;
        
        fetch(urlGoogle)
            .then(res => res.json())
            .then(data => {
                if (data.items && data.items.length > 0) {
                    const formateadas = data.items.map(item => ({
                        id: item.id.videoId, title: item.snippet.title, genre: "YouTube Live"
                    }));
                    renderizarResultados(formateadas);
                } else {
                    renderizarResultados(CATALOGO_LOCAL);
                }
            })
            .catch(() => renderizarResultados(CATALOGO_LOCAL));
    }
}

function renderizarResultados(lista) {
    const contenedor = document.getElementById('results');
    contenedor.innerHTML = "";
    lista.forEach(track => {
        const div = document.createElement('div');
        div.className = 'track-item';
        div.onclick = () => seleccionarCancion(track.id, track.title);
        div.innerHTML = `
            <div class="track-thumb">🎵</div>
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-genre">${track.genre}</div>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

function seleccionarCancion(id, titulo) {
    document.getElementById('studio-console').style.display = 'block';
    document.getElementById('console-title').innerText = titulo;
    if (player && player.loadVideoById) {
        player.loadVideoById(id);
        player.stopVideo(); 
    }
    document.getElementById('studio-console').scrollIntoView({ behavior: 'smooth' });
}

async function inicializarAudioProesado() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        source = audioCtx.createMediaStreamSource(micStream);
        gainNode = audioCtx.createGain();       
        delayNode = audioCtx.createDelay();     
        feedbackNode = audioCtx.createGain();   

        delayNode.delayTime.value = 0.3; 
        feedbackNode.gain.value = document.getElementById('vol-eco').value;
        gainNode.gain.value = document.getElementById('vol-mic').value;

        source.connect(gainNode);
        gainNode.connect(delayNode);
        delayNode.connect(feedbackNode);
        feedbackNode.connect(delayNode);
        
        gainNode.connect(audioCtx.destination);
        delayNode.connect(audioCtx.destination);

        document.getElementById('vol-mic').addEventListener('input', (e) => { gainNode.gain.value = e.target.value; });
        document.getElementById('vol-eco').addEventListener('input', (e) => { feedbackNode.gain.value = e.target.value; });

        mediaRecorder = new MediaRecorder(micStream);
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const preview = document.getElementById('audio-preview');
            const link = document.getElementById('download-link');
            
            preview.src = audioUrl;
            preview.style.display = 'block';
            link.href = audioUrl;
            link.download = `VecinosVirtuales_Karaoke.mp3`;
            link.style.display = 'inline-flex';
        };
    }
}

async function toggleGrabacion() {
    const btn = document.getElementById('rec-btn');
    const statusText = document.getElementById('rec-status');
    const eq = document.getElementById('eq-loader');

    if (!estaGrabando) {
        try {
            await inicializarAudioProesado();
            audioChunks = [];
            if (audioCtx.state === 'suspended') await audioCtx.resume();
            
            mediaRecorder.start();
            if (player && player.playVideo) player.playVideo(); 

            estaGrabando = true;
            btn.classList.add('recording');
            btn.innerHTML = '<i class="fas fa-stop"></i>';
            statusText.innerText = "¡Estás al aire! Canta con confianza...";
            statusText.style.color = "#22c55e";
            eq.style.display = 'flex';
            
            document.getElementById('audio-preview').style.display = 'none';
            document.getElementById('download-link').style.display = 'none';
        } catch (err) {
            const statusBox = document.getElementById('status-box');
            statusBox.style.display = 'block';
            statusBox.innerText = "⚠️ Error: Activa los permisos de micrófono para poder cantar.";
        }
    } else {
        mediaRecorder.stop();
        if (player && player.pauseVideo) player.pauseVideo();
        
        estaGrabando = false;
        btn.classList.remove('recording');
        btn.innerHTML = '<i class="fas fa-microphone"></i>';
        statusText.innerText = "Canción finalizada. Escucha y guarda tu voz abajo.";
        statusText.style.color = "#9ca3af";
        eq.style.display = 'none';
    }
}
