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
        moderatorLogs: [],
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
            { id: '1', name: 'Supermercado Central', description: 'Tu supermercado de confianza', logo: '🏪', tier: 'premium', active: true },
            { id: '2', name: 'Farmacia San José', description: 'Salud y bienestar', logo: '💊', tier: 'gold', active: true },
            { id: '3', name: 'Panadería Artesanal', description: 'Pan fresco todos los días', logo: '🥖', tier: 'silver', active: true }
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
    } 
};
