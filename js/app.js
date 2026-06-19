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

console.log('✅ Módulo APP cargado correctamente');
