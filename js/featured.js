// ========== MÓDULO OFERTAS DESTACADAS V2 (Táctil y por Barrio) ==========

VV.featured = {
    currentIndex: 0,
    items: [],
    startX: 0,
    isDragging: false,
    autoPlayTimer: null,

    // Cargar ofertas destacadas filtradas por barrio
    async loadFeaturedOffers() {
        console.log("✨ Cargando destacados para el barrio:", VV.data.neighborhood);
        const container = document.getElementById('featured-container');
        if (!container) return;

        try {
            // Buscamos productos que sean destacados y del barrio actual o globales
            // Nota: Se asume que has añadido 'is_featured' y 'scope' a tu tabla 'products'
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_featured', true)
                .or(`neighborhood.eq."${VV.data.neighborhood}",featured_scope.eq.global`);

            if (error) throw error;

            this.items = data || [];
            this.renderCarousel(container);
            
        } catch (e) {
            console.error("Error cargando destacados:", e);
            container.innerHTML = `<p style="padding:20px; text-align:center; color:#94a3b8;">Cargando destacados...</p>`;
        }
    },

    renderCarousel(container) {
        if (this.items.length === 0) {
            container.innerHTML = ''; // Ocultar si no hay nada
            return;
        }

        container.innerHTML = `
            <div class="featured-section-wrapper">
                <div class="featured-carousel" id="vv-main-carousel">
                    <div class="featured-track" id="featured-track">
                        ${this.items.map(item => `
                            <div class="featured-slide">
                                <img src="${item.image_url || 'https://via.placeholder.com/800x400'}" alt="${item.product}">
                                <div class="featured-overlay">
                                    <div class="featured-info">
                                        <h3>${item.product}</h3>
                                        <p>${item.business || 'Vendedor local'}</p>
                                    </div>
                                    <div class="featured-actions">
                                        <a href="https://wa.me/${item.contact}?text=Hola! Vi tu producto destacado en Vecinos Virtuales: ${item.product}" 
                                           target="_blank" class="btn-contact-wa">
                                            <i class="fab fa-whatsapp"></i> Consultar
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="carousel-indicators" id="carousel-dots">
                        ${this.items.map((_, i) => `<div class="indicator-dot ${i===0?'active':''}"></div>`).join('')}
                    </div>
                </div>
            </div>
        `;

        this.initEvents();
        this.startAutoPlay();
    },

    initEvents() {
        const carousel = document.getElementById('vv-main-carousel');
        const track = document.getElementById('featured-track');
        if (!carousel || !track) return;

        // Eventos Táctiles (Swipe)
        carousel.addEventListener('touchstart', (e) => {
            this.startX = e.touches[0].clientX;
            this.isDragging = true;
            this.stopAutoPlay();
        });

        carousel.addEventListener('touchend', (e) => {
            if (!this.isDragging) return;
            const endX = e.changedTouches[0].clientX;
            const diff = this.startX - endX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) this.next();
                else this.prev();
            }
            this.isDragging = false;
            this.startAutoPlay();
        });

        // Soporte para Mouse (Desktop)
        carousel.addEventListener('mousedown', (e) => {
            this.startX = e.clientX;
            this.isDragging = true;
            this.stopAutoPlay();
        });

        window.addEventListener('mouseup', (e) => {
            if (!this.isDragging) return;
            const diff = this.startX - e.clientX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.next();
                else this.prev();
            }
            this.isDragging = false;
            this.startAutoPlay();
        });
    },

    updateUI() {
        const track = document.getElementById('featured-track');
        const dots = document.querySelectorAll('.indicator-dot');
        if (!track) return;

        track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    },

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.updateUI();
    },

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
        this.updateUI();
    },

    startAutoPlay() {
        this.stopAutoPlay();
        if (this.items.length > 1) {
            this.autoPlayTimer = setInterval(() => this.next(), 5000);
        }
    },

    stopAutoPlay() {
        if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
    }
};

console.log('✅ Módulo FEATURED V2 cargado con soporte para barrios');
