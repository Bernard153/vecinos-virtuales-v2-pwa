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
        // Carga filtrada por barrio para no saturar el sistema
        async loadFromSupabase() {
            const n = VV.data.neighborhood;
            try {
                const [p, s, c, i] = await Promise.all([
                    supabase.from('products').select('*').eq('neighborhood', n),
                    supabase.from('services').select('*').eq('neighborhood', n),
                    supabase.from('cultural_posts').select('*').eq('neighborhood', n),
                    supabase.from('improvements').select('*').eq('neighborhood', n)
                ]);
                VV.data.products = p.data || [];
                VV.data.services = s.data || [];
                VV.data.culturalPosts = c.data || [];
                VV.data.improvements = i.data || [];
                console.log("✅ Datos del barrio cargados");
            } catch (e) { console.error("Error cargando datos", e); }
        }
    },
    utils: {
        showScreen(id) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            const target = document.getElementById(id);
            if (target) target.classList.add('active');
        },
        showSection(id) {
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const target = document.getElementById(id);
            if (target) target.classList.add('active');
            window.scrollTo(0, 0);
            // Cargas específicas de sección
            if (id === 'admin') VV.admin.load();
            if (id === 'marketplace') VV.marketplace.load();
            if (id === 'shopping') VV.marketplace.loadShopping();
        },
        isAdmin: () => VV.data.user && VV.data.user.role === 'admin'
    }
};
