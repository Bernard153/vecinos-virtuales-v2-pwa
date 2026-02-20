// ========================================
// MÓDULO: AVISOS (Anuncios del Barrio)
// ========================================

const VV = window.VV || {};
VV.avisos = {
    
    // Mostrar formulario de aviso
    showForm: function() {
        document.getElementById('aviso-form-container').style.display = 'block';
        if(document.getElementById('avisoForm')) document.getElementById('avisoForm').reset();
        this.clearMessage();
    },

    // Cerrar formulario
    hideForm: function() {
        document.getElementById('aviso-form-container').style.display = 'none';
        this.clearMessage();
    },

    // Mostrar mensaje
    showMessage: function(mensaje, tipo = 'success') {
        const msgDiv = document.getElementById('aviso-mensaje');
        if (!msgDiv) return;
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
        if (msgDiv) {
            msgDiv.style.display = 'none';
            msgDiv.textContent = '';
        }
    },

    // Subir aviso completo
    uploadAviso: async function(event) {
        event.preventDefault();
        this.clearMessage();
        this.showMessage('Procesando...', 'info');

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error('Debes iniciar sesión para publicar avisos');

            const titulo = document.getElementById('aviso-titulo').value.trim();
            const categoria = document.getElementById('aviso-categoria').value;
            const descripcion = document.getElementById('aviso-descripcion').value.trim();
            const imagenInput = document.getElementById('aviso-imagen');
            const archivo = imagenInput.files[0];

            if (!titulo || !categoria || !descripcion || !archivo) throw new Error('Por favor completa todos los campos');
            if (archivo.size > 5 * 1024 * 1024) throw new Error('La imagen no puede pesar más de 5MB');

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('name, unique_number, neighborhood')
                .eq('id', user.id)
                .single();

            if (userError || !userData) throw new Error('No se pudo obtener los datos del usuario');

            const nombreArchivo = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${archivo.name.split('.').pop()}`;

            this.showMessage('Subiendo imagen...', 'info');
            const { error: uploadError } = await supabase.storage
                .from('avisos')
                .upload(nombreArchivo, archivo);

            if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage.from('avisos').getPublicUrl(nombreArchivo);

            this.showMessage('Guardando aviso...', 'info');
            const { error: insertError } = await supabase
                .from('avisos')
                .insert([{
                    author_id: user.id,
                    author_name: userData.name,
                    author_number: userData.unique_number,
                    neighborhood: userData.neighborhood,
                    titulo: titulo,
                    categoria: categoria,
                    descripcion: descripcion,
                    imagen_url: publicUrl,
                    estado: 'activo'
                }]);

            if (insertError) throw insertError;

            this.showMessage('✓ ¡Aviso publicado correctamente!', 'success');
            document.getElementById('avisoForm').reset();
            
            setTimeout(() => {
                this.hideForm();
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
            let query = supabase.from('avisos').select('*').eq('estado', 'activo');
            if (neighborhood) query = query.eq('neighborhood', neighborhood);
            const { data, error } = await query.order('created_at', { ascending: false });
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data, error } = await supabase.from('avisos').select('*').eq('author_id', user.id);
            if (error) throw error;
            return data || [];
        } catch (error) {
            return [];
        }
    },

    // Eliminar aviso
    deleteAviso: async function(avisoId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este aviso?')) return false;
        try {
            const { error } = await supabase.from('avisos').delete().eq('id', avisoId);
            if (error) throw error;
            alert('Aviso eliminado correctamente');
            this.loadAvisos();
            return true;
        } catch (error) {
            alert(`Error: ${error.message}`);
            return false;
        }
    },

    // Actualizar estado
    updateEstado: async function(avisoId, nuevoEstado) {
        try {
            const { error } = await supabase.from('avisos').update({ estado: nuevoEstado }).eq('id', avisoId);
            return !error;
        } catch (error) {
            return false;
        }
    }
};

// Función global para cerrar formulario
function cerrarFormAviso() {
    VV.avisos.hideForm();
}

// === CORRECCIÓN FINAL: CIERRE DE EVENT LISTENER ===
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('avisoForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            VV.avisos.uploadAviso(e);
        });
    }
}); // Cierre correcto del DOMContentLoaded
