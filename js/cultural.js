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
            </div>
        `;
        }).join('');
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
                            <i class="fas fa-info-circle"></i> Soporta imágenes (JPG, PNG) y videos (MP4)
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
        
        // Procesar archivo multimedia si existe
        const fileInput = document.getElementById('cultural-media-file');
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            
            console.log('📸 Procesando archivo:', file.name, file.type, file.size);
            
            // Convertir a base64
            const reader = new FileReader();
            reader.onload = function(e) {
                formData.mediaUrl = e.target.result;
                console.log('✅ Archivo convertido a base64, tamaño:', e.target.result.length);
                VV.cultural.savePost(existing, formData);
            };
            reader.onerror = function(error) {
                console.error('❌ Error leyendo archivo:', error);
                alert('Error al procesar el archivo');
            };
            reader.readAsDataURL(file);
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
    
    // Dar like - MIGRADO A SUPABASE
    async like(postId) {
        const post = VV.data.culturalPosts.find(p => p.id === postId);
        if (!post) return;
        
        try {
            const newLikes = post.likes + 1;
            
            const { error } = await supabase
                .from('cultural_posts')
                .update({ likes: newLikes })
                .eq('id', postId);
            
            if (error) throw error;
            
            post.likes = newLikes;
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
    }
};

console.log('✅ Módulo CULTURAL cargado');
