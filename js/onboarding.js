// ============================================================
// 🎤 ONBOARDING VOCES VIRTUALES - Tutorial de Bienvenida
// ============================================================

window.VV_ONBOARDING = {
    slides: [
        {
            title: "Bienvenido a tu Barrio Virtual",
            desc: "Conéctate de forma real con las personas que viven cerca de ti.",
            icon: "🏘️"
        },
        {
            title: "Comunidad y Eventos",
            desc: "Propón mejoras para el barrio, entérate de eventos deportivos y culturales.",
            icon: "📢"
        },
        {
            title: "Voces Virtuales",
            desc: "Graba canciones, opina, diviértete y regala íconos a tus vecinos.",
            icon: "🎤"
        },
        {
            title: "Economía Local",
            desc: "Compra, vende, busca en el comparador de precios y publica en el folleto.",
            icon: "💰"
        }
    ],
    
    currentSlide: 0,
    
    init: function() {
        // Verificar si ya lo vio
        if (!VV_ROLES.shouldShowOnboarding()) {
            this.hide();
            return;
        }
        
        this.render();
        this.show();
    },
    
    render: function() {
        // Crear el contenedor si no existe
        let container = document.getElementById('vv-onboarding');
        if (!container) {
            container = document.createElement('div');
            container.id = 'vv-onboarding';
            container.className = 'vv-onboarding-container';
            container.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 999999 !important; display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%); color: white; font-family: inherit;';
            document.body.appendChild(container);
        }
        
        const slide = this.slides[this.currentSlide];
        const isLast = this.currentSlide === this.slides.length - 1;
        
        container.innerHTML = `
            <div class="vv-onboarding-slide">
                <button class="vv-onboarding-skip" onclick="VV_ONBOARDING.finish()">Saltar</button>
                
                <div class="vv-onboarding-content">
                    <span class="vv-onboarding-icon">${slide.icon}</span>
                    <h2 class="vv-onboarding-title">${slide.title}</h2>
                    <p class="vv-onboarding-desc">${slide.desc}</p>
                </div>
                
                <div class="vv-onboarding-footer">
                    <div class="vv-onboarding-dots">
                        ${this.slides.map((_, idx) => `
                            <div class="vv-onboarding-dot ${idx === this.currentSlide ? 'active' : ''}"></div>
                        `).join('')}
                    </div>
                    <button class="vv-onboarding-btn" onclick="VV_ONBOARDING.next()">
                        ${isLast ? 'Empezar a Explorar' : 'Siguiente'}
                    </button>
                </div>
            </div>
        `;
    },
    
    next: function() {
        if (this.currentSlide < this.slides.length - 1) {
            this.currentSlide++;
            this.render();
        } else {
            this.finish();
        }
    },
    
    finish: function() {
        VV_ROLES.markOnboardingSeen();
        this.hide();
    },
    
    show: function() {
        const container = document.getElementById('vv-onboarding');
        if (container) container.style.display = 'flex';
    },
    
    hide: function() {
        const container = document.getElementById('vv-onboarding');
        if (container) container.style.display = 'none';
    }
};
