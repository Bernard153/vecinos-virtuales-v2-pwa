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
            // Cargar usuarios del barrio
            var { data: usuarios, error } = await supabase
                .from('users')
                .select('id, name, unique_number, phone, avatar, neighborhood')
                .eq('neighborhood', neighborhood)
                .order('name', { ascending: true });

            if (error) throw error;

            if (!usuarios || usuarios.length === 0) {
                container.innerHTML = '<p style="text-align:center;color:var(--gray-600);grid-column:1/-1;padding:2rem;">No hay vecinos en este barrio.</p>';
                return;
            }

            // Cargar perfiles visibles
            var { data: perfiles } = await supabase
                .from('perfiles_vecinales')
                .select('*')
                .eq('is_visible', true);

            var perfilesMap = {};
            if (perfiles) {
                perfiles.forEach(function(p) { perfilesMap[p.user_id] = p; });
            }

            // Mi propio perfil
            var miPerfil = perfilesMap[user.id];

            var html = '';

            // Mi tarjeta de perfil (editar)
            html += '<div style="grid-column:1/-1;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;border-radius:16px;padding:1.5rem;margin-bottom:1rem;">';
            html += '<div style="display:flex;align-items:center;gap:1rem;">';
            var miAvatar = VV.avatars.getUserAvatar(user.id);
            html += '<div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:2rem;">' + miAvatar.emoji + '</div>';
            html += '<div style="flex:1;"><h3 style="margin:0;">' + user.name + '</h3>';
            html += '<p style="margin:0;opacity:0.8;font-size:0.85rem;">#' + (user.unique_number || '') + ' - Este es tu perfil</p></div>';
            html += '<button onclick="VV.perfiles.editarMiPerfil()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:0.5rem 1rem;border-radius:8px;cursor:pointer;font-weight:bold;">Editar mi perfil</button>';
            html += '</div>';
            if (miPerfil && miPerfil.bio) {
                html += '<p style="margin:0.75rem 0 0 0;font-size:0.9rem;opacity:0.9;">' + miPerfil.bio + '</p>';
            } else {
                html += '<p style="margin:0.75rem 0 0 0;font-size:0.85rem;opacity:0.7;">Aun no escribiste tu bio. Edita tu perfil para contar sobre vos.</p>';
            }
            html += '</div>';

            // Perfiles de otros vecinos
            var otrosUsuarios = usuarios.filter(function(u) { return u.id !== user.id; });
            var visibles = 0;

            otrosUsuarios.forEach(function(u) {
                var perfil = perfilesMap[u.id];
                if (!perfil) return; // No tiene perfil visible

                visibles++;
                var avatar = VV.avatars.getUserAvatar(u.id);
                var avatarEmoji = (perfil.show_avatar !== false && u.avatar) ? avatar.emoji : avatar.emoji;

                html += '<div style="background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.1);border:1px solid var(--gray-200);">';
                html += '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">';

                if (perfil.photo_url) {
                    html += '<img src="' + perfil.photo_url + '" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid var(--primary-blue);">';
                } else {
                    html += '<div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--primary-blue),var(--primary-purple));display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:white;">' + avatarEmoji + '</div>';
                }

                html += '<div><h4 style="margin:0;color:var(--gray-800);">' + u.name + '</h4>';
                html += '<p style="margin:0;font-size:0.8rem;color:var(--gray-500);">#' + (u.unique_number || '') + '</p></div>';
                html += '</div>';

                if (perfil.bio) {
                    html += '<p style="font-size:0.85rem;color:var(--gray-600);margin:0 0 0.75rem 0;line-height:1.4;">' + perfil.bio + '</p>';
                }

                if (perfil.document_url) {
                    html += '<a href="' + perfil.document_url + '" target="_blank" style="display:inline-flex;align-items:center;gap:0.4rem;background:var(--gray-100);color:var(--primary-blue);padding:0.4rem 0.75rem;border-radius:8px;text-decoration:none;font-size:0.8rem;font-weight:bold;">';
                    html += '<i class="fas fa-file-alt"></i> Ver documento</a>';
                }

                html += '<div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--gray-100);">';
                html += '<p style="font-size:0.8rem;color:var(--gray-500);margin:0;"><i class="fas fa-phone"></i> ' + (u.phone || 'Sin telefono') + '</p>';
                html += '</div>';
                html += '</div>';
            });

            if (visibles === 0) {
                html += '<p style="text-align:center;color:var(--gray-600);grid-column:1/-1;padding:2rem;">Los demas vecinos aun no hicieron visible su perfil.</p>';
            }

            container.innerHTML = html;

        } catch (err) {
            console.error('Error cargando perfiles:', err);
            container.innerHTML = '<p style="text-align:center;color:var(--error-red);grid-column:1/-1;">Error al cargar perfiles.</p>';
        }
    },

    editarMiPerfil() {
        var user = VV_ROLES.getCurrentUser();
        if (!user) return;

        var overlay = document.getElementById('perfil-edit-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'perfil-edit-overlay';
            document.body.appendChild(overlay);
        }

        // Cargar perfil actual
        supabase
            .from('perfiles_vecinales')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(function(result) {
                var perfil = result.data || {};

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
                html += '<label style="display:block;font-weight:bold;color:var(--gray-700);margin-bottom:0.5rem;">Sobre mi (bio)</label>';
                html += '<textarea id="perfil-bio" rows="4" maxlength="500" placeholder="Contá sobre vos, a qué te dedicás, qué ofrecés al barrio..." style="width:100%;padding:0.75rem;border:1px solid var(--gray-300);border-radius:8px;font-size:0.9rem;resize:vertical;">' + (perfil.bio || '') + '</textarea>';
                html += '<p style="font-size:0.75rem;color:var(--gray-400);margin:0.25rem 0 0 0;">Maximo 500 caracteres</p>';
                html += '</div>';

                // Documento
                html += '<div style="margin-bottom:1rem;">';
                html += '<label style="display:block;font-weight:bold;color:var(--gray-700);margin-bottom:0.5rem;">Documento / Certificacion (opcional)</label>';
                if (perfil.document_url) {
                    html += '<a href="' + perfil.document_url + '" target="_blank" style="display:inline-flex;align-items:center;gap:0.4rem;background:var(--gray-100);color:var(--primary-blue);padding:0.4rem 0.75rem;border-radius:8px;text-decoration:none;font-size:0.8rem;font-weight:bold;margin-bottom:0.5rem;"><i class="fas fa-file-alt"></i> Ver documento actual</a><br>';
                    html += '<button onclick="VV.perfiles.borrarDocumento()" style="background:var(--error-red);color:white;border:none;padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.8rem;margin-bottom:0.5rem;">Quitar documento</button><br>';
                }
                html += '<input type="file" id="perfil-doc-input" accept="image/*,application/pdf" style="width:100%;padding:0.5rem;border:1px solid var(--gray-300);border-radius:8px;">';
                html += '<p style="font-size:0.75rem;color:var(--gray-400);margin:0.25rem 0 0 0;">PDF o imagen. Ej: diploma, certificacion</p>';
                html += '</div>';

                // Visible
                html += '<div style="margin-bottom:1rem;">';
                html += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">';
                html += '<input type="checkbox" id="perfil-visible" ' + (perfil.is_visible !== false ? 'checked' : '') + ' style="width:20px;height:20px;">';
                html += '<span style="font-weight:bold;color:var(--gray-700);">Mostrar mi perfil en el directorio del barrio</span>';
                html += '</label>';
                html += '<p style="font-size:0.8rem;color:var(--gray-500);margin:0.25rem 0 0 1.75rem;">Si desactivas esto, solo vos veras tu perfil.</p>';
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
            });
    },

    async guardarPerfil() {
        var user = VV_ROLES.getCurrentUser();
        if (!user) return;

        var bio = document.getElementById('perfil-bio').value.trim();
        var isVisible = document.getElementById('perfil-visible').checked;
        var photoInput = document.getElementById('perfil-photo-input');
        var docInput = document.getElementById('perfil-doc-input');

        var photoUrl = null;
        var docUrl = null;

        try {
            // Subir foto si se selecciono
            if (photoInput.files && photoInput.files[0]) {
                var photoFile = photoInput.files[0];
                // Comprimir
                var compressedBlob = await this.compressImage(photoFile, 400, 0.7);
                var photoName = 'perfil-' + user.id + '-' + Date.now() + '.jpg';
                var { error: photoErr } = await supabase.storage
                    .from('perfiles-photos')
                    .upload(photoName, compressedBlob);
                if (!photoErr) {
                    var { data: urlData } = supabase.storage.from('perfiles-photos').getPublicUrl(photoName);
                    photoUrl = urlData.publicUrl;
                }
            }

            // Subir documento si se selecciono
            if (docInput.files && docInput.files[0]) {
                var docFile = docInput.files[0];
                var docName = 'documento-' + user.id + '-' + Date.now() + '.' + (docFile.name.split('.').pop());
                var { error: docErr } = await supabase.storage
                    .from('perfiles-photos')
                    .upload(docName, docFile);
                if (!docErr) {
                    var { data: docUrlData } = supabase.storage.from('perfiles-photos').getPublicUrl(docName);
                    docUrl = docUrlData.publicUrl;
                }
            }

            // Obtener perfil actual
            var { data: existing } = await supabase
                .from('perfiles_vecinales')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            var updateData = {
                user_id: user.id,
                bio: bio,
                is_visible: isVisible,
                updated_at: new Date().toISOString()
            };

            if (photoUrl) updateData.photo_url = photoUrl;
            if (docUrl) updateData.document_url = docUrl;
            if (existing && !photoUrl) updateData.photo_url = existing.photo_url;
            if (existing && !docUrl) updateData.document_url = existing.document_url;

            var { error } = await supabase
                .from('perfiles_vecinales')
                .upsert(updateData);

            if (error) throw error;

            document.getElementById('perfil-edit-overlay').style.display = 'none';
            VV.utils.showSuccess('Perfil guardado correctamente');
            VV.perfiles.load();

        } catch (err) {
            console.error('Error guardando perfil:', err);
            alert('Error al guardar: ' + err.message);
        }
    },

    async borrarFoto() {
        var user = VV_ROLES.getCurrentUser();
        if (!user) return;

        try {
            await supabase
                .from('perfiles_vecinales')
                .update({ photo_url: null })
                .eq('user_id', user.id);

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
            await supabase
                .from('perfiles_vecinales')
                .update({ document_url: null })
                .eq('user_id', user.id);

            VV.utils.showSuccess('Documento eliminado');
            VV.perfiles.editarMiPerfil();
            VV.perfiles.load();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    },

    compressImage(file, maxWidth, quality) {
        return new Promise(function(resolve) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = new Image();
                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    var scale = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(function(blob) {
                        resolve(blob);
                    }, 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
};
