// ============================================================
// VIGÍA VIP — RUTA SEGURA
// Lógica de tracking para la página del niño (sin login)
// ============================================================

(function() {
    'use strict';

    let rutaData = null;
    let sesionId = null;
    let watchId = null;
    let wakeLock = null;
    let audioContext = null;
    let ultimaPosicion = null;
    let ultimaSubida = 0;
    let intervaloTimer = null;
    let intervaloGracia = null;
    let tiempoRestante = 0;
    let enGracia = false;
    let graciaSegundos = 60;
    let gpsIntervalo = 5000;
    let gpsIntervaloEscalado = 2000;

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    document.addEventListener('DOMContentLoaded', async function() {
        const params = new URLSearchParams(window.location.search);
        const codigo = params.get('code');

        if (!codigo) {
            mostrarError('Falta el código de la ruta. Contactá a quien te envió el enlace.');
            return;
        }

        if (typeof supabase === 'undefined') {
            mostrarError('Error de conexión. Verificá tu conexión a internet.');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('vigia_rutas')
                .select('*')
                .eq('codigo_acceso', codigo)
                .eq('activa', true)
                .single();

            if (error || !data) {
                mostrarError('El enlace no es válido o la ruta ya no está activa.');
                return;
            }

            rutaData = data;
            iniciarRutaSegura();
        } catch (err) {
            console.error('Error:', err);
            mostrarError('Error al cargar la ruta. Intentá de nuevo.');
        }
    });

    // ============================================================
    // INICIAR RUTA SEGURA
    // ============================================================
    async function iniciarRutaSegura() {
        await activarWakeLock();

        try {
            const { data, error } = await supabase
                .from('vigia_sesiones')
                .insert({
                    ruta_id: rutaData.id,
                    status: 'activa',
                    started_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            sesionId = data.id;
        } catch (err) {
            console.error('Error creando sesión:', err);
            mostrarError('Error al iniciar la ruta. Intentá de nuevo.');
            return;
        }

        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('ruta-activa').style.display = 'flex';

        iniciarGPS();

        tiempoRestante = rutaData.eta_minutos * 60;
        iniciarTimer();

        document.getElementById('btn-llegue').onclick = function() {
            confirmarLlegada();
        };
    }

    // ============================================================
    // GPS — SEGUIMIENTO CONTINUO
    // ============================================================
    function iniciarGPS() {
        if (!navigator.geolocation) {
            mostrarError('Tu celular no soporta GPS.');
            return;
        }

        watchId = navigator.geolocation.watchPosition(
            onGPSExito,
            onGPSError,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    async function onGPSExito(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const velocidad = position.coords.speed || 0;
        const accuracy = position.coords.accuracy || 0;

        ultimaPosicion = { lat, lng };

        document.getElementById('status').textContent =
            '📍 Ubicación compartida (±' + Math.round(accuracy) + 'm)';

        const ahora = Date.now();
        const intervalo = enGracia ? gpsIntervaloEscalado : gpsIntervalo;
        if (ahora - ultimaSubida >= intervalo) {
            ultimaSubida = ahora;
            await enviarUbicacion(lat, lng, velocidad, accuracy);
        }

        if (!enGracia) {
            verificarGeofence(lat, lng);
        }
    }

    function onGPSError(err) {
        console.error('Error GPS:', err);
        document.getElementById('status').textContent = '⚠️ Buscando señal GPS...';
    }

    async function enviarUbicacion(lat, lng, velocidad, accuracy) {
        if (!sesionId) return;
        try {
            await supabase
                .from('vigia_ubicaciones')
                .insert({
                    sesion_id: sesionId,
                    lat: lat,
                    lng: lng,
                    velocidad: velocidad,
                    accuracy: accuracy,
                    timestamp: new Date().toISOString()
                });
        } catch (err) {
            console.error('Error enviando ubicación:', err);
        }
    }

    // ============================================================
    // GEOFENCING — DETECTAR LLEGADA
    // ============================================================
    function verificarGeofence(lat, lng) {
        const distancia = distanciaMetros(
            lat, lng,
            rutaData.destino_lat, rutaData.destino_lng
        );

        if (distancia <= rutaData.radio_metros) {
            confirmarLlegada(lat, lng);
        }
    }

    // Fórmula de Haversine
    function distanciaMetros(lat1, lng1, lat2, lng2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }

    // ============================================================
    // CONFIRMAR LLEGADA
    // ============================================================
    async function confirmarLlegada(lat, lng) {
        if (!sesionId) return;

        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }

        if (intervaloTimer) clearInterval(intervaloTimer);
        if (intervaloGracia) clearInterval(intervaloGracia);

        if (!lat || !lng) {
            lat = ultimaPosicion ? ultimaPosicion.lat : rutaData.destino_lat;
            lng = ultimaPosicion ? ultimaPosicion.lng : rutaData.destino_lng;
        }

        try {
            await supabase
                .from('vigia_sesiones')
                .update({
                    status: 'finalizada',
                    ended_at: new Date().toISOString(),
                    arrival_lat: lat,
                    arrival_lng: lng,
                    arrival_time: new Date().toISOString()
                })
                .eq('id', sesionId);
        } catch (err) {
            console.error('Error finalizando sesión:', err);
        }

        document.getElementById('ruta-activa').innerHTML = `
            <div style="font-size:5rem;">✅</div>
            <h1 style="margin-top:1rem;">¡Llegaste a destino!</h1>
            <p style="margin-top:0.5rem;opacity:0.8;">Tu papá fue notificado</p>
            <p style="margin-top:1rem;font-size:0.8rem;opacity:0.5;">Podés cerrar esta página</p>
        `;

        desactivarWakeLock();
    }

    // ============================================================
    // TIMER Y CUENTA REGRESIVA
    // ============================================================
    function iniciarTimer() {
        intervaloTimer = setInterval(function() {
            tiempoRestante--;

            const mins = Math.floor(Math.max(0, tiempoRestante) / 60);
            const segs = Math.max(0, tiempoRestante) % 60;
            document.getElementById('timer').textContent =
                '⏱️ ' + mins + ':' + (segs < 10 ? '0' : '') + segs;

            if (tiempoRestante > 0) {
                const porcentaje = (tiempoRestante / (rutaData.eta_minutos * 60)) * 100;
                if (porcentaje <= 50 && porcentaje > 25) {
                    if (tiempoRestante % 30 === 0) beep(800, 0.15, 0.3);
                } else if (porcentaje <= 25 && porcentaje > 10) {
                    if (tiempoRestante % 15 === 0) beep(1000, 0.2, 0.4);
                } else if (porcentaje <= 10 && porcentaje > 0) {
                    if (tiempoRestante % 5 === 0) beep(1200, 0.3, 0.5);
                }
            }

            if (tiempoRestante <= 0 && !enGracia) {
                iniciarGracia();
            }
        }, 1000);
    }

    // ============================================================
    // PERÍODO DE GRACIA (60 segundos)
    // ============================================================
    function iniciarGracia() {
        enGracia = true;
        let graciaRestante = graciaSegundos;

        document.getElementById('alerta-gracia').style.display = 'flex';

        intervaloGracia = setInterval(function() {
            beep(1400, 0.4, 0.6);
            graciaRestante--;

            if (graciaRestante <= 0) {
                clearInterval(intervaloGracia);
                escalarAlerta();
            }
        }, 1000);

        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
        }
    }

    // ============================================================
    // ESCALADA A ALERTA COMPLETA
    // ============================================================
    async function escalarAlerta() {
        document.getElementById('alerta-gracia').style.display = 'none';

        document.getElementById('ruta-activa').innerHTML = `
            <div style="font-size:5rem;animation:pulse 0.5s infinite;">🚨</div>
            <h1 style="margin-top:1rem;color:#fbbf24;">Alerta activada</h1>
            <p style="margin-top:0.5rem;opacity:0.8;">Se notificó a tu contacto de confianza</p>
            <p style="margin-top:1rem;font-size:0.8rem;opacity:0.5;">Compartiendo ubicación continuamente</p>
        `;

        try {
            await supabase
                .from('vigia_sesiones')
                .update({
                    status: 'escalada',
                    ended_at: new Date().toISOString(),
                    escalation_reason: 'No confirmó llegada dentro del tiempo estimado'
                })
                .eq('id', sesionId);
        } catch (err) {
            console.error('Error escalando sesión:', err);
        }

        gpsIntervalo = gpsIntervaloEscalado;

        if (navigator.vibrate) {
            navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000]);
        }

        intentarCapturaEmergencia();
    }

    // ============================================================
    // CAPTURA DE EMERGENCIA (foto + audio opcional)
    // ============================================================
    async function intentarCapturaEmergencia() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: true
            });

            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            await video.play();

            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const blob = await new Promise(function(resolve) {
                canvas.toBlob(resolve, 'image/jpeg', 0.7);
            });

            if (blob && sesionId) {
                const fileName = 'vigia-esc-' + sesionId + '-' + Date.now() + '.jpg';
                await supabase.storage
                    .from('alertas-photos')
                    .upload(fileName, blob);
            }

            stream.getTracks().forEach(function(track) { track.stop(); });
        } catch (err) {
            console.log('No se pudo capturar foto/audio:', err.message);
        }
    }

    // ============================================================
    // WAKE LOCK — MANTENER PANTALLA ENCENDIDA
    // ============================================================
    async function activarWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                document.addEventListener('visibilitychange', async function() {
                    if (wakeLock !== null && document.visibilityState === 'visible') {
                        try {
                            wakeLock = await navigator.wakeLock.request('screen');
                        } catch (err) {
                            console.error('Wake Lock re-adquisición falló:', err);
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Wake Lock no disponible:', err);
        }
    }

    function desactivarWakeLock() {
        if (wakeLock !== null) {
            wakeLock.release().then(function() {
                wakeLock = null;
            }).catch(function() {});
        }
    }

    // ============================================================
    // SONIDOS — WEB AUDIO API
    // ============================================================
    function beep(frecuencia, duracion, volumen) {
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.frequency.value = frecuencia;
            oscillator.type = 'sine';
            gain.gain.setValueAtTime(volumen, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duracion);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duracion);
        } catch (err) {
            console.error('Error sonido:', err);
        }
    }

    // ============================================================
    // MOSTRAR ERROR
    // ============================================================
    function mostrarError(mensaje) {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('ruta-activa').style.display = 'none';
        const errorDiv = document.getElementById('error');
        document.getElementById('error-msg').textContent = mensaje;
        errorDiv.style.display = 'block';
    }

})();
