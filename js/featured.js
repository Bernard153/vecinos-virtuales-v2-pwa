// ========== MÓDULO OFERTAS DESTACADAS (Versión Integrada Vecinos Virtuales) ==========

VV.featured = {
    currentIndex: 0,
    items: [],
    autoPlayTimer: null,

    /**
     * Solicitar destacar oferta
     * Abre el formulario modal con opción de mensaje y selección de producto.
     */
    requestFeatured() {
        // Obtenemos los productos del usuario logueado desde la data global
        const userProducts = VV.data.products.filter(p => p.seller_id === VV.data.user.id);
        
        if (userProducts.length === 0) {
            alert('Primero debes publicar al menos un producto en el Marketplace para poder destacarlo.');
            VV.utils.showSection('marketplace');
            return;
        }
        
        let overlay = document.getElementById('featured-request-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'featured-request-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-star"></i> Solicitar Oferta Destacada</h3>
                <p style="color: var(--gray-600); margin-bottom: 1.5rem; font-size: 0.9rem;">
                    Tu oferta aparecerá en el inicio de <strong>${VV.data.neighborhood}</strong>.
                    <br><small style="color: var(--error-red);">⚠️ Si recibes 10 votos negativos de los vecinos, tu cuenta será bloqueada.</small>
                </p>
                <form id="featured-request-form">
                    <div class="form-group">
                        <label>Selecciona tu producto *</label>
                        <select id="featured-product-id" class="form-control" required>
                            ${userProducts.map(p => `<option value="${p.id}">${p.product} - $${p.price}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Frase promocional (Máx. 60 caracteres) *</label>
                        <textarea id="featured-message" maxlength="60" placeholder="Ej: ¡Las mejores empanadas de la zona!" required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="VV.featured.closeRequestForm()">Cancelar</button>
                        <button type="submit" class="btn-primary">Confirmar y Publicar</button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('featured-request-form').onsubmit = async (e) => {
            e.preventDefault();
            await this.submitFeaturedRequest();
        };
    },

    closeRequestForm() {
        document.getElementById('featured-request-overlay')?.classList.remove('active');
    },

    async submitFeaturedRequest() {
        const productId = document.getElementById('featured-product-id').value;
        const message = document.getElementById('featured-message').value;

        try {
            VV.utils.showLoading(true);
            
            // Actualizamos el producto existente para marcarlo como destacado
            const { error } = await supabase
                .from('products')
                .update({ 
                    is_featured: true, 
                    featured_message: message,
                    neighborhood: VV.data.neighborhood 
                })
                .eq('id', productId);

            if (error) throw error;

            alert('¡Tu producto ahora es destacado en el barrio!');
            this.closeRequestForm();
            
            // Recargamos datos globales y refrescamos el carrusel
            await VV.data.loadFromSupabase();
            await this.loadFeaturedOffers();
            
        } catch (e) {
            console.error("Error en solicitud:", e);
            alert('Hubo un error al procesar la solicitud.');
        } finally {
            VV.utils.showLoading(false);
        }
    },

    /**
     * Carga de Destacados
     * Filtra los productos que tienen is_featured = true y pertenecen al barrio actual.
     */
    async loadFeaturedOffers() {
        const container = document.getElementById('featured-container');
        if (!container) return;

        try {
            // Buscamos en la data local primero para rapidez, o consultamos Supabase
            const featuredItems = VV.data.products.filter(p => 
                p.is_featured === true && 
                p.neighborhood === VV.data.neighborhood
            );

            this.items = featuredItems;
            this.renderCarousel(container);
        } catch (e) {
            console.error("Error cargando destacados:", e);
        }
    },

    renderCarousel(container) {
        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="welcome-banner" style="display:flex; align-items:center; justify-content:center; text-align:center; padding:2.5rem; min-height: 220px; background: var(--gray-50); border: 2px dashed var(--gray-200);">
                    <div>
                        <i class=\"fas fa-bullhorn\" style=\"font-size: 2.5rem; color: var(--primary-blue); margin-bottom: 1rem; opacity: 0.5;\"></i>
                        <h2 style=\"color: var(--gray-800);\">¡Anuncia aquí!</h2>
                        <p style=\"color: var(--gray-600);\">Llega a todos tus vecinos de <strong>${VV.data.neighborhood}</strong>.</p>
                        <button class="btn-primary" onclick="VV.featured.requestFeatured()" style="margin-top:1.2rem; width:auto; padding:0.8rem 1.5rem;">
                           <i class="fas fa-star"></i> Destacar mi Oferta
                        </button>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="featured-section-wrapper">
                <div class="featured-carousel" id="vv-main-carousel">
                    <div class="featured-track" id="featured-track">
                        ${this.items.map(item => `
                            <div class="featured-slide">
                                <img src="${item.image_url || 'https://via.placeholder.com/800x400?text=Vecinos+Virtuales'}" alt="${item.product}" onerror="this.src='https://via.placeholder.com/800x400?text=Imagen+no+disponible'">
                                <div class="featured-overlay">
                                    <div class="featured-info">
                                        <span class="featured-tag"><i class="fas fa-check-circle"></i> Verificado en ${item.neighborhood}</span>
                                        <h3>${item.product}</h3>
                                        <p>${item.featured_message || item.business || 'Vendedor del barrio'}</p>
                                    </div>
                                    <div class="featured-actions">
                                        <a href="https://wa.me/${item.contact}?text=Hola! Vi tu destacado en Vecinos Virtuales: ${item.product}" target="_blank" class="btn-contact-wa">
                                            <i class="fab fa-whatsapp"></i> WhatsApp
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="carousel-indicators">
                        ${this.items.map((_, i) => `<div class="indicator-dot ${i === 0 ? 'active' : ''}" onclick="VV.featured.goTo(${i})"></div>`).join('')}
                    </div>
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <button class="btn-text" onclick="VV.featured.requestFeatured()" style="color: var(--primary-blue); font-weight: 600; font-size: 0.85rem; cursor: pointer;">
                        <i class="fas fa-plus-circle"></i> Quiero destacar mi negocio
                    </button>
                </div>
            </div>
        `;

        this.currentIndex = 0;
        this.initEvents();
        this.startAutoPlay();
    },

    initEvents() {
        const carousel = document.getElementById('vv-main-carousel');
        if (!carousel) return;

        let startX = 0;
        
        // Soporte Táctil
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            this.stopAutoPlay();
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.next();
                else this.prev();
            }
            this.startAutoPlay();
        });

        // Soporte Mouse
        carousel.onmousedown = (e) => {
            startX = e.clientX;
            this.stopAutoPlay();
            document.onmouseup = (upEvent) => {
                const diff = startX - upEvent.clientX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) this.next();
                    else this.prev();
                }
                this.startAutoPlay();
                document.onmouseup = null;
            };
        };
    },

    goTo(index) {
        this.currentIndex = index;
        this.updateUI();
        this.startAutoPlay();
    },

    updateUI() {
        const track = document.getElementById('featured-track');
        const dots = document.querySelectorAll('.indicator-dot');
        if (!track) return;
        
        track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === this.currentIndex));
    },

    next() {
        if (this.items.length <= 1) return;
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.updateUI();
    },

    prev() {
        if (this.items.length <= 1) return;
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

// Vinculamos la carga de destacados con el evento de carga de datos global
// Esto evita que los productos desaparezcan al refrescar.
document.addEventListener('dataLoaded', () => {
    VV.featured.loadFeaturedOffers();
});

console.log('✅ Módulo FEATURED sincronizado y listo');
