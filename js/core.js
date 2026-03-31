// ========== VECINOS VIRTUALES - MÓDULO CORE ==========
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
        folleto: [], // Nueva tabla de folleto
        
        async loadFromSupabase() {
            try {
                const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });
                VV.data.products = products || [];
                
                const { data: services } = await supabase.from('services').select('*').order('created_at', { ascending: false });
                VV.data.services = services || [];
                
                const { data: culturalPosts } = await supabase.from('cultural_posts').select('*').order('created_at', { ascending: false });
                VV.data.culturalPosts = culturalPosts || [];

                // Carga de Folleto (Solo Aprobados)
                const { data: folletoData } = await supabase.from('folleto_imagenes').select('*').eq('aprobado', true).order('created_at', { ascending: false });
                VV.data.folleto = folletoData || [];
                
                const { data: improvements } = await supabase.from('improvements').select('*').order('created_at', { ascending: false });
                VV.data.improvements = improvements || [];
                
                const { data: sponsors } = await supabase.from('sponsors').select('*').order('created_at', { ascending: false });
                VV.data.sponsors = sponsors || [];
                
                console.log('✅ Datos de Folleto y Core cargados');
            } catch (error) {
                console.error('Error en loadFromSupabase:', error);
            }
        }
    },
    
    sampleData: {
        sponsors: [
            { id: '1', name: 'Supermercado Central', description: 'Tu súper', logo: '🏪', tier: 'premium', active: true }
        ]
    },
    
    utils: {
        showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            const el = document.getElementById(screenId);
            if (el) el.classList.add('active');
        },
        
                showSection(sectionId, addToHistory = true) {
            // 1. Restaurar scroll y limpiar bloqueos
            document.body.style.overflow = 'auto'; 
            const folletoCont = document.getElementById('folleto-container');
            if (folletoCont) folletoCont.classList.remove('active');

            if (addToHistory && history.pushState) {
                history.pushState({ section: sectionId }, '', `#${sectionId}`);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // 2. Actualizar Menú
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            const menuItem = document.querySelector(`[data-section="${sectionId}"]`);
            if (menuItem) menuItem.classList.add('active');
            
            // 3. Mostrar Sección y OCULTAR las demás
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none'; // Asegura que no interfieran
            });
            
            const sectionEl = document.getElementById(sectionId);
            if (sectionEl) {
                sectionEl.classList.add('active');
                sectionEl.style.display = 'block';
            }
            
            // 4. Cargar contenido específico (Aseguramos que no falle)
            try {
                switch(sectionId) {
                    case 'marketplace': VV.marketplace?.load(); break;
                    case 'services': VV.services?.load(); break;
                    case 'admin':
                        if (VV.utils.isAdmin()) {
                            VV.admin.load();
                            // Ejecuta moderación solo si la función existe
                            if (typeof window.cargarSolicitudesPendientes === 'function') {
                                window.cargarSolicitudesPendientes();
                            }
                        }
                        break;
                    case 'folleto':
                        if (typeof window.abrirFolletoVisual === 'function') {
                            window.abrirFolletoVisual();
                        }
                        break;
                }
            } catch (e) {
                console.error("Error cargando módulo:", sectionId, e);
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
            if (folletoCont) folletoCont.style.display = 'block';
            if (btnPlus) btnPlus.style.display = 'flex';
        },

        generateId() { return Date.now().toString() + Math.random().toString(36).substr(2, 9); },
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

        showSuccess(message) { console.log("Success:", message); }
    } 
};
