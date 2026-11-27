/* ============================================================
   js/grupos.js — Grupos y comisiones de barrio
   Requiere: tablas grupos / grupo_miembros + funciones mi_nivel, mi_rol
   ============================================================ */
(function () {
    'use strict';

    var ROLES = {
        presidente:     { nivel: 5, label: 'Presidente',     icon: '👑' },
        vicepresidente: { nivel: 4, label: 'Vicepresidente', icon: '🎖️' },
        secretario:     { nivel: 3, label: 'Secretario',     icon: '📋' },
        tesorero:       { nivel: 2, label: 'Tesorero',       icon: '💎' },
        vocal:          { nivel: 1, label: 'Vocal',          icon: '📣' },
        integrante:     { nivel: 0, label: 'Integrante',     icon: '👤' }
    };

    var ORDEN = ['presidente', 'vicepresidente', 'secretario', 'tesorero', 'vocal', 'integrante'];
    var grupoActual = null;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function usuario() {
        return (window.VV_ROLES && VV_ROLES.getCurrentUser())
            || (window.VV && VV.data && VV.data.user) || null;
    }

    function barrio() {
        return (window.VV && VV.data && (VV.data.neighborhood || (VV.data.user && VV.data.user.neighborhood))) || '';
    }

    function overlay() {
        var el = document.getElementById('vv-grupos-overlay');
        if (!el) {
            el = document.createElement('div');
            el.id = 'vv-grupos-overlay';
            el.className = 'modal-overlay active';
            el.style.zIndex = '9999';
            el.style.overflowY = 'auto';
            document.body.appendChild(el);
        }
        return el;
    }

    function caja(html) {
        return '<div class="modal-form" style="max-width:720px;">' + html + '</div>';
    }

    function cabecera(titulo, volver) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">' +
            '<h3 style="margin:0;">' + titulo + '</h3>' +
            '<div style="display:flex;gap:0.5rem;">' +
            (volver ? '<button onclick="VV.grupos.render()" style="background:none;border:1px solid #cbd5e1;border-radius:8px;padding:0.3rem 0.7rem;cursor:pointer;font-size:0.85rem;">← Volver</button>' : '') +
            '<button onclick="VV.grupos.cerrar()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#94a3b8;">✕</button>' +
            '</div></div>';
    }

    var VV_grupos = {
        ROLES: ROLES,

        abrir: async function () {
            var el = overlay();
            el.innerHTML = caja('<p style="text-align:center;color:#94a3b8;">Cargando grupos...</p>');
            el.onclick = function (e) { if (e.target === el) VV_grupos.cerrar(); };
            await VV_grupos.render();
        },

        cerrar: function () {
            if (VV_grupos._canal) {
                supabase.removeChannel(VV_grupos._canal);
                VV_grupos._canal = null;
            }
            var el = document.getElementById('vv-grupos-overlay');
            if (el) el.remove();
        },


        render: async function () {
            var el = overlay();
            var user = usuario();

            if (!user) {
                el.innerHTML = caja('<p>Iniciá sesión para ver los grupos.</p>');
                return;
            }

            var res = await supabase
                .from('grupos')
                .select('id,nombre,descripcion,barrio,avatar_url,visible_en_barrio')
                .eq('activo', true)
                .order('created_at', { ascending: false });

            if (res.error) {
                el.innerHTML = caja('<p style="color:#ef4444;">Error: ' + esc(res.error.message) + '</p>');
                return;
            }

            var mis = await supabase
                .from('grupo_miembros')
                .select('grupo_id,rol,estado')
                .eq('user_id', user.id);

            var mio = {};
            (mis.data || []).forEach(function (m) { mio[m.grupo_id] = m; });

            var html = cabecera('👥 Grupos del barrio');
            html += '<button onclick="VV.grupos.formCrear()" style="width:100%;padding:0.7rem;border-radius:10px;border:none;background:linear-gradient(135deg,#c084fc,#8b5cf6);color:white;font-weight:700;cursor:pointer;margin-bottom:1rem;">➕ Crear un grupo</button>';

            var grupos = res.data || [];

            if (!grupos.length) {
                html += '<p style="text-align:center;color:#94a3b8;padding:2rem;">Todavía no hay grupos. ¡Creá el primero!</p>';
            } else {
                html += grupos.map(function (g) {
                    var m = mio[g.id];
                    var etiqueta = '';

                    if (m) {
                        etiqueta = m.estado === 'activo'
                            ? ROLES[m.rol].icon + ' ' + ROLES[m.rol].label
                            : '⏳ Solicitud pendiente';
                    }

                    var boton = m
                        ? '<button onclick="VV.grupos.abrirGrupo(\'' + g.id + '\')" style="padding:0.5rem 0.9rem;border-radius:8px;border:1px solid #cbd5e1;background:white;cursor:pointer;font-size:0.85rem;">Abrir</button>'
                        : '<span style="display:flex;gap:0.4rem;">' +
                            '<button onclick="VV.grupos.abrirGrupo(\'' + g.id + '\')" style="padding:0.5rem 0.9rem;border-radius:8px;border:1px solid #cbd5e1;background:white;cursor:pointer;font-size:0.85rem;">Ver</button>' +
                            '<button onclick="VV.grupos.unirse(\'' + g.id + '\')" style="padding:0.5rem 0.9rem;border-radius:8px;border:none;background:#8b5cf6;color:white;cursor:pointer;font-size:0.85rem;font-weight:600;">Unirme</button>' +
                          '</span>';


                    return '<div style="border:1px solid #e2e8f0;border-radius:12px;padding:1rem;margin-bottom:0.75rem;display:flex;gap:0.75rem;align-items:center;">' +
                        '<div style="width:44px;height:44px;flex-shrink:0;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#312e81);display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:white;overflow:hidden;">' +
                            (g.avatar_url ? '<img src="' + esc(g.avatar_url) + '" style="width:100%;height:100%;object-fit:cover;">' : '👥') +
                        '</div>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="font-weight:700;color:#1e293b;">' + esc(g.nombre) + '</div>' +
                            '<div style="font-size:0.8rem;color:#64748b;">' + esc(g.barrio || 'Sin barrio') + (etiqueta ? ' · ' + etiqueta : '') + '</div>' +
                        '</div>' +
                        boton +
                    '</div>';
                }).join('');
            }

            el.innerHTML = caja(html);
        },

        formCrear: function () {
            var el = overlay();
            var html = cabecera('➕ Crear grupo', true);
            html += '<label style="display:block;font-weight:600;margin:0.5rem 0 0.25rem;">Nombre</label>';
            html += '<input id="gr-nombre" type="text" maxlength="60" placeholder="Ej: Futbol Lomas" style="width:100%;padding:0.6rem;border:1px solid #cbd5e1;border-radius:8px;">';
            html += '<label style="display:block;font-weight:600;margin:0.75rem 0 0.25rem;">Descripcion</label>';
            html += '<textarea id="gr-desc" rows="2" maxlength="200" placeholder="De que se trata el grupo" style="width:100%;padding:0.6rem;border:1px solid #cbd5e1;border-radius:8px;"></textarea>';
            html += '<label style="display:block;font-weight:600;margin:0.75rem 0 0.25rem;">Barrio</label>';
            html += '<input id="gr-barrio" type="text" value="' + esc(barrio()) + '" style="width:100%;padding:0.6rem;border:1px solid #cbd5e1;border-radius:8px;">';
            html += '<label style="display:flex;align-items:center;gap:0.5rem;margin:0.75rem 0;"><input type="checkbox" id="gr-visible"> Mostrar el grupo en el barrio</label>';
            html += '<button onclick="VV.grupos.crear()" style="width:100%;margin-top:1rem;padding:0.7rem;border-radius:10px;border:none;background:linear-gradient(135deg,#c084fc,#8b5cf6);color:white;font-weight:700;cursor:pointer;">Crear grupo</button>';
            el.innerHTML = caja(html);
        },

        crear: async function () {
            var user = usuario();
            if (!user) return;

            var nombre = (document.getElementById('gr-nombre').value || '').trim();
            var desc = (document.getElementById('gr-desc').value || '').trim();
            var bar = (document.getElementById('gr-barrio').value || '').trim();
            var vis = document.getElementById('gr-visible').checked;

            if (nombre.length < 3) { alert('El nombre debe tener al menos 3 caracteres'); return; }

            var res = await supabase.from('grupos').insert({
                nombre: nombre,
                descripcion: desc || null,
                barrio: bar || null,
                visible_en_barrio: vis,
                creador_id: user.id
            }).select().single();

            if (res.error) { alert('Error: ' + res.error.message); return; }

            VV_grupos.abrirGrupo(res.data.id);
        },

        unirse: async function (grupoId) {
            var user = usuario();
            if (!user) return;

            var res = await supabase.from('grupo_miembros').insert({
                grupo_id: grupoId,
                user_id: user.id,
                rol: 'integrante',
                estado: 'pendiente'
            });

            if (res.error) { alert('Error: ' + res.error.message); return; }

            alert('Solicitud enviada. La comision del grupo tiene que aprobarla.');
            VV_grupos.render();
        },

                abrirGrupo: async function (grupoId) {
            grupoActual = grupoId;
            var el = overlay();
            el.innerHTML = caja('<p style="text-align:center;color:#94a3b8;">Cargando grupo...</p>');

            var g = await supabase.from('grupos').select('*').eq('id', grupoId).single();
            if (g.error) { el.innerHTML = caja('<p style="color:#ef4444;">Error: ' + esc(g.error.message) + '</p>'); return; }

            var nivelRes = await supabase.rpc('mi_nivel', { gid: grupoId });
            var nivel = nivelRes.data || 0;
            var esMiembro = nivel > 0;
            var yo = usuario().id;

            var mi = await supabase.from('grupo_miembros')
                .select('rol,estado')
                .eq('grupo_id', grupoId)
                .eq('user_id', yo)
                .maybeSingle();

            var resumen = await supabase.rpc('grupo_resumen', { gid: grupoId });
            var res = (resumen.data && resumen.data[0]) || { miembros: 0, publicaciones: 0 };

            var lista = [];
            var nombres = {};

            if (esMiembro) {
                var miembros = await supabase.from('grupo_miembros')
                    .select('id,user_id,rol,estado,puntos_merito,joined_at')
                    .eq('grupo_id', grupoId)
                    .order('joined_at', { ascending: true });

                lista = miembros.data || [];

                if (lista.length) {
                    var ids = lista.map(function (m) { return m.user_id; });
                    var us = await supabase.from('users').select('id,name').in('id', ids);
                    (us.data || []).forEach(function (u) { nombres[u.id] = u.name; });
                }
            }

            function nombreDe(id) {
                return nombres[id] || ('Vecino ' + String(id).slice(0, 6));
            }

            var activos = lista.filter(function (m) { return m.estado === 'activo'; });
            var pendientes = lista.filter(function (m) { return m.estado === 'pendiente'; });

            var html = cabecera('👥 ' + esc(g.data.nombre), true);
            html += '<p style="color:#64748b;font-size:0.85rem;margin-top:-0.5rem;">' + esc(g.data.barrio || 'Sin barrio') + '</p>';

            if (g.data.descripcion) {
                html += '<p style="font-size:0.9rem;color:#334155;">' + esc(g.data.descripcion) + '</p>';
            }

            html += '<div style="display:flex;gap:0.75rem;margin:0.75rem 0;">' +
                '<div style="flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:0.5rem;text-align:center;font-size:0.8rem;">👥 <strong>' + res.miembros + '</strong> integrantes</div>' +
                '<div style="flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:0.5rem;text-align:center;font-size:0.8rem;">📢 <strong>' + res.publicaciones + '</strong> al barrio</div>' +
            '</div>';

            if (!esMiembro) {
                if (mi.data && mi.data.estado === 'pendiente') {
                    html += '<div style="width:100%;padding:0.7rem;border-radius:10px;background:#fef3c7;color:#92400e;text-align:center;font-weight:600;margin-bottom:1rem;">⏳ Solicitud pendiente de aprobación</div>';
                } else {
                    html += '<button onclick="VV.grupos.unirse(\'' + grupoId + '\')" style="width:100%;padding:0.7rem;border-radius:10px;border:none;background:linear-gradient(135deg,#c084fc,#8b5cf6);color:white;font-weight:700;cursor:pointer;margin-bottom:1rem;">Unirme al grupo</button>';
                }
            }


            if (mi.data) {
                html += '<div style="background:#f1f5f9;border-radius:10px;padding:0.75rem;margin:0.75rem 0;font-size:0.9rem;">' +
                    'Tu rol: <strong>' + ROLES[mi.data.rol].icon + ' ' + ROLES[mi.data.rol].label + '</strong>' +
                    (mi.data.estado === 'pendiente' ? ' · <span style="color:#f59e0b;">pendiente de aprobación</span>' : '') +
                '</div>';
            }

            // ===== Muro =====
            var pubs = await supabase.from('grupo_publicaciones')
                .select('id,autor_id,visibilidad,titulo,contenido,imagen_url,created_at')
                .eq('grupo_id', grupoId)
                .order('created_at', { ascending: false })
                .limit(5);

            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin:1.25rem 0 0.5rem;">' +
                '<h4 style="margin:0;">📌 ' + (esMiembro ? 'Muro del grupo' : 'Publicado al barrio') + '</h4>' +
                (esMiembro ? '<button onclick="VV.grupos.formPublicar()" style="padding:0.4rem 0.8rem;border-radius:8px;border:none;background:#8b5cf6;color:white;cursor:pointer;font-size:0.8rem;font-weight:600;">+ Publicar</button>' : '') +
            '</div>';

            var BADGE = {
                comision: { txt: '🔒 Comisión', bg: '#fee2e2', fg: '#991b1b' },
                grupo:    { txt: '👥 Grupo',    bg: '#ede9fe', fg: '#5b21b6' },
                barrio:   { txt: '📢 Barrio',   bg: '#dcfce7', fg: '#166534' }
            };

            var listaPubs = pubs.data || [];

            if (!listaPubs.length) {
                html += '<p style="color:#94a3b8;font-size:0.85rem;">' +
                    (esMiembro ? 'Todavía no hay publicaciones.' : 'Este grupo todavía no publicó nada al barrio.') +
                '</p>';
            } else {
                html += listaPubs.map(function (p) {
                    var b = BADGE[p.visibilidad] || BADGE.grupo;
                    return '<div style="border:1px solid #e2e8f0;border-radius:10px;padding:0.75rem;margin-bottom:0.5rem;">' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.35rem;">' +
                            '<strong style="font-size:0.9rem;color:#1e293b;">' + esc(p.titulo || 'Sin título') + '</strong>' +
                            '<span style="background:' + b.bg + ';color:' + b.fg + ';font-size:0.7rem;padding:0.15rem 0.5rem;border-radius:50px;white-space:nowrap;">' + b.txt + '</span>' +
                        '</div>' +
                        (p.contenido ? '<p style="font-size:0.85rem;color:#475569;margin:0 0 0.35rem;">' + esc(p.contenido) + '</p>' : '') +
                        (p.imagen_url ? '<img src="' + esc(p.imagen_url) + '" loading="lazy" decoding="async" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-bottom:0.35rem;">' : '') +
                        '<div style="font-size:0.75rem;color:#94a3b8;">' + esc(nombreDe(p.autor_id)) + ' · ' + new Date(p.created_at).toLocaleDateString('es-AR') + '</div>' +
                    '</div>';
                }).join('');
            }

            // ===== Solo para miembros =====
            if (esMiembro) {
                html += '<button onclick="VV.grupos.abrirChat(\'' + grupoId + '\')" style="width:100%;padding:0.6rem;border-radius:10px;border:1px solid #cbd5e1;background:white;cursor:pointer;font-weight:600;margin:0.5rem 0 1rem;">💬 Chat del grupo</button>';

                html += '<h4 style="margin:1rem 0 0.5rem;">Comisión y miembros (' + activos.length + ')</h4>';
                html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.5rem;">';
                ORDEN.forEach(function (r) {
                    var n = activos.filter(function (m) { return m.rol === r; }).length;
                    if (!n) return;
                    html += '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:0.5rem;font-size:0.8rem;">' +
                        ROLES[r].icon + ' ' + ROLES[r].label + ': <strong>' + n + '</strong></div>';
                });
                html += '</div>';

                if (nivel >= 3 && pendientes.length) {
                    html += '<h4 style="margin:1.25rem 0 0.5rem;">⏳ Solicitudes pendientes (' + pendientes.length + ')</h4>';
                    html += pendientes.slice(0, 5).map(function (m) {
                        return '<div style="border:1px solid #fde68a;background:#fffbeb;border-radius:8px;padding:0.6rem;margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">' +
                            '<span style="font-size:0.8rem;color:#92400e;">' + esc(nombreDe(m.user_id)) + '</span>' +
                            '<span style="display:flex;gap:0.4rem;">' +
                                '<button onclick="VV.grupos.resolver(\'' + m.id + '\',\'activo\')" style="padding:0.35rem 0.7rem;border-radius:6px;border:none;background:#22c55e;color:white;cursor:pointer;font-size:0.8rem;">Aceptar</button>' +
                                '<button onclick="VV.grupos.resolver(\'' + m.id + '\',\'rechazado\')" style="padding:0.35rem 0.7rem;border-radius:6px;border:none;background:#ef4444;color:white;cursor:pointer;font-size:0.8rem;">Rechazar</button>' +
                            '</span></div>';
                    }).join('');
                }

                html += '<h4 style="margin:1.25rem 0 0.5rem;">Integrantes</h4>';
                html += activos.map(function (m) {
                    var puede = nivel >= 3 && nivel > ROLES[m.rol].nivel && m.user_id !== yo;
                    var control;

                    if (puede) {
                        var opciones = ORDEN.filter(function (r) {
                            return ROLES[r].nivel < nivel;
                        }).map(function (r) {
                            return '<option value="' + r + '"' + (r === m.rol ? ' selected' : '') + '>' +
                                ROLES[r].icon + ' ' + ROLES[r].label + '</option>';
                        }).join('');

                        control = '<select onchange="VV.grupos.cambiarRol(\'' + m.id + '\', this.value)" ' +
                            'style="padding:0.3rem;border:1px solid #cbd5e1;border-radius:6px;font-size:0.8rem;">' +
                            opciones + '</select>';
                    } else {
                        control = '<span style="color:#64748b;font-size:0.8rem;">' +
                            ROLES[m.rol].label + ' · ' + (m.puntos_merito || 0) + ' pts</span>';
                    }

                    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid #f1f5f9;font-size:0.85rem;">' +
                        '<span>' + ROLES[m.rol].icon + ' ' + esc(nombreDe(m.user_id)) + '</span>' +
                        control +
                    '</div>';
                }).join('');
            }

            el.innerHTML = caja(html);
        },

        cambiarRol: async function (miembroId, rol) {
            var res = await supabase.from('grupo_miembros')
                .update({ rol: rol })
                .eq('id', miembroId);

            if (res.error) {
                alert('No se pudo cambiar el cargo: ' + res.error.message);
                VV_grupos.abrirGrupo(grupoActual);
                return;
            }

            VV_grupos.abrirGrupo(grupoActual);
        },
                abrirChat: async function (grupoId) {
            var el = overlay();

            el.innerHTML = caja(
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">' +
                    '<h3 style="margin:0;">💬 Chat del grupo</h3>' +
                    '<div style="display:flex;gap:0.5rem;">' +
                        '<button onclick="VV.grupos.abrirGrupo(\'' + grupoId + '\')" style="background:none;border:1px solid #cbd5e1;border-radius:8px;padding:0.3rem 0.7rem;cursor:pointer;font-size:0.85rem;">← Volver</button>' +
                        '<button onclick="VV.grupos.cerrar()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#94a3b8;">✕</button>' +
                    '</div>' +
                '</div>' +
                '<div id="vv-chat-lista" style="height:320px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:10px;padding:0.75rem;background:#f8fafc;margin-bottom:0.75rem;"></div>' +
                '<div style="display:flex;gap:0.5rem;">' +
                    '<input id="vv-chat-input" type="text" maxlength="500" placeholder="Escribí un mensaje..." ' +
                        'style="flex:1;padding:0.6rem;border:1px solid #cbd5e1;border-radius:8px;" ' +
                        'onkeydown="if(event.key===\'Enter\')VV.grupos.enviarMensaje(\'' + grupoId + '\')">' +
                    '<button onclick="VV.grupos.enviarMensaje(\'' + grupoId + '\')" style="padding:0.6rem 1rem;border-radius:8px;border:none;background:#8b5cf6;color:white;font-weight:700;cursor:pointer;">Enviar</button>' +
                '</div>'
            );

            await VV_grupos.cargarMensajes(grupoId);
            VV_grupos.suscribirChat(grupoId);
        },

        cargarMensajes: async function (grupoId) {
            var cont = document.getElementById('vv-chat-lista');
            if (!cont) return;

            var res = await supabase.from('grupo_mensajes')
                .select('id,autor_id,contenido,created_at')
                .eq('grupo_id', grupoId)
                .order('created_at', { ascending: true })
                .limit(100);

            if (res.error) {
                cont.innerHTML = '<p style="color:#ef4444;font-size:0.85rem;">' + esc(res.error.message) + '</p>';
                return;
            }

            var msgs = res.data || [];
            var yo = usuario().id;

            // Nombres de los autores
            var ids = [];
            msgs.forEach(function (m) {
                if (ids.indexOf(m.autor_id) === -1) ids.push(m.autor_id);
            });

            var nombres = {};
            if (ids.length) {
                var us = await supabase.from('users').select('id,name').in('id', ids);
                (us.data || []).forEach(function (u) { nombres[u.id] = u.name; });
            }

            function nombreDe(id) {
                return nombres[id] || 'Vecino';
            }

            function avatarDe(id) {
                try {
                    if (window.VV && VV.avatars && VV.avatars.getUserAvatar) {
                        var a = VV.avatars.getUserAvatar(id);
                        if (a && a.emoji) return a.emoji;
                    }
                } catch (e) {}
                return '👤';
            }

            cont.innerHTML = msgs.length
                ? msgs.map(function (m) {
                    var mio = m.autor_id === yo;
                    return '<div style="display:flex;gap:0.4rem;margin-bottom:0.5rem;' + (mio ? 'flex-direction:row-reverse;' : '') + '">' +
                        '<div style="width:28px;height:28px;flex-shrink:0;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#312e81);display:flex;align-items:center;justify-content:center;font-size:0.9rem;">' +
                            avatarDe(m.autor_id) +
                        '</div>' +
                        '<div style="max-width:75%;">' +
                            '<div style="font-size:0.7rem;color:#64748b;margin-bottom:0.1rem;' + (mio ? 'text-align:right;' : '') + '">' +
                                esc(nombreDe(m.autor_id)) +
                            '</div>' +
                            '<div style="padding:0.4rem 0.7rem;border-radius:10px;font-size:0.85rem;' +
                                (mio ? 'background:#8b5cf6;color:white;' : 'background:white;border:1px solid #e2e8f0;color:#1e293b;') + '">' +
                                esc(m.contenido) +
                                '<div style="font-size:0.65rem;opacity:0.7;margin-top:0.15rem;">' +
                                    new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                }).join('')
                : '<p style="color:#94a3b8;font-size:0.85rem;text-align:center;">Todavía no hay mensajes. ¡Escribí el primero!</p>';

            cont.scrollTop = cont.scrollHeight;
        },


        enviarMensaje: async function (grupoId) {
            var input = document.getElementById('vv-chat-input');
            var texto = (input.value || '').trim();
            if (!texto) return;

            input.value = '';

            var res = await supabase.from('grupo_mensajes').insert({
                grupo_id: grupoId,
                autor_id: usuario().id,
                contenido: texto
            });

            if (res.error) { alert('Error: ' + res.error.message); return; }

            await VV_grupos.cargarMensajes(grupoId);
        },

        suscribirChat: function (grupoId) {
            if (VV_grupos._canal) {
                supabase.removeChannel(VV_grupos._canal);
                VV_grupos._canal = null;
            }

            VV_grupos._canal = supabase.channel('grupo-chat-' + grupoId)
                .on('postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'grupo_mensajes', filter: 'grupo_id=eq.' + grupoId },
                    function () { VV_grupos.cargarMensajes(grupoId); })
                .subscribe();
        },

                formPublicar: function () {
            var el = overlay();
            var html = cabecera('📌 Publicar en el grupo', true);
            html += '<label style="display:block;font-weight:600;margin:0.5rem 0 0.25rem;">Título</label>';
            html += '<input id="gp-titulo" type="text" maxlength="80" style="width:100%;padding:0.6rem;border:1px solid #cbd5e1;border-radius:8px;">';
            html += '<label style="display:block;font-weight:600;margin:0.75rem 0 0.25rem;">Contenido</label>';
            html += '<textarea id="gp-contenido" rows="3" maxlength="1000" style="width:100%;padding:0.6rem;border:1px solid #cbd5e1;border-radius:8px;"></textarea>';
            html += '<label style="display:block;font-weight:600;margin:0.75rem 0 0.25rem;">¿Quién lo ve?</label>';
            html += '<select id="gp-visibilidad" style="width:100%;padding:0.6rem;border:1px solid #cbd5e1;border-radius:8px;">' +
                '<option value="comision">🔒 Solo la comisión</option>' +
                '<option value="grupo" selected>👥 Solo el grupo</option>' +
                '<option value="barrio">📢 Todo el barrio</option>' +
            '</select>';
            html += '<label style="display:block;font-weight:600;margin:0.75rem 0 0.25rem;">Imagen (opcional)</label>';
            html += '<input id="gp-imagen" type="file" accept="image/*" style="width:100%;padding:0.4rem;">';
            html += '<button onclick="VV.grupos.publicar()" style="width:100%;margin-top:1rem;padding:0.7rem;border-radius:10px;border:none;background:linear-gradient(135deg,#c084fc,#8b5cf6);color:white;font-weight:700;cursor:pointer;">Publicar</button>';
            el.innerHTML = caja(html);
        },

        publicar: async function () {
            var user = usuario();
            if (!user || !grupoActual) return;

            var titulo = (document.getElementById('gp-titulo').value || '').trim();
            var contenido = (document.getElementById('gp-contenido').value || '').trim();
            var vis = document.getElementById('gp-visibilidad').value;
            var fileInput = document.getElementById('gp-imagen');
            var file = fileInput && fileInput.files && fileInput.files[0];

            if (!titulo && !contenido) { alert('Escribí un título o un contenido'); return; }

            var imagenUrl = null;

            if (file) {
                if (file.size > 5 * 1048576) { alert('La imagen supera los 5 MB'); return; }

                var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
                var path = 'grupos/' + grupoActual + '/' + Date.now() + '.' + ext;

                var up = await supabase.storage.from('barrio-media').upload(path, file, {
                    cacheControl: '31536000',
                    contentType: file.type,
                    upsert: false
                });

                if (up.error) { alert('Error subiendo imagen: ' + up.error.message); return; }

                imagenUrl = supabase.storage.from('barrio-media').getPublicUrl(path).data.publicUrl;
            }

            var res = await supabase.from('grupo_publicaciones').insert({
                grupo_id: grupoActual,
                autor_id: user.id,
                visibilidad: vis,
                titulo: titulo || null,
                contenido: contenido || null,
                imagen_url: imagenUrl
            });

            if (res.error) { alert('Error: ' + res.error.message); return; }

            VV_grupos.abrirGrupo(grupoActual);
        },

        resolver: async function (miembroId, estado) {
            var res = await supabase.from('grupo_miembros')
                .update({ estado: estado })
                .eq('id', miembroId);

            if (res.error) { alert('Error: ' + res.error.message); return; }

            VV_grupos.abrirGrupo(grupoActual);
        }
        

    };

        // ===== Botón flotante de acceso =====
    function montarBoton(intentos) {
        intentos = intentos || 0;

        // Esperar a que la sesión esté disponible (evita la carrera de auth)
        if (!usuario()) {
            if (intentos < 20) {
                setTimeout(function () { montarBoton(intentos + 1); }, 300);
            }
            return;
        }

        if (document.getElementById('vv-grupos-fab')) return;

        var b = document.createElement('button');
        b.id = 'vv-grupos-fab';
        b.innerHTML = '👥';
        b.title = 'Grupos del barrio';
        b.setAttribute('aria-label', 'Grupos del barrio');
        b.style.cssText =
            'position:fixed;bottom:80px;right:16px;width:52px;height:52px;border-radius:50%;' +
            'border:none;background:linear-gradient(135deg,#c084fc,#8b5cf6);color:white;' +
            'font-size:1.4rem;cursor:pointer;box-shadow:0 4px 14px rgba(139,92,246,.45);z-index:9000;';
        b.onclick = function () { VV_grupos.abrir(); };

        document.body.appendChild(b);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { montarBoton(0); });
    } else {
        montarBoton(0);
    }

    window.VV = window.VV || {};
    window.VV.grupos = VV_grupos;
})();

