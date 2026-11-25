// ============================================================
// LANDING WEB — Carga de contenido agregado de todos los barrios
// ============================================================

VV.landingWeb = {

    async init() {
        await Promise.all([
            this.loadBarrios(),
            this.loadEfemerides(),
            this.loadFolletos(),
            this.loadDestacadas(),
            this.loadEventos(),
            this.loadVoces(),
            this.loadAnunciantes(),
            this.loadAdSpaces(),
            this.loadLandingContent(),
            this.loadCounters()
        ]);
    },

    // Rotación de barrios según el día del año
    getDiaDelAno() {
        const ahora = new Date();
        const inicio = new Date(ahora.getFullYear(), 0, 0);
        return Math.floor((ahora - inicio) / 86400000);
    },

    // Cargar barrios con conteo de vecinos
    async loadBarrios() {
    const container = document.getElementById('landing-barrios');
    if (!container) return;

    try {
         // Conteo por barrio (una fila por barrio, no por usuario)
        const { data: conteoData, error: err1 } = await supabase
            .rpc('conteo_barrios');

        if (err1) throw err1;

        // Cargar imágenes de barrios
        const { data: barriosData } = await supabase
            .from('barrios')
            .select('nombre, imagen_url, descripcion');

        const imagenesBarrios = {};
        (barriosData || []).forEach(b => {
            imagenesBarrios[b.nombre] = { img: b.imagen_url, desc: b.descripcion };
        });

        let barrios = (conteoData || []).map(row => ({
            nombre: row.neighborhood,
            vecinos: Number(row.vecinos),
            imagen: imagenesBarrios[row.neighborhood]?.img || null,
            descripcion: imagenesBarrios[row.neighborhood]?.desc || ''
        })).sort((a, b) => b.vecinos - a.vecinos);


        if (barrios.length === 0) {
            container.innerHTML = '<p style="opacity:0.6;">Aún no hay barrios registrados. ¡Sé el primero!</p>';
            return;
        }

        // Rotar: el barrio destacado cambia cada día
        const dia = this.getDiaDelAno();
        const indiceInicio = dia % barrios.length;
        const destacado = barrios[indiceInicio];

        // Reordenar: el destacado va primero
        barrios = barrios.filter(b => b.nombre !== destacado.nombre);
        barrios.unshift(destacado);

        container.innerHTML = barrios.map((b, i) => {
            const inicial = b.nombre.charAt(0).toUpperCase();
            const imgHtml = b.imagen 
                ? `<img src="${b.imagen}" alt="${b.nombre}" loading="lazy" decoding="async" style="width:100%;height:80px;object-fit:cover;border-radius:8px 8px 0 0;">`
                : `<div style="width:100%;height:80px;background:linear-gradient(135deg,#8b5cf6,#312e81);display:flex;align-items:center;justify-content:center;border-radius:8px 8px 0 0;font-size:2rem;font-weight:800;color:rgba(255,255,255,0.5);">${inicial}</div>`;
            return `
                <div class="barrio-card ${i === 0 ? 'destacado' : ''}" onclick="VV.landingWeb.verBarrio('${b.nombre.replace(/'/g, "\\'")}')">
                    ${imgHtml}
                    <div style="padding:0.5rem;">
                        <div class="barrio-name">${b.nombre}</div>
                        <div class="barrio-count">${b.vecinos} vecino${b.vecinos !== 1 ? 's' : ''}</div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error('Error cargando barrios:', e);
        container.innerHTML = '<p style="opacity:0.6;">Error cargando barrios</p>';
    }
},


    verBarrio(nombre) {
        // Por ahora lleva al registro. Después: mostrar contenido del barrio
        if (confirm(`¿Querés ver el contenido de ${nombre}? Te pediremos que elijas tu barrio para continuar.`)) {
            VV.utils.showScreen('location-screen');
            VV.auth.requestGeolocation();
        }
    },

    // Efemérides del día
    async loadEfemerides() {
        const container = document.getElementById('landing-efemerides');
        if (!container) return;

        try {
            
            const hoy = new Date();
            const mes = hoy.getMonth() + 1;
            const dia = hoy.getDate();

        const { data, error } = await supabase
            .from('efemerides')
            .select('*')
            .eq('activa', true)
            .eq('mes', mes)
            .eq('dia', dia)
            .order('tipo', { ascending: true });


            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = `
                    <h3>📅 ${hoy.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</h3>
                    <p style="opacity:0.6;font-size:0.85rem;">No hay efemérides para hoy. ¡Cargá una desde el panel admin!</p>
                `;
                return;
            }

            container.innerHTML = `
                <h3>📅 ${hoy.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</h3>
                ${data.map(e => `
                    <div style="margin-bottom:0.75rem;">
                        <div class="efem-titulo">${e.titulo}</div>
                        <div class="efem-desc">${e.descripcion || ''}</div>
                        ${e.barrio ? `<div style="font-size:0.75rem;color:#c084fc;margin-top:0.25rem;">📍 ${e.barrio}</div>` : ''}
                    </div>
                `).join('')}
            `;

        } catch (e) {
            console.error('Error cargando efemérides:', e);
            container.innerHTML = '<p style="opacity:0.6;">Error cargando efemérides</p>';
        }
    },

    // Folletos (mostrar_web = true)
    async loadFolletos() {
        const container = document.getElementById('landing-folleto');
        if (!container) return;

        try {
            const { data, error } = await supabase
                .from('folleto_imagenes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="opacity:0.6;padding:1rem;">No hay folletos para mostrar</p>';
                return;
            }

            container.innerHTML = data.map(f => `
                <div class="landing-card" onclick="VV.utils.showScreen('location-screen'); VV.auth.requestGeolocation();">
                    <img src="${f.image_url || f.url || ''}" alt="Folleto" loading="lazy" decoding="async" onerror="this.style.display='none'">
                    <div class="card-body">
                        <p class="card-title">${f.neighborhood || 'Barrio'}</p>
                        <p class="card-meta">${f.titulo || f.autor_name || ''}</p>

                    </div>
                </div>
            `).join('');

        } catch (e) {
            console.error('Error cargando folletos:', e);
            container.innerHTML = '<p style="opacity:0.6;padding:1rem;">Error cargando folletos</p>';
        }
    },

    // Ofertas destacadas
    async loadDestacadas() {
        const container = document.getElementById('landing-destacadas');
        if (!container) return;

        try {
            const { data, error } = await supabase
                .from('featured_offers')
                .select('*')
                .eq('blocked', false)
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) throw error;

            if (!data || data.length === 0) {
                // Fallback: cargar productos
                const { data: productos } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(6);

                if (!productos || productos.length === 0) {
                    container.innerHTML = '<p style="opacity:0.6;padding:1rem;">No hay ofertas para mostrar</p>';
                    return;
                }

                container.innerHTML = productos.map(p => `
                    <div class="landing-card" onclick="VV.utils.showScreen('location-screen'); VV.auth.requestGeolocation();">
                        <img src="${p.imagen_url || p.image_url || ''}" alt="${p.titulo || p.name || ''}" loading="lazy" decoding="async" onerror="this.style.display='none'">
                        <div class="card-body">
                            <p class="card-title">${p.titulo || p.name || 'Producto'}</p>
                            <p class="card-meta">${p.precio ? '$' + p.precio : ''} ${p.neighborhood || ''}</p>
                        </div>
                    </div>
                `).join('');
                return;
            }

            container.innerHTML = data.map(o => `
                <div class="landing-card" onclick="VV.utils.showScreen('location-screen'); VV.auth.requestGeolocation();">
                    <img src="${o.imagen_url || ''}" alt="${o.titulo || ''}" loading="lazy" decoding="async" onerror="this.style.display='none'">
                    <div class="card-body">
                        <p class="card-title">${o.titulo || 'Oferta'}</p>
                        <p class="card-meta">${o.barrio || ''}</p>
                    </div>
                </div>
            `).join('');

        } catch (e) {
            console.error('Error cargando ofertas:', e);
            container.innerHTML = '<p style="opacity:0.6;padding:1rem;">Error cargando ofertas</p>';
        }
    },

    // Eventos culturales
    async loadEventos() {
        const container = document.getElementById('landing-cultura');
        if (!container) return;

        try {
            const { data, error } = await supabase
                .from('cultural_posts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(4);

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="opacity:0.6;padding:1rem;">No hay eventos para mostrar</p>';
                return;
            }

            container.innerHTML = data.map(e => `
                <div class="landing-card" onclick="VV.utils.showScreen('location-screen'); VV.auth.requestGeolocation();">
                    <img src="${e.imagen_url || ''}" alt="${e.titulo || ''}" loading="lazy" decoding="async" onerror="this.style.display='none'">
                    <div class="card-body">
                        <p class="card-title">${e.titulo || 'Evento'}</p>
                        <p class="card-meta">${e.neighborhood || ''} ${e.fecha ? '· ' + new Date(e.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : ''}</p>
                    </div>
                </div>
            `).join('');

        } catch (e) {
            console.error('Error cargando eventos:', e);
            container.innerHTML = '<p style="opacity:0.6;padding:1rem;">Error cargando eventos</p>';
        }
    },

        // Voces Virtuales
    async loadVoces() {
        const container = document.getElementById('landing-voces');
        if (!container) return;

        try {
            const { data, error } = await supabase
                .from('karaoke_videos')
                .select('*')
                .eq('visible', true)
                .eq('estado_moderacion', 'aprobado')
                .order('views_count', { ascending: false })
                .limit(4);

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="opacity:0.6;padding:1rem;">No hay videos para mostrar</p>';
                return;
            }

            container.innerHTML = data.map(v => {
                const thumb = v.thumbnail_url || v.poster_url || '';

                const miniatura = thumb
                    ? `<img src="${thumb}" alt="${v.title || 'Video'}" loading="lazy" decoding="async"
                            style="width:100%;height:120px;object-fit:cover;">`
                    : `<div style="width:100%;height:120px;display:flex;align-items:center;justify-content:center;
                            background:linear-gradient(135deg,#4c1d95,#8b5cf6);font-size:2rem;">▶</div>`;

                return `
                <div class="landing-card" onclick="VV.utils.showScreen('location-screen'); VV.auth.requestGeolocation();">
                    ${miniatura}
                    <div class="card-body">
                        <p class="card-title">${v.title || 'Sin título'}</p>
                        <p class="card-meta">${v.user_name || ''} · 👁 ${v.views_count || 0}</p>
                    </div>
                </div>`;
            }).join('');

        } catch (e) {
            console.error('Error cargando voces:', e);
            container.innerHTML = '<p style="opacity:0.6;padding:1rem;">Error cargando videos</p>';
        }
    },


        // Anunciantes (mostrar_web = true)
    async loadAnunciantes() {
        const container = document.getElementById('landing-anunciantes');
        if (!container) return;

        try {
            const { data, error } = await supabase
                .from('sponsors')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="opacity:0.6;padding:1rem;">No hay anunciantes para mostrar</p>';
                return;
            }

            container.innerHTML = data.map(s => `
                <div class="landing-card" onclick="VV.utils.showScreen('location-screen'); VV.auth.requestGeolocation();">
                    ${s.logo ? `<img src="${s.logo}" alt="${s.business_name || ''}" loading="lazy" decoding="async" onerror="this.style.display='none'">` : `<div style="width:100%;height:120px;background:linear-gradient(135deg,#312e81,#4c1d95);display:flex;align-items:center;justify-content:center;font-size:2rem;">📢</div>`}
                    <div class="card-body">
                        <p class="card-title">${s.business_name || 'Anunciante'}</p>
                        <p class="card-meta">${s.neighborhoods || 'Todos los barrios'}</p>
                    </div>
                </div>
            `).join('');

        } catch (e) {
            console.error('Error cargando anunciantes:', e);
            container.innerHTML = '<p style="opacity:0.6;padding:1rem;">Error cargando anunciantes</p>';
        }
    },

    // Espacios publicitarios web
    async loadAdSpaces() {
    try {
        const { data: spaces, error: err1 } = await supabase
            .from('sponsor_spaces')
            .select('*')
            .in('space_type', ['web_top', 'web_sidebar', 'web_infeed', 'web_footer', 'web_sticky'])
            .eq('active', true);

        if (err1) throw err1;

        if (!spaces || spaces.length === 0) return;

        const { data: sponsors } = await supabase
            .from('sponsors')
            .select('id, business_name, logo, image_url, contact, website');

        const sponsorsMap = {};
        (sponsors || []).forEach(s => { sponsorsMap[s.id] = s; });

        spaces.forEach(space => {
            const sponsor = space.sponsor_id ? sponsorsMap[space.sponsor_id] : null;
            const imageUrl = space.image_url || (sponsor && (sponsor.image_url || sponsor.logo)) || '';
            const link = (sponsor && sponsor.website) || '#';
            const adId = 'ad-' + space.space_type.replace('web_', '');
            const el = document.getElementById(adId);
            if (el && imageUrl) {
                const lazyAttr = space.space_type === 'web_top' ? '' : ' loading="lazy"';
                el.innerHTML = '<a href="' + link + '" target="_blank"><img src="' + imageUrl + '" alt="Publicidad" decoding="async"' + lazyAttr + '></a>';
                el.style.display = 'flex';
            }

        });

    } catch (e) {
        console.error('Error cargando espacios publicitarios:', e);
    }
},
    // ===== CONTADORES EN VIVO =====
    async loadCounters() {
        try {
            // Vecinos y barrios en una sola llamada
            const { data: conteo } = await supabase.rpc('conteo_barrios');

            const vecinos = (conteo || []).reduce((s, r) => s + Number(r.vecinos), 0);
            const barriosCount = (conteo || []).length;


            // Contadores con head: true (eficiente)
            const [
                { count: productos },
                { count: eventos },
                { count: videos },
                { count: comercios }
            ] = await Promise.all([
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('cultural_posts').select('*', { count: 'exact', head: true }),
                supabase.from('karaoke_videos').select('*', { count: 'exact', head: true }).eq('visible', true),
                supabase.from('sponsors').select('*', { count: 'exact', head: true }).eq('active', true)
            ]);

            this.animateCounter('counter-vecinos', vecinos);
            this.animateCounter('counter-productos', productos || 0);
            this.animateCounter('counter-eventos', eventos || 0);
            this.animateCounter('counter-videos', videos || 0);
            this.animateCounter('counter-comercios', comercios || 0);
            this.animateCounter('counter-barrios', barriosCount);

        } catch (e) {
            console.error('Error cargando contadores:', e);
        }
    },

    animateCounter(elementId, target) {
        const el = document.getElementById(elementId);
        if (!el) return;
        let current = 0;
        const steps = 30;
        const increment = Math.max(1, Math.ceil(target / steps));
        const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            el.textContent = current.toLocaleString('es-AR');
        }, 40);
    },


    // Cargar textos editables de landing_content
    async loadLandingContent() {
        try {
            const { data, error } = await supabase
                .from('landing_content')
                .select('key, value');

            if (error || !data) return;

            const textos = {};
            data.forEach(item => textos[item.key] = item.value);

            const heroTitle = document.getElementById('landing-hero-title');
            if (heroTitle && textos.hero_title) heroTitle.textContent = '🏠 ' + textos.hero_title;

            const heroSub = document.getElementById('landing-hero-subtitle');
            if (heroSub && textos.hero_subtitle) heroSub.textContent = textos.hero_subtitle;

            const ctaBtn = document.getElementById('landing-cta-btn');
            if (ctaBtn && textos.cta_text) ctaBtn.textContent = '🏠 ' + textos.cta_text;

                       const footerText = document.getElementById('landing-footer-text');
            if (footerText && textos.footer_text) footerText.textContent = textos.footer_text;

            // ===== Título y bajada editables por sección =====
            ['barrios', 'folletos', 'ofertas', 'eventos', 'voces'].forEach(slug => {
                const titulo = textos['sec_' + slug + '_titulo'];
                const sub = textos['sec_' + slug + '_subtitulo'];

                const elTitulo = document.getElementById('sec-' + slug + '-titulo');
                if (elTitulo && titulo) elTitulo.textContent = titulo;

                const elSub = document.getElementById('sec-' + slug + '-subtitulo');
                if (elSub && sub !== undefined) {
                    elSub.textContent = sub;
                    elSub.style.display = sub.trim() ? '' : 'none';
                }
            });

        } catch (e) {
            console.error('Error cargando landing_content:', e);
        }

    }
};
// Auto-inicializar cuando la landing está visible
function initLandingWeb() {
    if (typeof VV !== 'undefined' && VV.landingWeb && window.supabase) {
        VV.landingWeb.init();
    } else {
        setTimeout(initLandingWeb, 500);
    }
}
initLandingWeb();

