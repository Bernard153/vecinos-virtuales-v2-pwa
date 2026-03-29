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
        const { data, error } = await supabase
            .from('folleto_imagenes')
            .select('*')
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

// Exportar funciones si usas módulos, o dejarlas globales para llamar desde HTML
window.abrirFolletoVisual = abrirFolletoVisual;
