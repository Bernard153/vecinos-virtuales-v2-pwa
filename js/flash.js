/* ============================================================
   SISTEMA DE ANUNCIOS FLASH — Vecinos Virtuales
   js/flash.js
   Componente de visualización + Panel de administración
   Namespace: VV.flash (display) + VV.flashAdmin (admin)
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    //  PARTE 1: COMPONENTE DE VISUALIZACIÓN (lo que ve el vecino)
    // ============================================================
    VV.flash = {
        flashesActivos: [],
        indexActual: 0,
        timerActual: null,
        timerIntervalo: null,
        mostrando: false,
        flashesVistosHoy: [],

        // Mapeo de efectos DB -> clases CSS
        mapaEntrada: {
            'fade': 'flash-anim-fade-in',
            'zoom': 'flash-anim-zoom-in',
            'slide_arriba': 'flash-anim-slide-arriba',
            'slide_izquierda': 'flash-anim-slide-izquierda',
            'rebote': 'flash-anim-rebote',
            'girar': 'flash-anim-girar',
            'elastico': 'flash-anim-elastico',
            'volar_arriba': 'flash-anim-volar-arriba',
            'latido': 'flash-anim-latido'
        },
        mapaSalida: {
            'fade': 'flash-anim-fade-out',
            'zoom_out': 'flash-anim-zoom-out',
            'slide_abajo': 'flash-anim-slide-abajo',
            'girar_out': 'flash-anim-girar-out',
            'volar_out': 'flash-anim-volar-out'
        },

        /**
         * Inicializa el sistema de flash.
         * Llamar después de que el usuario inicia sesión.
         */
        init: function () {
            if (!document.getElementById('flash-overlay')) {
                this.crearOverlay();
            }
            this.cargarFlashes();
        },

        /**
         * Crea el HTML del overlay en el DOM
         */
        crearOverlay: function () {
            var html =
                '<div id="flash-overlay">' +
                    '<div id="flash-box">' +
                        '<span id="flash-label">ANUNCIO</span>' +
                        '<div id="flash-close">✕</div>' +
                        '<div id="flash-image">' +
                            '<div id="flash-text"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="flash-counter"></div>' +
                '</div>';
            document.body.insertAdjacentHTML('beforeend', html);

            var self = this;
            document.getElementById('flash-close').addEventListener('click', function () {
                self.cerrarYAvanzar();
            });
        },

        /**
         * Carga los flashes activos para el barrio del usuario
         */
        cargarFlashes: async function () {
            try {
                var barrio = VV.data.neighborhood || (VV.data.user && VV.data.user.neighborhood);

                var { data, error } = await supabase
                    .from('anuncios_flash')
                    .select('*')
                    .eq('estado', 'activo')
                    .lte('fecha_inicio', new Date().toISOString());

                if (error) {
                    console.error('Flash: error cargando flashes:', error);
                    return;
                }

                if (!data || data.length === 0) return;

                var self = this;
                var flashes = data.filter(function (f) {
                    if (f.fecha_fin && new Date(f.fecha_fin) < new Date()) return false;
                    if (f.barrio && barrio && f.barrio !== barrio) return false;
                    if (f.frecuencia === 'una_vez_por_dia') {
                        var hoy = new Date().toDateString();
                        var key = f.id + '_' + hoy;
                        if (self.flashesVistosHoy.indexOf(key) !== -1) return false;
                    }
                    return true;
                });

                this.flashesActivos = flashes;

                if (flashes.length > 0) {
                    this.mostrarTanda();
                }
            } catch (err) {
                console.error('Flash: error inesperado:', err);
            }
        },

        /**
         * Muestra una tanda de hasta 2 flashes
         */
        mostrarTanda: function () {
            if (this.flashesActivos.length === 0 || this.mostrando) return;
            this.mostrando = true;
            this.indexActual = 0;
            this.mostrarSiguiente();
        },

        /**
         * Muestra el siguiente flash en la tanda
         */
        mostrarSiguiente: function () {
            var self = this;

            if (this.indexActual >= this.flashesActivos.length || this.indexActual >= 2) {
                this.mostrando = false;
                this.actualizarCounter(-1);
                var intervalo = this.calcularIntervalo();
                this.timerIntervalo = setTimeout(function () {
                    self.mostrarTanda();
                }, intervalo);
                return;
            }

            var flash = this.flashesActivos[this.indexActual];
            this.mostrarFlash(flash);
            this.actualizarCounter(this.indexActual);

            this.timerActual = setTimeout(function () {
                self.cerrarYAvanzar();
            }, flash.duracion_seg * 1000);
        },

        /**
         * Muestra un flash individual con su animación de entrada
         */
        mostrarFlash: function (flash) {
            var overlay = document.getElementById('flash-overlay');
            var box = document.getElementById('flash-box');
            var image = document.getElementById('flash-image');
            var text = document.getElementById('flash-text');

            image.style.backgroundImage = 'url("' + flash.imagen_url + '")';

            text.className = '';
            if (flash.texto_posicion === 'none' || !flash.texto_superpuesto) {
                text.classList.add('flash-text-none');
                text.textContent = '';
            } else {
                text.classList.add('flash-text-' + flash.texto_posicion);
                text.textContent = flash.texto_superpuesto;
                text.style.color = flash.texto_color || '#fff';
                text.style.fontSize = (flash.texto_tamano || 15) + 'px';
                if (flash.texto_fondo === false) {
                    text.style.background = 'transparent';
                    text.style.textShadow = '2px 2px 4px rgba(0,0,0,0.9)';
                } else {
                    text.style.background = 'rgba(0,0,0,0.6)';
                    text.style.textShadow = '1px 1px 3px rgba(0,0,0,0.8)';
                }
            }

            box.className = '';
            void box.offsetWidth;
            box.classList.add(this.mapaEntrada[flash.efecto_entrada] || 'flash-anim-zoom-in');

            overlay.classList.add('flash-activo');

            this.registrarImpresion(flash.id);

            var hoy = new Date().toDateString();
            this.flashesVistosHoy.push(flash.id + '_' + hoy);
        },

        /**
         * Cierra el flash actual y avanza al siguiente
         */
        cerrarYAvanzar: function () {
            var self = this;
            if (this.timerActual) {
                clearTimeout(this.timerActual);
                this.timerActual = null;
            }

            var box = document.getElementById('flash-box');
            var flash = this.flashesActivos[this.indexActual];
            var overlay = document.getElementById('flash-overlay');

            box.className = '';
            void box.offsetWidth;
            if (flash) {
                box.classList.add(this.mapaSalida[flash.efecto_salida] || 'flash-anim-fade-out');
            }

            setTimeout(function () {
                overlay.classList.remove('flash-activo');
                self.indexActual++;
                self.mostrarSiguiente();
            }, 450);
        },

        /**
         * Calcula el intervalo entre tandas (en ms)
         */
        calcularIntervalo: function () {
            if (this.flashesActivos.length > 0 && this.flashesActivos[0].intervalo_min) {
                return this.flashesActivos[0].intervalo_min * 60 * 1000;
            }
            return 10 * 60 * 1000;
        },

        /**
         * Actualiza el contador de puntos de la tanda
         */
        actualizarCounter: function (index) {
            var counter = document.getElementById('flash-counter');
            if (!counter) return;
            var total = Math.min(this.flashesActivos.length, 2);
            if (index < 0) {
                counter.innerHTML = '';
                return;
            }
            var html = '';
            for (var i = 0; i < total; i++) {
                html += '<span class="dot' + (i === index ? ' active' : '') + '"></span>';
            }
            counter.innerHTML = html;
        },

        /**
         * Registra la impresión en la base de datos
         */
        registrarImpresion: async function (flashId) {
            try {
                var userId = VV.data.user && VV.data.user.id;
                if (!userId) return;
                await supabase.from('flash_impresiones').insert({
                    flash_id: flashId,
                    user_id: userId,
                    clic: false
                });
            } catch (e) {
                console.warn('Flash: no se pudo registrar impresión:', e);
            }
        },

        /**
         * Detiene el sistema de flash (al cerrar sesión)
         */
        detener: function () {
            if (this.timerActual) clearTimeout(this.timerActual);
            if (this.timerIntervalo) clearTimeout(this.timerIntervalo);
            this.timerActual = null;
            this.timerIntervalo = null;
            this.mostrando = false;
            this.flashesActivos = [];
            this.indexActual = 0;
            var overlay = document.getElementById('flash-overlay');
            if (overlay) overlay.classList.remove('flash-activo');
        }
    };
    // ============================================================
    //  PARTE 2: PANEL DE ADMINISTRACIÓN
    // ============================================================
    VV.flashAdmin = {
        editandoId: null,

        /**
         * Muestra el panel de administración de flashes
         */
        mostrar: function () {
            VV.admin.showTab('flash');
            this.cargarLista();
        },

        /**
         * Carga la lista de flashes en el panel admin
         */
        cargarLista: async function () {
            var contenedor = document.getElementById('admin-flash-lista');
            if (!contenedor) return;

            contenedor.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;">Cargando flashes...</p>';

            try {
                var { data, error } = await supabase
                    .from('anuncios_flash')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (!data || data.length === 0) {
                    contenedor.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:2rem;">No hay anuncios flash creados aún.<br>Presioná "Nuevo Flash" para crear el primero.</p>';
                    return;
                }

                var html = '';
                data.forEach(function (f) {
                    var fechaInicio = new Date(f.fecha_inicio).toLocaleDateString('es-AR');
                    var fechaFin = f.fecha_fin ? new Date(f.fecha_fin).toLocaleDateString('es-AR') : 'Sin vencimiento';
                    var barrioTxt = f.barrio ? f.barrio : 'Todos los barrios';

                    html += '<div class="flash-admin-card">' +
                        '<div class="flash-admin-card-img" style="background-image:url(\'' + f.imagen_url + '\')"></div>' +
                        '<div class="flash-admin-card-body">' +
                            '<h4>' + (f.anunciante_nombre || 'Sin nombre') + '</h4>' +
                            '<span class="flash-admin-badge ' + f.estado + '">' + f.estado + '</span>' +
                            '<div class="flash-admin-card-meta">' +
                                '<i class="fas fa-map-marker-alt"></i> ' + barrioTxt + '<br>' +
                                '<i class="fas fa-calendar"></i> ' + fechaInicio + ' → ' + fechaFin + '<br>' +
                                '<i class="fas fa-clock"></i> ' + f.duracion_seg + 's · cada ' + f.intervalo_min + ' min' +
                            '</div>' +
                            '<div class="flash-admin-card-actions">' +
                                (f.estado !== 'activo' ? '<button class="btn-activar" onclick="VV.flashAdmin.activar(\'' + f.id + '\')"><i class="fas fa-check"></i> Activar</button>' : '') +
                                '<button onclick="VV.flashAdmin.editar(\'' + f.id + '\')"><i class="fas fa-edit"></i> Editar</button>' +
                                '<button onclick="VV.flashAdmin.verReporte(\'' + f.id + '\')"><i class="fas fa-chart-bar"></i> Reporte</button>' +
                                '<button class="btn-eliminar" onclick="VV.flashAdmin.eliminar(\'' + f.id + '\')"><i class="fas fa-trash"></i> Eliminar</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                });

                contenedor.innerHTML = html;
            } catch (err) {
                contenedor.innerHTML = '<p style="color:#ef4444;text-align:center;padding:1rem;">Error: ' + err.message + '</p>';
            }
        },

        /**
         * Abre el formulario para crear/editar un flash
         */
        abrirForm: function (id) {
            this.editandoId = id || null;
            var modal = document.getElementById('flash-form-modal');
            if (!modal) {
                this.crearFormModal();
            }
            this.limpiarForm();
            if (id) {
                this.cargarParaEditar(id);
            }
            document.getElementById('flash-form-modal').classList.add('flash-modal-abierto');
        },

        /**
         * Atajo: editar recibe el id y abre el form
         */
        editar: function (id) {
            this.abrirForm(id);
        },

        /**
         * Crea el modal del formulario en el DOM
         */
        crearFormModal: function () {
            var html =
                '<div id="flash-form-modal">' +
                    '<div class="flash-form-contenido">' +
                        '<h3 id="flash-form-titulo">✨ Nuevo Anuncio Flash</h3>' +

                        '<div class="flash-form-grid">' +
                            '<div class="flash-form-group full">' +
                                '<label>Nombre del anunciante *</label>' +
                                '<input type="text" id="ff-anunciante" placeholder="Ej: Verdulería Don José">' +
                            '</div>' +

                            '<div class="flash-form-group full">' +
                                '<label>Imagen JPG del anuncio *</label>' +
                                '<input type="file" id="ff-imagen" accept="image/*" onchange="VV.flashAdmin.onImagenSeleccionada()">' +
                            '</div>' +

                            '<div class="flash-form-group full">' +
                                '<label>Texto superpuesto (opcional — dejá vacío si el JPG ya trae el slogan)</label>' +
                                '<textarea id="ff-texto" rows="2" placeholder="Ej: Oferta de frutas hoy!" oninput="VV.flashAdmin.actualizarVistaPrevia()"></textarea>' +
                            '</div>' +

                            '<div class="flash-form-group">' +
                                '<label>Posición del texto</label>' +
                                '<select id="ff-posicion" onchange="VV.flashAdmin.actualizarVistaPrevia()">' +
                                    '<option value="bottom">Abajo</option>' +
                                    '<option value="top">Arriba</option>' +
                                    '<option value="center">Centro</option>' +
                                    '<option value="none">Sin texto (solo imagen)</option>' +
                                '</select>' +
                            '</div>' +

                            '<div class="flash-form-group">' +
                                '<label>Color del texto</label>' +
                                '<input type="color" id="ff-color" value="#ffffff" onchange="VV.flashAdmin.actualizarVistaPrevia()">' +
                            '</div>' +

                            '<div class="flash-form-group">' +
                                '<label>Tamaño de texto</label>' +
                                '<input type="number" id="ff-tamano" value="15" min="10" max="30" onchange="VV.flashAdmin.actualizarVistaPrevia()">' +
                            '</div>' +

                            '<div class="flash-form-group">' +
                                '<label>Fondo detrás del texto</label>' +
                                '<select id="ff-fondo" onchange="VV.flashAdmin.actualizarVistaPrevia()">' +
                                    '<option value="true">Sí (semitransparente)</option>' +
                                    '<option value="false">No (solo sombra)</option>' +
                                '</select>' +
                            '</div>' +

                            '<div class="flash-form-group">' +
                                '<label>Efecto de entrada</label>' +
                                '<select id="ff-entrada">' +
                                    '<option value="zoom">Zoom</option>' +
                                    '<option value="rebote">Rebote</option>' +
                                    '<option value="girar">Girar</option>' +
                                    '<option value="elastico">Elástico</option>' +
                                    '<option value="volar_arriba">Volar arriba</option>' +
                                    '<option value="latido">Latido</option>' +
                                    '<option value="slide_arriba">Slide arriba</option>' +
                                    '<option value="slide_izquierda">Slide izquierda</option>' +
                                    '<option value="fade">Fade</option>' +
                                '</select>' +
                            '</div>' +

                            '<div class="flash-form-group">' +
                                '<label>Efecto de salida</label>' +
                                '<select id="ff-salida">' +
                                    '<option value="fade">Fade</option>' +
                                    '<option value="zoom_out">Zoom out</option>' +
                                    '<option value="slide_abajo">Slide abajo</option>' +
                                    '<option value="girar_out">Girar out</option>' +
                                    '<option value="volar_out">Volar arriba out</option>' +
                                '</select>' +
                            '</div>' +

                            '<div class="flash-form-group">' +
                                '<label>Duración (segundos)</label>' +
                                '<input type="number" id="ff-duracion" value="4" min="1" max="20">' +
                            '</div>' +

                            '<div class="flash-form-group">' +
                                '<label>Intervalo entre tandas (minutos)</label>' +
                                '<input type="number" id="ff-intervalo" value="10" min="1" max="120">' +
                            '</div>' +

                            '<div class="flash-form-group">' +
                                '<label>Barrio destino</label>' +
                                '<select id="ff-barrio">' +
                                    '<option value="">Todos los barrios</option>' +
                                '</select>' +
                            '</div>' +

                            '<div class="flash-form-group">' +
                                '<label>Fecha de inicio</label>' +
                                '<input type="datetime-local" id="ff-fecha-inicio">' +
                            '</div>' +

                            '<div class="flash-form-group">' +
                                '<label>Fecha de finalización</label>' +
                                '<input type="datetime-local" id="ff-fecha-fin">' +
                            '</div>' +

                            '<div class="flash-form-group full">' +
                                '<label>URL de destino (opcional — al tocar el anuncio)</label>' +
                                '<input type="text" id="ff-url" placeholder="https://...">' +
                            '</div>' +
                        '</div>' +

                        '<h4 style="margin:1rem 0 0.5rem;color:#475569;font-size:0.9rem;">Vista previa</h4>' +
                        '<div class="flash-vista-previa" id="ff-vista-previa">' +
                            '<span class="flash-vista-previa-label">ANUNCIO</span>' +
                            '<div class="flash-vista-previa-img" id="ff-vista-img">' +
                                '<div class="flash-vista-previa-text" id="ff-vista-text"></div>' +
                            '</div>' +
                        '</div>' +

                        '<div class="flash-form-actions">' +
                            '<button class="btn-guardar" onclick="VV.flashAdmin.guardar()"><i class="fas fa-save"></i> Guardar</button>' +
                            '<button class="btn-cancelar" onclick="VV.flashAdmin.cerrarForm()">Cancelar</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            document.body.insertAdjacentHTML('beforeend', html);
            this.cargarBarrios();
        },

        /**
         * Carga la lista de barrios en el select
         */
        cargarBarrios: async function () {
            try {
                var { data, error } = await supabase
                    .from('users')
                    .select('neighborhood')
                    .not('neighborhood', 'is', null);

                if (error || !data) return;

                var barrios = {};
                data.forEach(function (u) {
                    if (u.neighborhood) barrios[u.neighborhood] = true;
                });

                var select = document.getElementById('ff-barrio');
                if (!select) return;
                var opciones = '<option value="">Todos los barrios</option>';
                Object.keys(barrios).sort().forEach(function (b) {
                    opciones += '<option value="' + b + '">' + b + '</option>';
                });
                select.innerHTML = opciones;
            } catch (e) {
                console.warn('Flash: no se pudieron cargar barrios:', e);
            }
        },

        /**
         * Maneja la selección de imagen — sube a Storage y actualiza vista previa
         */
        onImagenSeleccionada: async function () {
            var input = document.getElementById('ff-imagen');
            if (!input.files || !input.files[0]) return;

            var file = input.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen es muy grande. Máximo 5 MB.');
                return;
            }

            var reader = new FileReader();
            reader.onload = function (e) {
                var img = document.getElementById('ff-vista-img');
                img.style.backgroundImage = 'url("' + e.target.result + '")';
            };
            reader.readAsDataURL(file);

            var nombreArchivo = 'flash_' + Date.now() + '_' + file.name.replace(/\s/g, '_');
            try {
                var { data, error } = await supabase
                    .storage
                    .from('anuncios-flash')
                    .upload(nombreArchivo, file);

                if (error) throw error;

                var url = supabase.storage.from('anuncios-flash').getPublicUrl(nombreArchivo).data.publicUrl;
                document.getElementById('ff-imagen').setAttribute('data-url', url);
            } catch (err) {
                alert('Error al subir la imagen: ' + err.message);
            }
        },

        /**
         * Actualiza la vista previa del texto superpuesto
         */
        actualizarVistaPrevia: function () {
            var texto = document.getElementById('ff-texto').value;
            var posicion = document.getElementById('ff-posicion').value;
            var color = document.getElementById('ff-color').value;
            var tamano = document.getElementById('ff-tamano').value;
            var fondo = document.getElementById('ff-fondo').value === 'true';

            var textEl = document.getElementById('ff-vista-text');

            textEl.style.display = '';
            textEl.style.order = '';
            textEl.style.alignSelf = '';
            textEl.style.borderRadius = '';

            if (posicion === 'none' || !texto) {
                textEl.style.display = 'none';
                return;
            }

            textEl.textContent = texto;
            textEl.style.color = color;
            textEl.style.fontSize = tamano + 'px';

            if (!fondo) {
                textEl.style.background = 'transparent';
                textEl.style.textShadow = '2px 2px 4px rgba(0,0,0,0.9)';
            } else {
                textEl.style.background = 'rgba(0,0,0,0.6)';
                textEl.style.textShadow = '1px 1px 3px rgba(0,0,0,0.8)';
            }

            if (posicion === 'top') {
                textEl.style.order = '-1';
                textEl.style.alignSelf = 'stretch';
                textEl.style.borderRadius = '18px 18px 0 0';
            } else if (posicion === 'center') {
                textEl.style.order = '0';
                textEl.style.alignSelf = 'center';
                textEl.style.margin = 'auto';
                textEl.style.borderRadius = '12px';
            } else {
                textEl.style.order = '1';
                textEl.style.alignSelf = 'stretch';
                textEl.style.borderRadius = '0 0 18px 18px';
            }
        },

        /**
         * Guarda el flash en la base de datos
         */
        guardar: async function () {
            var anunciante = document.getElementById('ff-anunciante').value.trim();
            var imagenUrl = document.getElementById('ff-imagen').getAttribute('data-url');

            if (!anunciante) {
                alert('El nombre del anunciante es obligatorio.');
                return;
            }

            if (!imagenUrl && this.editandoId) {
                imagenUrl = document.getElementById('ff-imagen').getAttribute('data-url-existente');
            }
            if (!imagenUrl) {
                alert('Debés subir una imagen JPG para el anuncio.');
                return;
            }

            var datos = {
                anunciante_nombre: anunciante,
                imagen_url: imagenUrl,
                texto_superpuesto: document.getElementById('ff-texto').value.trim() || null,
                texto_posicion: document.getElementById('ff-posicion').value,
                texto_color: document.getElementById('ff-color').value,
                texto_tamano: parseInt(document.getElementById('ff-tamano').value) || 15,
                texto_fondo: document.getElementById('ff-fondo').value === 'true',
                efecto_entrada: document.getElementById('ff-entrada').value,
                efecto_salida: document.getElementById('ff-salida').value,
                duracion_seg: parseInt(document.getElementById('ff-duracion').value) || 4,
                frecuencia: 'cada_login',
                intervalo_min: parseInt(document.getElementById('ff-intervalo').value) || 10,
                barrio: document.getElementById('ff-barrio').value || null,
                fecha_inicio: document.getElementById('ff-fecha-inicio').value
                    ? new Date(document.getElementById('ff-fecha-inicio').value).toISOString()
                    : new Date().toISOString(),
                fecha_fin: document.getElementById('ff-fecha-fin').value
                    ? new Date(document.getElementById('ff-fecha-fin').value).toISOString()
                    : null,
                url_destino: document.getElementById('ff-url').value.trim() || null,
                estado: 'activo',
                creado_por: VV.data.user.id
            };

            try {
                var result;
                if (this.editandoId) {
                    result = await supabase.from('anuncios_flash').update(datos).eq('id', this.editandoId);
                } else {
                    result = await supabase.from('anuncios_flash').insert(datos);
                }

                if (result.error) throw result.error;

                alert(this.editandoId ? 'Flash actualizado correctamente.' : 'Flash creado y activado correctamente.');
                this.cerrarForm();
                this.cargarLista();
            } catch (err) {
                alert('Error al guardar: ' + err.message);
            }
        },

        /**
         * Carga un flash existente para editar
         */
        cargarParaEditar: async function (id) {
            try {
                var { data, error } = await supabase
                    .from('anuncios_flash')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error || !data) return;

                document.getElementById('flash-form-titulo').textContent = '✏️ Editar Flash';
                document.getElementById('ff-anunciante').value = data.anunciante_nombre || '';
                document.getElementById('ff-imagen').setAttribute('data-url-existente', data.imagen_url);
                document.getElementById('ff-texto').value = data.texto_superpuesto || '';
                document.getElementById('ff-posicion').value = data.texto_posicion || 'bottom';
                document.getElementById('ff-color').value = data.texto_color || '#ffffff';
                document.getElementById('ff-tamano').value = data.texto_tamano || 15;
                document.getElementById('ff-fondo').value = String(data.texto_fondo);
                document.getElementById('ff-entrada').value = data.efecto_entrada || 'zoom';
                document.getElementById('ff-salida').value = data.efecto_salida || 'fade';
                document.getElementById('ff-duracion').value = data.duracion_seg || 4;
                document.getElementById('ff-intervalo').value = data.intervalo_min || 10;
                document.getElementById('ff-barrio').value = data.barrio || '';
                document.getElementById('ff-url').value = data.url_destino || '';

                if (data.fecha_inicio) {
                    var fi = new Date(data.fecha_inicio);
                    document.getElementById('ff-fecha-inicio').value = fi.toISOString().slice(0, 16);
                }
                if (data.fecha_fin) {
                    var ff = new Date(data.fecha_fin);
                    document.getElementById('ff-fecha-fin').value = ff.toISOString().slice(0, 16);
                }

                var img = document.getElementById('ff-vista-img');
                img.style.backgroundImage = 'url("' + data.imagen_url + '")';
                this.actualizarVistaPrevia();
            } catch (e) {
                console.error('Flash: error cargando para editar:', e);
            }
        },

        /**
         * Activa un flash (cambia estado a activo)
         */
        activar: async function (id) {
            try {
                var { error } = await supabase
                    .from('anuncios_flash')
                    .update({ estado: 'activo' })
                    .eq('id', id);
                if (error) throw error;
                this.cargarLista();
            } catch (err) {
                alert('Error al activar: ' + err.message);
            }
        },

        /**
         * Elimina un flash (soft delete)
         */
        eliminar: async function (id) {
            if (!confirm('¿Eliminar este anuncio flash? Esta acción no se puede deshacer.')) return;
            try {
                var { error } = await supabase
                    .from('anuncios_flash')
                    .update({ estado: 'eliminado' })
                    .eq('id', id);
                if (error) throw error;
                this.cargarLista();
            } catch (err) {
                alert('Error al eliminar: ' + err.message);
            }
        },

        /**
         * Muestra el reporte de impresiones de un flash
         */
        verReporte: async function (id) {
            try {
                var { data, error } = await supabase
                    .from('flash_impresiones')
                    .select('id, clic, visto_at')
                    .eq('flash_id', id);

                if (error) throw error;

                var total = data.length;
                var clics = data.filter(function (d) { return d.clic; }).length;
                var ctr = total > 0 ? ((clics / total) * 100).toFixed(1) : '0';

                alert('📊 Reporte del Flash\n\n' +
                    'Impresiones (veces visto): ' + total + '\n' +
                    'Clics: ' + clics + '\n' +
                    'CTR (tasa de clics): ' + ctr + '%');
            } catch (err) {
                alert('Error al cargar reporte: ' + err.message);
            }
        },

        /**
         * Cierra el formulario
         */
        cerrarForm: function () {
            document.getElementById('flash-form-modal').classList.remove('flash-modal-abierto');
            this.editandoId = null;
        },

        /**
         * Limpia el formulario
         */
        limpiarForm: function () {
            document.getElementById('flash-form-titulo').textContent = '✨ Nuevo Anuncio Flash';
            document.getElementById('ff-anunciante').value = '';
            document.getElementById('ff-imagen').value = '';
            document.getElementById('ff-imagen').removeAttribute('data-url');
            document.getElementById('ff-imagen').removeAttribute('data-url-existente');
            document.getElementById('ff-texto').value = '';
            document.getElementById('ff-posicion').value = 'bottom';
            document.getElementById('ff-color').value = '#ffffff';
            document.getElementById('ff-tamano').value = '15';
            document.getElementById('ff-fondo').value = 'true';
            document.getElementById('ff-entrada').value = 'zoom';
            document.getElementById('ff-salida').value = 'fade';
            document.getElementById('ff-duracion').value = '4';
            document.getElementById('ff-intervalo').value = '10';
            document.getElementById('ff-url').value = '';

            // Fecha inicio por defecto: ahora (en zona horaria local)
            var ahora = new Date();
            var localISO = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('ff-fecha-inicio').value = localISO;


            var img = document.getElementById('ff-vista-img');
            img.style.backgroundImage = 'none';
            img.style.backgroundColor = '#f1f5f9';
            this.actualizarVistaPrevia();
        }
    };

})();

console.log('✅ Módulo FLASH cargado');

