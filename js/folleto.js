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
        // UBICACIÓN: Dentro de data.forEach en cargarContenidoFolleto()
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'folleto-item';
    
            // Preparamos el texto para WhatsApp
            const mensajeWS = encodeURIComponent(`¡Mira este anuncio en nuestra App Vecinal!\n*${item.titulo}*\n${item.descripcion}`);
            const linkWS = `https://wa.me{mensajeWS}`;

            card.innerHTML = `
                <img src="${item.url_imagen}" alt="${item.titulo}" loading="lazy">
                <div class="folleto-text">
                    <strong style="display:block; margin-bottom:5px;">${item.titulo}</strong>
                    <p style="font-size:0.85em; color:#444;">${item.descripcion}</p>
            
                    <!-- Botón de compartir -->
                    <a href="${linkWS}" target="_blank" class="btn-share-ws">
                        <span>Compartir en WhatsApp</span>
                        <img src="https://upload.wikimedia.org" style="width:16px; display:inline; margin:0;">
                    </a>
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
    /**
 * MODULO: ADMINISTRACIÓN (MODERACIÓN)
 * Carga las fotos con aprobado = false en el panel de admin
 */
async function cargarSolicitudesPendientes() {
    const contenedor = document.getElementById('lista-solicitudes-pendientes');
    if (!contenedor) return;

    contenedor.innerHTML = '<p style="text-align: center; color: #64748b; grid-column: 1/-1; padding: 20px;">Cargando solicitudes...</p>';

    try {
        const { data, error } = await supabase
            .from('folleto_imagenes')
            .select('*')
            .eq('aprobado', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            contenedor.innerHTML = '<p style="text-align: center; color: #94a3b8; grid-column: 1/-1; padding: 20px;">No hay solicitudes pendientes.</p>';
            return;
        }

        contenedor.innerHTML = data.map(img => `
            <div class="admin-card-solicitud" style="background: white; border: 1px solid #e2e8f0; padding: 12px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <img src="${img.url_imagen}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
                <h4 style="margin: 0 0 5px 0; font-size: 0.95rem;">${img.titulo || 'Sin título'}</h4>
                <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 10px;">De: ${img.nombre_vecino || 'Vecino'}</p>
                <div style="display: flex; gap: 8px;">
                    <button onclick="gestionarSolicitud('${img.id}', true)" style="flex: 1; background: #10b981; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600;">Aprobar</button>
                    <button onclick="gestionarSolicitud('${img.id}', false)" style="flex: 1; background: #ef4444; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600;">Rechazar</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error en moderación:", error);
        contenedor.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Error al conectar con Supabase.</p>';
    }
}

/**
 * Aprueba o rechaza una imagen
 */
async function gestionarSolicitud(id, aprobar) {
    try {
        if (aprobar) {
            const { error } = await supabase
                .from('folleto_imagenes')
                .update({ aprobado: true })
                .eq('id', id);
            if (error) throw error;
            alert("Imagen aprobada y publicada en el folleto.");
        } else {
            const { error } = await supabase
                .from('folleto_imagenes')
                .delete()
                .eq('id', id);
            if (error) throw error;
            alert("Solicitud rechazada y eliminada.");
        }
        // Recargar la lista automáticamente
        cargarSolicitudesPendientes();
    } catch (error) {
        alert("Error al procesar: " + error.message);
    }
}

});

// Exportar funciones si usas módulos, o dejarlas globales para llamar desde HTML
window.abrirFolletoVisual = abrirFolletoVisual;
window.cargarSolicitudesPendientes = cargarSolicitudesPendientes;
window.gestionarSolicitud = gestionarSolicitud;

