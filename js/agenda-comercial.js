// ============================================
// AGENDA COMERCIAL - Panel de Administración
// ============================================

VV.agenda = {
    data: [],
    filtered: [],
    filters: {
        status: 'all',
        space: 'all',
        payment: 'all',
        search: ''
    },

    async init() {
        await this.loadSpaces();
    },

    async loadSpaces() {
        try {
            const { data, error } = await supabase
                .from('sponsor_spaces')
                .select(`
                    *,
                    sponsor:sponsors(id, business_name, contact, neighborhoods, active)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.data = data || [];
            this.applyFilters();
        } catch (e) {
            console.error('Error cargando espacios:', e);
            VV.utils.showSuccess('Error al cargar agenda comercial');
        }
    },

    applyFilters() {
        let result = [...this.data];

        // Filtro por estado
        if (this.filters.status === 'active') {
            result = result.filter(s => s.active);
        } else if (this.filters.status === 'inactive') {
            result = result.filter(s => !s.active);
        } else if (this.filters.status === 'expired') {
            const today = new Date().toISOString().split('T')[0];
            result = result.filter(s => s.end_date && s.end_date < today);
        }

        // Filtro por espacio
        if (this.filters.space !== 'all') {
            result = result.filter(s => s.space_type === this.filters.space);
        }

        // Filtro por pago
        if (this.filters.payment === 'paid') {
            result = result.filter(s => s.paid);
        } else if (this.filters.payment === 'unpaid') {
            result = result.filter(s => !s.paid && s.amount > 0);
        } else if (this.filters.payment === 'free') {
            result = result.filter(s => s.amount === 0);
        }

        // Búsqueda
        if (this.filters.search) {
            const q = this.filters.search.toLowerCase();
            result = result.filter(s => {
                const name = (s.sponsor?.business_name || '').toLowerCase();
                const contact = (s.sponsor?.contact || '').toLowerCase();
                return name.includes(q) || contact.includes(q);
            });
        }

        this.filtered = result;
        this.renderTable();
    },

    renderTable() {
        const container = document.getElementById('agenda-table-body');
        if (!container) return;

        if (this.filtered.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                        No hay espacios publicitarios registrados
                    </td>
                </tr>
            `;
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        container.innerHTML = this.filtered.map(s => {
            const isExpired = s.end_date && s.end_date < today;
            const isFree = s.amount === 0;
            const business = s.sponsor?.business_name || 'Sin nombre';
            const contact = s.sponsor?.contact || '';

            return `
                <tr style="${isExpired ? 'opacity: 0.5;' : ''}">
                    <td style="font-weight: 600;">${business}</td>
                    <td><span class="agenda-badge agenda-${s.space_type}">${s.space_type}</span></td>
                    <td>${s.start_date ? this.formatDate(s.start_date) : '-'}</td>
                    <td>${s.end_date ? this.formatDate(s.end_date) : '-'}</td>
                    <td>${isFree ? '<span style="color: #10b981;">Sin cargo</span>' : '$' + (s.amount || 0).toLocaleString()}</td>
                    <td>
                        ${isFree ? '-' : s.paid 
                            ? '<span style="color: #10b981; font-weight: 600;">✓ Sí</span>' 
                            : '<span style="color: #ef4444; font-weight: 600;">No</span>'}
                    </td>
                    <td>
                        <span style="padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;
                            ${s.active 
                                ? 'background: #d1fae5; color: #065f46;' 
                                : 'background: #fee2e2; color: #991b1b;'}">
                            ${s.active ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>${isExpired ? '<span style="color: #ef4444;">Vencido</span>' : ''}</td>
                    <td>
                        <button onclick="VV.agenda.openEditModal('${s.id}')" style="border: none; background: var(--primary-blue); color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                            ✏️ Editar
                        </button>
                        <button onclick="VV.agenda.deleteSpace('${s.id}')" style="border: none; background: #ef4444; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; margin-left: 4px;">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Actualar contador
        const counter = document.getElementById('agenda-count');
        if (counter) counter.textContent = this.filtered.length;
    },

    formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    },

    openEditModal(id) {
        const space = this.data.find(s => s.id === id);
        if (!space) return;

        const overlay = document.getElementById('agenda-edit-overlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 500px;">
                <h3 style="margin: 0 0 1.5rem 0;">Editar espacio - ${space.sponsor?.business_name || ''}</h3>
                
                <div style="display: grid; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Espacio</label>
                        <select id="edit-space-type" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                            <option value="banner" ${space.space_type === 'banner' ? 'selected' : ''}>Banner</option>
                            <option value="folleto" ${space.space_type === 'folleto' ? 'selected' : ''}>Folleto</option>
                            <option value="destacado" ${space.space_type === 'destacado' ? 'selected' : ''}>Destacado</option>
                            <option value="flash" ${space.space_type === 'flash' ? 'selected' : ''}>Flash</option>
                            <option value="vip" ${space.space_type === 'vip' ? 'selected' : ''}>VIP</option>
                        </select>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Inicio</label>
                            <input type="date" id="edit-start" value="${space.start_date || ''}" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Fin</label>
                            <input type="date" id="edit-end" value="${space.end_date || ''}" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                        </div>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Importe ($)</label>
                        <input type="number" id="edit-amount" value="${space.amount || 0}" min="0" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                        <small style="color: var(--gray-500);">0 = Sin cargo (colaborador/invitado)</small>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="edit-paid" ${space.paid ? 'checked' : ''}>
                            <span style="font-weight: 600;">Abonado</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="edit-active" ${space.active ? 'checked' : ''}>
                            <span style="font-weight: 600;">Activo</span>
                        </label>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Notas</label>
                        <textarea id="edit-notes" rows="2" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--gray-300);">${space.notes || ''}</textarea>
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem; justify-content: flex-end;">
                    <button onclick="VV.agenda.closeEditModal()" class="btn-secondary">Cancelar</button>
                    <button onclick="VV.agenda.saveSpace('${id}')" class="btn-primary">Guardar</button>
                </div>
            </div>
        `;
        overlay.style.display = 'flex';
    },

    closeEditModal() {
        const overlay = document.getElementById('agenda-edit-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    async saveSpace(id) {
        const space = this.data.find(s => s.id === id);
        if (!space) return;

        const update = {
            space_type: document.getElementById('edit-space-type').value,
            start_date: document.getElementById('edit-start').value || null,
            end_date: document.getElementById('edit-end').value || null,
            amount: parseFloat(document.getElementById('edit-amount').value) || 0,
            paid: document.getElementById('edit-paid').checked,
            active: document.getElementById('edit-active').checked,
            notes: document.getElementById('edit-notes').value
        };

        try {
            const { error } = await supabase
                .from('sponsor_spaces')
                .update(update)
                .eq('id', id);

            if (error) throw error;

            this.closeEditModal();
            await this.loadSpaces();
            VV.utils.showSuccess('Espacio actualizado');
        } catch (e) {
            console.error('Error guardando:', e);
            alert('Error: ' + e.message);
        }
    },

    async openAddModal() {
        // Cargar lista de sponsors para el select
        const { data: sponsors } = await supabase
            .from('sponsors')
            .select('id, business_name')
            .order('business_name');

        const overlay = document.getElementById('agenda-edit-overlay');
        if (!overlay) return;

        const today = new Date().toISOString().split('T')[0];

        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 500px;">
                <h3 style="margin: 0 0 1.5rem 0;">Nuevo espacio publicitario</h3>
                
                <div style="display: grid; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Anunciante</label>
                        <select id="add-sponsor" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                            ${(sponsors || []).map(s => `<option value="${s.id}">${s.business_name}</option>`).join('')}
                        </select>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Espacio</label>
                        <select id="add-space-type" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                            <option value="banner">Banner</option>
                            <option value="folleto">Folleto</option>
                            <option value="destacado">Destacado</option>
                            <option value="flash">Flash</option>
                            <option value="vip">VIP</option>
                        </select>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Inicio</label>
                            <input type="date" id="add-start" value="${today}" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Fin</label>
                            <input type="date" id="add-end" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                        </div>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Importe ($)</label>
                        <input type="number" id="add-amount" value="0" min="0" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--gray-300);">
                        <small style="color: var(--gray-500);">0 = Sin cargo (colaborador/invitado)</small>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="add-paid">
                            <span style="font-weight: 600;">Abonado</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="add-active" checked>
                            <span style="font-weight: 600;">Activo</span>
                        </label>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Notas</label>
                        <textarea id="add-notes" rows="2" placeholder="Observaciones..." style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--gray-300);"></textarea>
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem; justify-content: flex-end;">
                    <button onclick="VV.agenda.closeEditModal()" class="btn-secondary">Cancelar</button>
                    <button onclick="VV.agenda.addSpace()" class="btn-primary">Crear espacio</button>
                </div>
            </div>
        `;
        overlay.style.display = 'flex';
    },

    async addSpace() {
        const newSpace = {
            sponsor_id: document.getElementById('add-sponsor').value,
            space_type: document.getElementById('add-space-type').value,
            start_date: document.getElementById('add-start').value || null,
            end_date: document.getElementById('add-end').value || null,
            amount: parseFloat(document.getElementById('add-amount').value) || 0,
            paid: document.getElementById('add-paid').checked,
            active: document.getElementById('add-active').checked,
            notes: document.getElementById('add-notes').value
        };

        if (!newSpace.sponsor_id) {
            alert('Seleccioná un anunciante');
            return;
        }

        try {
            const { error } = await supabase
                .from('sponsor_spaces')
                .insert(newSpace);

            if (error) throw error;

            this.closeEditModal();
            await this.loadSpaces();
            VV.utils.showSuccess('Espacio creado');
        } catch (e) {
            console.error('Error creando:', e);
            alert('Error: ' + e.message);
        }
    },

    async deleteSpace(id) {
        if (!confirm('¿Eliminar este espacio publicitario?')) return;

        try {
            const { error } = await supabase
                .from('sponsor_spaces')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.loadSpaces();
            VV.utils.showSuccess('Espacio eliminado');
        } catch (e) {
            console.error('Error eliminando:', e);
            alert('Error: ' + e.message);
        }
    },

    setFilter(key, value) {
        this.filters[key] = value;
        this.applyFilters();
    },

    exportCSV() {
        const headers = ['Comercio', 'Espacio', 'Inicio', 'Fin', 'Importe', 'Abonado', 'Activo', 'Notas'];
        const rows = this.filtered.map(s => [
            s.sponsor?.business_name || '',
            s.space_type,
            s.start_date || '',
            s.end_date || '',
            s.amount || 0,
            s.paid ? 'Sí' : 'No',
            s.active ? 'Sí' : 'No',
            s.notes || ''
        ]);

        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agenda-comercial.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
};
