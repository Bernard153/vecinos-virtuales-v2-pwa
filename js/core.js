// ========== VECINOS VIRTUALES - MÓDULO CORE ==========
// Sistema base y datos globales

window.VV = window.VV || {};
    VV.data = {
        user: null,
        neighborhood: '',
        products: [],
        improvements: [],
        culturalPosts: [],
        services: [],
        sponsors: [],
        cart: [],
        users: [],
        moderatorLogs: [], // Registro de actividad de moderadores
        
        // Cargar datos desde Supabase
        async loadFromSupabase() {
            try {
                // Cargar productos
                const { data: products } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                VV.data.products = products || [];
                
                // Cargar servicios
                const { data: services } = await supabase
                    .from('services')
                    .select('*')
                    .order('created_at', { ascending: false });
                VV.data.services = services || [];
                
                // Cargar publicaciones culturales
                const { data: culturalPosts } = await supabase
                    .from('cultural_posts')
                    .select('*')
                    .order('created_at', { ascending: false });
                VV.data.culturalPosts = culturalPosts || [];
                
                // Cargar mejoras
                const { data: improvements } = await supabase
                    .from('improvements')
                    .select('*')
                    .order('created_at', { ascending: false });
                VV.data.improvements = improvements || [];
                
                // Cargar anunciantes
                const { data: sponsors } = await supabase
                    .from('sponsors')
                    .select('*')
                    .order('created_at', { ascending: false });
                VV.data.sponsors = sponsors || [];
                
                console.log('✅ Datos cargados desde Supabase');
            } catch (error) {
                console.error('Error cargando datos:', error);
            }
        }
    },
    
    // Datos de ejemplo
    sampleData: {
        sponsors: [
            {
                id: '1',
                name: 'Supermercado Central',
                description: 'Tu supermercado de confianza',
                logo: '🏪',
                tier: 'premium',
                contact: '+54 11 1111-1111',
                website: 'https://supermercadocentral.com',
                active: true,
                views: 1250,
                clicks: 89
            },
            {
                id: '2',
                name: 'Farmacia San José',
                description: 'Salud y bienestar',
                logo: '💊',
                tier: 'gold',
                contact: '+54 11 2222-2222',
                website: 'https://farmaciasanjose.com',
                active: true,
                views: 890,
                clicks: 45
            },
            {
                id: '3',
                name: 'Panadería Artesanal',
                description: 'Pan fresco todos los días',
                logo: '🥖',
                tier: 'silver',
                contact: '+54 11 3333-3333',
                website: 'https://panaderiaartesanal.com',
                active: true,
                views: 567,
                clicks: 23
            }
        ]
    },
    
    // Utilidades
    utils: {
        showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(screenId).classList.add('active');
        },
        
        showSection(sectionId, addToHistory = true) {
            // Agregar al historial del navegador
            if (addToHistory && history.pushState) {
                history.pushState({ section: sectionId }, '', `#${sectionId}`);
            }
            
            // Scroll al inicio
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Actualizar menú
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            const menuItem = document.querySelector(`[data-section="${sectionId}"]`);
            if (menuItem) menuItem.classList.add('active');
            
            // Mostrar sección
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');
            
            // Cargar contenido según sección
            switch(sectionId) {
                case 'marketplace':
                    VV.marketplace.load();
                    break;
                case 'shopping':
                    VV.marketplace.loadShopping();
                    break;
                case 'improvements':
                    VV.improvements.load();
                    break;
                case 'cultural':
                    VV.cultural.load();
                    break;
                case 'services':
                    VV.services.load();
                    break;
                case 'admin':
                    if (VV.utils.isAdmin()) {
                        VV.admin.load();
                    }
                    break;
                case 'users-management':
                    if (VV.utils.isAdmin()) {
                        VV.admin.loadUsers();
                    }
                    break;
                case 'admin-neighborhoods':
                    if (VV.utils.isAdmin()) {
                        VV.admin.loadAllNeighborhoods();
                    }
                    break;
                case 'admin-products':
                    if (VV.utils.isAdmin()) {
                        VV.admin.loadAllProducts();
                    }
                    break;
                case 'admin-improvements':
                    if (VV.utils.isAdmin()) {
                        VV.admin.loadAllImprovements();
                    }
                    break;
                case 'moderator':
                    if (VV.utils.isModerator()) {
                        VV.moderator.load();
                    }
                    break;
            }
        },
        
        // Inicializar navegación con historial
        initNavigation() {
            // Manejar botón atrás del navegador
            window.addEventListener('popstate', (event) => {
                if (event.state && event.state.section) {
                    // Navegar a la sección del historial sin agregar nueva entrada
                    VV.utils.showSection(event.state.section, false);
                } else {
                    // Si no hay estado, volver al dashboard y prevenir salida
                    VV.utils.showSection('dashboard', false);
                    // Agregar estado para que no salga de la app
                    if (history.pushState) {
                        history.pushState({ section: 'dashboard' }, '', '#dashboard');
                    }
                }
            });
            
            // Establecer estado inicial
            if (history.replaceState) {
                history.replaceState({ section: 'dashboard' }, '', '#dashboard');
            }
            
            // Prevenir salida accidental de la app
            window.addEventListener('beforeunload', (event) => {
                // Solo mostrar advertencia si el usuario está intentando cerrar/recargar
                // No mostrar si está navegando dentro de la app
                const currentSection = document.querySelector('.content-section.active')?.id;
                if (currentSection && currentSection !== 'dashboard') {
                    // No hacer nada, permitir navegación interna
                    return;
                }
            });
        },
        
        showSuccess(message) {
            const div = document.createElement('div');
            div.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
            document.body.appendChild(div);
        },
        
        generateId() {
            return Date.now().toString() + Math.random().toString(36).substr(2, 9);
        },
        // Verificar si es admin
        isAdmin() {
            return VV.data.user && VV.data.user.role === 'admin';
        },
        
        isModerator() {
            return VV.data.user && VV.data.user.role === 'moderator';
        },
        
        // Verificar si tiene permisos de moderación (admin o moderador)
        canModerate() {
            return VV.utils.isAdmin() || VV.utils.isModerator();
        },
        
        // Registrar acción de moderador
        logModeratorAction(action, details) {
            if (!VV.utils.isModerator() && !VV.utils.isAdmin()) return;
            
            const log = {
                id: VV.utils.generateId(),
                moderatorId: VV.data.user.id,
                moderatorName: VV.data.user.name,
                neighborhood: VV.data.neighborhood,
                action: action,
                details: details,
                timestamp: new Date().toISOString()
            };
            
            // Cargar logs existentes
            const logs = JSON.parse(localStorage.getItem('moderatorLogs') || '[]');
            logs.unshift(log); // Agregar al inicio
            
            // Mantener solo los últimos 500 logs
            if (logs.length > 500) {
                logs.splice(500);
            }
            
            localStorage.setItem('moderatorLogs', JSON.stringify(logs));
        },
        
        // Obtener logs de moderadores
        getModeratorLogs(neighborhood = null, limit = 100) {
            const logs = JSON.parse(localStorage.getItem('moderatorLogs') || '[]');
            
            if (neighborhood) {
                return logs.filter(log => log.neighborhood === neighborhood).slice(0, limit);
            }
            
            return logs.slice(0, limit);
        }
    }
};

// Hacer showSection global para onclick
window.showSection = VV.utils.showSection;
console.log('✅ Módulo CORE cargado');
