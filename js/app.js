// ========== INICIALIZACIÓN DE LA APLICACIÓN ==========

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Vecinos Virtuales V2 - Iniciando...');
    
    // ===== ACCESO ADMIN DIRECTO =====
    if (window.location.hash === '#admin-login') {
        VV.utils.showScreen('login-screen');
        return;
    }
    
    // ===== MODO INVITADO GUARDADO =====
    if (localStorage.getItem('vv_guest_mode') === 'true') {
        VV.data.isGuest = true;
        VV.data.neighborhood = 'Mi Barrio';
        VV.utils.showScreen('main-app');
        VV.utils.showSection('dashboard');
        VV.guest.init();
                // Mostrar banner de invitado
        const guestBanner = document.getElementById('guest-banner');
        if (guestBanner) guestBanner.style.display = 'block';
        
        // Ocultar créditos
        const creditsBar = document.getElementById('user-credits-bar');
        if (creditsBar) creditsBar.style.display = 'none';
        setupNavigation();
        return;
    }
    
    VV.utils.showScreen('loading-screen');
    await new Promise(r => setTimeout(r, 800));
    
    const hasSession = await VV.auth.checkExistingUser();
    
    if (hasSession) {
        console.log('👤 Sesión activa, iniciando app...');
        VV.auth.startApp();
        if (VV.utils.activarFolleto) VV.utils.activarFolleto();
        await VV.geo.init();
        VV.geo.updateLocationUI();
    } else {
        console.log('👋 Nuevo usuario, mostrando landing...');
        VV.landing.init();
    }
    
    setupNavigation();
});

function setupNavigation() {
    document.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            e.preventDefault();
            const section = menuItem.dataset.section;
            if (section) {
                VV.utils.showSection(section);
            }
        }
    });
}

// ========== MÓDULO INVITADO ==========
VV.guest = {
    init() {
        console.log('👀 Modo invitado activado');
        
        // Header genérico
        const headerNeighborhood = document.getElementById('header-neighborhood');
        const headerUserNumber = document.getElementById('header-user-number');
        if (headerNeighborhood) headerNeighborhood.textContent = 'Modo Invitado';
        if (headerUserNumber) headerUserNumber.textContent = '---';
        
        // Banner de invitado
        const welcomeName = document.getElementById('welcome-name');
        const welcomeNeighborhood = document.getElementById('welcome-neighborhood');
        const welcomeNumber = document.getElementById('welcome-number');
        if (welcomeName) welcomeName.textContent = 'Invitado';
        if (welcomeNeighborhood) welcomeNeighborhood.textContent = 'Explorá Vecinos Virtuales';
        if (welcomeNumber) welcomeNumber.textContent = '---';
        
        // Ocultar botones que no puede usar
        this.restrictActions();
        
        // Cargar contenido público
        this.loadPublicContent();
    },
    
    restrictActions() {
        // Agregar clase a botones que requieren auth
        document.querySelectorAll('.module-card, .btn-primary').forEach(btn => {
            const onclick = btn.getAttribute('onclick') || '';
            if (onclick.includes('showForm') || onclick.includes('create') || onclick.includes('publish')) {
                btn.setAttribute('data-requires-auth', 'true');
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm('🔒 Esta acción requiere una cuenta gratuita.\n\n¿Querés registrarte ahora?')) {
                        VV.landing.goToRegister();
                    }
                };
            }
        });
    },
    
    async loadPublicContent() {
        // Cargar productos públicos
        if (typeof VV.marketplace !== 'undefined') {
            VV.marketplace.loadShopping();
        }
    }
};
// ========== FEED DE ACTIVIDAD ==========
VV.dashboard = {
    async loadActivityFeed() {
        const container = document.getElementById('activity-feed');
        if (!container) return;
        
        const neighborhood = VV.data.neighborhood || 'Mi Barrio';
        
        try {
            // Traer últimas cosas de todas las tablas relevantes
            const [products, improvements, cultural, alerts] = await Promise.all([
                supabase.from('products').select('id, name, price, created_at, seller_name').eq('neighborhood', neighborhood).order('created_at', { ascending: false }).limit(3),
                supabase.from('improvements').select('id, title, status, created_at').eq('neighborhood', neighborhood).order('created_at', { ascending: false }).limit(3),
                supabase.from('cultural_posts').select('id, title, type, created_at').eq('neighborhood', neighborhood).order('created_at', { ascending: false }).limit(3),
                supabase.from('community_alerts').select('id, type, description, created_at').eq('neighborhood', neighborhood).order('created_at', { ascending: false }).limit(2)
            ]);
            
            let allItems = [];
            
            if (products.data) {
                products.data.forEach(p => allItems.push({
                    type: 'product',
                    icon: '🛒',
                    color: '#10b981',
                    text: `<strong>${p.name}</strong> a $${p.price}`,
                    date: p.created_at
                }));
            }
            
            if (improvements.data) {
                improvements.data.forEach(i => allItems.push({
                    type: 'improvement',
                    icon: '🔧',
                    color: '#f59e0b',
                    text: `Nueva mejora: <strong>${i.title}</strong>`,
                    date: i.created_at
                }));
            }
            
            if (cultural.data) {
                cultural.data.forEach(c => allItems.push({
                    type: 'cultural',
                    icon: '🎨',
                    color: '#8b5cf6',
                    text: `Publicación cultural: <strong>${c.title}</strong>`,
                    date: c.created_at
                }));
            }
            
            if (alerts.data) {
                alerts.data.forEach(a => allItems.push({
                    type: 'alert',
                    icon: '📢',
                    color: '#ef4444',
                    text: `Alerta: ${a.description?.substring(0, 50) || 'Nueva alerta'}...`,
                    date: a.created_at
                }));
            }
            
            // Ordenar por fecha más reciente
            allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Tomar solo los 5 más recientes
            allItems = allItems.slice(0, 5);
            
            if (allItems.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; color: var(--gray-500); padding: 2rem 0;">
                        <i class="fas fa-wind" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                        Aún no hay actividad en ${neighborhood}.<br>
                        <span style="font-size: 0.9rem;">¡Sé el primero en publicar algo!</span>
                    </div>`;
                return;
            }
            
            container.innerHTML = allItems.map(item => `
                <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid var(--gray-100); transition: background 0.2s; border-radius: 8px;" onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background='transparent'">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: ${item.color}15; color: ${item.color}; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
                        ${item.icon}
                    </div>
                    <div style="flex: 1; font-size: 0.9rem; color: var(--gray-800); line-height: 1.4;">
                        ${item.text}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--gray-500); white-space: nowrap;">
                        ${this.timeAgo(item.date)}
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error cargando feed:', error);
            container.innerHTML = `
                <div style="text-align: center; color: var(--gray-500); padding: 2rem 0;">
                    <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
                    No se pudo cargar la actividad reciente.
                </div>`;
        }
    },
    
    timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'ahora';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    }
};

console.log('✅ Módulo APP cargado correctamente');
