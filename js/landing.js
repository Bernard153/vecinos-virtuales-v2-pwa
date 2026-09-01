// ========== LANDING PÚBLICA ==========

async function cargarLandingPublica() {
    await Promise.all([
        cargarFolletoPublico(),
        cargarDestacadasPublico(),
        cargarCulturaPublico(),
        cargarVocesPublico()
    ]);
}
async function cargarLandingPublica() {
    await Promise.all([
        cargarFolletoPublico(),
        cargarDestacadasPublico(),
        cargarCulturaPublico(),
        cargarVocesPublico(),
        cargarAnunciantesPublico()
    ]);
}

async function cargarFolletoPublico() {
    const container = document.getElementById('landing-folleto');
    if (!container) return;
    
    try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('folleto_imagenes')
            .select('*')
            .eq('aprobado', true)
            .gt('expires_at', now)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error || !data || data.length === 0) {
            container.innerHTML = '<p style="opacity: 0.6; padding: 1rem;">No hay anuncios disponibles.</p>';
            return;
        }

        container.innerHTML = data.map(item => `
            <div style="min-width: 200px; background: rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                <img src="${item.url_imagen}" alt="${sanitizeText(item.titulo)}" style="width: 100%; height: 120px; object-fit: cover;" loading="lazy">
                <div style="padding: 0.5rem;">
                    <strong style="font-size: 0.85rem; display: block;">${sanitizeText(item.titulo)}</strong>
                    <p style="font-size: 0.75rem; opacity: 0.7; margin: 0.25rem 0;">${sanitizeText(item.descripcion)}</p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p style="opacity: 0.6; padding: 1rem;">Error al cargar.</p>';
    }
}

async function cargarDestacadasPublico() {
    const container = document.getElementById('landing-destacadas');
    if (!container) return;
    
    try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('featured_offers')
            .select('*')
            .eq('status', 'active')
            .eq('blocked', false)
            .gt('expires_at', now)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error || !data || data.length === 0) {
            container.innerHTML = '<p style="opacity: 0.6; padding: 1rem;">No hay ofertas destacadas.</p>';
            return;
        }

        container.innerHTML = data.map(offer => `
            <div style="min-width: 200px; background: rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                ${offer.image_url ? `<img src="${offer.image_url}" alt="${sanitizeText(offer.title)}" style="width: 100%; height: 120px; object-fit: cover;" loading="lazy">` : ''}
                <div style="padding: 0.5rem;">
                    <strong style="font-size: 0.85rem; display: block;">${sanitizeText(offer.title)}</strong>
                    <p style="font-size: 0.75rem; opacity: 0.7; margin: 0.25rem 0;">${sanitizeText(offer.description || '')}</p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p style="opacity: 0.6; padding: 1rem;">Error al cargar.</p>';
    }
}

async function cargarCulturaPublico() {
    const container = document.getElementById('landing-cultura');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('cultural_posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error || !data || data.length === 0) {
            container.innerHTML = '<p style="opacity: 0.6; padding: 1rem;">No hay eventos.</p>';
            return;
        }

        container.innerHTML = data.map(post => `
            <div style="min-width: 200px; background: rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                ${post.media_url ? `<img src="${post.media_url}" alt="${sanitizeText(post.title)}" style="width: 100%; height: 120px; object-fit: cover;" loading="lazy">` : ''}
                <div style="padding: 0.5rem;">
                    <strong style="font-size: 0.85rem; display: block;">${sanitizeText(post.title)}</strong>
                    <p style="font-size: 0.75rem; opacity: 0.7; margin: 0.25rem 0;">${sanitizeText(post.description || '')}</p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p style="opacity: 0.6; padding: 1rem;">Error al cargar.</p>';
    }
}

async function cargarVocesPublico() {
    const container = document.getElementById('landing-voces');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('karaoke_videos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error || !data || data.length === 0) {
            container.innerHTML = '<p style="opacity: 0.6; padding: 1rem;">No hay videos.</p>';
            return;
        }

        container.innerHTML = data.map(video => `
            <div style="min-width: 200px; background: rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                ${video.thumbnail_url ? `<img src="${video.thumbnail_url}" alt="${sanitizeText(video.title)}" style="width: 100%; height: 120px; object-fit: cover;" loading="lazy">` : `<div style="width:100%;height:120px;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:2rem;">🎤</div>`}
                <div style="padding: 0.5rem;">
                    <strong style="font-size: 0.85rem; display: block;">${sanitizeText(video.title || 'Sin título')}</strong>
                    <p style="font-size: 0.75rem; opacity: 0.7; margin: 0.25rem 0;">${sanitizeText(video.author_name || '')}</p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p style="opacity: 0.6; padding: 1rem;">Error al cargar.</p>';
    }
}
async function cargarAnunciantesPublico() {
    const container = document.getElementById('landing-anunciantes');
    if (!container) return;
    
    try {
        const { data: sponsors, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error || !sponsors || sponsors.length === 0) {
            container.innerHTML = '<p style="opacity: 0.6; padding: 1rem;">No hay anunciantes disponibles.</p>';
            return;
        }

        container.innerHTML = sponsors.map(s => `
            <div style="min-width: 200px; background: rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                ${s.imageUrl ? 
                    `<img src="${s.imageUrl}" alt="${sanitizeText(s.name)}" style="width: 100%; height: 120px; object-fit: cover;" loading="lazy">` :
                    `<div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; font-size: 2rem;">${s.logo || '🏪'}</div>`
                }
                <div style="padding: 0.5rem;">
                    <strong style="font-size: 0.85rem; display: block;">${sanitizeText(s.name)}</strong>
                    <p style="font-size: 0.75rem; opacity: 0.7; margin: 0.25rem 0;">${sanitizeText(s.description || '')}</p>
                    <span style="font-size: 0.65rem; background: rgba(251,191,36,0.2); color: #fbbf24; padding: 0.1rem 0.4rem; border-radius: 8px;">${(s.tier || 'basic').toUpperCase()}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p style="opacity: 0.6; padding: 1rem;">Error al cargar.</p>';
    }
}

console.log('✅ Módulo LANDING cargado');
