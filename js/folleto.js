/**
 * MODULO: FOLLETO VISUAL CONTINUO (MAMP)
 * Descripción: Maneja la visualización de imágenes tipo Masonry y la conexión con Supabase.
 */

// Referencias al DOM (Asegúrate de que estos IDs existan en tu index.html)
const folletoEl = document.getElementById('folleto-container');
const gridFolleto = document.getElementById('grid-folleto');
const btnMinimizar = document.getElementById('btn-minimizar');

/**
 * Abre el folleto y activa la carga de datos
 */
async function abrirFolletoVisual() {
    if (!folletoEl) return console.error("No se encontró el contenedor del folleto.");
    
    folletoEl.classList.add('active');
    document.body.style.overflow = 'hidden'; // Bloquea scroll de fondo
    
    // Mostramos un indicador de carga simple
    gridFolleto.innerHTML = '<p style="color:#666; padding:20px;">Cargando folleto...</p>';
    
    await cargarContenidoFolleto();
}

/**
 * Cierra el folleto y restaura el scroll
 */
function minimizarFolleto() {
    folletoEl.classList.remove('active');
    document.body.style.overflow = 'auto';
}

/**
 * Obtiene los datos de Supabase y los dibuja en el Masonry Grid
 */
async function cargarContenidoFolleto() {
    try {
        // Consultamos la tabla 'folleto_imagenes' (ajusta el nombre si es distinto)
        // Nota: Asumo que usas el cliente global 'supabase' definido en auth-supabase.js
        // UBICACIÓN: Dentro de cargarContenidoFolleto() en folleto.js
    const { data, error } = await supabase
        .from('folleto_imagenes')
        .select('*')
        .eq('aprobado', true) // <--- ESTO ASEGURA QUE SOLO SE VEA LO PUBLICADO
        .order('created_at', { ascending: false });

        if (error) throw error;

        // Limpiamos el grid
        gridFolleto.innerHTML = '';

        if (data.length === 0) {
            gridFolleto.innerHTML = '<p style="padding:20px;">No hay anuncios disponibles por ahora.</p>';
            return;
        }

        // Renderizamos cada ítem
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'folleto-item';
            card.innerHTML = `
                <img src="${item.url_imagen}" alt="Imagen de ${item.nombre_vecino || 'Vecino'}" loading="lazy">
                <div class="folleto-text">
                    <strong style="display:block; margin-bottom:5px; font-size: 1.1em;">${item.titulo || ''}</strong>
                    <span style="color: #555; font-size: 0.9em;">${item.descripcion || ''}</span>
                </div>
            `;
            gridFolleto.appendChild(card);
        });

    } catch (err) {
        console.error("Error al cargar el folleto:", err.message);
        gridFolleto.innerHTML = '<p style="color:red; padding:20px;">Error al cargar las imágenes. Reintenta más tarde.</p>';
    }
}

// Escuchador para el botón cerrar si existe
if (btnMinimizar) {
    btnMinimizar.addEventListener('click', minimizarFolleto);
}
// UBICACIÓN: Final de js/folleto.js

const seccionForm = document.getElementById('seccion-solicitud');
const formSolicitud = document.getElementById('form-solicitud-vecino');

// Mostrar/Ocultar Formulario
document.getElementById('btn-mostrar-form').addEventListener('click', () => seccionForm.classList.toggle('active'));
document.getElementById('btn-cancelar-sol').addEventListener('click', () => seccionForm.classList.remove('active'));

formSolicitud.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-enviar-solicitud');
    btn.disabled = true;
    btn.innerText = "Enviando...";

    const file = document.getElementById('sol-imagen').files[0];
    const titulo = document.getElementById('sol-titulo').value;
    const desc = document.getElementById('sol-desc').value;
    const nombre = document.getElementById('sol-nombre').value;

    try {
        // 1. Subir imagen a Supabase Storage (Bucket llamado 'folleto')
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `solicitudes/${fileName}`;

        let { error: uploadError } = await supabase.storage
            .from('folleto')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Obtener URL pública
        const { data: urlData } = supabase.storage.from('folleto').getPublicUrl(filePath);

        // 3. Guardar en la tabla 'folleto_imagenes' con aprobado = false
        const { error: insertError } = await supabase
            .from('folleto_imagenes')
            .insert([{
                titulo: titulo,
                descripcion: desc,
                nombre_vecino: nombre,
                url_imagen: urlData.publicUrl,
                aprobado: false // Espera revisión del admin
            }]);

        if (insertError) throw insertError;

        alert("¡Solicitud enviada! El administrador la revisará pronto.");
        formSolicitud.reset();
        seccionForm.classList.remove('active');

    } catch (error) {
        console.error("Error:", error);
        alert("Hubo un error al enviar: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Enviar al Administrador";
    }
});

// Exportar funciones si usas módulos, o dejarlas globales para llamar desde HTML
window.abrirFolletoVisual = abrirFolletoVisual;
