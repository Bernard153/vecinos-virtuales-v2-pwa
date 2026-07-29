// ========== MÓDULO CULTURAL ==========

VV.cultural = {
    // SOLUCIÓN TEMPORAL: Intentar con diferentes valores de tipo
    async testAllTypes() {
        console.log('🧪 PROBANDO DIFERENTES VALORES DE TIPO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const typesToTest = [
            'Fotografia', 'Fotografía', 
            'Arte', 'Cultural', 'Deporte',
            'photography', 'art', 'sport',
            'foto', 'imagen', 'post'
        ];
        
        for (const typeValue of typesToTest) {
            console.log(`\n🔍 Probando tipo: "${typeValue}"`);
            
            try {
                const { data, error } = await supabase
                    .from('cultural_posts')
                    .insert({
                        title: 'TEST',
                        type: typeValue,
                        description: 'Test',
                        author_id: VV.data.user.id,
                        author_name: 'Test',
                        author_number: '0000',
                        neighborhood: VV.data.neighborhood
                    })
                    .select()
                    .single();
                
                if (error) {
                    console.log(`   ❌ "${typeValue}" NO funciona:`, error.message);
                } else {
                    console.log(`   ✅ "${typeValue}" FUNCIONA!`);
                    // Eliminar el test
                    await supabase.from('cultural_posts').delete().eq('id', data.id);
                    console.log(`   🎉 VALOR CORRECTO ENCONTRADO: "${typeValue}"`);
                    break;
                }
            } catch (err) {
                console.log(`   ❌ Error: ${err.message}`);
            }
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    },
    
    // DIAGNÓSTICO: Probar conexión con Supabase
    async testSupabaseConnection() {
        console.log('🔍 DIAGNÓSTICO DE SUPABASE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        try {
            // Test 1: Verificar que supabase esté definido
            console.log('1️⃣ Verificando cliente Supabase...');
            if (!window.supabase) {
                console.error('❌ Supabase no está inicializado');
                return;
            }
            console.log('✅ Cliente Supabase OK');
            
            // Test 2: Intentar leer datos (SELECT)
            console.log('2️⃣ Probando lectura de datos...');
            const { data: readData, error: readError } = await supabase
                .from('cultural_posts')
                .select('*')
                .limit(1);
            
            if (readError) {
                console.error('❌ Error leyendo datos:', readError);
            } else {
                console.log('✅ Lectura OK. Registros encontrados:', readData?.length || 0);
            }
            
            // Test 3: Intentar insertar un registro de prueba
            console.log('3️⃣ Probando inserción de datos...');
            const testPost = {
                title: 'TEST - Borrar',
                type: 'Fotografia',
                description: 'Test de conexión',
                media_type: null,
                media_url: null,
                author_id: VV.data.user.id,
                author_name: 'Test',
                author_number: '0000',
                neighborhood: VV.data.neighborhood
            };
            
            console.log('📤 Intentando insertar:', testPost);
            
            const { data: insertData, error: insertError } = await supabase
                .from('cultural_posts')
                .insert(testPost)
                .select()
                .single();
            
            if (insertError) {
                console.error('❌ Error insertando:', insertError);
                console.error('   Código:', insertError.code);
                console.error('   Mensaje:', insertError.message);
                console.error('   Detalles:', insertError.details);
                console.error('   Hint:', insertError.hint);
            } else {
                console.log('✅ Inserción OK:', insertData);
                
                // Eliminar el registro de prueba
                console.log('4️⃣ Limpiando registro de prueba...');
                await supabase
                    .from('cultural_posts')
                    .delete()
                    .eq('id', insertData.id);
                console.log('✅ Limpieza OK');
            }
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🏁 DIAGNÓSTICO COMPLETO');
            
        } catch (error) {
            console.error('❌ Error general:', error);
        }
    },
    
    // Mapeo de tipos a nombres legibles
    typeLabels: {
        'Fotografía': '📸 Fotografía',
        'Evento': '🎉 Evento',
        '🔄 Trueque': '🔄 Trueque'
    },
    
    // Obtener nombre legible del tipo
    getTypeLabel(type) {
        return this.typeLabels[type] || type;
    },
    
    // Cargar posts culturales
    load() {
        const container = document.getElementById('cultural-posts');
        
        // DEBUG: Ver qué tipos existen en la DB
        if (VV.data.culturalPosts.length > 0) {
            const existingTypes = [...new Set(VV.data.culturalPosts.map(p => p.type))];
            console.log('📊 Tipos existentes en DB:', existingTypes);
        }
        
        // Verificar si el usuario está en su barrio principal
        const homeNeighborhood = VV.data.user.home_neighborhood || VV.data.user.neighborhood;
        const currentNeighborhood = VV.data.user.current_neighborhood || VV.data.user.neighborhood;
        
        if (homeNeighborhood !== currentNeighborhood) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--gray-50); border-radius: 12px;">
                    <i class="fas fa-lock" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--gray-700); margin-bottom: 0.5rem;">Acceso Restringido</h3>
                    <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                        Solo puedes publicar y comentar en tu barrio principal: <strong>${homeNeighborhood}</strong>
                    </p>
                    <p style="color: var(--gray-500); font-size: 0.9rem;">
                        Actualmente estás visitando: <strong>${currentNeighborhood}</strong>
                    </p>
                    <button onclick="VV.geo.returnToHomeNeighborhood()" class="btn-primary" style="margin-top: 1rem;">
                        <i class="fas fa-home"></i> Volver a ${homeNeighborhood}
                    </button>
                </div>
            `;
            return;
        }
        
        // Filtrar solo posts del mismo barrio
        const neighborhoodPosts = VV.data.culturalPosts.filter(p => 
            !p.neighborhood || p.neighborhood === VV.data.neighborhood
        );
        
        if (neighborhoodPosts.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray-600);">
                    <i class="fas fa-palette" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No hay publicaciones aún</h3>
                    <p>Comparte arte, eventos o propón un trueque</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = neighborhoodPosts.map(post => {
            const isOwner = (post.author_id || post.userId) === VV.data.user.id;
            const canModerate = VV.utils.canModerate();
            const mediaType = post.media_type || post.mediaType;
            const mediaUrl = post.media_url || post.mediaUrl;
            const authorName = post.author_name || post.userName;
            
            return `
            <div class="cultural-card">
                <div class="card-header">
                    <h3>${post.title}</h3>
                    <span class="badge" style="background: rgba(139, 92, 246, 0.1); color: var(--primary-purple);">${VV.cultural.getTypeLabel(post.type)}</span>
                </div>
                <p><strong>Por:</strong> ${authorName}</p>
                
                ${mediaType === 'image' && mediaUrl ? `
                    <div style="margin: 1rem 0;">
                        <img src="${mediaUrl}" alt="${post.title}" style="width: 100%; border-radius: 8px; max-height: 300px; object-fit: cover;">
                    </div>
                ` : ''}
                
                ${mediaType === 'video' && mediaUrl ? `
                    <div style="margin: 1rem 0;">
                        <video controls style="width: 100%; border-radius: 8px; max-height: 300px;">
                            <source src="${mediaUrl}" type="video/mp4">
                            Tu navegador no soporta videos.
                        </video>
                    </div>
                ` : ''}
                
                <p style="color: var(--gray-700); margin: 0.5rem 0; white-space: pre-wrap;">${post.description}</p>
                                <div class="card-footer">
                    <button class="like-btn" onclick="VV.cultural.like('${post.id}')">
                        <i class="fas fa-heart"></i> ${post.likes}
                    </button>
                    <button class="like-btn" onclick="VV.cultural.showComments('${post.id}')" style="margin-left: 0.5rem;">
                        <i class="fas fa-comment"></i> Comentar
                    </button>
                    ${!isOwner ? `
                        <button class="like-btn" onclick="VV.cultural.showGiftPicker('${post.id}', '${post.author_id || post.userId}')" style="margin-left: 0.5rem; background: rgba(251,191,36,0.15); color: #f59e0b;">
                            <i class="fas fa-gift"></i> Regalar
                        </button>
                    ` : ''}
                    ${isOwner ? `
                        <div style="display: flex; gap: 0.5rem; margin-left: auto;">
                            <button class="btn-edit" onclick="VV.cultural.showForm('${post.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="VV.cultural.delete('${post.id}')" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : canModerate ? `
                        <button class="btn-delete" onclick="VV.cultural.delete('${post.id}')" title="Eliminar (Moderador)" style="margin-left: auto;">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div id="cultural-comments-${post.id}" style="display:none; margin-top: 1rem;"></div>
                <div id="cultural-gifts-${post.id}" style="margin-top: 0.5rem;"></div>

            </div>
        `;
        }).join('');
	        // Cargar regalos de cada post
        neighborhoodPosts.forEach(post => {
            this.loadGifts(post.id);
        });

    },
    
    // Mostrar formulario
    showForm(postId = null) {
        // Verificar si el usuario está en su barrio principal
        const homeNeighborhood = VV.data.user.home_neighborhood || VV.data.user.neighborhood;
        const currentNeighborhood = VV.data.user.current_neighborhood || VV.data.user.neighborhood;
        
        if (homeNeighborhood !== currentNeighborhood) {
            alert(`Solo puedes publicar en tu barrio principal: ${homeNeighborhood}\n\nActualmente estás visitando: ${currentNeighborhood}`);
            return;
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const post = postId ? VV.data.culturalPosts.find(p => p.id === postId) : null;
        const isEdit = post !== null;
        
        let overlay = document.getElementById('cultural-form-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'cultural-form-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-${isEdit ? 'edit' : 'palette'}"></i> ${isEdit ? 'Editar' : 'Compartir'} Arte</h3>
                <form id="cultural-form">
                    <div class="form-group">
                        <label>Título *</label>
                        <input type="text" id="cultural-title" value="${post?.title || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Tipo *</label>
                        <select id="cultural-type" required>
                            <option value="">Seleccionar</option>
                            <option value="Fotografía" ${post?.type === 'Fotografía' ? 'selected' : ''}>📸 Fotografía</option>
                            <option value="Evento" ${post?.type === 'Evento' ? 'selected' : ''}>🎉 Evento</option>
                            <option value="🔄 Trueque" ${post?.type === '🔄 Trueque' ? 'selected' : ''}>🔄 Trueque</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción / Texto *</label>
                        <textarea id="cultural-description" rows="4" required placeholder="Comparte tu texto, poesía, o descripción...">${post?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Tipo de Multimedia</label>
                        <select id="cultural-media-type" onchange="VV.cultural.toggleMediaInput()">
                            <option value="">Sin multimedia</option>
                            <option value="image" ${post?.mediaType === 'image' ? 'selected' : ''}>Imagen</option>
                            <option value="video" ${post?.mediaType === 'video' ? 'selected' : ''}>Video</option>
                        </select>
                    </div>
                    <div class="form-group" id="media-input-container" style="display: ${post?.mediaType ? 'block' : 'none'};">
                        <label>Subir archivo</label>
                        <input type="file" id="cultural-media-file" accept="image/*,video/*">
                        <p style="font-size: 0.85rem; color: var(--gray-600); margin-top: 0.5rem;">
                            <i class="fas fa-info-circle"></i> Imágenes: JPG/PNG/WebP máx 2MB (se comprimen automáticamente) · Videos: MP4/WebM máx 5MB
                        </p>

                        ${post?.mediaUrl ? `<p style="font-size: 0.85rem; color: var(--success-green); margin-top: 0.5rem;"><i class="fas fa-check"></i> Archivo actual cargado</p>` : ''}
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.cultural.closeForm()">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-save"></i> ${isEdit ? 'Actualizar' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('cultural-form').onsubmit = (e) => {
            e.preventDefault();
            VV.cultural.save(post);
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.cultural.closeForm();
        };
    },
    
    // Cerrar formulario
    closeForm() {
        const overlay = document.getElementById('cultural-form-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Toggle media input
    toggleMediaInput() {
        const mediaType = document.getElementById('cultural-media-type').value;
        const container = document.getElementById('media-input-container');
        container.style.display = mediaType ? 'block' : 'none';
    },
    
    // Guardar post
    async save(existing) {
        const formData = {
            title: document.getElementById('cultural-title').value.trim(),
            type: document.getElementById('cultural-type').value,
            description: document.getElementById('cultural-description').value.trim(),
            mediaType: document.getElementById('cultural-media-type').value,
            mediaUrl: ''
        };
        
        if (!formData.title || !formData.type || !formData.description) {
            alert('Completa todos los campos obligatorios');
            return;
        }
        
        // 
        // Procesar archivo multimedia si existe
        const fileInput = document.getElementById('cultural-media-file');
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            
            console.log('📸 Procesando archivo:', file.name, file.type, file.size);
            
            // === RESTRICCIONES DE AUSTERIDAD ===
            const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
            const MAX_VIDEO_SIZE = 5 * 1024 * 1024;  // 5MB
            const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
            const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
            
            // Validar tipo de archivo
            if (formData.mediaType === 'image') {
                if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                    alert('Solo se permiten imágenes JPG, PNG o WebP');
                    return;
                }
                if (file.size > MAX_IMAGE_SIZE) {
                    alert(`La imagen es demasiado grande (${(file.size/1024/1024).toFixed(1)}MB). Máximo 2MB.`);
                    return;
                }
            } else if (formData.mediaType === 'video') {
                if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
                    alert('Solo se permiten videos MP4 o WebM');
                    return;
                }
                if (file.size > MAX_VIDEO_SIZE) {
                    alert(`El video es demasiado grande (${(file.size/1024/1024).toFixed(1)}MB). Máximo 5MB.`);
                    return;
                }
            }
                
            // Comprimir imagen antes de convertir a base64
            if (formData.mediaType === 'image') {
                VV.cultural.compressImage(file, 1080, 0.7, (compressedDataUrl) => {
                    formData.mediaUrl = compressedDataUrl;
                    console.log('✅ Imagen comprimida, tamaño:', compressedDataUrl.length);
                    VV.cultural.savePost(existing, formData);
                });
            } else {
                // Video: convertir a base64 sin compresión
                const reader = new FileReader();
                reader.onload = function(e) {
                    formData.mediaUrl = e.target.result;
                    console.log('✅ Video convertido a base64, tamaño:', e.target.result.length);
                    VV.cultural.savePost(existing, formData);
                };
                reader.onerror = function(error) {
                    console.error('❌ Error leyendo archivo:', error);
                    alert('Error al procesar el archivo');
                };
                reader.readAsDataURL(file);
            }
        } else {

            // Si no hay archivo nuevo, mantener el existente
            if (existing && (existing.media_url || existing.mediaUrl)) {
                formData.mediaUrl = existing.media_url || existing.mediaUrl;
                console.log('📎 Manteniendo archivo existente');
            }
            VV.cultural.savePost(existing, formData);
        }
    },
    
    // Guardar post (helper) - MIGRADO A SUPABASE
    async savePost(existing, formData) {
        console.log('💾 Guardando post cultural:', {
            title: formData.title,
            type: formData.type,
            mediaType: formData.mediaType,
            hasMediaUrl: !!formData.mediaUrl,
            mediaUrlLength: formData.mediaUrl?.length || 0
        });
        
        // TEMPORAL: Verificar qué valores acepta la DB
        console.warn('⚠️ TIPO ENVIADO:', formData.type);
        console.warn('⚠️ Si falla, la DB solo acepta ciertos valores específicos');
        
        try {
            if (existing) {
                // Actualizar post existente
                console.log('📝 Actualizando post existente:', existing.id);
                const { error } = await supabase
                    .from('cultural_posts')
                    .update({
                        title: formData.title,
                        type: formData.type,
                        description: formData.description,
                        media_type: formData.mediaType,
                        media_url: formData.mediaUrl
                    })
                    .eq('id', existing.id);
                
                if (error) throw error;
                
                const index = VV.data.culturalPosts.findIndex(p => p.id === existing.id);
                VV.data.culturalPosts[index] = { ...existing, ...formData };
                console.log('✅ Post actualizado');
            } else {
                // Crear nuevo post
                console.log('🆕 Creando nuevo post');
                const { data, error } = await supabase
                    .from('cultural_posts')
                    .insert({
                        title: formData.title,
                        type: formData.type,
                        description: formData.description,
                        media_type: formData.mediaType,
                        media_url: formData.mediaUrl,
                        author_id: VV.data.user.id,
                        author_name: VV.data.user.name,
                        author_number: VV.data.user.unique_number,
                        neighborhood: VV.data.neighborhood
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                console.log('✅ Post creado:', data);
                VV.data.culturalPosts.push(data);
            }
            
            VV.cultural.closeForm();
            VV.cultural.load();
            VV.utils.showSuccess(existing ? 'Publicación actualizada' : 'Publicación compartida');
            
        } catch (error) {
            console.error('❌ Error guardando publicación:', error);
            alert('Error al guardar la publicación: ' + error.message);
        }
    },
    
        // Dar like - MIGRADO A SUPABASE (un like por usuario)
    async like(postId) {
        const user = VV_ROLES.getCurrentUser();
        if (!user) { alert('Iniciá sesión para dar like'); return; }

        try {
            const { data: existing } = await supabase
                .from('cultural_likes')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', user.id)
                .maybeSingle();

            const post = VV.data.culturalPosts.find(p => p.id === postId);
            if (!post) return;

            if (existing) {
                // Ya dio like → quitarlo
                await supabase.from('cultural_likes').delete().eq('id', existing.id);
                const newLikes = Math.max(0, (post.likes || 0) - 1);
                await supabase.from('cultural_posts').update({ likes: newLikes }).eq('id', postId);
                post.likes = newLikes;
            } else {
                // No dio like → agregarlo
                await supabase.from('cultural_likes').insert([{
                    post_id: postId,
                    user_id: user.id
                }]);
                const newLikes = (post.likes || 0) + 1;
                await supabase.from('cultural_posts').update({ likes: newLikes }).eq('id', postId);
                post.likes = newLikes;
            }

            VV.cultural.load();

        } catch (error) {
            console.error('Error dando like:', error);
        }
    },
    
    // Eliminar post - MIGRADO A SUPABASE
    async delete(postId) {
        const post = VV.data.culturalPosts.find(p => p.id === postId);
        if (!post) return;
        
        const isOwner = post.user_id === VV.data.user.id;
        const canModerate = VV.utils.canModerate();
        
        if (!isOwner && !canModerate) {
            alert('No tienes permisos para eliminar esta publicación');
            return;
        }
        
        if (!confirm('¿Eliminar esta publicación?')) return;
        
        try {
            const { error } = await supabase
                .from('cultural_posts')
                .delete()
                .eq('id', postId);
            
            if (error) throw error;
            
            VV.data.culturalPosts = VV.data.culturalPosts.filter(p => p.id !== postId);
            
            // Registrar acción de moderador si aplica
            if (canModerate && !isOwner) {
                VV.utils.logModeratorAction('ELIMINAR_PUBLICACION', {
                    postId: postId,
                    postTitle: post.title,
                    authorName: post.user_name
                });
            }
            
            VV.cultural.load();
            VV.utils.showSuccess('Publicación eliminada');
            
        } catch (error) {
            console.error('Error eliminando publicación:', error);
            alert('Error al eliminar la publicación: ' + error.message);
        }
     },
// ========== SISTEMA DE COMENTARIOS ==========

    COMENTARIOS: {
        felicitaciones: ['¡Felicitaciones!', '¡Qué logro!', '¡Orgullo del barrio!', '¡Te lo merecés!'],
        celebra: ['¡A festejar!', '¡Baila con todos!', '¡Que la pasaste lindo!', '¡A celebrar!'],
        emocional: ['Me emocionaste', 'Se siente de verdad', 'Tiene alma', 'Directo al corazón'],
        reconocimiento: ['Felicitaciones vecino!', 'El barrio te aplaude', 'Seguí así', 'Orgullo del barrio'],
        especial: ['Candidato al destacado', 'Esto merece un regalo', 'No paro de verlo', 'Lo compartí con todos']
    },

    categoryEmoji: function(category) {
        const emojis = { felicitaciones: '👏', celebra: '🎉', emocional: '❤️', reconocimiento: '🏆', especial: '🌟' };
        return emojis[category] || '💬';
    },

    showComments: async function(postId) {
        const section = document.getElementById('cultural-comments-' + postId);
        if (!section) return;

        if (section.style.display === 'block') {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        section.innerHTML = '<p style="color: var(--gray-500);">Cargando comentarios...</p>';

        try {
            const { data: comments, error } = await supabase
                .from('cultural_comments')
                .select('*')
                .eq('post_id', postId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const user = VV_ROLES.getCurrentUser();
            let html = '<div style="border-top: 1px solid var(--gray-200); padding-top: 0.75rem;">';

            if (comments && comments.length > 0) {
                html += comments.map(c => `
                    <div style="display:flex;align-items:center;gap:0.4rem;padding:0.4rem 0;border-bottom:1px solid var(--gray-100);">
                        <span style="font-size:1.1rem;">${this.categoryEmoji(c.category)}</span>
                        <span style="font-size:0.85rem;color:var(--gray-700);">${c.comment_text}</span>
                        <span style="font-size:0.7rem;color:var(--gray-400);margin-left:auto;">${c.user_name || ''}</span>
                    </div>
                `).join('');
            } else {
                html += '<p style="color: var(--gray-500); font-size: 0.85rem;">Sin comentarios aún</p>';
            }

            if (user) {
                html += '<div style="margin-top: 0.75rem;">';
                html += '<p style="font-size: 0.8rem; color: var(--gray-600); margin-bottom: 0.4rem;">Elegí un comentario:</p>';
                for (const [cat, textos] of Object.entries(this.COMENTARIOS)) {
                    html += `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.3rem;">`;
                    html += `<span style="font-size:0.75rem;color:var(--gray-500);min-width:90px;">${this.categoryEmoji(cat)} ${cat}</span>`;
                    textos.forEach(texto => {
                        html += `<button onclick="VV.cultural.postComment('${postId}', '${cat}', '${texto.replace(/'/g, "\\'")}')" style="background:var(--gray-100);border:1px solid var(--gray-200);border-radius:20px;padding:0.3rem 0.7rem;font-size:0.75rem;cursor:pointer;color:var(--gray-700);">${texto}</button>`;
                    });
                    html += `</div>`;
                }
                html += '</div>';
            }

            html += '</div>';
            section.innerHTML = html;

        } catch (err) {
            console.error('Error cargando comentarios:', err);
            section.innerHTML = '<p style="color: var(--error-red); font-size: 0.85rem;">Error al cargar comentarios</p>';
        }
    },

        postComment: async function(postId, category, text) {
        const user = VV_ROLES.getCurrentUser();
        if (!user) { alert('Iniciá sesión para comentar'); return; }

        try {
            const { data: existing } = await supabase
                .from('cultural_comments')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (existing) {
                await supabase.from('cultural_comments')
                    .update({ comment_text: text, category: category })
                    .eq('id', existing.id);
            } else {
                await supabase.from('cultural_comments').insert([{
                    post_id: postId,
                    user_id: user.id,
                    user_name: user.name || user.email || 'Anónimo',
                    comment_text: text,
                    category: category
                }]);
            }

            // Forzar recarga sin toggle
            const section = document.getElementById('cultural-comments-' + postId);
            if (section) {
                section.style.display = 'block';
                // Recargar comentarios forzando el estado visible
                await this.reloadComments(postId);
		// Cerrar la cortina después de un segundo
            setTimeout(() => {
                const sec = document.getElementById('cultural-comments-' + postId);
                if (sec) sec.style.display = 'none';
            }, 1500);

            }

        } catch (err) {
            console.error('Error posteando comentario:', err);
            alert('No se pudo enviar el comentario');
        }
    },

    reloadComments: async function(postId) {
        const section = document.getElementById('cultural-comments-' + postId);
        if (!section) return;

        try {
            const { data: comments, error } = await supabase
                .from('cultural_comments')
                .select('*')
                .eq('post_id', postId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const user = VV_ROLES.getCurrentUser();
            let html = '<div style="border-top: 1px solid var(--gray-200); padding-top: 0.75rem;">';

            if (comments && comments.length > 0) {
                html += comments.map(c => `
                    <div style="display:flex;align-items:center;gap:0.4rem;padding:0.4rem 0;border-bottom:1px solid var(--gray-100);">
                        <span style="font-size:1.1rem;">${this.categoryEmoji(c.category)}</span>
                        <span style="font-size:0.85rem;color:var(--gray-700);">${c.comment_text}</span>
                        <span style="font-size:0.7rem;color:var(--gray-400);margin-left:auto;">${c.user_name || ''}</span>
                    </div>
                `).join('');
            } else {
                html += '<p style="color: var(--gray-500); font-size: 0.85rem;">Sin comentarios aún</p>';
            }

            if (user) {
                html += '<div style="margin-top: 0.75rem;">';
                html += '<p style="font-size: 0.8rem; color: var(--gray-600); margin-bottom: 0.4rem;">Elegí un comentario:</p>';
                for (const [cat, textos] of Object.entries(this.COMENTARIOS)) {
                    html += `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.3rem;">`;
                    html += `<span style="font-size:0.75rem;color:var(--gray-500);min-width:90px;">${this.categoryEmoji(cat)} ${cat}</span>`;
                    textos.forEach(texto => {
                        html += `<button onclick="VV.cultural.postComment('${postId}', '${cat}', '${texto.replace(/'/g, "\\'")}')" style="background:var(--gray-100);border:1px solid var(--gray-200);border-radius:20px;padding:0.3rem 0.7rem;font-size:0.75rem;cursor:pointer;color:var(--gray-700);">${texto}</button>`;
                    });
                    html += `</div>`;
                }
                html += '</div>';
            }

            html += '</div>';
            section.innerHTML = html;

        } catch (err) {
            console.error('Error recargando comentarios:', err);
        }
    },

      
    sendGift: async function(postId, toUserId, itemCode, itemName, price) {
        const result = await VV_WALLET.sendGift(toUserId, itemCode, postId, 'cultural');

        if (result.success) {
            document.getElementById('cultural-gift-modal').remove();
            alert('🎉 ¡' + itemName + ' enviado!');
            this.loadGifts(postId);
        } else {
            alert('❌ ' + result.error);
        }
    },

    loadGifts: async function(postId) {
        const section = document.getElementById('cultural-gifts-' + postId);
        if (!section) return;

        try {
            const { data: gifts, error } = await supabase
                .from('regalos_enviados')
                .select('*')
                .eq('publicacion_id', postId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error || !gifts || gifts.length === 0) {
                section.innerHTML = '';
                return;
            }

            const codes = [...new Set(gifts.map(g => g.tipo_regalo))];
            const { data: items } = await supabase.from('catalogo_regalos').select('*').in('code', codes);
            const itemMap = {};
            (items || []).forEach(i => itemMap[i.code] = i);

            section.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:0.3rem;padding-top:0.5rem;">' +
                gifts.map(g => {
                    const item = itemMap[g.tipo_regalo] || {};
                    return '<span style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:20px;padding:0.2rem 0.6rem;font-size:0.75rem;display:flex;align-items:center;gap:0.2rem;">' +
                        '<span style="font-size:1rem;">' + (item.icono || '🎁') + '</span>' +
                        '<span style="color:#f59e0b;font-weight:600;">' + (item.nombre || g.tipo_regalo) + '</span>' +
                        '</span>';
                }).join('') +
                '</div>';

        } catch (err) {
            console.error('Error cargando regalos:', err);
        }
    },
    // ========== SISTEMA DE REGALOS ==========

    showGiftPicker: async function(postId, toUserId) {
        const user = VV_ROLES.getCurrentUser();
        if (!user) { alert('Iniciá sesión para regalar'); return; }
        if (user.id === toUserId) { alert('No podés regalarte a vos mismo 😄'); return; }
        if (!window.VV_WALLET) { alert('Sistema de billetera no disponible'); return; }

        // Cerrar comentarios abiertos
        document.querySelectorAll('[id^="cultural-comments-"]').forEach(el => el.style.display = 'none');

        const { balance } = await VV_WALLET.getBalance(user.id);
        const items = await VV_WALLET.getShopItems('regalo');

        const modal = document.createElement('div');
        modal.id = 'cultural-gift-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';

        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:400px;width:90%;padding:1.25rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    <h3 style="margin:0;color:var(--gray-800);">🎁 Enviar Regalo</h3>
                    <div style="display:flex;align-items:center;gap:0.4rem;background:rgba(251,191,36,0.15);padding:0.4rem 0.8rem;border-radius:20px;">
                        <span>🪙</span>
                        <span style="font-weight:700;color:#f59e0b;">${balance}</span>
                    </div>
                </div>
                <p style="color:var(--gray-500);font-size:0.8rem;margin-bottom:0.75rem;">Elegí un regalo:</p>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;">
                    ${items.map(item => `
                        <div onclick="VV.cultural.sendGift('${postId}', '${toUserId}', '${item.code}', '${item.nombre}', ${item.precio_monedas})"
                             style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:10px;padding:0.75rem;text-align:center;cursor:pointer;transition:all 0.2s;"
                             onmouseover="this.style.background='rgba(251,191,36,0.1)';this.style.borderColor='rgba(251,191,36,0.3)'"
                             onmouseout="this.style.background='var(--gray-50)';this.style.borderColor='var(--gray-200)'">
                            <div style="font-size:2rem;margin-bottom:0.25rem;">${item.icono}</div>
                            <p style="margin:0;font-size:0.7rem;color:var(--gray-700);">${item.nombre}</p>
            <p style="margin:0.2rem 0 0;font-size:0.8rem;color:#f59e0b;font-weight:700;">🪙 ${item.precio_monedas}</p>
                        </div>
                    `).join('')}
                </div>
                <button onclick="document.getElementById('cultural-gift-modal').remove()" style="margin-top:1rem;width:100%;padding:0.6rem;background:var(--gray-100);border:none;border-radius:8px;cursor:pointer;color:var(--gray-600);">Cerrar</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    },

    sendGift: async function(postId, toUserId, itemCode, itemName, price) {
        const result = await VV_WALLET.sendGift(toUserId, itemCode, postId, 'cultural');

        if (result.success) {
            document.getElementById('cultural-gift-modal').remove();
            alert('🎉 ¡' + itemName + ' enviado!');
            this.loadGifts(postId);
        } else {
            alert('❌ ' + result.error);
        }
    },

    loadGifts: async function(postId) {
        const section = document.getElementById('cultural-gifts-' + postId);
        if (!section) return;

        try {
            const { data: gifts, error } = await supabase
                .from('regalos_enviados')
                .select('*')
                .function(postId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error || !gifts || gifts.length === 0) {
                section.innerHTML = '';
                return;
            }

            const codes = [...new Set(gifts.map(g => g.tipo_regalo))];
            const { data: items } = await supabase.from('catalogo_regalos').select('*').in('code', codes);
            const itemMap = {};
            (items || []).forEach(i => itemMap[i.code] = i);

            section.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:0.3rem;padding-top:0.5rem;">' +
                gifts.map(g => {
                    const item = itemMap[g.tipo_regalo] || {};
                    return '<span style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:20px;padding:0.2rem 0.6rem;font-size:0.75rem;display:flex;align-items:center;gap:0.2rem;">' +
                        '<span style="font-size:1rem;">' + (item.icono || '🎁') + '</span>' +
                        '<span style="color:#f59e0b;font-weight:600;">' + (item.nombre || g.tipo_regalo) + '</span>' +
                        '</span>';
                }).join('') +
                '</div>';

        } catch (err) {
            console.error('Error cargando regalos:', err);
        }
    },

    // Comprimir imagen usando Canvas API
    compressImage(file, maxWidth, quality, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                
                // Redimensionar si excede maxWidth
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressed = canvas.toDataURL('image/jpeg', quality);
                callback(compressed);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

console.log('✅ Módulo CULTURAL cargado');

