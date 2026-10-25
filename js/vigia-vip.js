// ============================================================
// VIGÍA VIP — PANEL DEL PADRE / TUTOR
// Crear rutas, generar enlace, ver ubicación en vivo
// ============================================================

VV.vigiaVIP = {
    rutaSeleccionada: null,
    mapa: null,
    marcadorDestino: null,
    marcadorTiempoReal: null,
    polilinea: null,
    puntosRuta: [],
    sesionActiva: null,
    intervaloMapa: null,

    // Verificar VIP
    isVIP() {
        const user = VV_ROLES ? VV_ROLES.getCurrentUser() : null;
        if (!user) return false;
        return VV.avatars.getUserTier(user.id) === 'vip';
    },

    // Generar código único
    generarCodigo() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let codigo = '';
        for (let i = 0; i < 10; i++) {
            codigo += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return codigo;
    },

    // Crear ruta
    async crearRuta(datos) {
        const user = VV_ROLES.getCurrentUser();
        if (!user) return { error: 'Debés iniciar sesión' };
        if (!this.isVIP()) return { error: 'Esta función es exclusiva para usuarios VIP' };

        const codigo = this.generarCodigo();

        try {
            const { data, error } = await supabase
                .from('vigia_rutas')
                .insert({
                    creada_por: user.id,
                    nombre: datos.nombre || 'Ruta segura',
                    destino_lat: datos.destino_lat,
                    destino_lng: datos.destino_lng,
                    destino_nombre: datos.destino_nombre || '',
                    radio_metros: datos.radio_metros || 100,
                    eta_minutos: datos.eta_minutos || 20,
                    codigo_acceso: codigo,
                    modo_activacion: datos.modo_activacion || 'enlace',
                    asignada_a: datos.asignada_a || null,
                    activa: true
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, ruta: data, codigo: codigo };
        } catch (err) {
            console.error('Error creando ruta:', err);
            return { error: err.message };
        }
    },

    // Listar mis rutas
    async listarRutas() {
        const user = VV_ROLES.getCurrentUser();
        if (!user) return [];

        try {
            const { data, error } = await supabase
                .from('vigia_rutas')
                .select('*')
                .eq('creada_por', user.id)
                .order('creada_en', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error listando rutas:', err);
            return [];
        }
    },

    // Activar / desactivar ruta
    async toggleRuta(rutaId, activa) {
        try {
            const { error } = await supabase
                .from('vigia_rutas')
                .update({ activa: activa })
                .eq('id', rutaId);
            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Error toggle ruta:', err);
            return { error: err.message };
        }
    },

    // Eliminar ruta
    async eliminarRuta(rutaId) {
        try {
            const { error } = await supabase
                .from('vigia_rutas')
                .delete()
                .eq('id', rutaId);
            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Error eliminando ruta:', err);
            return { error: err.message };
        }
    },

    // Ver sesión activa de una ruta
    async getSesionActiva(rutaId) {
        try {
            const { data, error } = await supabase
                .from('vigia_sesiones')
                .select('*')
                .eq('ruta_id', rutaId)
                .eq('status', 'activa')
                .order('started_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            return data || null;
        } catch (err) {
            console.error('Error buscando sesión activa:', err);
            return null;
        }
    },

    // Obtener última ubicación
    async getUltimaUbicacion(sesionId) {
        try {
            const { data, error } = await supabase
                .from('vigia_ubicaciones')
                .select('*')
                .eq('sesion_id', sesionId)
                .order('timestamp', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            return data || null;
        } catch (err) {
            console.error('Error buscando ubicación:', err);
            return null;
        }
    },

    // Generar enlace para el teléfono del niño
    generarEnlace(codigo) {
        const base = window.location.origin;
        return base + '/ruta.html?code=' + codigo;
    },

    // Renderizar lista de rutas
    async renderRutas(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const rutas = await this.listarRutas();

        if (rutas.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:2rem;color:#94a3b8;">
                    <div style="font-size:3rem;margin-bottom:1rem;">🛡️</div>
                    <h3 style="margin:0 0 0.5rem;">No tenés rutas creadas</h3>
                    <p style="font-size:0.85rem;">Creá una ruta para seguir a tu hijo en tiempo real</p>
                </div>
            `;
            return;
        }

        container.innerHTML = rutas.map(ruta => {
            const enlace = this.generarEnlace(ruta.codigo_acceso);
            return `
                <div style="background:white;border-radius:10px;padding:1rem;box-shadow:0 1px 4px rgba(0,0,0,0.08);border-left:4px solid ${ruta.activa ? '#10b981' : '#94a3b8'};margin-bottom:0.75rem;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <h4 style="margin:0;">${ruta.nombre}</h4>
                        <span style="font-size:0.7rem;padding:0.2rem 0.5rem;border-radius:8px;background:${ruta.activa ? '#f0fdf4' : '#f1f5f9'};color:${ruta.activa ? '#16a34a' : '#94a3b8'};font-weight:600;">${ruta.activa ? '● Activa' : '○ Inactiva'}</span>
                    </div>
                    <p style="font-size:0.8rem;color:#64748b;margin:0.5rem 0;">
                        🏫 ${ruta.destino_nombre || 'Destino'} · ⏱️ ${ruta.eta_minutos} min · 📏 ${ruta.radio_metros}m
                    </p>
                    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem;">
                        <button onclick="navigator.clipboard.writeText('${enlace}'); VV.utils.showSuccess('Enlace copiado')" style="flex:1;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:6px;padding:0.5rem;cursor:pointer;font-size:0.8rem;font-weight:600;">
                            🔗 Copiar enlace
                        </button>
                        <button onclick="VV.vigiaVIP.mostrarMapaEnVivo('vigia-mapa-container','${ruta.id}')" style="flex:1;background:#3b82f6;color:white;border:none;border-radius:6px;padding:0.5rem;cursor:pointer;font-size:0.8rem;">
                            🗺️ Ver en vivo
                        </button>
                        <button onclick="VV.vigiaVIP.toggleRuta('${ruta.id}', ${!ruta.activa}).then(()=>VV.vigiaVIP.renderRutas('${containerId}'))" style="background:${ruta.activa ? '#e2e8f0' : '#10b981'};color:${ruta.activa ? '#475569' : 'white'};border:none;border-radius:6px;padding:0.5rem;cursor:pointer;font-size:0.8rem;">
                            ${ruta.activa ? '⏸️ Pausar' : '▶️ Activar'}
                        </button>
                        <button onclick="if(confirm('¿Eliminar esta ruta?')) VV.vigiaVIP.eliminarRuta('${ruta.id}').then(()=>VV.vigiaVIP.renderRutas('${containerId}'))" style="background:#ef4444;color:white;border:none;border-radius:6px;padding:0.5rem;cursor:pointer;font-size:0.8rem;">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML += `<div id="vigia-mapa-container" style="margin-top:1rem;"></div>`;
    },

    // Mostrar mapa en vivo
    async mostrarMapaEnVivo(containerId, rutaId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const rutas = await this.listarRutas();
        const ruta = rutas.find(r => r.id === rutaId);
        if (!ruta) {
            container.innerHTML = '<p style="text-align:center;padding:1rem;color:#ef4444;">Ruta no encontrada</p>';
            return;
        }

        const sesion = await this.getSesionActiva(ruta.id);

        if (!sesion) {
            container.innerHTML = '<p style="text-align:center;padding:1rem;color:#94a3b8;">No hay una sesión activa. La ruta se activa cuando se abre el enlace en el teléfono del niño.</p>';
            return;
        }

        this.sesionActiva = sesion;

        container.innerHTML = `
            <div style="padding:0.75rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:0.5rem;">
                <strong>🛡️ Sesión activa</strong>
                <span style="font-size:0.8rem;color:#16a34a;">desde ${new Date(sesion.started_at).toLocaleTimeString('es-AR')}</span>
            </div>
            <div id="vigia-mapa-${ruta.id}" style="height:350px;border-radius:8px;z-index:0;"></div>
            <div id="vigia-estado-${ruta.id}" style="text-align:center;padding:0.5rem;font-size:0.8rem;color:#94a3b8;">Esperando ubicación...</div>
        `;

        if (this.mapa) {
            this.mapa.remove();
            this.mapa = null;
        }
        this.marcadorTiempoReal = null;
        this.polilinea = null;
        this.puntosRuta = [];

        setTimeout(() => {
            this.mapa = L.map('vigia-mapa-' + ruta.id).setView([ruta.destino_lat, ruta.destino_lng], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(this.mapa);

            L.circleMarker([ruta.destino_lat, ruta.destino_lng], {
                radius: Math.max(10, ruta.radio_metros / 10),
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.2,
                weight: 2
            }).addTo(this.mapa).bindPopup(ruta.destino_nombre || 'Destino');

            if (this.intervaloMapa) clearInterval(this.intervaloMapa);
            this.intervaloMapa = setInterval(() => {
                this.actualizarUbicacionEnVivo(ruta.id, sesion.id);
            }, 3000);
            this.actualizarUbicacionEnVivo(ruta.id, sesion.id);
        }, 100);
    },

    // Actualizar ubicación en vivo (polling cada 3 seg)
    async actualizarUbicacionEnVivo(rutaId, sesionId) {
        const ubicacion = await this.getUltimaUbicacion(sesionId);
        const estadoEl = document.getElementById('vigia-estado-' + rutaId);
        if (!ubicacion) {
            if (estadoEl) estadoEl.textContent = 'Esperando primera ubicación...';
            return;
        }

        if (this.mapa) {
            if (!this.marcadorTiempoReal) {
                this.marcadorTiempoReal = L.marker([ubicacion.lat, ubicacion.lng], {
                    icon: L.divIcon({ className: '', html: '🔵', iconSize: [20, 20] })
                }).addTo(this.mapa);
            } else {
                this.marcadorTiempoReal.setLatLng([ubicacion.lat, ubicacion.lng]);
            }

            this.puntosRuta.push([ubicacion.lat, ubicacion.lng]);
            if (this.polilinea) this.mapa.removeLayer(this.polilinea);
            this.polilinea = L.polyline(this.puntosRuta, {
                color: '#3b82f6', weight: 3, opacity: 0.7
            }).addTo(this.mapa);

            this.mapa.setView([ubicacion.lat, ubicacion.lng], 15);
        }

        if (estadoEl) {
            estadoEl.textContent = '📍 Última ubicación: ' + new Date(ubicacion.timestamp).toLocaleTimeString('es-AR') +
                ' (±' + Math.round(ubicacion.accuracy || 0) + 'm)';
        }
    },

    // Detener mapa en vivo
    detenerMapaEnVivo() {
        if (this.intervaloMapa) {
            clearInterval(this.intervaloMapa);
            this.intervaloMapa = null;
        }
        this.puntosRuta = [];
        this.marcadorTiempoReal = null;
        this.polilinea = null;
    },

    // Formulario de nueva ruta
    renderFormularioNuevaRuta(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div style="background:white;border-radius:10px;padding:1rem;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
                <h3 style="margin:0 0 1rem;"><i class="fas fa-route"></i> Nueva Ruta Segura</h3>
                <div class="form-group">
                    <label>Nombre de la ruta *</label>
                    <input type="text" id="vigia-nombre" placeholder="Ida al colegio de Juan" style="width:100%;padding:0.5rem;border:1px solid var(--gray-300);border-radius:6px;">
                </div>
                <div class="form-group">
                    <label>Destino (tocá el mapa para elegir) *</label>
                    <div id="vigia-mapa-destino" style="height:250px;border-radius:8px;border:1px solid var(--gray-200);"></div>
                    <p id="vigia-destino-info" style="font-size:0.8rem;color:#94a3b8;margin-top:0.5rem;">Tocá el mapa para marcar el destino</p>
                </div>
                <div class="form-group" style="margin-top:0.75rem;">
                    <label>Nombre del destino</label>
                    <input type="text" id="vigia-destino-nombre" placeholder="Colegio San Martín" style="width:100%;padding:0.5rem;border:1px solid var(--gray-300);border-radius:6px;">
                </div>
                <div style="display:flex;gap:0.75rem;margin-top:0.75rem;">
                    <div class="form-group" style="flex:1;">
                        <label>Tiempo estimado (min)</label>
                        <input type="number" id="vigia-eta" value="20" min="1" max="180" style="width:100%;padding:0.5rem;border:1px solid var(--gray-300);border-radius:6px;">
                    </div>
                    <div class="form-group" style="flex:1;">
                        <label>Radio de llegada (m)</label>
                        <input type="number" id="vigia-radio" value="100" min="30" max="500" style="width:100%;padding:0.5rem;border:1px solid var(--gray-300);border-radius:6px;">
                    </div>
                </div>
                <div class="form-group" style="margin-top:0.75rem;">
                    <label>Modo de activación</label>
                    <select id="vigia-modo" style="width:100%;padding:0.5rem;border:1px solid var(--gray-300);border-radius:6px;">
                        <option value="enlace">🔗 Enlace (niño pequeño/especial — sin cuenta)</option>
                        <option value="app">📱 App (adolescente con cuenta)</option>
                    </select>
                </div>
                <button onclick="VV.vigiaVIP.guardarNuevaRuta()" style="width:100%;margin-top:1rem;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:8px;padding:0.75rem;cursor:pointer;font-weight:600;">
                    <i class="fas fa-save"></i> Crear Ruta
                </button>
            </div>
        `;

        setTimeout(() => {
            // Centrar en Tucumán por defecto
            this.mapa = L.map('vigia-mapa-destino').setView([-26.8083, -65.2167], 13);

            // Si el GPS está disponible, centrar en la ubicación actual
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(pos) {
                    VV.vigiaVIP.mapa.setView([pos.coords.latitude, pos.coords.longitude], 15);
                });
            }

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(this.mapa);

            this.mapa.on('click', (e) => {
                if (this.marcadorDestino) this.mapa.removeLayer(this.marcadorDestino);
                this.marcadorDestino = L.marker([e.latlng.lat, e.latlng.lng]).addTo(this.mapa);
                document.getElementById('vigia-destino-info').textContent =
                    '📍 Destino: ' + e.latlng.lat.toFixed(6) + ', ' + e.latlng.lng.toFixed(6);
            });
        }, 100);
    },

    // Guardar nueva ruta
    async guardarNuevaRuta() {
        const nombre = document.getElementById('vigia-nombre').value.trim();
        const destinoNombre = document.getElementById('vigia-destino-nombre').value.trim();
        const eta = parseInt(document.getElementById('vigia-eta').value) || 20;
        const radio = parseInt(document.getElementById('vigia-radio').value) || 100;
        const modo = document.getElementById('vigia-modo').value;

        if (!nombre) { alert('Ingresá un nombre para la ruta'); return; }
        if (!this.marcadorDestino) { alert('Tocá el mapa para elegir el destino'); return; }

        const latlng = this.marcadorDestino.getLatLng();

        const resultado = await this.crearRuta({
            nombre: nombre,
            destino_lat: latlng.lat,
            destino_lng: latlng.lng,
            destino_nombre: destinoNombre,
            eta_minutos: eta,
            radio_metros: radio,
            modo_activacion: modo
        });

        if (resultado.error) {
            alert('Error: ' + resultado.error);
            return;
        }

        const enlace = this.generarEnlace(resultado.codigo);
        navigator.clipboard.writeText(enlace).then(function() {
            alert('✅ Ruta creada!\n\nEl enlace se copió automáticamente al portapapeles.\n\nPegalo en el navegador del teléfono del niño.');
        }).catch(function() {
            prompt('Copia este enlace (Ctrl+C):', enlace);
        });
        this.renderRutas('vigia-rutas-container');
    },

    // ============================================================
    // MOSTRAR PANEL COMPLETO (overlay)
    // ============================================================
    mostrarPanel() {
        if (!this.isVIP()) {
            alert('🛡️ Ruta Segura es una función exclusiva para usuarios VIP.\n\nContactá al administrador para más información.');
            return;
        }

        let overlay = document.getElementById('vigia-panel-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'vigia-panel-overlay';
            overlay.className = 'modal-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99998;overflow-y:auto;';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div style="background:white;max-width:600px;margin:2rem auto;border-radius:12px;padding:1.5rem;min-height:80vh;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    <h2 style="margin:0;color:#1a1a40;"><i class="fas fa-shield-alt"></i> Ruta Segura</h2>
                    <button onclick="document.getElementById('vigia-panel-overlay').style.display='none'; VV.vigiaVIP.detenerMapaEnVivo();" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#94a3b8;">✕</button>
                </div>
                <p style="font-size:0.85rem;color:#64748b;margin-bottom:1rem;">Creá una ruta para seguir a tu hijo en tiempo real. Se generará un enlace para abrir en el teléfono del niño.</p>
                <div id="vigia-form-container"></div>
                <hr style="margin:1.5rem 0;border:none;border-top:1px solid #e2e8f0;">
                <h3 style="margin:0 0 0.75rem;color:#1a1a40;">Mis rutas</h3>
                <div id="vigia-rutas-container"></div>
            </div>
        `;

        overlay.style.display = 'flex';
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                overlay.style.display = 'none';
                VV.vigiaVIP.detenerMapaEnVivo();
            }
        };

        this.renderFormularioNuevaRuta('vigia-form-container');
        this.renderRutas('vigia-rutas-container');
    },

};
