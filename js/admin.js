// ========== MÓDULO ADMINISTRACIÓN ==========

VV.admin = {
  sponsorRequests: [],

  // Cargar panel de admin
  async load() {
    if (!VV.utils?.isAdmin?.()) {
      alert('No tienes permisos de administrador');
      return;
    }
    await VV.admin.loadSponsorRequests();
    await VV.admin.loadFeaturedRequests();
    await VV.admin.loadSponsors();
  },

  // ========== SOLICITUDES "SER ANUNCIANTE" ==========

  // Cargar solicitudes pendientes desde advertiser_requests
  async loadSponsorRequests() {
    try {
      const container = document.getElementById('sponsor-requests-container');
      const list = document.getElementById('sponsor-requests-list');
      if (!container || !list) return;

      const { data: pending, error } = await supabase
        .from('advertiser_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!pending || pending.length === 0) {
        container.style.display = 'none';
        return;
      }

      container.style.display = 'block';
      list.innerHTML = pending
        .map((req) => {
          const safeName = (req.user_name || req.business_name || 'Sin nombre');
          const safeDesc = req.message || req.description || '';
          const tier = (req.tier || 'silver').toLowerCase();
          const logo = req.logo || '🏪';
          const contact = req.user_number || req.contact || '';
          const website = req.website || '';

          return `
            <div class="sponsor-request-card" style="border-left: 4px solid var(--primary-blue);">
              <div class="request-header">
                <div>
                  <h4><i class="fas fa-bullhorn"></i> ${safeName}</h4>
                  <p style="color: var(--gray-600); font-size: 0.85rem; margin-top: 0.25rem;">
                    Solicitado por: ${req.user_name || 'Usuario'} ${req.neighborhood ? `(${req.neighborhood})` : '' }
                  </p>
                </div>
                <span class="request-tier-badge ${tier}">${tier.toUpperCase()}</span>
              </div>
              <div class="request-info">
                <p>${logo} ${safeDesc}</p>
                ${contact ? `<p><i class="fas fa-phone"></i> ${contact}</p>` : ''}
                ${website ? `<p><i class="fas fa-globe"></i> ${website}</p>` : ''}
              </div>
              <div class="request-actions">
                <button class="btn-approve" onclick="VV.admin.approveSponsorRequest('${req.id}')">
                  <i class="fas fa-check"></i> Aprobar
                </button>
                <button class="btn-reject" onclick="VV.admin.rejectSponsorRequest('${req.id}')">
                  <i class="fas fa-times"></i> Rechazar
                </button>
              </div>
            </div>
          `;
        })
        .join('');
    } catch (error) {
      console.error('Error cargando solicitudes de anunciantes:', error);
    }
  },

  // Aprobar solicitud de advertiser_requests: crea/activa sponsor
  async approveSponsorRequest(requestId) {
    const durationStr = prompt('¿Por cuántos días activar este anunciante? (Ej: 30, 60, 90)', '30');
    const duration = parseInt(durationStr || '0', 10);
    if (!duration || isNaN(duration)) {
      alert('Duración inválida');
      return;
    }

    try {
      // Traer la solicitud
      const { data: req, error: fetchErr } = await supabase
        .from('advertiser_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      if (fetchErr) throw fetchErr;
      if (!req) throw new Error('Solicitud no encontrada');

      // Marcar solicitud como aprobada
      const nowIso = new Date().toISOString();
      const { error: updReqErr } = await supabase
        .from('advertiser_requests')
        .update({
          status: 'approved',
          reviewed_by: VV.data?.user?.id || null,
          reviewed_at: nowIso,
        })
        .eq('id', requestId);
      if (updReqErr) throw updReqErr;

      // Calcular expiración
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration);

      // Intentar encontrar sponsor existente del user
      const { data: existingSponsors, error: findErr } = await supabase
        .from('sponsors')
        .select('*')
        .eq('user_id', req.user_id)
        .limit(1);
      if (findErr) throw findErr;

      const sponsorPayload = {
        business_name: req.business_name || req.user_name || 'Anunciante',
        description: req.description || req.message || '',
        contact: req.user_number || req.contact || '',
        website: req.website || null,
        tier: (req.tier || 'silver').toLowerCase(),
        logo: req.logo || '🏪',
        image_url: null,
        neighborhoods: req.neighborhood ? [req.neighborhood] : null,
        active: true,
        status: 'active',
        duration: duration,
        expires_at: expiresAt.toISOString(),
        updated_at: nowIso,
        views: 0,
        clicks: 0,
        user_id: req.user_id || null,
        user_name: req.user_name || null,
      };

      if (existingSponsors && existingSponsors.length > 0) {
        const { error: updErr } = await supabase
          .from('sponsors')
          .update(sponsorPayload)
          .eq('id', existingSponsors[0].id);
        if (updErr) throw updErr;
      } else {
        sponsorPayload.created_at = nowIso;
        const { error: insErr } = await supabase
          .from('sponsors')
          .insert(sponsorPayload);
        if (insErr) throw insErr;
      }

      await VV.admin.load();
      if (VV.banner?.init) await VV.banner.init();
      VV.utils?.showSuccess?.(`Anunciante aprobado por ${duration} días`);
    } catch (error) {
      console.error('Error aprobando anunciante:', error);
      alert('Error al aprobar el anunciante: ' + (error.message || error));
    }
  },

  // Rechazar solicitud de advertiser_requests
  async rejectSponsorRequest(requestId) {
    if (!confirm('¿Rechazar esta solicitud?')) return;

    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('advertiser_requests')
        .update({
          status: 'rejected',
          reviewed_by: VV.data?.user?.id || null,
          reviewed_at: nowIso,
        })
        .eq('id', requestId);

      if (error) throw error;

      await VV.admin.load();
      VV.utils?.showSuccess?.('Solicitud rechazada');
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      alert('Error al rechazar la solicitud: ' + (error.message || error));
    }
  },

  // ========== GESTIÓN DE SPONSORS EXISTENTES ==========

  // Cargar anunciantes
  async loadSponsors() {
    const container = document.getElementById('sponsors-management');
    if (!container) return;

    try {
      const { data: sponsors, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      VV.data.sponsors = sponsors || [];
    } catch (error) {
      console.error('Error cargando sponsors:', error);
      VV.data.sponsors = VV.data.sponsors || [];
    }

    if (VV.data.sponsors.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay anunciantes</p>';
      return;
    }

    container.innerHTML = VV.data.sponsors
      .map((sponsor) => `
      <div class="sponsor-management-card">
        <div class="sponsor-management-header">
          <div class="sponsor-logo">${sponsor.logo || '🏪'}</div>
          <span class="sponsor-tier ${sponsor.tier}">${(sponsor.tier || '').toUpperCase()}</span>
        </div>
        <h4>${sponsor.business_name || sponsor.name || 'Anunciante'}</h4>
        <p>${sponsor.description || ''}</p>
        <div class="sponsor-stats">
          <p><i class="fas fa-eye"></i> ${sponsor.views || 0} vistas</p>
          <p><i class="fas fa-mouse-pointer"></i> ${sponsor.clicks || 0} clics</p>
          <p><i class="fas fa-phone"></i> ${sponsor.contact || ''}</p>
        </div>
        <div style="margin: 0.5rem 0; padding: 0.5rem; background: var(--gray-50); border-radius: 4px;">
          <p style="font-size: 0.85rem; color: var(--gray-600); margin: 0;">
            <i class="fas fa-map-marker-alt"></i>
            <strong>Visible en:</strong>
            ${
              !sponsor.neighborhoods || sponsor.neighborhoods === 'all'
                ? '<span style="color: var(--success-green);">Todos los barrios</span>'
                : Array.isArray(sponsor.neighborhoods)
                  ? sponsor.neighborhoods.join(', ')
                  : sponsor.neighborhoods
            }
          </p>
        </div>
        <div class="sponsor-management-actions">
          <button class="btn-edit" onclick="VV.admin.showSponsorForm('${sponsor.id}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn-toggle ${sponsor.active ? '' : 'inactive'}" onclick="VV.admin.toggleSponsor('${sponsor.id}')">
            <i class="fas fa-${sponsor.active ? 'pause' : 'play'}"></i> ${sponsor.active ? 'Pausar' : 'Activar'}
          </button>
          <button class="btn-delete" onclick="VV.admin.deleteSponsor('${sponsor.id}')">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </div>
      </div>
    `)
      .join('');
  },

  // Mostrar formulario de anunciante
  async showSponsorForm(sponsorId = null) {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const sponsor = sponsorId ? VV.data.sponsors.find((s) => s.id === sponsorId) : null;
    const isEdit = sponsor !== null;

    let overlay = document.getElementById('sponsor-form-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sponsor-form-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-form">
        <h3><i class="fas fa-${isEdit ? 'edit' : 'bullhorn'}"></i> ${isEdit ? 'Editar' : 'Nuevo'} Anunciante</h3>
        <form id="sponsor-form">
          <div class="form-group">
            <label>Nombre del negocio *</label>
            <input type="text" id="sponsor-name" value="${sponsor?.business_name || sponsor?.name || ''}" required>
          </div>
          <div class="form-group">
            <label>Descripción *</label>
            <input type="text" id="sponsor-description" value="${sponsor?.description || ''}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Logo (emoji) *</label>
              <input type="text" id="sponsor-logo" value="${sponsor?.logo || ''}" placeholder="🏪" required>
            </div>
            <div class="form-group">
              <label>Nivel *</label>
              <select id="sponsor-tier" required>
                <option value="">Seleccionar</option>
                <option value="premium" ${sponsor?.tier === 'premium' ? 'selected' : ''}>Premium</option>
                <option value="gold" ${sponsor?.tier === 'gold' ? 'selected' : ''}>Gold</option>
                <option value="silver" ${sponsor?.tier === 'silver' ? 'selected' : ''}>Silver</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Teléfono *</label>
            <input type="tel" id="sponsor-contact" value="${sponsor?.contact || ''}" required>
          </div>
          <div class="form-group">
            <label>Sitio web</label>
            <input type="url" id="sponsor-website" value="${sponsor?.website || ''}" placeholder="https://...">
          </div>
          <div class="form-group">
            <label>Imagen del banner (opcional)</label>
            <input type="file" id="sponsor-image" accept="image/*">
            <p style="font-size: 0.85rem; color: var(--gray-600); margin-top: 0.5rem;">
              <i class="fas fa-info-circle"></i> Si no subes imagen, se usará el emoji como logo
            </p>
            ${sponsor?.image_url ? `<p style="font-size: 0.85rem; color: var(--success-green); margin-top: 0.5rem;"><i class="fas fa-check"></i> Imagen actual cargada</p>` : ''}
          </div>
          <div class="form-group">
            <label>Mostrar en barrios *</label>
            <select id="sponsor-visibility" onchange="VV.admin.toggleNeighborhoodSelection()">
              <option value="all" ${!sponsor?.neighborhoods ? 'selected' : ''}>Todos los barrios</option>
              <option value="specific" ${sponsor?.neighborhoods && Array.isArray(sponsor.neighborhoods) && sponsor.neighborhoods.length > 0 ? 'selected' : ''}>Barrios específicos</option>
            </select>
          </div>
          <div class="form-group" id="neighborhoods-selection" style="display: ${sponsor?.neighborhoods && Array.isArray(sponsor.neighborhoods) && sponsor.neighborhoods.length > 0 ? 'block' : 'none'};">
            <label>Seleccionar barrios</label>
            <div id="neighborhoods-checkboxes" style="max-height: 200px; overflow-y: auto; border: 1px solid var(--gray-300); border-radius: 8px; padding: 1rem;"></div>
            <p style="font-size: 0.85rem; color: var(--gray-600); margin-top: 0.5rem;">
              <i class="fas fa-info-circle"></i> Selecciona uno o más barrios donde se mostrará el anuncio
            </p>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="sponsor-active" ${sponsor?.active !== false ? 'checked' : ''}>
              Anuncio activo
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" onclick="VV.admin.closeSponsorForm()">Cancelar</button>
            <button type="submit" class="btn-save">
              <i class="fas fa-save"></i> ${isEdit ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    `;

    overlay.classList.add('active');

    await VV.admin.loadNeighborhoodCheckboxes(sponsor);

    document.getElementById('sponsor-form').onsubmit = (e) => {
      e.preventDefault();
      VV.admin.saveSponsor(sponsor);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) VV.admin.closeSponsorForm();
    };
  },

  // Cargar checkboxes de barrios
  async loadNeighborhoodCheckboxes(sponsor) {
    const container = document.getElementById('neighborhoods-checkboxes');
    if (!container) return;
    const neighborhoods = await VV.auth.getExistingNeighborhoods();
    if (!neighborhoods || neighborhoods.length === 0) {
      container.innerHTML =
        '<p style="color: var(--gray-600); padding: 0.5rem;">No hay barrios registrados aún</p>';
      return;
    }

    const selectedNeighborhoods =
      sponsor?.neighborhoods && sponsor.neighborhoods !== 'all'
        ? Array.isArray(sponsor.neighborhoods)
          ? sponsor.neighborhoods
          : [sponsor.neighborhoods]
        : [];

    container.innerHTML = neighborhoods
      .map(
        (n) => `
        <label style="display: block; padding: 0.5rem; cursor: pointer; border-bottom: 1px solid var(--gray-200);">
          <input type="checkbox" name="neighborhood" value="${n}" ${selectedNeighborhoods.includes(n) ? 'checked' : ''} style="margin-right: 0.5rem;">
          ${n}
        </label>
      `
      )
      .join('');
  },

  // Toggle selección de barrios
  toggleNeighborhoodSelection() {
    const visibility = document.getElementById('sponsor-visibility').value;
    const selection = document.getElementById('neighborhoods-selection');
    if (selection) selection.style.display = visibility === 'specific' ? 'block' : 'none';
  },

  // Cerrar formulario
  closeSponsorForm() {
    const overlay = document.getElementById('sponsor-form-overlay');
    if (overlay) overlay.classList.remove('active');
  },

  // Guardar anunciante (create/update en sponsors)
  async saveSponsor(existing) {
    const visibility = document.getElementById('sponsor-visibility').value;
    let neighborhoods = 'all';
    if (visibility === 'specific') {
      const checkboxes = document.querySelectorAll('input[name="neighborhood"]:checked');
      if (!checkboxes || checkboxes.length === 0) {
        alert('Debes seleccionar al menos un barrio');
        return;
      }
      neighborhoods = Array.from(checkboxes).map((cb) => cb.value);
    }

    const formData = {
      name: document.getElementById('sponsor-name').value.trim(),
      description: document.getElementById('sponsor-description').value.trim(),
      logo: document.getElementById('sponsor-logo').value.trim(),
      tier: document.getElementById('sponsor-tier').value,
      contact: document.getElementById('sponsor-contact').value.trim(),
      website: document.getElementById('sponsor-website').value.trim(),
      active: document.getElementById('sponsor-active').checked,
      neighborhoods: neighborhoods,
      imageUrl: existing?.image_url || '',
    };

    if (!formData.name || !formData.description || !formData.logo || !formData.tier || !formData.contact) {
      alert('Completa todos los campos obligatorios');
      return;
    }

    // Procesar imagen si existe
    const imageInput = document.getElementById('sponsor-image');
    if (imageInput?.files && imageInput.files[0]) {
      const file = imageInput.files[0];
      try {
        const fileName = `sponsor-${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('sponsor-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error('❌ Error subiendo imagen:', uploadError);
          alert('Error al subir la imagen: ' + uploadError.message + '. Continuando sin imagen...');
        } else {
          const { data: urlData } = supabase.storage.from('sponsor-images').getPublicUrl(fileName);
          formData.imageUrl = urlData.publicUrl;
        }
      } catch (error) {
        console.error('Error procesando imagen:', error);
        alert('Error al procesar la imagen. Continuando sin imagen...');
      }
    }

    VV.admin.saveSponsorData(existing, formData);
  },

  // Guardar datos del anunciante en sponsors
  async saveSponsorData(existing, formData) {
    try {
      if (existing) {
        const updateData = {
          business_name: formData.name,
          description: formData.description,
          contact: formData.contact,
          website: formData.website || null,
          tier: formData.tier,
          logo: formData.logo,
          neighborhoods: formData.neighborhoods === 'all' ? null : formData.neighborhoods,
          active: formData.active,
        };
        if (formData.imageUrl) updateData.image_url = formData.imageUrl;

        const { error } = await supabase.from('sponsors').update(updateData).eq('id', existing.id);
        if (error) throw error;

        const index = VV.data.sponsors.findIndex((s) => s.id === existing.id);
        VV.data.sponsors[index] = { ...existing, ...formData };
      } else {
        const newSponsor = {
          business_name: formData.name,
          description: formData.description,
          contact: formData.contact,
          website: formData.website || null,
          tier: formData.tier,
          logo: formData.logo,
          image_url: formData.imageUrl || null,
          neighborhoods: formData.neighborhoods === 'all' ? null : formData.neighborhoods,
          active: formData.active,
          views: 0,
          clicks: 0,
          status: formData.active ? 'active' : 'pending',
        };

        const { data, error } = await supabase.from('sponsors').insert(newSponsor).select().single();
        if (error) throw error;

        VV.data.sponsors.push(data);
      }

      VV.admin.closeSponsorForm();
      await VV.admin.loadSponsors();
      if (VV.banner?.init) await VV.banner.init();
      VV.utils?.showSuccess?.(existing ? 'Anunciante actualizado' : 'Anunciante creado');
    } catch (error) {
      console.error('Error guardando anunciante:', error);
      alert('Error al guardar el anunciante: ' + (error.message || error));
    }
  },

  // Toggle anunciante
  async toggleSponsor(sponsorId) {
    const sponsor = VV.data.sponsors.find((s) => s.id === sponsorId);
    if (!sponsor) return;

    try {
      const newActive = !sponsor.active;
      const { error } = await supabase.from('sponsors').update({ active: newActive }).eq('id', sponsorId);
      if (error) throw error;

      sponsor.active = newActive;
      VV.admin.loadSponsors();
      if (VV.banner?.init) await VV.banner.init();
      VV.utils?.showSuccess?.(sponsor.active ? 'Anunciante activado' : 'Anunciante pausado');
    } catch (error) {
      console.error('Error actualizando anunciante:', error);
    }
  },

  // Eliminar anunciante
  async deleteSponsor(sponsorId) {
    if (!confirm('¿Eliminar este anunciante?')) return;

    try {
      const { error } = await supabase.from('sponsors').delete().eq('id', sponsorId);
      if (error) throw error;

      VV.data.sponsors = (VV.data.sponsors || []).filter((s) => s.id !== sponsorId);
      VV.admin.loadSponsors();
      if (VV.banner?.init) await VV.banner.init();
      VV.utils?.showSuccess?.('Anunciante eliminado');
    } catch (error) {
      console.error('Error eliminando anunciante:', error);
      alert('Error al eliminar el anunciante: ' + (error.message || error));
    }
  },

  // ========== OTRAS UTILIDADES ADMIN EXISTENTES ==========

  showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
    const btn = document.querySelector(`[onclick="VV.admin.showTab('${tabName}')"]`);
    if (btn) btn.classList.add('active');

    document.querySelectorAll('.admin-tab-content').forEach((content) => content.classList.remove('active'));
    const tab = document.getElementById(`admin-${tabName}`);
    if (tab) tab.classList.add('active');

    if (tabName === 'stats') VV.admin.loadStats();
    if (tabName === 'moderator-logs') VV.admin.loadModeratorLogs();
    if (tabName === 'featured') VV.admin.loadFeaturedOffers?.();
    if (tabName === 'avatars') VV.admin.loadAvatarsManagement?.();
    if (tabName === 'raffles') VV.admin.loadRafflesManagement?.();
  },

  loadStats() {
    const totalViews = (VV.data.sponsors || []).reduce((sum, s) => sum + (s.views || 0), 0);
    const totalClicks = (VV.data.sponsors || []).reduce((sum, s) => sum + (s.clicks || 0), 0);
    const v = document.getElementById('banner-views');
    const c = document.getElementById('banner-clicks');
    if (v) v.textContent = totalViews.toLocaleString();
    if (c) c.textContent = totalClicks.toLocaleString();
  },

  // ... (resto de utilidades de usuarios, mejoras, etc. sin cambios relevantes)

};

// ========== FLUJO USUARIO: SOLICITAR SER ANUNCIANTE ==========

window.requestSponsorStatus = function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });

  let overlay = document.getElementById('sponsor-request-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sponsor-request-overlay';
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="modal-form">
      <h3><i class="fas fa-bullhorn"></i> Solicitar ser Anunciante</h3>
      <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
        Envía tu solicitud al administrador para publicar anuncios
      </p>
      <form id="sponsor-request-form">
        <div class="form-group">
          <label>Nombre del negocio *</label>
          <input type="text" id="request-name" required>
        </div>
        <div class="form-group">
          <label>Descripción *</label>
          <input type="text" id="request-description" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Logo (emoji) *</label>
            <input type="text" id="request-logo" placeholder="🏪" required>
          </div>
          <div class="form-group">
            <label>Nivel deseado *</label>
            <select id="request-tier" required>
              <option value="">Seleccionar</option>
              <option value="premium">Premium</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Teléfono *</label>
          <input type="tel" id="request-contact" value="${VV.data.user?.phone || ''}" required>
        </div>
        <div class="form-group">
          <label>Sitio web</label>
          <input type="url" id="request-website" placeholder="https://...">
        </div>
        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick="document.getElementById('sponsor-request-overlay').classList.remove('active')">Cancelar</button>
          <button type="button" class="btn-save" onclick="window.submitSponsorRequest()">
            <i class="fas fa-paper-plane"></i> Enviar Solicitud
          </button>
        </div>
      </form>
    </div>
  `;

  overlay.classList.add('active');
  overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('active'); };
};

// Enviar solicitud: inserta en advertiser_requests (NO sponsors)
window.submitSponsorRequest = async function () {
  const businessName = document.getElementById('request-name').value.trim();
  const description = document.getElementById('request-description').value.trim();
  const logo = document.getElementById('request-logo').value.trim();
  const tier = document.getElementById('request-tier').value;
  const contact = document.getElementById('request-contact').value.trim();
  const website = document.getElementById('request-website').value.trim();

  if (!businessName || !description || !logo || !tier || !contact) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }

  try {
    const payload = {
      user_id: VV.data.user?.id,
      user_name: VV.data.user?.name,
      user_number: VV.data.user?.unique_number || VV.data.user?.phone || null,
      neighborhood: VV.data.neighborhood || null,
      message: description,
      status: 'pending',
      // snapshot de preferencia del sponsor
      business_name: businessName,
      logo,
      tier,
      contact,
      website: website || null,
    };

    const { error } = await supabase.from('advertiser_requests').insert(payload);
    if (error) throw error;

    document.getElementById('sponsor-request-overlay').classList.remove('active');
    VV.utils?.showSuccess?.('Solicitud enviada. El administrador la revisará pronto.');
  } catch (error) {
    console.error('❌ Error enviando solicitud de anunciante:', error);
    alert('Error al enviar la solicitud: ' + (error.message || error));
  }
};

// ========== GESTIÓN DE OFERTAS DESTACADAS ==========

VV.admin.loadFeaturedRequests = async function () {
  try {
    const container = document.getElementById('featured-requests-container');
    const list = document.getElementById('featured-requests-list');
    if (!container || !list) return;

    // Leer desde featured_requests con status pending
    const { data: requests, error } = await supabase
      .from('featured_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!requests || requests.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    list.innerHTML = requests
      .map((req) => `
        <div class="sponsor-request-card" style="border-left: 4px solid var(--warning-orange);">
          <div class="request-header">
            <div>
              <h4><i class="fas fa-star"></i> ${req.product_name || req.title || 'Destacado'}</h4>
              <p style="color: var(--gray-600); font-size: 0.85rem; margin-top: 0.25rem;">
                Solicitado por: ${req.user_name || 'Usuario'} ${req.user_number ? `#${req.user_number}` : ''} ${req.neighborhood ? `(${req.neighborhood})` : ''}
              </p>
            </div>
            <span class="request-tier-badge" style="background: var(--warning-orange);">${req.duration_days || req.duration || 7} DÍAS</span>
          </div>
          <div class="request-info">
            ${req.product_price ? `<p><strong>Precio:</strong> $${req.product_price} ${req.product_unit || ''}</p>` : ''}
            ${req.message ? `<p><strong>Mensaje:</strong> ${req.message}</p>` : (req.description ? `<p><strong>Descripción:</strong> ${req.description}</p>` : '')}
            <p><strong>Fecha de solicitud:</strong> ${new Date(req.created_at).toLocaleDateString()}</p>
          </div>
          <div class="request-actions">
            <input type="number" id="duration-${req.id}" value="${req.duration_days || 7}" min="1" max="90" style="width: 80px; padding: 0.5rem; margin-right: 0.5rem; border: 1px solid var(--gray-300); border-radius: 4px;">
            <label style="margin-right: 1rem; color: var(--gray-600);">días</label>
            <button class="btn-approve" onclick="VV.admin.approveFeaturedRequest('${req.id}')">
              <i class="fas fa-check"></i> Aprobar
            </button>
            <button class="btn-reject" onclick="VV.admin.rejectFeaturedRequest('${req.id}')">
              <i class="fas fa-times"></i> Rechazar
            </button>
          </div>
        </div>
      `)
      .join('');
  } catch (error) {
    console.error('Error cargando solicitudes de destacados:', error);
  }
};

// Aprobar destacado: actualiza featured_requests a approved
VV.admin.approveFeaturedRequest = async function (requestId) {
  const input = document.getElementById(`duration-${requestId}`);
  const duration = parseInt(input?.value || '7', 10);
  if (!duration || isNaN(duration)) {
    alert('Duración inválida');
    return;
  }
  try {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('featured_requests')
      .update({
        status: 'approved',
        reviewed_by: VV.data?.user?.id || null,
        reviewed_at: nowIso,
        duration_days: duration,
      })
      .eq('id', requestId);

    if (error) throw error;

    await VV.admin.loadFeaturedRequests();
    VV.utils?.showSuccess?.(`Solicitud de destacado aprobada por ${duration} días`);
  } catch (e) {
    console.error('Error aprobando destacado:', e);
    alert('No se pudo aprobar la solicitud.');
  }
};

// Rechazar destacado
VV.admin.rejectFeaturedRequest = async function (requestId) {
  if (!confirm('¿Rechazar esta solicitud de destacado?')) return;
  try {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('featured_requests')
      .update({
        status: 'rejected',
        reviewed_by: VV.data?.user?.id || null,
        reviewed_at: nowIso,
      })
      .eq('id', requestId);

    if (error) throw error;

    await VV.admin.loadFeaturedRequests();
    VV.utils?.showSuccess?.('Solicitud de destacado rechazada');
  } catch (e) {
    console.error('Error rechazando destacado:', e);
    alert('No se pudo rechazar la solicitud.');
  }
};

VV.admin.loadFeaturedOffers = function() {
    const allFeatured = JSON.parse(localStorage.getItem('featuredOffers') || '[]');
    const container = document.getElementById('featured-management');
    
    if (allFeatured.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay ofertas destacadas</p>';
        return;
    }
    
    // Agrupar por estado
    const active = allFeatured.filter(f => f.status === 'active' && !f.blocked && new Date(f.expiresAt) > new Date());
    const expired = allFeatured.filter(f => new Date(f.expiresAt) <= new Date());
    const blocked = allFeatured.filter(f => f.blocked);
    
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h4 style="color: var(--success-green);"><i class="fas fa-check-circle"></i> Activas (${active.length})</h4>
            <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                ${active.length > 0 ? active.map(f => VV.admin.renderFeaturedCard(f)).join('') : '<p style="color: var(--gray-600);">No hay ofertas activas</p>'}
            </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h4 style="color: var(--error-red);"><i class="fas fa-ban"></i> Bloqueadas (${blocked.length})</h4>
            <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                ${blocked.length > 0 ? blocked.map(f => VV.admin.renderFeaturedCard(f)).join('') : '<p style="color: var(--gray-600);">No hay ofertas bloqueadas</p>'}
            </div>
        </div>
        
        <div>
            <h4 style="color: var(--gray-600);"><i class="fas fa-clock"></i> Expiradas (${expired.length})</h4>
            <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                ${expired.length > 0 ? expired.map(f => VV.admin.renderFeaturedCard(f)).join('') : '<p style="color: var(--gray-600);">No hay ofertas expiradas</p>'}
            </div>
        </div>
    `;
};

VV.admin.renderFeaturedCard = function(offer) {
    const daysLeft = Math.ceil((new Date(offer.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft <= 0;
    
    return `
        <div style="background: white; border-radius: 8px; padding: 1rem; border-left: 4px solid ${offer.blocked ? 'var(--error-red)' : isExpired ? 'var(--gray-400)' : 'var(--warning-orange)'};">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <div style="flex: 1;">
                    <h5 style="margin: 0 0 0.25rem 0;">${offer.title}</h5>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--gray-600);">
                        ${offer.userName} #${offer.userNumber} - ${offer.neighborhood}
                    </p>
                </div>
                ${offer.blocked ? `
                    <span style="background: var(--error-red); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                        BLOQUEADA
                    </span>
                ` : isExpired ? `
                    <span style="background: var(--gray-400); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                        EXPIRADA
                    </span>
                ` : `
                    <span style="background: var(--success-green); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                        ACTIVA
                    </span>
                `}
            </div>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;"><strong>Producto:</strong> ${offer.productName || offer.product?.product || 'N/A'}</p>
            <div style="display: flex; gap: 1rem; margin: 0.5rem 0; font-size: 0.85rem;">
                <span><i class="fas fa-thumbs-up" style="color: var(--success-green);"></i> ${offer.goodVotes || 0}</span>
                <span><i class="fas fa-thumbs-down" style="color: var(--error-red);"></i> ${offer.badVotes || 0}</span>
                <span><i class="fas fa-clock"></i> ${isExpired ? 'Expirada' : `${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}</span>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                ${!offer.blocked && !isExpired ? `
                    <button class="btn-delete" onclick="VV.admin.deactivateFeatured('${offer.id}')" style="flex: 1;">
                        <i class="fas fa-ban"></i> Desactivar
                    </button>
                ` : ''}
                <button class="btn-delete" onclick="VV.admin.deleteFeatured('${offer.id}')" style="flex: 1;">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
};

VV.admin.deactivateFeatured = function(offerId) {
    if (!confirm('¿Desactivar esta oferta destacada?')) return;
    
    const allFeatured = JSON.parse(localStorage.getItem('featuredOffers') || '[]');
    const offerIndex = allFeatured.findIndex(f => f.id === offerId);
    
    if (offerIndex !== -1) {
        allFeatured[offerIndex].status = 'inactive';
        allFeatured[offerIndex].blocked = true;
        localStorage.setItem('featuredOffers', JSON.stringify(allFeatured));
        VV.admin.loadFeaturedOffers();
        VV.utils.showSuccess('Oferta desactivada');
    }
};

VV.admin.deleteFeatured = function(offerId) {
    if (!confirm('¿Eliminar esta oferta destacada permanentemente?')) return;
    
    const allFeatured = JSON.parse(localStorage.getItem('featuredOffers') || '[]');
    const filtered = allFeatured.filter(f => f.id !== offerId);
    localStorage.setItem('featuredOffers', JSON.stringify(filtered));
    VV.admin.loadFeaturedOffers();
    VV.utils.showSuccess('Oferta eliminada');
};

// ========== GESTIÓN DE AVATARES ==========

VV.admin.loadAvatarsManagement = async function() {
    if (!VV.utils.isAdmin()) return;
    
    const container = document.getElementById('avatars-management');
    container.innerHTML = '<p style="text-align: center; padding: 2rem;">Cargando avatares...</p>';
    
    // Obtener usuarios desde Supabase
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin')
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error cargando usuarios:', error);
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: red;">Error cargando usuarios</p>';
        return;
    }
    
    const premiumAvatars = VV.avatars.defaultAvatars.filter(a => a.premium);
    
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h4><i class="fas fa-gift"></i> Desbloquear Avatares Premium para Usuarios</h4>
            <p style="color: var(--gray-600); margin: 1rem 0;">
                Selecciona un usuario y un avatar premium para desbloquearlo como premio.
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end;">
                <div class="form-group">
                    <label>Usuario</label>
                    <select id="unlock-user-select" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                        <option value="">Seleccionar usuario</option>
                        ${users.map(u => `
                            <option value="${u.id}">${u.name} #${u.unique_number} - ${u.neighborhood}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Avatar Premium</label>
                    <select id="unlock-avatar-select" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                        <option value="">Seleccionar avatar</option>
                        ${premiumAvatars.map(a => `
                            <option value="${a.id}">${a.emoji} ${a.name} (${a.rarity})</option>
                        `).join('')}
                    </select>
                </div>
                <button class="btn-primary" onclick="VV.admin.unlockAvatarForUser()" style="padding: 0.75rem 1.5rem;">
                    <i class="fas fa-unlock"></i> Desbloquear
                </button>
            </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h4><i class="fas fa-users"></i> Usuarios y sus Avatares</h4>
            <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                ${users.map(user => {
                    const avatar = VV.avatars.getUserAvatar(user.id);
                    const unlockedAvatars = user.unlocked_avatars || [];
                    const totalPremium = premiumAvatars.length;
                    const unlockedPremium = unlockedAvatars.length;
                    
                    return `
                        <div style="background: white; border-radius: 12px; padding: 1.5rem; border-left: 4px solid var(--primary-blue); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary-blue), var(--primary-purple)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                                    ${avatar.emoji}
                                </div>
                                <div style="flex: 1;">
                                    <h5 style="margin: 0 0 0.25rem 0;">${user.name} #${user.unique_number}</h5>
                                    <p style="margin: 0; font-size: 0.85rem; color: var(--gray-600);">
                                        <i class="fas fa-map-marker-alt"></i> ${user.neighborhood}
                                    </p>
                                </div>
                                <div style="text-align: center; padding: 1rem; background: var(--gray-50); border-radius: 8px;">
                                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-purple);">
                                        ${unlockedPremium}/${totalPremium}
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--gray-600);">Premium</div>
                                </div>
                                <button class="btn-secondary" onclick="VV.admin.showUserAvatars('${user.id}')" style="padding: 0.5rem 1rem;">
                                    <i class="fas fa-eye"></i> Ver Colección
                                </button>
                            </div>
                            ${unlockedPremium > 0 ? `
                                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);">
                                    <p style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: var(--gray-600);">
                                        <i class="fas fa-star"></i> Avatares premium desbloqueados:
                                    </p>
                                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                        ${unlockedAvatars.map(avatarId => {
                                            const a = VV.avatars.defaultAvatars.find(av => av.id === avatarId);
                                            return a ? `
                                                <span style="background: var(--gray-100); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">
                                                    ${a.emoji} ${a.name}
                                                </span>
                                            ` : '';
                                        }).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
};

VV.admin.unlockAvatarForUser = function() {
    const userId = document.getElementById('unlock-user-select').value;
    const avatarId = document.getElementById('unlock-avatar-select').value;
    
    if (!userId || !avatarId) {
        alert('Selecciona un usuario y un avatar');
        return;
    }
    
    const user = VV.auth.getAllUsers().find(u => u.id === userId);
    const avatar = VV.avatars.defaultAvatars.find(a => a.id === avatarId);
    
    if (!user || !avatar) {
        alert('Usuario o avatar no encontrado');
        return;
    }
    
    if (VV.avatars.unlockAvatar(userId, avatarId)) {
        VV.utils.showSuccess(`Avatar "${avatar.name}" desbloqueado para ${user.name}`);
        VV.admin.loadAvatarsManagement();
    } else {
        alert('El usuario ya tiene este avatar desbloqueado');
    }
};

VV.admin.showUserAvatars = async function(userId) {
    // Obtener usuario desde Supabase
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error || !user) {
        console.error('Error obteniendo usuario:', error);
        return;
    }
    
    const unlockedAvatars = user.unlocked_avatars || [];
    const premiumAvatars = VV.avatars.defaultAvatars.filter(a => a.premium);
    
    let overlay = document.getElementById('user-avatars-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'user-avatars-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
        <div class="modal-form" style="max-width: 700px;">
            <h3><i class="fas fa-user-circle"></i> Colección de ${user.name}</h3>
            
            <div style="margin: 2rem 0;">
                <h4 style="color: var(--primary-purple); margin-bottom: 1rem;">
                    <i class="fas fa-star"></i> Avatares Premium (${unlockedAvatars.length}/${premiumAvatars.length})
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem;">
                    ${premiumAvatars.map(avatar => {
                        const isUnlocked = unlockedAvatars.includes(avatar.id);
                        return `
                            <div style="
                                padding: 1rem;
                                background: ${isUnlocked ? 'white' : 'var(--gray-100)'};
                                border: 2px solid ${isUnlocked ? 'var(--success-green)' : 'var(--gray-300)'};
                                border-radius: 12px;
                                text-align: center;
                                opacity: ${isUnlocked ? '1' : '0.5'};
                            ">
                                ${isUnlocked ? `
                                    <div style="position: absolute; top: 5px; right: 5px; background: var(--success-green); color: white; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem;">
                                        <i class="fas fa-check"></i>
                                    </div>
                                ` : `
                                    <div style="position: absolute; top: 5px; right: 5px; background: var(--error-red); color: white; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem;">
                                        <i class="fas fa-lock"></i>
                                    </div>
                                `}
                                <div style="font-size: 3rem; margin: 0.5rem 0; ${isUnlocked ? '' : 'filter: grayscale(100%);'}">
                                    ${avatar.emoji}
                                </div>
                                <div style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0.25rem;">
                                    ${avatar.name}
                                </div>
                                <div style="font-size: 0.7rem; color: var(--gray-600);">
                                    ${avatar.rarity}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div style="text-align: center;">
                <button class="btn-secondary" onclick="VV.admin.closeUserAvatars()">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        </div>
    `;
    
    overlay.classList.add('active');
    
    overlay.onclick = (e) => {
        if (e.target === overlay) VV.admin.closeUserAvatars();
    };
};

VV.admin.closeUserAvatars = function() {
    const overlay = document.getElementById('user-avatars-overlay');
    if (overlay) overlay.classList.remove('active');
};

// ========== GESTIÓN DE SORTEOS ==========

VV.admin.loadRafflesManagement = function() {
    if (!VV.utils.isAdmin()) return;
    
    const container = document.getElementById('raffles-management');
    const raffles = JSON.parse(localStorage.getItem('raffles') || '[]');
    const activeRaffles = raffles.filter(r => r.status === 'active');
    const completedRaffles = raffles.filter(r => r.status === 'completed');
    
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <button class="btn-primary" onclick="VV.raffle.createRaffle()">
                <i class="fas fa-plus"></i> Crear Nuevo Sorteo
            </button>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h4 style="color: var(--primary-blue);"><i class="fas fa-dice"></i> Sorteos Activos (${activeRaffles.length})</h4>
            ${activeRaffles.length === 0 ? `
                <p style="color: var(--gray-600); padding: 2rem; text-align: center; background: var(--gray-50); border-radius: 8px;">
                    No hay sorteos activos
                </p>
            ` : `
                <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                    ${activeRaffles.map(raffle => `
                        <div style="background: white; border-radius: 12px; padding: 1.5rem; border-left: 4px solid var(--primary-purple); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div style="flex: 1;">
                                    <h5 style="margin: 0 0 0.5rem 0; color: var(--primary-purple);">
                                        <i class="fas fa-dice"></i> ${raffle.title}
                                    </h5>
                                    <p style="margin: 0; color: var(--gray-700);">${raffle.description}</p>
                                </div>
                                <span style="background: var(--success-green); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                                    ACTIVO
                                </span>
                            </div>
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                                <p style="margin: 0 0 0.5rem 0;"><strong>🎁 Premio:</strong> ${raffle.prizeData.prizeDisplay}</p>
                                <p style="margin: 0 0 0.5rem 0;"><strong>📍 Dirigido a:</strong> ${raffle.target === 'all' ? 'Todos los barrios' : raffle.target}</p>
                                <p style="margin: 0;"><strong>📅 Creado:</strong> ${new Date(raffle.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button class="btn-primary" onclick="VV.raffle.executeRaffle('${raffle.id}')" style="width: 100%;">
                                <i class="fas fa-play"></i> Ejecutar Sorteo
                            </button>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
        
        <div>
            <h4 style="color: var(--success-green);"><i class="fas fa-trophy"></i> Sorteos Completados (${completedRaffles.length})</h4>
            ${completedRaffles.length === 0 ? `
                <p style="color: var(--gray-600); padding: 2rem; text-align: center; background: var(--gray-50); border-radius: 8px;">
                    No hay sorteos completados
                </p>
            ` : `
                <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                    ${completedRaffles.map(raffle => `
                        <div style="background: white; border-radius: 12px; padding: 1.5rem; border-left: 4px solid var(--success-green); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div style="flex: 1;">
                                    <h5 style="margin: 0 0 0.5rem 0; color: var(--success-green);">
                                        <i class="fas fa-trophy"></i> ${raffle.title}
                                    </h5>
                                    <p style="margin: 0; color: var(--gray-700);">${raffle.description}</p>
                                </div>
                                <span style="background: var(--gray-400); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                                    COMPLETADO
                                </span>
                            </div>
                            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                                <p style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--gray-800);">
                                    🎉 Ganador: ${raffle.winnerName} #${raffle.winnerNumber}
                                </p>
                                <p style="margin: 0;"><strong>🎁 Premio:</strong> ${raffle.prizeData.prizeDisplay}</p>
                            </div>
                            <div style="font-size: 0.85rem; color: var(--gray-600);">
                                <p style="margin: 0;"><strong>📅 Realizado:</strong> ${new Date(raffle.drawnAt).toLocaleDateString()} ${new Date(raffle.drawnAt).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
};

console.log('✅ Módulo ADMIN cargado');
