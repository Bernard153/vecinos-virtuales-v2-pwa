// ============================================================
// DIRECTORIO DE VECINOS - PERFILES
// ============================================================

VV.perfiles = {
    async load() {
        var container = document.getElementById('perfiles-container');
        if (!container) return;

        var user = VV_ROLES.getCurrentUser();
        if (!user) return;

        var neighborhood = user.neighborhood || VV.data.neighborhood;
        var nhEl = document.getElementById('perfiles-neighborhood');
        if (nhEl) nhEl.textContent = neighborhood;

        container.innerHTML = '<p style="text-align:center;color:var(--gray-600);grid-column:1/-1;">Cargando perfiles...</p>';

        try {
            // Cargar vecinos desde la vista protegida.
            // Esta vista oculta teléfono y número si la persona no los comparte.
            var { data: usuarios, error } = await supabase
                .from('directorio_usuarios')
                .select('id, name, unique_number, phone, avatar, neighborhood, bio, photo_url, document_url')
                .eq('neighborhood', neighborhood)
                .order('name', { ascending: true });

            if (error) throw error;

            usuarios = usuarios || [];

            // Crear un mapa con los perfiles públicos devueltos por la vista
            var perfilesMap = {};
            usuarios.forEach(function(p) {
                perfilesMap[p.id] = p;
            });

            // Cargar por separado solo mi propio perfil.
            // Así puedo editarlo aunque todavía no esté visible en el directorio.
            var { data: miPerfilData, error: miPerfilError } = await supabase
                .from('perfiles_vecinales')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (miPerfilError) throw miPerfilError;

            var miPerfil = miPerfilData || {};

            var html = '';

            // Mi tarjeta de perfil
            html += '<div style="grid-column:1/-1;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;border-radius:16px;padding:1.5rem;margin-bottom:1rem;">';
            html += '<div style="display:flex;align-items:center;gap:1rem;">';

            var miAvatar = VV.avatars.getUserAvatar(user.id);

            html += '<div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:2rem;">' + miAvatar.emoji + '</div>';
            html += '<div style="flex:1;"><h3 style="margin:0;">' + user.name + '</h3>';
            html += '<p style="margin:0;opacity:0.8;font-size:0.85rem;">#' + (user.unique_number || '') + ' - Este es tu perfil</p></div>';
            html += '<button onclick="VV.perfiles.editarMiPerfil()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:0.5rem 1rem;border-radius:8px;cursor:pointer;font-weight:bold;">Editar mi perfil</button>';
            html += '</div>';

            if (miPerfil.bio) {
                html += '<p style="margin:0.75rem 0 0 0;font-size:0.9rem;opacity:0.9;">' + miPerfil.bio + '</p>';
            } else {
                html += '<p style="margin:0.75rem 0 0 0;font-size:0.85rem;opacity:0.7;">Aun no escribiste tu bio. Edita tu perfil para contar sobre vos.</p>';
            }

            html += '</div>';

            // Perfiles visibles de otros vecinos
            var otrosUsuarios = usuarios.filter(function(u) {
                return u.id !== user.id;
            });

            var visibles = 0;

            otrosUsuarios.forEach(function(u) {
                var perfil = perfilesMap[u.id];
                if (!perfil) return;

                visibles++;

                var avatar = VV.avatars.getUserAvatar(u.id);
                var avatarEmoji = avatar.emoji;

                html += '<div style="background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.1);border:1px solid var(--gray-200);">';
                html += '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">';

                if (perfil.photo_url) {
                    html += '<img src="' + perfil.photo_url + '" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid var(--primary-blue);">';
                } else {
                    html += '<div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--primary-blue),var(--primary-purple));display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:white;">' + avatarEmoji + '</div>';
                }

                html += '<div><h4 style="margin:0;color:var(--gray-800);">' + u.name + '</h4>';

                // El número solo llega desde la vista si el vecino decidió compartirlo
                if (u.unique_number !== null && u.unique_number !== undefined) {
                    html += '<p style="margin:0;font-size:0.8rem;color:var(--gray-500);">#' + u.unique_number + '</p>';
                }

                html += '</div></div>';

                if (perfil.bio) {
                    html += '<p style="font-size:0.85rem;color:var(--gray-600);margin:0 0 0.75rem 0;line-height:1.4;">' + perfil.bio + '</p>';
                }

                if (perfil.document_url) {
                    html += '<a href="' + perfil.document_url + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:0.4rem;background:var(--gray-100);color:var(--primary-blue);padding:0.4rem 0.75rem;border-radius:8px;text-decoration:none;font-size:0.8rem;font-weight:bold;">';
                    html += '<i class="fas fa-file-alt"></i> Ver documento</a>';
                }

                // El teléfono solo llega desde la vista si el vecino decidió compartirlo
                if (u.phone) {
                    html += '<div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--gray-100);">';
                    html += '<p style="font-size:0.8rem;color:var(--gray-500);margin:0;"><i class="fas fa-phone"></i> ' + u.phone + '</p>';
                    html += '</div>';
                }

                html += '</div>';
            });

            if (visibles === 0) {
                html += '<p style="text-align:center;color:var(--gray-600);grid-column:1/-1;padding:2rem;">Los demás vecinos aún no hicieron visible su perfil.</p>';
            }

            container.innerHTML = html;

        } catch (err) {
            console.error('Error cargando perfiles:', err);
            container.innerHTML = '<p style="text-align:center;color:var(--error-red);grid-column:1/-1;">Error al cargar perfiles.</p>';
        }
    },

    async editarMiPerfil() {
        var user = VV_ROLES.getCurrentUser();
        if (!user) return;

        var overlay = document.getElementById('perfil-edit-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'perfil-edit-overlay';
            document.body.appendChild(overlay);
        }

        try {
            var { data: perfilData, error } = await supabase
                .from('perfiles_vecinales')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;

            var perfil = perfilData || {};
            var avatar = VV.avatars.getUserAvatar(user.id);

            var html = '<div style="background:white;border-radius:16px;max-width:500px;width:95%;max-height:90vh;overflow-y:auto;padding:1.5rem;margin:auto;">';

            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">';
            html += '<h2 style="margin:0;color:var(--gray-800);">Mi Perfil</h2>';
            html += '<button onclick="document.getElementById(\'perfil-edit-overlay\').style.display=\'none\';" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--gray-500);">X</button>';
            html += '</div>';

            // Avatar actual
            html += '<div style="text-align:center;margin-bottom:1rem;">';
            html += '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--primary-blue),var(--primary-purple));display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:white;margin:0 auto 0.5rem;">' + avatar.emoji + '</div>';
            html += '<p style="font-size:0.8rem;color:var(--gray-500);margin:0;">Avatar: ' + avatar.name + '</p>';
            html += '</div>';

            // Foto de perfil
            html += '<div style="margin-bottom:1rem;">';
            html += '<label style="display:block;font-weight:bold;color:var(--gray-700);margin-bottom:0.5rem;">Foto de perfil (opcional)</label>';

            if (perfil.photo_url) {
                html += '<img src="' + perfil.photo_url + '" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:0.5rem;"><br>';
                html += '<button onclick="VV.perfiles.borrarFoto()" style="background:var(--error-red);color:white;border:none;padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.8rem;">Quitar foto</button>';
            }

            html += '<input type="file" id="perfil-photo-input" accept="image/*" style="width:100%;padding:0.5rem;border:1px solid var(--gray-300);border-radius:8px;">';
            html += '</div>';

            // Bio
            html += '<div style="margin-bottom:1rem;">';
            html += '<label style="display:block;font-weight:bold;color:var(--gray-700);margin-bottom:0.5rem;">Sobre mí (bio)</label>';
            html += '<textarea id="perfil-bio" rows="4" maxlength="500" placeholder="Contá sobre vos, a qué te dedicás, qué ofrecés al barrio..." style="width:100%;padding:0.75rem;border:1px solid var(--gray-300);border-radius:8px;font-size:0.9rem;resize:vertical;">' + (perfil.bio || '') + '</textarea>';
            html += '<p style="font-size:0.75rem;color:var(--gray-400);margin:0.25rem 0 0 0;">Máximo 500 caracteres</p>';
            html += '</div>';

            // Documento
            html += '<div style="margin-bottom:1rem;">';
            html += '<label style="display:block;font-weight:bold;color:var(--gray-700);margin-bottom:0.5rem;">Documento / Certificación (opcional)</label>';

            if (perfil.document_url) {
                html += '<a href="' + perfil.document_url + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:0.4rem;background:var(--gray-100);color:var(--primary-blue);padding:0.4rem 0.75rem;border-radius:8px;text-decoration:none;font-size:0.8rem;font-weight:bold;margin-bottom:0.5rem;"><i class="fas fa-file-alt"></i> Ver documento actual</a><br>';
                html += '<button onclick="VV.perfiles.borrarDocumento()" style="background:var(--error-red);color:white;border:none;padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.8rem;margin-bottom:0.5rem;">Quitar documento</button><br>';
            }

            html += '<input type="file" id="perfil-doc-input" accept="image/*,application/pdf" style="width:100%;padding:0.5rem;border:1px solid var(--gray-300);border-radius:8px;">';
            html += '<p style="font-size:0.75rem;color:var(--gray-400);margin:0.25rem 0 0 0;">PDF o imagen. Ej: diploma, certificación</p>';
            html += '</div>';

            // Visibilidad del perfil
            html += '<div style="margin-bottom:1rem;">';
            html += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">';
            html += '<input type="checkbox" id="perfil-visible" ' + (perfil.is_visible !== false ? 'checked' : '') + ' style="width:20px;height:20px;">';
            html += '<span style="font-weight:bold;color:var(--gray-700);">Mostrar mi perfil en el directorio del barrio</span>';
            html += '</label>';
            html += '<p style="font-size:0.8rem;color:var(--gray-500);margin:0.25rem 0 0 1.75rem;">Si desactivas esto, tu perfil no aparecerá en el directorio.</p>';
            html += '</div>';

            // Privacidad del teléfono
            html += '<div style="margin-bottom:1rem;">';
            html += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">';
            html += '<input type="checkbox" id="perfil-compartir-telefono" ' + (perfil.compartir_telefono === true ? 'checked' : '') + ' style="width:20px;height:20px;">';
            html += '<span style="font-weight:bold;color:var(--gray-700);">Compartir mi teléfono en el directorio</span>';
            html += '</label>';
            html += '</div>';

            // Privacidad del número de vecino
            html += '<div style="margin-bottom:1rem;">';
            html += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">';
            html += '<input type="checkbox" id="perfil-compartir-numero" ' + (perfil.compartir_numero_usuario === true ? 'checked' : '') + ' style="width:20px;height:20px;">';
            html += '<span style="font-weight:bold;color:var(--gray-700);">Compartir mi número de vecino</span>';
            html += '</label>';
            html += '</div>';

            // Botones
            html += '<div style="display:flex;gap:0.5rem;">';
            html += '<button onclick="VV.perfiles.guardarPerfil()" style="flex:1;background:var(--success-green);color:white;padding:0.75rem;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:0.9rem;">Guardar</button>';
            html += '<button onclick="document.getElementById(\'perfil-edit-overlay\').style.display=\'none\';" style="flex:1;background:var(--gray-200);color:var(--gray-700);padding:0.75rem;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:0.9rem;">Cancelar</button>';
            html += '</div>';

            html += '</div>';

            overlay.innerHTML = html;
            overlay.style.display = 'flex';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(0,0,0,0.8)';
            overlay.style.zIndex = '10010';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';

        } catch (err) {
            console.error('Error cargando el perfil para editar:', err);
            alert('No se pudo cargar tu perfil: ' + err.message);
        }
    },

    async guardarPerfil() {
        var user = VV_ROLES.getCurrentUser();
        if (!user) return;

        var bio = document.getElementById('perfil-bio').value.trim();
        var isVisible = document.getElementById('perfil-visible').checked;
        var compartirTelefono = document.getElementById('perfil-compartir-telefono').checked;
        var compartirNumero = document.getElementById('perfil-compartir-numero').checked;

        var photoInput = document.getElementById('perfil-photo-input');
        var docInput = document.getElementById('perfil-doc-input');

        var photoUrl = null;
        var docUrl = null;

        try {
            // Subir foto si se seleccionó
            if (photoInput.files && photoInput.files[0]) {
                var photoFile = photoInput.files[0];
                var compressedBlob = await this.compressImage(photoFile, 400, 0.7);
                var photoName = 'perfil-' + user.id + '-' + Date.now() + '.jpg';

                var { error: photoErr } = await supabase.storage
                    .from('perfiles-photos')
                    .upload(photoName, compressedBlob);

                if (!photoErr) {
                    var { data: urlData } = supabase.storage
                        .from('perfiles-photos')
                        .getPublicUrl(photoName);

                    photoUrl = urlData.publicUrl;
                }
            }

            // Subir documento si se seleccionó
            if (docInput.files && docInput.files[0]) {
                var docFile = docInput.files[0];
                var extension = docFile.name.split('.').pop();
                var docName = 'documento-' + user.id + '-' + Date.now() + '.' + extension;

                var { error: docErr } = await supabase.storage
                    .from('perfiles-photos')
                    .upload(docName, docFile);

                if (!docErr) {
                    var { data: docUrlData } = supabase.storage
                        .from('perfiles-photos')
                        .getPublicUrl(docName);

                    docUrl = docUrlData.publicUrl;
                }
            }

            // Obtener el perfil actual para conservar foto y documento si no se reemplazan
            var { data: existing, error: existingError } = await supabase
                .from('perfiles_vecinales')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (existingError) throw existingError;

            var updateData = {
                user_id: user.id,
                bio: bio,
                is_visible: isVisible,
                compartir_telefono: compartirTelefono,
                compartir_numero_usuario: compartirNumero,
                updated_at: new Date().toISOString()
            };

            if (photoUrl) {
                updateData.photo_url = photoUrl;
            } else if (existing) {
                updateData.photo_url = existing.photo_url;
            }

            if (docUrl) {
                updateData.document_url = docUrl;
            } else if (existing) {
                updateData.document_url = existing.document_url;
            }

            var { error } = await supabase
                .from('perfiles_vecinales')
                .upsert(updateData, { onConflict: 'user_id' });

            if (error) throw error;

            document.getElementById('perfil-edit-overlay').style.display = 'none';
            VV.utils.showSuccess('Perfil guardado correctamente');
            VV.perfiles.load();

        } catch (err) {
            console.error('Error guardando perfiles:', err);
            alert('Error al guardar: ' + err.message);
        }
    },

    async borrarFoto() {
        var user = VV_ROLES.getCurrentUser();
        if (!user) return;

        try {
            var { error } = await supabase
                .from('perfiles_vecinales')
                .update({ photo_url: null })
                .eq('user_id', user.id);

            if (error) throw error;

            VV.utils.showSuccess('Foto eliminada');
            VV.perfiles.editarMiPerfil();
            VV.perfiles.load();

        } catch (err) {
            alert('Error: ' + err.message);
        }
    },

    async borrarDocumento() {
        var user = VV_ROLES.getCurrentUser();
        if (!user) return;

        try {
            var { error } = await supabase
                .from('perfiles_vecinales')
                .update({ document_url: null })
                .eq('user_id', user.id);

            if (error) throw error;

            VV.utils.showSuccess('Documento eliminado');
            VV.perfiles.editarMiPerfil();
            VV.perfiles.load();

        } catch (err) {
            alert('Error: ' + err.message);
        }
    },

    compressImage(file, maxWidth, quality) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();

            reader.onerror = function() {
                reject(new Error('No se pudo leer la imagen.'));
            };

            reader.onload = function(e) {
                var img = new Image();

                img.onerror = function() {
                    reject(new Error('No se pudo abrir la imagen.'));
                };

                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');

                    var scale = Math.min(1, maxWidth / img.width);
                    canvas.width = Math.round(img.width * scale);
                    canvas.height = Math.round(img.height * scale);

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob(function(blob) {
                        if (!blob) {
                            reject(new Error('No se pudo comprimir la imagen.'));
                            return;
                        }

                        resolve(blob);
                    }, 'image/jpeg', quality);
                };

                img.src = e.target.result;
            };

            reader.readAsDataURL(file);
        });
    }
};