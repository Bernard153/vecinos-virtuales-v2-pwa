// ========================================
// MÓDULO: AVISOS (Anuncios del Barrio)
// ========================================

const VV = window.VV || {};
VV.avisos = {
    
    // Mostrar formulario de aviso
    showForm: function() {
        document.getElementById('aviso-form-container').style.display = 'block';
        document.getElementById('avisoForm').reset();
        this.clearMessage();
    },

    // Cerrar formulario
    hideForm: function() {
        document.getElementById('aviso-form-container').style.display = 'none';
        document.getElementById('avisoForm').reset();
        this.clearMessage();
    },

    // Mostrar mensaje
    showMessage: function(mensaje, tipo = 'success') {
        const msgDiv = document.getElementById('aviso-mensaje');
        msgDiv.textContent = mensaje;
        msgDiv.style.display = 'block';
        
        if (tipo === 'success') {
            msgDiv.style.background = '#d1fae5';
            msgDiv.style.color = '#065f46';
            msgDiv.style.border = '1px solid #6ee7b7';
        } else {
            msgDiv.style.background = '#fee2e2';
            msgDiv.style.color = '#991b1b';
            msgDiv.style.border = '1px solid #fca5a5';
        }
    },

    // Limpiar mensaje
    clearMessage: function() {
        const msgDiv = document.getElementById('aviso-mensaje');
        msgDiv.style.display = 'none';
        msgDiv.textContent = '';
    },

    // Subir aviso completo
    uploadAviso: async function(event) {
        event.preventDefault();
        this.clearMessage();
        this.showMessage('Procesando...', 'info');

        try {
            // 1. Validar que el usuario esté autenticado
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                throw new Error('Debes iniciar sesión para publicar avisos');
            }

            // 2. Obtener datos del formulario
            const titulo = document.getElementById('aviso-titulo').value.trim();
            const categoria = document.getElementById('aviso-categoria').value;
            const descripcion = document.getElementById('aviso-descripcion').value.trim();
            const imagenInput = document.getElementById('aviso-imagen');
            const archivo = imagenInput.files[0];

            // 3. Validaciones
            if (!titulo || !categoria || !descripcion || !archivo) {
                throw new Error('Por favor completa todos los campos');
            }

            if (archivo.size > 5 * 1024 * 1024) {
                throw new Error('La imagen no puede pesar más de 5MB');
            }

            if (!archivo.type.startsWith('image/')) {
                throw new Error('El archivo debe ser una imagen');
            }

            // 4. Obtener datos del usuario
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('name, unique_number, neighborhood')
                .eq('id', user.id)
                .single();

            if (userError || !userData) {
                throw new Error('No se pudo obtener los datos del usuario');
            }

            // 5. Generar nombre único para la imagen
            const nombreArchivo = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${archivo.name.split('.').pop()}`;

            // 6. Subir imagen a Storage
            this.showMessage('Subiendo imagen...', 'info');
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avisos')
                .upload(nombreArchivo, archivo);

            if (uploadError) {
                throw new Error(`Error al subir imagen: ${uploadError.message}`);
            }

            // 7. Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('avisos')
                .getPublicUrl(nombreArchivo);

            // 8. Guardar en tabla avisos
            this.showMessage('Guardando aviso...', 'info');
            const { data: avisoData, error: insertError } = await supabase
                .from('avisos')
                .insert([
                    {
                        author_id: user.id,
                        author_name: userData.name,
                        author_number: userData.unique_number,
                        neighborhood: userData.neighborhood,
                        titulo: titulo,
                        categoria: categoria,
                        descripcion: descripcion,
                        imagen_url: publicUrl,
                        estado: 'activo'
                    }
                ])
                .select();

            if (insertError) {
                throw new Error(`Error al guardar aviso: ${insertError.message}`);
            }

            // 9. Éxito
            this.showMessage('✓ ¡Aviso publicado correctamente!', 'success');
            document.getElementById('avisoForm').reset();
            
            // Cerrar formulario después de 2 segundos
            setTimeout(() => {
                this.hideForm();
                // Recargar lista de avisos si existe
                if (this.loadAvisos) this.loadAvisos();
            }, 2000);

        } catch (error) {
            console.error('Error:', error);
            this.showMessage(`✗ ${error.message}`, 'error');
        }
    },

    // Cargar todos los avisos
    loadAvisos: async function(neighborhood = null) {
        try {
            let query = supabase
                .from('avisos')
                .select('*')
                .eq('estado', 'activo')
                .order('created_at', { ascending: false });

            if (neighborhood) {
                query = query.eq('neighborhood', neighborhood);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data || [];

        } catch (error) {
            console.error('Error cargando avisos:', error);
            return [];
        }
    },

    // Cargar avisos del usuario actual
    loadMisAvisos: async function() {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) return [];

            const { data, error } = await supabase
                .from('avisos')
                .select('*')
                .eq('author_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];

        } catch (error) {
            console.error('Error cargando mis avisos:', error);
            return [];
        }
    },

    // Eliminar aviso
    deleteAviso: async function(avisoId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este aviso?')) return false;

        try {
            const { error } = await supabase
                .from('avisos')
                .delete()
                .eq('id', avisoId);

            if (error) throw error;

            alert('Aviso eliminado correctamente');
            if (this.loadAvisos) this.loadAvisos();
            return true;

        } catch (error) {
            console.error('Error eliminando aviso:', error);
            alert(`Error: ${error.message}`);
            return false;
        }
    },

    // Actualizar estado de aviso
    updateEstado: async function(avisoId, nuevoEstado) {
        try {
            const { error } = await supabase
                .from('avisos')
                .update({ estado: nuevoEstado })
                .eq('id', avisoId);

            if (error) throw error;

            return true;

        } catch (error) {
            console.error('Error actualizando aviso:', error);
            return false;
        }
    }
};

// Función global para cerrar formulario
function cerrarFormAviso() {
    VV.avisos.hideForm();
}

// Asignar evento al formulario cuando carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('avisoForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            VV.avisos.uploadAviso(e);
        });
    }
// ========================================
// MÓDULO: DESTACADOS (Ofertas con Imagen)
// ========================================
VV.featured = {
    // 1. Configuración de URLs
    getPublicUrl: function(fileName) {
        const supabaseUrl = 'https://<TU-PROJECT-ID>.supabase.co'; // SUSTITUYE POR TU ID
        return `${supabaseUrl}/storage/v1/object/public/product-images/${encodeURIComponent(fileName)}`;
    },

    // 2. Cargar y Renderizar en el Carrusel
    loadFeatured: async function() {
        const contenedor = document.getElementById('featured-cards-wrapper');
        if (!contenedor) return;

        try {
            // Consulta a la tabla 'destacados'
            const { data, error } = await supabase
                .from('destacados')
                .select('id, titulo, filename, descripcion')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                contenedor.innerHTML = '<p style="padding:20px; color:#666;">No hay ofertas destacadas aún.</p>';
                return;
            }

            contenedor.innerHTML = ''; // Limpiar cargando

            data.forEach(item => {
                const imgUrl = this.getPublicUrl(item.filename);
                
                contenedor.innerHTML += `
                    <div class="vv-card-destacada">
                        <div class="vv-card-image">
                            <img src="${imgUrl}" alt="${item.titulo}" 
                                 onerror="this.src='https://via.placeholder.com'">
                            <div class="vv-badge-destacado"><i class="fas fa-star"></i></div>
                        </div>
                        <div class="vv-card-body">
                            <h4 class="vv-card-title">${item.titulo}</h4>
                            <p style="font-size:0.85rem; color:#666; margin-bottom:1rem;">${item.descripcion || ''}</p>
                            <button class="vv-btn-action" onclick="VV.featured.viewDetail('${item.id}')">
                                Ver Oferta
                            </button>
                        </div>
                    </div>
                `;
            });
        } catch (err) {
            console.error('Error en destacados:', err);
            contenedor.innerHTML = '<p>Error al conectar con Supabase.</p>';
        }
    },

    // 3. Funciones de botones (Placeholder para que no den error)
    createAnnouncement: function() {
        alert("Función para administradores: Crear Anuncio");
    },

    requestFeatured: function() {
        alert("Aquí abriríamos el formulario para que el vecino envíe su oferta a revisión.");
    },

    viewDetail: function(id) {
        alert("Abriendo detalles de la oferta ID: " + id);
        // Aquí podrías disparar un Modal con más info
    }
};

// ========================================
// INICIALIZACIÓN GLOBAL
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Avisos (tu código anterior)
    const form = document.getElementById('avisoForm');
    if (form) {
        form.addEventListener('submit', (e) => VV.avisos.uploadAviso(e));
    }

    // Inicializar Destacados (el nuevo módulo)
    if (VV.featured && VV.featured.loadFeatured) {
        VV.featured.loadFeatured();
    }
});
