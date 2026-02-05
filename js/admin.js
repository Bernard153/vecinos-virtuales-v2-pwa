// ========== MÓDULO ADMINISTRACIÓN ==========

VV.admin = {
    sponsorRequests: [],
    
    // Cargar panel de admin
    load() {
        if (!VV.utils.isAdmin()) {
            alert('No tienes permisos de administrador');
            return;
        }
        
        VV.admin.loadSponsorRequests();
        VV.admin.loadFeaturedRequests();
        VV.admin.loadSponsors();
    },
    
    // Cargar solicitudes pendientes de anunciantes
    loadSponsorRequests() {
        const requests = JSON.parse(localStorage.getItem('sponsorRequests') || '[]');
        const pending = requests.filter(r => r.status === 'pending');
        
        const container = document.getElementById('sponsor-requests-container');
        const list = document.getElementById('sponsor-requests-list');
        
        if (!container || !list) return;

        if (pending.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        list.innerHTML = pending.map(req => `
            <div class="sponsor-request-card">
                <div class="request-header">
                    <h4>${req.logo} ${req.name}</h4>
                    <span class="request-tier-badge ${req.tier}">${req.tier.toUpperCase()}</span>
                </div>
                <div class="request-info">
                    <p><i class="fas fa-info-circle"></i> ${req.description}</p>
                    <p><i class="fas fa-phone"></i> ${req.contact}</p>
                </div>
                <div class="request-actions">
                    <button class="btn-approve" onclick="VV.admin.approveSponsorRequest('${req.id}')">Aprobar</button>
                    <button class="btn-reject" onclick="VV.admin.rejectSponsorRequest('${req.id}')">Rechazar</button>
                </div>
            </div>
        `).join('');
    },
    
    // Aprobar anunciante
    approveSponsorRequest(requestId) {
        const requests = JSON.parse(localStorage.getItem('sponsorRequests') || '[]');
        const request = requests.find(r => r.id === requestId);
        if (!request) return;
        
        const newSponsor = {
            id: VV.utils.generateId(),
            name: request.name,
            description: request.description,
            logo: request.logo,
            tier: request.tier,
            contact: request.contact,
            active: true,
            views: 0,
            clicks: 0
        };
        
        VV.data.sponsors.push(newSponsor);
        request.status = 'approved';
        localStorage.setItem('sponsorRequests', JSON.stringify(requests));
        VV.admin.load();
        alert('Anunciante aprobado');
    },

    // Gestión de Pestañas (Tabs)
    showTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[onclick*="showTab('${tabName}')"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
        const targetContent = document.getElementById(`admin-${tabName}`);
        if (targetContent) targetContent.classList.add('active');
        
        if (tabName === 'stats') VV.admin.loadStats();
        if (tabName === 'moderator-logs') VV.admin.loadModeratorLogs();
        if (tabName === 'featured') VV.admin.loadFeaturedOffers();
    },

    // --- AUDITORÍA GLOBAL (BARRIOS, PRODUCTOS, MEJORAS) ---

    loadAllNeighborhoods() {
        const users = VV.auth.getAllUsers();
        const neighborhoods = new Map();
        
        users.forEach(u => {
            if (u.neighborhood && u.neighborhood !== 'Administrador') {
                if (!neighborhoods.has(u.neighborhood)) {
                    neighborhoods.set(u.neighborhood, { name: u.neighborhood, count: 0 });
                }
                neighborhoods.get(u.neighborhood).count++;
            }
        });

        const listContainer = document.getElementById('admin-neighborhoods-list');
        if (!listContainer) return;

        listContainer.innerHTML = Array.from(neighborhoods.values()).map(n => `
            <div class="neighborhood-stat-card">
                <h3>${n.name}</h3>
                <p>Vecinos: ${n.count}</p>
                <button onclick="alert('Detalles de ${n.name}')">Ver Informe</button>
            </div>
        `).join('');
    },

    loadAllProducts() {
        const list = document.getElementById('admin-products-list');
        if (!list) return;
        list.innerHTML = VV.data.products.map(p => `
            <div class="admin-item-card">
                <span><strong>${p.neighborhood}</strong> - ${p.product} ($${p.price})</span>
                <button onclick="VV.admin.deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    },

    loadAllImprovements() {
        const list = document.getElementById('admin-improvements-list');
        if (!list) return;
        list.innerHTML = VV.data.improvements.map(i => `
            <div class="admin-item-card">
                <span><strong>${i.neighborhood}</strong>: ${i.title} [${i.status}]</span>
                <button onclick="VV.admin.deleteImprovement('${i.id}')"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    },

    // --- LOGS DE ACTIVIDAD ---

    loadModeratorLogs() {
        const container = document.getElementById('moderator-logs-list');
        if (!container) return;
        const logs = VV.utils.getModeratorLogs();
        
        if (logs.length === 0) {
            container.innerHTML = '<p>No hay actividad reciente.</p>';
            return;
        }

        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr><th>Fecha</th><th>Moderador</th><th>Barrio</th><th>Acción</th></tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>${new Date(log.timestamp).toLocaleString()}</td>
                            <td>${log.moderatorName}</td>
                            <td>${log.neighborhood}</td>
                            <td>${log.action}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    // --- SOLICITUDES DE DESTACADOS (SUPABASE) ---

    async loadFeaturedRequests() {
        try {
            const { data: requests } = await supabase.from('featured_requests').select('*').eq('status', 'pending');
            const list = document.getElementById('featured-requests-list');
            if (!list || !requests) return;

            list.innerHTML = requests.map(req => `
                <div class="admin-request-card">
                    <p><strong>${req.product_name}</strong> por ${req.user_name} (${req.neighborhood})</p>
                    <button onclick="VV.admin.approveFeaturedRequest('${req.id}')">Aprobar</button>
                </div>
            `).join('');
        } catch (e) { console.error(e); }
    },

    async approveFeaturedRequest(id) {
        if (!confirm('¿Aprobar este destacado?')) return;
        await supabase.from('featured_requests').update({ status: 'active' }).eq('id', id);
        VV.admin.loadFeaturedRequests();
        alert('Destacado activado');
    },

    deleteProduct(id) {
        if (!confirm('¿Eliminar producto globalmente?')) return;
        VV.data.products = VV.data.products.filter(p => p.id !== id);
        localStorage.setItem('vecinosVirtuales_products', JSON.stringify(VV.data.products));
        VV.admin.loadAllProducts();
    }
};

console.log('✅ Módulo ADMIN original cargado');
