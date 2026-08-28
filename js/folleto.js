/**
 * MODULO: FOLLETO VISUAL CONTINUO
 * Con caducidad, restricciones, comentarios, regalos y admin VIP
 */

window.VV = window.VV || {};

// Comentarios prediseñados para folleto
const FOLLETO_COMENTARIOS = {
    interes: ['¡Me interesa!', '¿Tenés stock?', '¿Cómo coordinamos?', '¿Hacés envíos?'],
    calidad: ['¡Se ve bien!', '¡Buena oferta!', '¡Precio justo!', '¡Lo recomiendo!'],
    consulta: ['¿Precio actualizado?', '¿Disponible aún?', '¿Aceptás tarjeta?', '¿Dónde retirar?'],
    apoyo: ['¡Suerte con la venta!', '¡Buen emprendimiento!', '¡Aguante el barrio!', '¡Éxitos!']
};

function folletoCategoryEmoji(category) {
    const emojis = { interes: '🛒', calidad: '👍', consulta: '❓', apoyo: '💪' };
    return emojis[category] || '💬';
}

// Referencias al DOM
const folletoEl = document.getElementById('folleto-container');
const gridFolleto = document.getElementById('grid-folleto');
const seccionForm = document.getElementById('seccion-solicitud');
const formSolicitud = document.getElementById('form-solicitud-vecino');

// ========== VISUALIZACIÓN ==========

async function abrirFolletoVisual() {
    if (!folletoEl) return console.error("No se encontró el contenedor del folleto.");
    
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
    
    const btnPlus = document.getElementById('btn-mostrar-form');
    if (btnPlus) btnPlus.style.display = 'block';
    const btnClose = document.getElementById('btn-minimizar');
    if (btnClose) btnClose.style.display = 'flex';
}

function minimizarFolleto() {
    const folleto = document.getElementById('folleto-container');
    if (folleto) {
        folleto.classList.remove('active');
        folleto.classList.add('hidden');
        folleto.style.display = 'none';
    }
    const backdrop = document.getElementById('folleto-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    const btnPlus = document.getElementById('btn-mostrar-form');
    if (btnPlus) btnPlus.style.display = 'none';
    const btnClose = document.getElementById('btn-minimizar');
    if (btnClose) btnClose.style.display = 'none';
}

async function cargarContenidoFolleto() {
    try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('folleto_imagenes')
            .select('*')
            .eq('aprobado', true)
            .gt('expires_at', now)
            .order('highlighted', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        gridFolleto.innerHTML = '';

        if (!data || data.length === 0) {
            gridFolleto.innerHTML = '<p style="padding:20px;">No hay anuncios disponibles por ahora.</p>';
            return;
        }

        const user = VV_ROLES ? VV_ROLES.getCurrentUser() : (VV.data && VV.data.user ? VV.data.user : null);
        const isAdmin = user && (user.role === 'admin' || user.role === 'ADMIN');


        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'folleto-item';
            
            // Estilo VIP/destacado
            const vipStyle = item.highlighted ? 'border: 3px solid #f59e0b; box-shadow: 0 4px 12px rgba(251,191,36,0.3);' : '';
            const vipBadge = item.vip_icon ? `<span style="position:absolute;top:5px;left:5px;background:rgba(0,0,0,0.7);color:gold;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:0.9rem;">${item.vip_icon}</span>` : '';
            const vipLabel = item.vip_label ? `<span style="position:absolute;top:5px;right:5px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:0.2rem 0.5rem;border-radius:12px;font-size:0.7rem;font-weight:600;">${item.vip_label}</span>` : '';
            
            // Días restantes
            const daysLeft = Math.ceil((new Date(item.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
            const expiryBadge = `<span style="font-size:0.7rem;color:${daysLeft <= 2 ? '#ef4444' : '#94a3b8'};">⏰ ${daysLeft}d restantes</span>`;
            
            const mensajeWS = encodeURIComponent(`¡Hola! Vi tu anuncio en Vecinos Virtuales: *${item.titulo}*`);
            
            card.innerHTML = `
                <div style="position:relative;${vipStyle}">
                    ${vipBadge}
                    ${vipLabel}
                    <img src="${item.url_imagen}" alt="${item.titulo}" loading="lazy" style="width:100%;border-radius:8px;">
                </div>
                <div class="folleto-text" style="padding:10px;">
                    <strong style="display:block; margin-bottom:5px;">${sanitizeText(item.titulo)}</strong>
                    <p style="font-size:0.85em; color:#444;">${sanitizeText(item.descripcion)}</p>

                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:5px;">
                        ${expiryBadge}
                        <span style="font-size:0.7rem;color:#94a3b8;">${item.nombre_vecino || ''}</span>
                    </div>
                    <a href="https://wa.me/?text=${mensajeWS}" target="_blank" class="btn-share-ws" style="display:block; margin-top:10px; color:#25d366; text-decoration:none; font-weight:bold; font-size:0.8rem;">
                        <i class="fab fa-whatsapp"></i> Consultar
                    </a>
                    <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
                        <button onclick="folletoShowComments('${item.id}')" style="flex:1;background:#f1f5f9;border:none;border-radius:6px;padding:0.4rem;cursor:pointer;font-size:0.75rem;">
                            💬 Comentar
                        </button>
                        ${user && item.user_id && user.id !== item.user_id ? `
                            <button onclick="folletoShowGiftPicker('${item.id}', '${item.user_id}')" style="flex:1;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:6px;padding:0.4rem;cursor:pointer;font-size:0.75rem;">
                            🎁 Regalar
                        </button>` : ''}


                    </div>
                    <div id="folleto-comments-${item.id}" style="display:none;margin-top:0.5rem;"></div>
                    <div id="folleto-gifts-${item.id}" style="margin-top:0.3rem;"></div>
                    ${isAdmin ? `
                    <div style="display:flex;gap:0.3rem;margin-top:0.5rem;flex-wrap:wrap;">
                        <button onclick="folletoToggleHighlight('${item.id}', ${!item.highlighted})" style="background:${item.highlighted ? '#f59e0b' : '#e2e8f0'};color:${item.highlighted ? 'white' : '#475569'};border:none;border-radius:4px;padding:0.3rem 0.5rem;cursor:pointer;font-size:0.7rem;">⭐ ${item.highlighted ? 'Quitar destaque' : 'Destacar'}</button>
                        <button onclick="folletoEditTitle('${item.id}', '${item.titulo.replace(/'/g, "\\'")}')" style="background:#e2e8f0;color:#475569;border:none;border-radius:4px;padding:0.3rem 0.5rem;cursor:pointer;font-size:0.7rem;">✏️ Título</button>
                        <button onclick="folletoEditDescription('${item.id}', '${(item.descripcion || '').replace(/'/g, "\\'")}')" style="background:#e2e8f0;color:#475569;border:none;border-radius:4px;padding:0.3rem 0.5rem;cursor:pointer;font-size:0.7rem;">📝 Descripción</button>
                        <button onclick="folletoSetVip('${item.id}')" style="background:#e2e8f0;color:#475569;border:none;border-radius:4px;padding:0.3rem 0.5rem;cursor:pointer;font-size:0.7rem;">👑 VIP</button>
                        <button onclick="folletoSetDays('${item.id}')" style="background:#e2e8f0;color:#475569;border:none;border-radius:4px;padding:0.3rem 0.5rem;cursor:pointer;font-size:0.7rem;">📅 Días</button>
                        <button onclick="folletoDeleteItem('${item.id}')" style="background:#ef4444;color:white;border:none;border-radius:4px;padding:0.3rem 0.5rem;cursor:pointer;font-size:0.7rem;">🗑️ Eliminar</button>
                    </div>
                    ` : ''}

                </div>
            `;
            gridFolleto.appendChild(card);
            
            // Cargar regalos existentes
            if (item.user_id) folletoLoadGifts(item.id);
        });
    } catch (err) {
        console.error("Error al cargar el folleto:", err.message);
        gridFolleto.innerHTML = '<p style="padding:20px;color:#ef4444;">Error al cargar el folleto.</p>';
    }
}

// ========== COMENTARIOS ==========

async function folletoShowComments(postId) {
    const section = document.getElementById('folleto-comments-' + postId);
    if (!section) return;
    
    if (section.style.display === 'block') {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    await folletoReloadComments(postId);
}


async function folletoPostComment(postId, category, text) {
    const user = VV_ROLES ? VV_ROLES.getCurrentUser() : null;
    if (!user) { alert('Iniciá sesión para comentar'); return; }
    
    try {
        const { data: existing } = await supabase
            .from('folleto_comments')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle();
        
        if (existing) {
            await supabase.from('folleto_comments')
                .update({ comment_text: text, category: category })
                .eq('id', existing.id);
        } else {
            await supabase.from('folleto_comments').insert([{
                post_id: postId,
                user_id: user.id,
                user_name: user.name || 'Anónimo',
                comment_text: text,
                category: category
            }]);
        }
        
        await folletoReloadComments(postId);
    } catch (err) {
        console.error('Error posteando comentario:', err);
        alert('No se pudo enviar el comentario');
    }
}

async function folletoReloadComments(postId) {
    const section = document.getElementById('folleto-comments-' + postId);
    if (!section) return;
    
    try {
        const { data: comments, error } = await supabase
            .from('folleto_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const user = VV_ROLES ? VV_ROLES.getCurrentUser() : null;
        let html = '<div style="border-top:1px solid #e2e8f0;padding-top:0.5rem;">';
        
        if (comments && comments.length > 0) {
            html += comments.map(c => `
                <div style="display:flex;align-items:center;gap:0.4rem;padding:0.3rem 0;border-bottom:1px solid #f1f5f9;">
                    <span style="font-size:1rem;">${folletoCategoryEmoji(c.category)}</span>
                    <span style="font-size:0.8rem;color:#475569;">${c.comment_text}</span>
                    <span style="font-size:0.7rem;color:#94a3b8;margin-left:auto;">${c.user_name || ''}</span>
                </div>
            `).join('');
        } else {
            html += '<p style="color:#94a3b8;font-size:0.8rem;">Sin comentarios aún</p>';
        }
        
        // Solo mostrar un botón para agregar otro comentario
        if (user) {
            html += `<button onclick="folletoShowCommentPicker('${postId}')" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:0.4rem 0.8rem;font-size:0.75rem;cursor:pointer;color:#475569;margin-top:0.5rem;">➕ Agregar comentario</button>`;
        }
        
        html += '</div>';
        section.innerHTML = html;
    } catch (err) {
        console.error('Error recargando comentarios:', err);
    }
}

async function folletoShowCommentPicker(postId) {
    const section = document.getElementById('folleto-comments-' + postId);
    if (!section) return;
    
    let html = '<div style="border-top:1px solid #e2e8f0;padding-top:0.5rem;">';
    
    for (const [cat, textos] of Object.entries(FOLLETO_COMENTARIOS)) {
        html += `<div style="display:flex;flex-wrap:wrap;gap:0.25rem;margin-bottom:0.25rem;">`;
        html += `<span style="font-size:0.7rem;color:#94a3b8;min-width:70px;">${folletoCategoryEmoji(cat)} ${cat}</span>`;
        textos.forEach(texto => {
            html += `<button onclick="folletoPostComment('${postId}', '${cat}', '${texto.replace(/'/g, "\\'")}')" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:16px;padding:0.25rem 0.6rem;font-size:0.7rem;cursor:pointer;color:#475569;">${texto}</button>`;
        });
        html += `</div>`;
    }
    
    html += `<button onclick="folletoReloadComments('${postId}')" style="background:transparent;border:none;color:#94a3b8;font-size:0.75rem;cursor:pointer;margin-top:0.5rem;">✕ Cancelar</button>`;
    html += '</div>';
    section.innerHTML = html;
}

// ========== REGALOS ==========

async function folletoShowGiftPicker(postId, toUserId) {
    const user = VV_ROLES ? VV_ROLES.getCurrentUser() : null;
    if (!user) { alert('Iniciá sesión para regalar'); return; }
    if (user.id === toUserId) { alert('No podés regalarte a vos mismo 😄'); return; }
    if (!window.VV_WALLET) { alert('Sistema de billetera no disponible'); return; }
    
    document.querySelectorAll('[id^="folleto-comments-"]').forEach(el => el.style.display = 'none');
    
    const { balance } = await VV_WALLET.getBalance(user.id);
    const items = await VV_WALLET.getShopItems('regalo');
    
    const modal = document.createElement('div');
    modal.id = 'folleto-gift-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';
    
    modal.innerHTML = `
        <div style="background:white;border-radius:16px;max-width:400px;width:90%;padding:1.25rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                <h3 style="margin:0;color:#1e293b;">🎁 Enviar Regalo</h3>
                <div style="display:flex;align-items:center;gap:0.4rem;background:rgba(251,191,36,0.15);padding:0.4rem 0.8rem;border-radius:20px;">
                    <span>🪙</span>
                    <span style="font-weight:700;color:#f59e0b;">${balance}</span>
                </div>
            </div>
            <p style="color:#64748b;font-size:0.8rem;margin-bottom:0.75rem;">Elegí un regalo:</p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;">
                ${items.map(item => `
                    <div onclick="folletoSendGift('${postId}', '${toUserId}', '${item.code}', '${item.nombre}', ${item.precio_monedas})"
                         style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:0.75rem;text-align:center;cursor:pointer;transition:all 0.2s;"
                         onmouseover="this.style.background='rgba(251,191,36,0.1)';this.style.borderColor='rgba(251,191,36,0.3)'"
                         onmouseout="this.style.background='#f8fafc';this.style.borderColor='#e2e8f0'">
                        <div style="font-size:2rem;margin-bottom:0.25rem;">${item.icono}</div>
                        <p style="margin:0;font-size:0.7rem;color:#475569;">${item.nombre}</p>
                        <p style="margin:0.2rem 0 0;font-size:0.8rem;color:#f59e0b;font-weight:700;">🪙 ${item.precio_monedas}</p>
                    </div>
                `).join('')}
            </div>
            <button onclick="document.getElementById('folleto-gift-modal').remove()" style="margin-top:1rem;width:100%;padding:0.6rem;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;color:#64748b;">Cerrar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
}

async function folletoSendGift(postId, toUserId, itemCode, itemName, price) {
    const result = await VV_WALLET.sendGift(toUserId, itemCode, postId, 'folleto');
    
    if (result.success) {
        document.getElementById('folleto-gift-modal').remove();
        alert('🎉 ¡' + itemName + ' enviado!');
        folletoLoadGifts(postId);
    } else {
        alert('❌ ' + result.error);
    }
}

async function folletoLoadGifts(postId) {
    const section = document.getElementById('folleto-gifts-' + postId);
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
        
        section.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:0.3rem;padding-top:0.3rem;">' +
            gifts.map(g => {
                const item = itemMap[g.tipo_regalo] || {};
                return '<span style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:20px;padding:0.2rem 0.5rem;font-size:0.7rem;display:flex;align-items:center;gap:0.2rem;">' +
                    '<span style="font-size:0.9rem;">' + (item.icono || '🎁') + '</span>' +
                    '<span style="color:#f59e0b;font-weight:600;">' + (item.nombre || g.tipo_regalo) + '</span>' +
                    '</span>';
            }).join('') +
            '</div>';
    } catch (err) {
        console.error('Error cargando regalos:', err);
    }
}

// ========== ADMIN ==========

async function folletoToggleHighlight(id, highlight) {
    try {
        await supabase.from('folleto_imagenes').update({ highlighted: highlight }).eq('id', id);
        cargarContenidoFolleto();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function folletoEditTitle(id, currentTitle) {
    const newTitle = prompt('Nuevo título:', currentTitle);
    if (newTitle && newTitle.trim()) {
        try {
            await supabase.from('folleto_imagenes').update({ titulo: newTitle.trim() }).eq('id', id);
            cargarContenidoFolleto();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }
}

async function folletoSetVip(id) {
    const icon = prompt('Icono VIP (emoji, ej: 👑 ⭐ 🏆):', '👑');
    if (icon === null) return;
    const label = prompt('Etiqueta VIP (ej: PREMIUM, DESTACADO):', 'VIP');
    if (label === null) return;
    
    try {
        const updateData = {};
        if (icon) updateData.vip_icon = icon;
        if (label) updateData.vip_label = label;
        if (!icon && !label) {
            updateData.vip_icon = null;
            updateData.vip_label = null;
        }
        await supabase.from('folleto_imagenes').update(updateData).eq('id', id);
        cargarContenidoFolleto();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function folletoSetDays(id) {
    const days = prompt('¿Cuántos días liberar? (1-90):', '7');
    if (!days || isNaN(days) || days < 1 || days > 90) {
        if (days !== null) alert('Ingresa un número válido (1-90)');
        return;
    }
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(days));
    
    try {
        await supabase.from('folleto_imagenes').update({ 
            expires_at: expiresAt.toISOString(),
            last_renewed: new Date().toISOString()
        }).eq('id', id);
        cargarContenidoFolleto();
        alert(`Anuncio liberado por ${days} días.`);
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ========== COMPRESIÓN DE IMAGEN ==========

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

// ========== ENVÍO DE SOLICITUD ==========

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
            const user = VV_ROLES ? VV_ROLES.getCurrentUser() : null;
            
            // === RESTRICCIÓN: Máximo 3 fotos por día por usuario ===
            if (user) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const { data: todayPosts, error: countError } = await supabase
                    .from('folleto_imagenes')
                    .select('id')
                    .eq('user_id', user.id)
                    .gte('created_at', today.toISOString());
                
                if (countError) throw countError;
                
                if (todayPosts && todayPosts.length >= 3) {
                    alert('Ya subiste 3 fotos hoy. Volvé mañana para subir más.');
                    return;
                }
            }
            
                       // === RESTRICCIÓN: Máximo 10MB por imagen (se comprime automáticamente) ===
            if (file.size > 10 * 1024 * 1024) {
                alert('La imagen es demasiado grande. Máximo 10MB.');
                return;
            }

            // Comprimir imagen
            const compressedBlob = await compressImageFolleto(file, 1080, 0.7);
            const compressedFile = new File([compressedBlob], 'solicitud.jpg', { type: 'image/jpeg' });
            const fileName = `${Date.now()}.jpg`;
            const filePath = `solicitudes/${fileName}`;

            let { error: uploadError } = await supabase.storage.from('folleto').upload(filePath, compressedFile);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('folleto').getPublicUrl(filePath);

            // Caducidad: 7 días por defecto
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const { error: insertError } = await supabase.from('folleto_imagenes').insert([{
                titulo: titulo,
                descripcion: desc,
                nombre_vecino: nombre,
                url_imagen: urlData.publicUrl,
                aprobado: false,
                user_id: user ? user.id : null,
                expires_at: expiresAt.toISOString(),
                last_renewed: new Date().toISOString(),
                highlighted: false,
                vip_icon: null,
                vip_label: null
            }]);

            if (insertError) throw insertError;

            alert("¡Solicitud enviada con éxito! Tu anuncio estará visible 7 días.");
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

// ========== ADMIN: MODERACIÓN ==========

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
            const days = prompt('¿Cuántos días autorizar? (1-90):', '7');
            if (!days || isNaN(days) || days < 1 || days > 90) {
                if (days !== null) alert('Ingresa un número válido (1-90)');
                return;
            }
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(days));
            await supabase.from('folleto_imagenes').update({ 
                aprobado: true,
                expires_at: expiresAt.toISOString(),
                last_renewed: new Date().toISOString()
            }).eq('id', id);
            alert("Imagen aprobada. Visible por " + days + " días.");
        } else {
            if (!confirm('¿Rechazar y eliminar esta solicitud?')) return;
            await supabase.from('folleto_imagenes').delete().eq('id', id);
            alert("Solicitud rechazada.");
        }
        cargarSolicitudesPendientes();
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Eliminar anuncio del folleto
async function folletoDeleteItem(itemId) {
    if (!confirm('¿Eliminar este anuncio del folleto? Esta acción no se puede deshacer.')) return;
    try {
        const { error } = await supabase.from('folleto_imagenes').delete().eq('id', itemId);
        if (error) throw error;
        alert('Anuncio eliminado.');
        cargarContenidoFolleto();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
}

// Editar descripción del anuncio
async function folletoEditDescription(itemId, currentDesc) {
    const newDesc = prompt('Editar descripción:', currentDesc);
    if (newDesc === null) return;
    try {
        const { error } = await supabase.from('folleto_imagenes')
            .update({ descripcion: newDesc, updated_at: new Date().toISOString() })
            .eq('id', itemId);
        if (error) throw error;
        alert('Descripción actualizada.');
        cargarContenidoFolleto();
    } catch (err) {
        alert('Error al actualizar: ' + err.message);
    }
}

console.log('✅ Módulo FOLLETO cargado');
