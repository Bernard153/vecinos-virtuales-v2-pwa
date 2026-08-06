/**
 * INICIALIZACIÓN DE SEGURIDAD (Añadir esto arriba de todo)
 */
window.VV = window.VV || {};
window.VV.utils = window.VV.utils || {
    // Si la función falta, la definimos aquí para que no se rompa la app
    canModerate: function() {
        const user = JSON.parse(localStorage.getItem('vv_user_session'));
        return user && (user.role === 'admin' || user.role === 'moderator');
    }
};

/**
 * MODULO: FOLLETO VISUAL CONTINUO
 * Descripción: Maneja la visualización de imágenes y moderación.
 */

// Referencias al DOM
const folletoEl = document.getElementById('folleto-container');
const gridFolleto = document.getElementById('grid-folleto');
const btnMinimizar = document.getElementById('btn-minimizar');
const seccionForm = document.getElementById('seccion-solicitud');
const formSolicitud = document.getElementById('form-solicitud-vecino');

/**
 * LOGICA DE USUARIO: VISUALIZACIÓN
 */
async function abrirFolletoVisual() {
    if (!folletoEl) return console.error("No se encontró el contenedor del folleto.");
    
    // Crear backdrop si no existe
    let backdrop = document.getElementById('folleto-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'folleto-backdrop';
        backdrop.className = 'folleto-backdrop';
        document.body.appendChild(backdrop);
        backdrop.onclick = minimizarFolleto;
    }
    
    folletoEl.classList.remove('hidden');
    folletoEl.classList.add('active');
    folletoEl.style.display = 'flex';
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    gridFolleto.innerHTML = '<p style="color:#666; padding:20px;">Cargando folleto...</p>';
    await cargarContenidoFolleto();
    
    // Mostrar botones flotantes
    const btnPlus = document.getElementById('btn-mostrar-form');
    if (btnPlus) btnPlus.style.display = 'block';
    const btnClose = document.getElementById('btn-minimizar');
    if (btnClose) btnClose.style.display = 'flex';
}

function minimizarFolleto() {
    if (folletoEl) {
        folletoEl.classList.remove('active');
        folletoEl.classList.add('hidden');
        folletoEl.style.display = 'none';
    }
    const backdrop = document.getElementById('folleto-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Ocultar botones flotantes
    const btnPlus = document.getElementById('btn-mostrar-form');
    if (btnPlus) btnPlus.style.display = 'none';
    const btnClose = document.getElementById('btn-minimizar');
    if (btnClose) btnClose.style.display = 'none';
}

async function cargarContenidoFolleto() {
    try {
        const { data, error } = await supabase
            .from('folleto_imagenes')
            .select('*')
            .eq('aprobado', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        gridFolleto.innerHTML = '';

        if (data.length === 0) {
            gridFolleto.innerHTML = '<p style="padding:20px;">No hay anuncios disponibles por ahora.</p>';
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'folleto-item';
            // Corrección en el enlace de WhatsApp:
            const mensajeWS = encodeURIComponent(`¡Hola! Vi tu anuncio en Vecinos Virtuales: *${item.titulo}*`);
            
            card.innerHTML = `
                <img src="${item.url_imagen}" alt="${item.titulo}" loading="lazy">
                <div class="folleto-text" style="padding:10px;">
                    <strong style="display:block; margin-bottom:5px;">${item.titulo}</strong>
                    <p style="font-size:0.85em; color:#444;">${item.descripcion}</p>
                    <a href="https://wa.me{mensajeWS}" target="_blank" class="btn-share-ws" style="display:block; margin-top:10px; color:#25d366; text-decoration:none; font-weight:bold; font-size:0.8rem;">
                        <i class="fab fa-whatsapp"></i> Consultar
                    </a>
                </div>
            `;
            gridFolleto.appendChild(card);
        });
    } catch (err) {
        console.error("Error al cargar el folleto:", err.message);
    }
}
// Comprimir imagen antes de subir
function compressImageFolleto(file, maxWidth, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(function(blob) {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * LOGICA DE USUARIO: ENVÍO DE SOLICITUD
 */
// Reforzado para PC y Móvil
document.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'btn-mostrar-form' || e.target.closest('#btn-mostrar-form'))) {
        if (seccionForm) {
            seccionForm.classList.toggle('active');
            if (seccionForm.classList.contains('active')) {
                seccionForm.style.display = 'block';
            } else {
                seccionForm.style.display = 'none';
            }
        }
    }
    if (e.target && (e.target.id === 'btn-cancelar-sol' || e.target.closest('#btn-cancelar-sol'))) {
        if (seccionForm) {
            seccionForm.classList.remove('active');
            seccionForm.style.display = 'none';
        }
    }
});

if (formSolicitud) {
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
                        // Comprimir imagen automáticamente
            const compressedBlob = await compressImageFolleto(file, 1080, 0.7);
            const compressedFile = new File([compressedBlob], 'solicitud.jpg', { type: 'image/jpeg' });
            const fileName = `${Math.random()}.jpg`;
            const filePath = `solicitudes/${fileName}`;

            let { error: uploadError } = await supabase.storage.from('folleto').upload(filePath, compressedFile);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('folleto').getPublicUrl(filePath);


            const { error: insertError } = await supabase.from('folleto_imagenes').insert([{
                titulo: titulo,
                descripcion: desc,
                nombre_vecino: nombre,
                url_imagen: urlData.publicUrl,
                aprobado: false
            }]);

            if (insertError) throw insertError;

            alert("¡Solicitud enviada con éxito!");
            formSolicitud.reset();
            if (seccionForm) seccionForm.classList.remove('active');
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Enviar al Administrador";
        }
    });
}

/**
 * LOGICA DE ADMINISTRADOR: MODERACIÓN
 */
async function cargarSolicitudesPendientes() {
    const contenedor = document.getElementById('lista-solicitudes-pendientes');
    if (!contenedor) return;

    contenedor.innerHTML = '<p style="text-align: center; color: #64748b; grid-column: 1/-1;">Cargando...</p>';

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
            <div class="admin-card-solicitud" style="background: white; border: 1px solid #e2e8f0; padding: 12px; border-radius: 12px;">
                <img src="${img.url_imagen}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
                <h4 style="margin: 10px 0 5px 0;">${img.titulo}</h4>
                <p style="font-size:0.8rem; color:#666;">Por: ${img.nombre_vecino}</p>
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button onclick="gestionarSolicitud('${img.id}', true)" style="flex: 1; background: #10b981; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">Aprobar</button>
                    <button onclick="gestionarSolicitud('${img.id}', false)" style="flex: 1; background: #ef4444; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">Rechazar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
    }
}

async function gestionarSolicitud(id, aprobar) {
    try {
        if (aprobar) {
            await supabase.from('folleto_imagenes').update({ aprobado: true }).eq('id', id);
            alert("Imagen aprobada.");
        } else {
            await supabase.from('folleto_imagenes').delete().eq('id', id);
            alert("Imagen rechazada.");
        }
        cargarSolicitudesPendientes();
    } catch (error) {
        alert(error.message);
    }
}

// Exportación global
window.abrirFolletoVisual = abrirFolletoVisual;
window.minimizarFolleto = minimizarFolleto;
window.cargarSolicitudesPendientes = cargarSolicitudesPendientes;
window.gestionarSolicitud = gestionarSolicitud;

const btnMinimizarNew = document.getElementById('btn-minimizar');
const btnMinimizarFlotante = document.getElementById('btn-minimizar');
if (btnMinimizarFlotante) btnMinimizarFlotante.addEventListener('click', minimizarFolleto);


