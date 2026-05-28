// ============================================================
// VECINOS VIRTUALES - MÓDULO CORE MAESTRO UNIFICADO V5
// ============================================================

const VV = {
    data: {
        user: null,
        neighborhood: 'Lomas de Tafí', // Barrio insignia por defecto para invitados
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
                // Sincronización segura de sesión persistente para evitar bloqueos del Admin
                if (!VV.data.user) {
                    const sessionUser = localStorage.getItem('vv_user_session');
                    if (sessionUser) VV.data.user = JSON.parse(sessionUser);
                }

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
                
                console.log('✅ Datos de Folleto y Core cargados con éxito desde Supabase');
                
                // Disparador de seguridad: Si estamos en el Dashboard de inicio, forzamos el dibujado de la cartelera
                if (typeof window.VV !== 'undefined' && window.VV.featured && typeof window.VV.featured.renderNovedadesCarrusel === 'function') {
                    window.VV.featured.renderNovedadesCarrusel();
                }
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
        canModerate() {
            try {
                const user = VV.data.user || JSON.parse(localStorage.getItem('vv_user_session'));
                return !!(user && (user.role === 'admin' || user.role === 'moderator'));
            } catch(e) { return false; }
        },

        // 📺 CONTROLADOR DE LONAS GIGANTES DE PANTALLA
        showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(s => {
                s.classList.remove('active');
                s.style.display = 'none'; // Forzamos el apagado físico para evitar bloqueos
            });
            const el = document.getElementById(screenId);
            if (el) {
                el.classList.add('active');
                el.style.display = 'block';
            }
        },
        
        // 🚀 CONTROLADOR DE MÓDULOS DEL INTERIOR (EL STAND DE NAVEGACIÓN)
        showSection(sectionId, addToHistory = true) {
            document.body.style.overflow = 'auto'; 
            
            // 🚨 EL LEVANTADOR DE TELÓN AUTOMÁTICO:
            // Si el sistema navega al dashboard o secciones, nos aseguramos de pulverizar las pantallas de bloqueo
            const pantallasCarga = ['loading-screen', 'location-screen', 'auth-screen', 'registration-screen', 'login-screen'];
            pantallasCarga.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.classList.remove('active');
                    el.style.display = 'none';
                }
            });

            const folletoCont = document.getElementById('folleto-container');
            if (folletoCont) {
                folletoCont.classList.remove('active');
                folletoCont.style.display = 'none';
            }

            if (addToHistory && history.pushState) {
                history.pushState({ section: sectionId }, '', `#${sectionId}`);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // 🛡️ RED DE SEGURIDAD PROTECTORA EN LA NAVEGACIÓN DEL MENÚ INFERIOR
            try {
                document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
                const menuItem = document.querySelector(`[data-section="${sectionId}"]`);
                if (menuItem) {
                    menuItem.classList.add('active');
                }
            } catch (err) {
                console.log("Aviso de menú: Navegando mediante acceso directo externo.");
            }
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });
            
            const sectionEl = document.getElementById(sectionId);
            if (sectionEl) {
                sectionEl.classList.add('active');
                sectionEl.style.display = 'block';
            }

            // 🌟 ACTIVADOR DE LA NUEVA CARTELERA COMERCIAL EXCLUSIVA POR BARRIO
            if (sectionId === 'dashboard' || sectionId === '') {
                if (typeof window.VV !== 'undefined' && window.VV.featured && typeof window.VV.featured.renderNovedadesCarrusel === 'function') {
                    window.VV.featured.renderNovedadesCarrusel();
                }
            }

            try {
                if (sectionId === 'marketplace' && VV.marketplace) VV.marketplace.load();
                if (sectionId === 'services' && VV.services) VV.services.load();
                if (sectionId === 'improvements' && VV.improvements) VV.improvements.load();
                if (sectionId === 'cultural' && VV.cultural) VV.cultural.load();
                
                // 👑 CONEXIÓN BLINDADA DEL ADMINISTRADOR SUPREMO
                if (sectionId === 'admin') {
                    if (VV.utils.isAdmin()) {
                        if (VV.admin && typeof VV.admin.load === 'function') VV.admin.load();
                        if (typeof window.cargarSolicitudesPendientes === 'function') {
                            window.cargarSolicitudesPendientes();
                        }
                    } else {
                        console.warn("⚠️ Acceso denegado: No posees rol de Administrador Supremo.");
                        VV.utils.showSection('dashboard');
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
        
        // 🔒 VALIDACIONES JERÁRQUICAS AMPLIADAS CON RESPALDO LOCAL
        isAdmin() { 
            const user = VV.data.user || JSON.parse(localStorage.getItem('vv_user_session'));
            return !!(user && user.role === 'admin'); 
        },
        isModerator() { 
            const user = VV.data.user || JSON.parse(localStorage.getItem('vv_user_session'));
            return !!(user && user.role === 'moderator'); 
        },
        
        logModeratorAction(action, details) {
            const user = VV.data.user || JSON.parse(localStorage.getItem('vv_user_session'));
            if (!user) return;
            const logData = {
                id: VV.utils.generateId(),
                moderatorId: user.id,
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

window.VV = VV;
console.log('✅ Columna Vertebral CORE V5 unificada, blindada e indestructible cargada.');
