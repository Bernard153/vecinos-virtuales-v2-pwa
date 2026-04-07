// ========== VECINOS VIRTUALES - MÓDULO CORE (CORREGIDO) ==========
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
        
        async loadFromSupabase() {
            try {
                const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });
                VV.data.products = products || [];
                
                const { data: services } = await supabase.from('services').select('*').order('created_at', { ascending: false });
                VV.data.services = services || [];
                
                const { data: culturalPosts } = await supabase.from('cultural_posts').select('*').order('created_at', { ascending: false });
                VV.data.culturalPosts = culturalPosts || [];

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
        // FUNCIÓN CRÍTICA RESTAURADA: Verifica permisos para Mejoras, Cultura y Servicios
        canModerate() {
            try {
                const user = VV.data.user || JSON.parse(localStorage.getItem('vv_user_session'));
                return !!(user && (user.role === 'admin' || user.role === 'moderator'));
            } catch(e) { return false; }
        },

        showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            const el = document.getElementById(screenId);
            if (el) el.classList.add('active');
        },
        
        showSection(sectionId, addToHistory = true) {
            document.body.style.overflow = 'auto'; 
            const folletoCont = document.getElementById('folleto-container');
            if (folletoCont) {
                folletoCont.classList.remove('active');
                folletoCont.style.display = 'none'; // Limpia la pantalla gigante
            }

            if (addToHistory && history.pushState) {
                history.pushState({ section: sectionId }, '', `#${sectionId}`);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            const menuItem = document.querySelector(`[data-section="${sectionId}"]`);
            if (menuItem) menuItem.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });
            
            const sectionEl = document.getElementById(sectionId);
            if (sectionEl) {
                sectionEl.classList.add('active');
                sectionEl.style.display = 'block';
            }
            
            try {
                // Ejecutamos la carga de cada módulo
                if (sectionId === 'marketplace' && VV.marketplace) VV.marketplace.load();
                if (sectionId === 'services' && VV.services) VV.services.load();
                if (sectionId === 'improvements' && VV.improvements) VV.improvements.load();
                if (sectionId === 'cultural' && VV.cultural) VV.cultural.load();
                
                if (sectionId === 'admin') {
                    if (VV.utils.isAdmin()) {
                        VV.admin.load();
                        if (typeof window.cargarSolicitudesPendientes === 'function') {
                            window.cargarSolicitudesPendientes();
                        }
                    }
                }
                if (sectionId === 'folleto') {
                    if (typeof window.abrirFolletoVisual === 'function') {
                        window.abrirFolletoVisual();
                    }
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

// Exportamos para que sea global
window.VV = VV;
