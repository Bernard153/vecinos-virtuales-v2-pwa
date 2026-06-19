VV.landing = {
    carouselIntervals: {},
    
    async init() {
        VV.utils.showScreen('landing-screen');
        await this.loadFeeds();
        this.startAutoScroll();
    },
    
    async loadFeeds() {
        const categories = [
            { id: 'cultura', icon: 'fa-palette', defaultTitle: 'Cultura y Eventos' },
            { id: 'mejoras', icon: 'fa-tools', defaultTitle: 'Mejoras' },
            { id: 'comercios', icon: 'fa-store', defaultTitle: 'Comercios' }
        ];
        
        for (const cat of categories) {
            const container = document.getElementById(`feed-${cat.id}`);
            if (!container) continue;
            
            try {
                const { data, error } = await supabase
                    .from('landing_content')
                    .select('*')
                    .eq('category', cat.id)
                    .eq('active', true)
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                if (error) throw error;
                
                if (!data || data.length === 0) {
                    container.innerHTML = `
                        <div style="min-width: 100%; height: 160px; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.15); color: white; text-align: center; padding: 1rem;">
                            <i class="fas ${cat.icon}" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.6;"></i>
                            <div style="font-weight: 600;">Vecinos Virtuales</div>
                            <div style="font-size: 0.85rem; opacity: 0.7;">${cat.defaultTitle}</div>
                        </div>`;
                    continue;
                }
                
                container.innerHTML = data.map(item => `
                    <div class="feed-item" style="min-width: 280px; height: 160px; border-radius: 12px; overflow: hidden; position: relative; flex-shrink: 0; cursor: pointer; border: 1px solid rgba(255,255,255,0.2);" onclick="VV.landing.handleFeedClick('${cat.id}')">
                        ${item.type === 'video' 
                            ? `<video src="${item.url}" muted loop playsinline style="width:100%; height:100%; object-fit:cover; pointer-events:none;"></video>`
                            : `<img src="${item.url}" style="width:100%; height:100%; object-fit:cover; pointer-events:none;" alt="${item.title || ''}">`}
                        ${item.title ? `<div style="position:absolute; bottom:0; left:0; right:0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 2rem 0.75rem 0.75rem; font-size: 0.85rem; font-weight: 600;">${item.title}</div>` : ''}
                    </div>
                `).join('');
                
            } catch (err) {
                console.error('Error cargando feed', cat.id, err);
                container.innerHTML = `<div style="color: rgba(255,255,255,0.6); padding: 2rem;">Error cargando contenido</div>`;
            }
        }
    },
    
    startAutoScroll() {
        document.querySelectorAll('.feed-carousel').forEach((carousel, index) => {
            let scrollPos = 0;
            const speed = 0.5 + (index * 0.2);
            
            this.carouselIntervals[index] = setInterval(() => {
                if (carousel.matches(':hover') || carousel.matches(':active')) return;
                scrollPos += speed;
                if (scrollPos >= carousel.scrollWidth - carousel.clientWidth) {
                    scrollPos = 0;
                }
                carousel.scrollLeft = scrollPos;
            }, 20);
        });
    },
    
    stopAutoScroll() {
        Object.values(this.carouselIntervals).forEach(clearInterval);
    },
    
    handleFeedClick(category) {
        this.goToRegister();
    },
    
    goToVocesVirtuales() {
        this.goToRegister();
    },
    
    goToComparador() {
        VV.utils.showScreen('main-app');
        VV.utils.showSection('shopping');
    },
    
    goToRegister() {
        VV.utils.showScreen('terms-screen');
    },
    
    goToLogin() {
        if (typeof VV.authCelular !== 'undefined' && VV.authCelular.showLogin) {
            VV.authCelular.showLogin();
        } else {
            console.error('Módulo auth-celular no cargado');
        }
    }
};

console.log('✅ Módulo LANDING cargado');
