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
                if (sectionId === 'admin-neighborhoods' && VV.admin.loadAllNeighborhoods) {
                    VV.admin.loadAllNeighborhoods();
                }
                if (sectionId === 'admin-products' && VV.admin.loadAllProducts) {
                    VV.admin.loadAllProducts();
                }
                if (sectionId === 'admin-improvements' && VV.admin.loadAllImprovements) {
                    VV.admin.loadAllImprovements();
                }
                if (sectionId === 'admin-users' && VV.admin.loadAllUsers) {
                    VV.admin.loadAllUsers();
                }
                if (sectionId === 'admin-wallet' && VV.admin.loadAllWallets) {
                    VV.admin.loadAllWallets();
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

// ========== SISTEMA DE MENSAJES ADMIN-USUARIO ==========

// Cargar mensajes del usuario
async function cargarMensajeAdmin() {
    const user = VV_ROLES.getCurrentUser();
    if (!user) return;

    try {
        // Verificar si el usuario tiene mensajes habilitados
        const { data: userData } = await supabase.from('users').select('mensajes_habilitados').eq('id', user.id).single();
        if (userData && userData.mensajes_habilitados === false) return;

        // Buscar hilos abiertos para este usuario
        const { data: mensajes, error } = await supabase
            .from('mensajes_admin')
            .select('*')
            .eq('user_id', user.id)
            .eq('thread_status', 'open')
            .order('created_at', { ascending: true });

        if (error || !mensajes || mensajes.length === 0) return;

        // Agrupar por thread_id, tomar el más reciente
        const threads = {};
        mensajes.forEach(m => {
            if (!threads[m.thread_id]) threads[m.thread_id] = [];
            threads[m.thread_id].push(m);
        });

        const threadIds = Object.keys(threads);
        const latestThread = threads[threadIds[threadIds.length - 1]];
        const lastMsg = latestThread[latestThread.length - 1];

        const notif = document.getElementById('mensaje-admin-notificacion');
        const preview = document.getElementById('mensaje-admin-preview');
        const badge = document.getElementById('mensaje-admin-badge');

        if (notif && preview) {
            // Mostrar resumen del último mensaje
            const msgCount = latestThread.length;
            const ultimo = lastMsg.sender === 'admin' ? 'Admin' : 'Tú';
            preview.textContent = `${ultimo}: ${lastMsg.mensaje.substring(0, 50)}... (${msgCount} mensaje${msgCount > 1 ? 's' : ''})`;
            notif.style.display = 'block';
        }
        
        window.mensajeAdminThread = latestThread;
        window.mensajeAdminThreadId = latestThread[0].thread_id;
    } catch (err) {
        console.error('Error cargando mensaje:', err);
    }
}

// Abrir mensaje
function abrirMensajeAdmin() {
    const thread = window.mensajeAdminThread;
    if (!thread || thread.length === 0) return;

    const modal = document.getElementById('mensaje-admin-modal');
    const contenido = document.getElementById('mensaje-admin-contenido');
    
    if (modal && contenido) {
        const user = VV_ROLES.getCurrentUser();
        contenido.innerHTML = `
            <div style="max-height:300px;overflow-y:auto;margin-bottom:1rem;">
                ${thread.map(m => `
                    <div style="padding:0.5rem;margin-bottom:0.5rem;border-radius:8px;${m.sender === 'admin' ? 'background:#dbeafe;margin-left:2rem;' : 'background:#f1f5f9;margin-right:2rem;'}">
                        <span style="font-size:0.75rem;color:#94a3b8;">${m.sender === 'admin' ? '👤 Administrador' : '💬 Tú'}</span>
                        <p style="font-size:0.9rem;margin:0.3rem 0;">${m.mensaje}</p>
                        <span style="font-size:0.65rem;color:#cbd5e1;">${new Date(m.created_at).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        `;
        modal.style.display = 'flex';
    }
}

// Cerrar mensaje
function cerrarMensajeAdmin() {
    const modal = document.getElementById('mensaje-admin-modal');
    if (modal) modal.style.display = 'none';
}

// Enviar respuesta
async function enviarRespuestaAdmin() {
    const threadId = window.mensajeAdminThreadId;
    const respuesta = document.getElementById('mensaje-admin-respuesta')?.value.trim();
    const user = VV_ROLES.getCurrentUser();
    
    if (!threadId || !respuesta) {
        alert('Escribí una respuesta antes de enviar.');
        return;
    }
    
    try {
        await supabase.from('mensajes_admin').insert({
            admin_id: null,
            user_id: user.id,
            thread_id: threadId,
            sender: 'user',
            mensaje: respuesta,
            thread_status: 'open',
            respondido: true,
            responded_at: new Date().toISOString()
        });
        
        alert('✅ Respuesta enviada al administrador.');
        cerrarMensajeAdmin();
        
        // Recargar el hilo actualizado
        window.mensajeAdminThread = null;
        window.mensajeAdminThreadId = null;
        
        // Recargar notificación
        setTimeout(cargarMensajeAdmin, 500);
        
    } catch (err) {
        alert('Error al enviar respuesta: ' + err.message);
    }
}

// Exportamos para que sea global
window.VV = VV;
