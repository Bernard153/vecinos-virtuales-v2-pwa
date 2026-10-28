/* ============================================================
   BUZÓN DE MENSAJES — Vecinos Virtuales
   js/buzon.js
   Namespace: VV.buzon (usuario) + VV.buzonAdmin (admin)
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    //  PARTE 1: BUZÓN DEL USUARIO (lo que ve el vecino)
    // ============================================================
    VV.buzon = {
        tipoSeleccionado: 'sugerencia',

        /**
         * Abre el modal del buzón
         */
        abrir: function () {
            if (!document.getElementById('buzon-modal')) {
                this.crearModal();
            }
            this.limpiarForm();
            this.cargarMisMensajes();
            document.getElementById('buzon-modal').classList.add('buzon-abierto');
        },

        /**
         * Crea el modal en el DOM
         */
        crearModal: function () {
            var html =
                '<div id="buzon-modal">' +
                    '<div class="buzon-contenido">' +
                        '<div class="buzon-header">' +
                            '<h3>📬 Buzón de Vecinos Virtuales</h3>' +
                            '<button class="buzon-cerrar" onclick="VV.buzon.cerrar()">✕</button>' +
                        '</div>' +

                        '<p style="font-size:0.85rem;color:#64748b;margin-bottom:1rem;">' +
                            'Envianos tu sugerencia, solicitud, reclamo o pedido sobre tus datos personales. ' +
                            'Recibirás una respuesta en este mismo buzón.' +
                        '</p>' +

                        '<div class="buzon-form-group">' +
                            '<label>Tipo de mensaje</label>' +
                            '<div class="buzon-tipo-grid">' +
                                '<div class="buzon-tipo-btn seleccionado" data-tipo="sugerencia" onclick="VV.buzon.seleccionarTipo(\'sugerencia\')">💡 Sugerencia</div>' +
                                '<div class="buzon-tipo-btn" data-tipo="solicitud" onclick="VV.buzon.seleccionarTipo(\'solicitud\')">📋 Solicitud</div>' +
                                '<div class="buzon-tipo-btn" data-tipo="reclamo" onclick="VV.buzon.seleccionarTipo(\'reclamo\')">⚠️ Reclamo</div>' +
                                '<div class="buzon-tipo-btn" data-tipo="datos_personales" onclick="VV.buzon.seleccionarTipo(\'datos_personales\')">🔒 Datos personales</div>' +
                            '</div>' +
                        '</div>' +

                        '<div class="buzon-form-group">' +
                            '<label>Asunto *</label>' +
                            '<input type="text" id="bz-asunto" placeholder="Resumen de tu mensaje" maxlength="100">' +
                        '</div>' +

                        '<div class="buzon-form-group">' +
                            '<label>Mensaje *</label>' +
                            '<textarea id="bz-mensaje" placeholder="Escribí tu mensaje acá..." maxlength="1000"></textarea>' +
                        '</div>' +

                        '<button class="buzon-enviar" onclick="VV.buzon.enviar()">📨 Enviar mensaje</button>' +

                        '<div class="buzon-mensajes-lista" id="buzon-mis-mensajes">' +
                            '<h4>Mis mensajes enviados</h4>' +
                            '<p style="color:#94a3b8;font-size:0.85rem;">Cargando...</p>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            document.body.insertAdjacentHTML('beforeend', html);
        },

        /**
         * Selecciona el tipo de mensaje
         */
        seleccionarTipo: function (tipo) {
            this.tipoSeleccionado = tipo;
            var botones = document.querySelectorAll('.buzon-tipo-btn');
            botones.forEach(function (btn) {
                if (btn.getAttribute('data-tipo') === tipo) {
                    btn.classList.add('seleccionado');
                } else {
                    btn.classList.remove('seleccionado');
                }
            });
        },

        /**
         * Envía el mensaje
         */
        enviar: async function () {
            var asunto = document.getElementById('bz-asunto').value.trim();
            var mensaje = document.getElementById('bz-mensaje').value.trim();

            if (!asunto || !mensaje) {
                alert('Por favor completá el asunto y el mensaje.');
                return;
            }

            try {
                var { error } = await supabase.from('buzon_mensajes').insert({
                    user_id: VV.data.user.id,
                    tipo: this.tipoSeleccionado,
                    asunto: asunto,
                    mensaje: mensaje,
                    estado: 'nuevo'
                });

                if (error) throw error;

                VV.utils.showSuccess('Mensaje enviado correctamente.');
                this.limpiarForm();
                this.cargarMisMensajes();
            } catch (err) {
                alert('Error al enviar: ' + err.message);
            }
        },

        /**
         * Carga los mensajes del usuario
         */
        cargarMisMensajes: async function () {
            var contenedor = document.getElementById('buzon-mis-mensajes');
            if (!contenedor) return;

            try {
                var { data, error } = await supabase
                    .from('buzon_mensajes')
                    .select('*')
                    .eq('user_id', VV.data.user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (!data || data.length === 0) {
                    contenedor.innerHTML =
                        '<h4>Mis mensajes enviados</h4>' +
                        '<p style="color:#94a3b8;font-size:0.85rem;">No enviaste mensajes todavía.</p>';
                    return;
                }

                var html = '<h4>Mis mensajes enviados</h4>';
                data.forEach(function (m) {
                    var fecha = new Date(m.created_at).toLocaleString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    });
                    var tipoLabel = {
                        'sugerencia': '💡 Sugerencia',
                        'solicitud': '📋 Solicitud',
                        'reclamo': '⚠️ Reclamo',
                        'datos_personales': '🔒 Datos personales'
                    };

                    html += '<div class="buzon-msg-card">' +
                        '<span class="msg-tipo ' + m.tipo + '">' + (tipoLabel[m.tipo] || m.tipo) + '</span>' +
                        '<span class="msg-estado ' + m.estado + '">' + m.estado + '</span>' +
                        '<div class="msg-asunto">' + m.asunto + '</div>' +
                        '<div class="msg-texto">' + m.mensaje + '</div>' +
                        '<div class="msg-fecha">' + fecha + '</div>';

                    if (m.respuesta) {
                        var fechaResp = new Date(m.respondido_at).toLocaleString('es-AR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        });
                        html += '<div class="buzon-msg-respuesta">' +
                            '<strong>📥 Respuesta del administrador (' + fechaResp + '):</strong>' +
                            m.respuesta +
                        '</div>';
                    }

                    html += '</div>';
                });

                contenedor.innerHTML = html;
            } catch (err) {
                contenedor.innerHTML = '<p style="color:#ef4444;font-size:0.85rem;">Error: ' + err.message + '</p>';
            }
        },

        /**
         * Limpia el formulario
         */
        limpiarForm: function () {
            this.tipoSeleccionado = 'sugerencia';
            this.seleccionarTipo('sugerencia');
            var asunto = document.getElementById('bz-asunto');
            var mensaje = document.getElementById('bz-mensaje');
            if (asunto) asunto.value = '';
            if (mensaje) mensaje.value = '';
        },

        /**
         * Cierra el modal
         */
        cerrar: function () {
            var modal = document.getElementById('buzon-modal');
            if (modal) modal.classList.remove('buzon-abierto');
        }
    };

    // ============================================================
    //  PARTE 2: PANEL ADMIN DEL BUZÓN
    // ============================================================
    VV.buzonAdmin = {
        /**
         * Carga la lista de mensajes en el panel admin
         */
        cargarLista: async function () {
            var contenedor = document.getElementById('admin-buzon-lista');
            if (!contenedor) return;

            contenedor.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:1rem;">Cargando mensajes...</p>';

            try {
                var { data, error } = await supabase
                    .from('buzon_mensajes')
                    .select('*, users!buzon_mensajes_user_id_fkey(name, neighborhood)')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (!data || data.length === 0) {
                    contenedor.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:2rem;">No hay mensajes en el buzón.</p>';
                    return;
                }

                var tipoLabel = {
                    'sugerencia': '💡 Sugerencia',
                    'solicitud': '📋 Solicitud',
                    'reclamo': '⚠️ Reclamo',
                    'datos_personales': '🔒 Datos personales'
                };

                var html = '';
                data.forEach(function (m) {
                    var fecha = new Date(m.created_at).toLocaleString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    });
                    var userName = m.users ? m.users.name : 'Usuario desconocido';
                    var userBarrio = m.users ? m.users.neighborhood : '';

                    html += '<div class="buzon-admin-card ' + (m.estado === 'nuevo' ? 'nuevo' : '') + '" id="buzon-card-' + m.id + '">' +
                        '<div class="buzon-admin-card-head">' +
                            '<h4>' + m.asunto + '</h4>' +
                            '<span class="msg-tipo ' + m.tipo + '">' + (tipoLabel[m.tipo] || m.tipo) + '</span>' +
                        '</div>' +
                        '<div class="buzon-admin-card-user">' +
                            '<i class="fas fa-user"></i> ' + userName +
                            (userBarrio ? ' · <i class="fas fa-map-marker-alt"></i> ' + userBarrio : '') +
                            ' · <i class="fas fa-clock"></i> ' + fecha +
                        '</div>' +
                        '<div class="buzon-admin-card-msg">' + m.mensaje + '</div>';

                    if (m.respuesta) {
                        html += '<div class="buzon-msg-respuesta">' +
                            '<strong>Tu respuesta:</strong>' +
                            m.respuesta +
                        '</div>';
                    }

                    html += '<div class="buzon-admin-card-actions">' +
                        '<span class="msg-estado ' + m.estado + '">' + m.estado + '</span>';

                    if (m.estado === 'nuevo') {
                        html += '<button onclick="VV.buzonAdmin.marcarLeido(\'' + m.id + '\')"><i class="fas fa-check"></i> Marcar leído</button>';
                    }

                    if (m.estado !== 'cerrado') {
                        html += '<button class="btn-responder" onclick="VV.buzonAdmin.toggleRespuesta(\'' + m.id + '\')"><i class="fas fa-reply"></i> Responder</button>';
                        html += '<button onclick="VV.buzonAdmin.cerrarMsg(\'' + m.id + '\')"><i class="fas fa-times-circle"></i> Cerrar</button>';
                    }

                    html += '</div>' +
                        '<div class="buzon-admin-respuesta-area" id="resp-area-' + m.id + '">' +
                            '<textarea id="resp-text-' + m.id + '" placeholder="Escribí tu respuesta para el vecino..."></textarea>' +
                            '<button onclick="VV.buzonAdmin.enviarRespuesta(\'' + m.id + '\')">Enviar respuesta</button>' +
                        '</div>' +
                    '</div>';
                });

                contenedor.innerHTML = html;
            } catch (err) {
                contenedor.innerHTML = '<p style="color:#ef4444;text-align:center;padding:1rem;">Error: ' + err.message + '</p>';
            }
        },

        /**
         * Marca un mensaje como leído
         */
        marcarLeido: async function (id) {
            try {
                var { error } = await supabase
                    .from('buzon_mensajes')
                    .update({ estado: 'leido' })
                    .eq('id', id);
                if (error) throw error;
                this.cargarLista();
            } catch (err) {
                alert('Error: ' + err.message);
            }
        },

        /**
         * Muestra/oculta el área de respuesta
         */
        toggleRespuesta: function (id) {
            var area = document.getElementById('resp-area-' + id);
            if (area) {
                area.classList.toggle('abierta');
            }
        },

        /**
         * Envía la respuesta al vecino
         */
        enviarRespuesta: async function (id) {
            var texto = document.getElementById('resp-text-' + id).value.trim();
            if (!texto) {
                alert('Escribí una respuesta antes de enviar.');
                return;
            }

            try {
                var { error } = await supabase
                    .from('buzon_mensajes')
                    .update({
                        respuesta: texto,
                        estado: 'respondido',
                        respondido_por: VV.data.user.id,
                        respondido_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (error) throw error;

                alert('Respuesta enviada.');
                this.cargarLista();
            } catch (err) {
                alert('Error: ' + err.message);
            }
        },

        /**
         * Cierra un mensaje
         */
        cerrarMsg: async function (id) {
            if (!confirm('¿Cerrar este mensaje?')) return;
            try {
                var { error } = await supabase
                    .from('buzon_mensajes')
                    .update({ estado: 'cerrado' })
                    .eq('id', id);
                if (error) throw error;
                this.cargarLista();
            } catch (err) {
                alert('Error: ' + err.message);
            }
        }
    };

    console.log('✅ Módulo BUZON cargado');
})();
