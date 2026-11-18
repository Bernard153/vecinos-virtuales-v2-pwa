// ============================================
// PANEL ADMIN WEB — Gestión de contenido web
// ============================================

VV.adminWeb = {
    WEB_AD_SPACES: [
        { type: 'web_top', name: 'Top Banner', size: '728×90px', hint: 'Banner horizontal arriba de todo' },
        { type: 'web_sidebar', name: 'Sidebar', size: '300×600px', hint: 'Banner vertical lateral (solo PC)' },
        { type: 'web_infeed', name: 'In-feed', size: '300×250px', hint: 'Banner entre secciones de contenido' },
        { type: 'web_footer', name: 'Footer Banner', size: '728×90px', hint: 'Banner horizontal abajo de todo' },
        { type: 'web_sticky', name: 'Sticky Mobile', size: '320×50px', hint: 'Banner fijo abajo (solo celular)' }
    ],

    async init() {
        await Promise.all([
            this.loadSponsors(),
            this.loadFolletos(),
            this.loadEfemerides(),
            this.loadLandingContent(),
            this.loadAdSpacesAdmin()
        ]);
    },
// ===== SPONSORS EN WEB =====
    async loadSponsors() {
        const container = document.getElementById('web-sponsors-list');
        if (!container) return;

        try {
            const { data, error } = await supabase
                .from('sponsors')
                .select('id, business_name, contact, active, mostrar_web, tier')
                .order('business_name', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="text-align:center;color:#94a3b8;">No hay anunciantes creados.</p>';
                return;
            }

            container.innerHTML = data.map(s => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                    <div>
                        <strong>${s.business_name || 'Sin nombre'}</strong>
                        <span style="margin-left:0.5rem;font-size:0.75rem;padding:2px 8px;border-radius:10px;background:${s.active ? '#d1fae5' : '#fee2e2'};color:${s.active ? '#065f46' : '#991b1b'};">${s.active ? 'Activo' : 'Inactivo'}</span>
                        <span style="margin-left:0.5rem;font-size:0.75rem;color:#64748b;">${s.tier || ''}</span>
                    </div>
                    <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
                        <input type="checkbox" ${s.mostrar_web ? 'checked' : ''} 
                               onchange="VV.adminWeb.toggleSponsorWeb('${s.id}', this.checked)"
                               style="width:20px;height:20px;cursor:pointer;">
                        <span style="font-size:0.85rem;font-weight:600;">Web</span>
                    </label>
                </div>
            `).join('');

        } catch (e) {
            console.error('Error cargando sponsors web:', e);
            container.innerHTML = '<p style="color:#ef4444;text-align:center;">Error al cargar</p>';
        }
    },

        // ===== ESPACIOS PUBLICITARIOS WEB =====
    
    async loadAdSpacesAdmin() {
        const container = document.getElementById('web-adspaces-list');
        if (!container) return;

        try {
            const { data: sponsors } = await supabase
                .from('sponsors')
                .select('id, business_name')
                .eq('active', true)
                .order('business_name', { ascending: true });

            const { data: spaces } = await supabase
                .from('sponsor_spaces')
                .select('*')
                .in('space_type', ['web_top', 'web_sidebar', 'web_infeed', 'web_footer', 'web_sticky'])
                .order('created_at', { ascending: false });

            const spacesMap = {};
            (spaces || []).forEach(s => {
                if (!spacesMap[s.space_type]) spacesMap[s.space_type] = s;
            });

            container.innerHTML = this.WEB_AD_SPACES.map(space => {
                const existing = spacesMap[space.type];
                const selectedSponsor = existing?.sponsor_id || '';
                const imageUrl = existing?.image_url || '';
                const isActive = existing ? existing.active !== false : false;

                const sponsorOptions = (sponsors || []).map(s => 
                    `<option value="${s.id}" ${selectedSponsor === s.id ? 'selected' : ''}>${s.business_name}</option>`
                ).join('');

                return `
                    <div style="padding: 1rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <div>
                                <strong>${space.name}</strong>
                                <span style="margin-left: 0.5rem; font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; background: #ede9fe; color: #5b21b6;">${space.size}</span>
                            </div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" id="ad-active-${space.type}" ${isActive ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                                <span style="font-size: 0.85rem; font-weight: 600;">Activo</span>
                            </label>
                        </div>
                        <p style="font-size: 0.8rem; color: #64748b; margin: 0 0 0.75rem;">${space.hint}</p>
                        <div style="display: grid; gap: 0.5rem;">
                            <select id="ad-sponsor-${space.type}" style="padding: 0.5rem; border-radius: 8px; border: 1px solid #cbd5e1;">
                                <option value="">Sin asignar</option>
                                ${sponsorOptions}
                            </select>
                            <input type="file" id="ad-image-${space.type}" accept="image/*" onchange="VV.adminWeb.previewAdImage('${space.type}', this)" style="font-size: 0.8rem;">
                            <div id="ad-preview-${space.type}" style="margin-top: 0.5rem;">
                                ${imageUrl ? `<img src="${imageUrl}" alt="${space.name}" style="max-width: 200px; max-height: 80px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0;">` : '<p style="font-size: 0.8rem; color: #94a3b8;">Sin imagen</p>'}
                            </div>
                        </div>
                        <button onclick="VV.adminWeb.saveAdSpace('${space.type}')" class="btn-primary" style="margin-top: 0.75rem; width: 100%;">
                            <i class="fas fa-save"></i> Guardar espacio
                        </button>
                    </div>
                `;
            }).join('');

        } catch (e) {
            console.error('Error cargando espacios publicitarios:', e);
            container.innerHTML = '<p style="color: #ef4444; text-align: center;">Error al cargar</p>';
        }
    },

    previewAdImage(spaceType, input) {
        const preview = document.getElementById('ad-preview-' + spaceType);
        if (!preview || !input.files.length) return;
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview" style="max-width: 200px; max-height: 80px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0;">';
        };
        reader.readAsDataURL(file);
    },

    async saveAdSpace(spaceType) {
        const sponsorId = document.getElementById('ad-sponsor-' + spaceType).value;
        const isActive = document.getElementById('ad-active-' + spaceType).checked;
        const fileInput = document.getElementById('ad-image-' + spaceType);

        try {
            let imageUrl = null;

            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const ext = file.name.split('.').pop();
                const fileName = 'web-ads/' + spaceType + '_' + Date.now() + '.' + ext;

                const { error: uploadError } = await supabase.storage
                    .from('barrio-media')
                    .upload(fileName, file, { contentType: file.type });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('barrio-media')
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
            }

            const { data: existing } = await supabase
                .from('sponsor_spaces')
                .select('id, image_url')
                .eq('space_type', spaceType)
                .order('created_at', { ascending: false })
                .limit(1);

            if (existing && existing.length > 0) {
                const updateData = {
                    sponsor_id: sponsorId || null,
                    active: isActive
                };
                if (imageUrl) updateData.image_url = imageUrl;

                const { error } = await supabase
                    .from('sponsor_spaces')
                    .update(updateData)
                    .eq('id', existing[0].id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('sponsor_spaces')
                    .insert({
                        sponsor_id: sponsorId || null,
                        space_type: spaceType,
                        active: isActive,
                        amount: 0,
                        paid: false,
                        image_url: imageUrl,
                        start_date: new Date().toISOString().split('T')[0]
                    });

                if (error) throw error;
            }

            VV.utils.showSuccess('Espacio publicitario guardado');
            this.loadAdSpacesAdmin();

        } catch (e) {
            console.error('Error guardando espacio publicitario:', e);
            alert('Error al guardar: ' + e.message);
        }
     }
};


    

    async toggleSponsorWeb(sponsorId, value) {
        try {
            const { error } = await supabase
                .from('sponsors')
                .update({ mostrar_web: value })
                .eq('id', sponsorId);

            if (error) throw error;
            VV.utils.showSuccess(value ? 'Anunciante visible en la web' : 'Anunciante oculto de la web');
        } catch (e) {
            console.error('Error actualizando sponsor web:', e);
            alert('Error al actualizar');
        }
    },

    // ===== FOLLETOS EN WEB =====
    async loadFolletos() {
        const container = document.getElementById('web-folletos-list');
        if (!container) return;

        try {
            const { data, error } = await supabase
                .from('folleto_imagenes')
                .select('id, image_url, neighborhood, mostrar_web, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="text-align:center;color:#94a3b8;grid-column:1/-1;">No hay folletos cargados.</p>';
                return;
            }

            container.innerHTML = data.map(f => `
                <div style="padding:0.5rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;text-align:center;">
                    <img src="${f.image_url}" alt="folleto" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:0.5rem;">
                    <p style="font-size:0.8rem;margin:0 0 0.25rem;">${f.neighborhood || 'Sin barrio'}</p>
                    <label style="display:flex;align-items:center;justify-content:center;gap:0.5rem;cursor:pointer;">
                        <input type="checkbox" ${f.mostrar_web ? 'checked' : ''} 
                               onchange="VV.adminWeb.toggleFolletoWeb('${f.id}', this.checked)"
                               style="width:18px;height:18px;cursor:pointer;">
                        <span style="font-size:0.8rem;font-weight:600;">Mostrar en web</span>
                    </label>
                </div>
            `).join('');

        } catch (e) {
            console.error('Error cargando folletos web:', e);
            container.innerHTML = '<p style="color:#ef4444;text-align:center;grid-column:1/-1;">Error al cargar</p>';
        }
    },

    async toggleFolletoWeb(folletoId, value) {
        try {
            const { error } = await supabase
                .from('folleto_imagenes')
                .update({ mostrar_web: value })
                .eq('id', folletoId);

            if (error) throw error;
            VV.utils.showSuccess(value ? 'Folleto visible en la web' : 'Folleto oculto de la web');
        } catch (e) {
            console.error('Error actualizando folleto web:', e);
            alert('Error al actualizar');
        }
    },

    // ===== EFEMERIDES =====
    async loadEfemerides() {
        const container = document.getElementById('web-efemerides-list');
        if (!container) return;

        try {
            const { data, error } = await supabase
                .from('efemerides')
                .select('*')
                .order('fecha', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="text-align:center;color:#94a3b8;">No hay efemérides cargadas.</p>';
                return;
            }

            container.innerHTML = data.map(e => {
                const fecha = new Date(e.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
                return `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                        <div>
                            <span style="font-weight:700;color:#f59e0b;">📅 ${fecha}</span>
                            <span style="margin-left:0.5rem;font-weight:600;">${e.titulo}</span>
                            <span style="margin-left:0.5rem;font-size:0.75rem;padding:2px 8px;border-radius:10px;background:#ede9fe;color:#6d28d9;">${e.tipo}</span>
                        </div>
                        <div style="display:flex;gap:0.5rem;">
                            <button onclick="VV.adminWeb.deleteEfemeride('${e.id}')" style="border:none;background:#ef4444;color:white;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:0.8rem;">🗑️</button>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (e) {
            console.error('Error cargando efemerides:', e);
            container.innerHTML = '<p style="color:#ef4444;text-align:center;">Error al cargar</p>';
        }
    },

    async showEfemerideForm() {
        const fecha = prompt('Fecha (AAAA-MM-DD):', '2026-11-17');
        if (!fecha) return;

        const titulo = prompt('Título:', 'Día de...');
        if (!titulo) return;

        const descripcion = prompt('Descripción breve:', '');
        const tipo = prompt('Tipo (nacional/barrial/cultural/social):', 'nacional');

        try {
            const mes = new Date(fecha).getMonth() + 1;
            const dia = new Date(fecha).getDate();

            const { error } = await supabase
                .from('efemerides')
                .insert({
                    fecha: fecha,
                    titulo: titulo,
                    descripcion: descripcion,
                    tipo: tipo || 'nacional',
                    activa: true,
                    mes: mes,
                    dia: dia
                });

            if (error) throw error;
            VV.utils.showSuccess('Efeméride creada');
            this.loadEfemerides();
        } catch (e) {
            console.error('Error creando efemeride:', e);
            alert('Error: ' + e.message);
        }
    },

    async deleteEfemeride(id) {
        if (!confirm('¿Eliminar esta efeméride?')) return;
        try {
            const { error } = await supabase
                .from('efemerides')
                .delete()
                .eq('id', id);

            if (error) throw error;
            VV.utils.showSuccess('Efeméride eliminada');
            this.loadEfemerides();
        } catch (e) {
            console.error('Error eliminando efemeride:', e);
            alert('Error al eliminar');
        }
    },

    // ===== TEXTOS DE LA LANDING =====
    async loadLandingContent() {
        try {
            const { data, error } = await supabase
                .from('landing_content')
                .select('key, value');

            if (error) throw error;

            const textos = {};
            (data || []).forEach(item => textos[item.key] = item.value);

            const heroTitle = document.getElementById('web-hero-title');
            if (heroTitle) heroTitle.value = textos.hero_title || '';

            const heroSub = document.getElementById('web-hero-subtitle');
            if (heroSub) heroSub.value = textos.hero_subtitle || '';

            const ctaText = document.getElementById('web-cta-text');
            if (ctaText) ctaText.value = textos.cta_text || '';

            const footerText = document.getElementById('web-footer-text');
            if (footerText) footerText.value = textos.footer_text || '';

        } catch (e) {
            console.error('Error cargando landing content:', e);
        }
    },

    async saveLandingContent() {
        try {
            const items = [
                { key: 'hero_title', value: document.getElementById('web-hero-title')?.value || '' },
                { key: 'hero_subtitle', value: document.getElementById('web-hero-subtitle')?.value || '' },
                { key: 'cta_text', value: document.getElementById('web-cta-text')?.value || '' },
                { key: 'footer_text', value: document.getElementById('web-footer-text')?.value || '' }
            ];

            for (const item of items) {
                await supabase
                    .from('landing_content')
                    .upsert({ key: item.key, value: item.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

            }

            VV.utils.showSuccess('Textos guardados');
        } catch (e) {
            console.error('Error guardando landing content:', e);
            alert('Error al guardar');
        }
    }
};
