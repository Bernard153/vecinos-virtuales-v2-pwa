// ========== VECINOS VIRTUALES - MÓDULO CORE ==========
// Sistema base y datos globales

const VV = {
    data: {
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
        folleto: [],
        
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
                // ... debajo de VV.data.culturalPosts = culturalPosts || [];

                // Cargar datos del Folleto Visual (Solo aprobados)
                const { data: folletoData } = await supabase
                    .from('folleto_imagenes')
                    .select('*')
                    .eq('aprobado', true)
                    .order('created_at', { ascending: false });
                VV.data.folleto = folletoData || [];
                
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
            const el = document.getElementById(screenId);
            if (el) el.classList.add('active');
        },
        
        showSection(sectionId, addToHistory = true) {
            if (addToHistory && history.pushState) {
                history.pushState({ section: sectionId }, '', `#${sectionId}`);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            const menuItem = document.querySelector(`[data-section="${sectionId}"]`);
            if (menuItem) menuItem.classList.add('active');
            document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
            const sectionEl = document.getElementById(sectionId);
            if (sectionEl) sectionEl.classList.add('active');
            
            switch(sectionId) {
                case 'marketplace': VV.marketplace.load(); break;
                case 'shopping': VV.marketplace.loadShopping(); break;
                case 'improvements': VV.improvements.load(); break;
                case 'cultural': VV.cultural.load(); break;
                case 'services': VV.services.load(); break;
                case 'folleto': 
                    if (typeof abrirFolletoVisual === 'function') abrirFolletoVisual(); 
                    break;
                case 'admin':
                    if (VV.utils.isAdmin()) {
                        VV.admin.load();
                        if (typeof cargarSolicitudesPendientes === 'function') cargarSolicitudesPendientes();
                    }
                    break;
            }
        },
        
        initNavigation() {
            window.addEventListener('popstate', (event) => {
                if (event.state && event.state.section) {
                    VV.utils.showSection(event.state.section, false);
                } else {
                    VV.utils.showSection('dashboard', false);
                }
            });
            if (history.replaceState) {
                history.replaceState({ section: 'dashboard' }, '', '#dashboard');
            }
        },

        activarFolleto() {
            const folletoCont = document.getElementById('folleto-container');
            const btnPlus = document.getElementById('btn-mostrar-form');
            if (VV.data.user) {
                if (folletoCont) folletoCont.style.display = 'block';
                if (btnPlus) btnPlus.style.display = 'flex';
            }
        },

        generateId() {
            return Date.now().toString() + Math.random().toString(36).substr(2, 9);
        },

        isAdmin() { return VV.data.user && VV.data.user.role === 'admin'; },
        isModerator() { return VV.data.user && VV.data.user.role === 'moderator'; },
        
        logModeratorAction(action, details) {
            if (!VV.data.user) return;
            const logData = {
                id: VV.utils.generateId(),
                moderatorId: VV.data.user.id,
                action: action,
                details: details,
                timestamp: new Date().toISOString()
            };
            const logs = JSON.parse(localStorage.getItem('moderatorLogs') || '[]');
            logs.unshift(logData);
            localStorage.setItem('moderatorLogs', JSON.stringify(logs.slice(0, 500)));
        },

        showSuccess(message) {
            console.log("Success:", message);
        }
    } // Asegúrate de que esta llave cierre bien el objeto utils
}; // Esta llave cierra el objeto VV principal
        // Módulo de Folleto (AQUÍ VA LA FUNCIÓN NUEVA BIEN UBICADA)
        activarFolleto() {
            const folletoCont = document.getElementById('folleto-container');
            const btnPlus = document.getElementById('btn-mostrar-form');
    
            if (VV.data.user) {
                if (folletoCont) folletoCont.style.display = 'block';
                if (btnPlus) btnPlus.style.display = 'flex';
                console.log('📖 Módulo de Folleto activado para el usuario');
            }
        },
            
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
        },
        
        // Calcular tiempo transcurrido
        timeAgo(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);
            
            if (seconds < 60) return 'hace unos segundos';
            
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
            
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
            
            const days = Math.floor(hours / 24);
            if (days < 7) return `hace ${days} día${days > 1 ? 's' : ''}`;
            
            const weeks = Math.floor(days / 7);
            if (weeks < 4) return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
            
            const months = Math.floor(days / 30);
            if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`;
            
            const years = Math.floor(days / 365);
            return `hace ${years} año${years > 1 ? 's' : ''}`;
        },
        
        // Sanitizar HTML para prevenir XSS
        sanitizeHTML(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        // Sanitizar URL para prevenir javascript: y data:
        sanitizeURL(url) {
            if (!url) return '';
            const lower = url.toLowerCase().trim();
            if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
                return '';
            }
            return url;
        }
    }
};

// Hacer showSection global para onclick
window.showSection = VV.utils.showSection;
console.log('✅ Módulo CORE cargado');
