// ========== MÓDULO OFERTAS DESTACADAS (Versión Integrada Vecinos Virtuales) ==========

VV.featured = {
    currentIndex: 0,
    items: [],
    autoPlayTimer: null,

    /**
     * Solicitar destacar oferta
     * Mantiene la lógica de geolocalización: el barrio se asigna automáticamente
     * desde VV.data.neighborhood para que la oferta sea local.
     */
    requestFeatured() {
        // Verificar si el usuario tiene productos registrados
        const userProducts = VV.data.products.filter(p => p.seller_id === VV.data.user.id);
        
        if (userProducts.length === 0) {
            alert('Primero debes publicar al menos un producto para poder destacarlo.');
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
                <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                    Tu oferta aparecerá en el dashboard de <strong>${VV.data.neighborhood}</strong>.
                    <br><small style="color: var(--error-red);">⚠️ Si recibes 10 votos negativos, tu cuenta será bloqueada.</small>
                </p>
                <form id="featured-request-form">
                    <div class="form-group">
                        <label>Selecciona tu producto *</label>
                        <select id="featured-product-id" required>
                            ${userProducts.map(p => `<option value="${p.id}">${p.product} - $${p.price}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Mensaje promocional (Máx. 60 caracteres) *</label>
                        <textarea id="featured-message" maxlength="60" placeholder="Ej: ¡Las mejores facturas del barrio!" required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="VV.featured.closeRequestForm()">Cancelar</button>
                        <button type="submit" class="btn-primary">Enviar Solicitud</button>
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
            // Actualizamos el producto en Supabase marcándolo como destacado
            // Se guarda el barrio actual para que la geolocalización funcione al filtrar
            const { error } = await supabase.from('products').update({ 
                is_featured: true, 
                featured_message: message,
                neighborhood: VV.data.neighborhood // Aseguramos que se guarde el barrio de origen
            }).eq('id', productId);

            if (error) throw error;
            alert('¡Solicitud enviada con éxito!');
            this.closeRequestForm();
            await this.loadFeaturedOffers();
        } catch (e) {
            console.error("Error en solicitud:", e);
            alert('Hubo un error al procesar tu solicitud.');
        }
    },

    /**
     * Carga de Destacados con Filtro Geográfico
     * Solo muestra productos donde el barrio coincide con la ubicación actual del usuario.
     */
    async loadFeaturedOffers() {
        const container = document.getElementById('featured-container');
        if (!container) return;

        try {
            // Filtro de geolocalización estricto por barrio
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_featured', true)
                .eq('neighborhood', VV.data.neighborhood);

            if (error) throw error;
            this.items = data || [];
            this.renderCarousel(container);
        } catch (e) {
            console.error("Error cargando destacados:", e);
        }
    },

    renderCarousel(container) {
        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="welcome-banner" style="display:flex; align-items:center; justify-content:center; text-align:center; padding:2rem; min-height: 200px;">
                    <div>
                        <h2>¡Hola, vecino!</h2>
                        <p>No hay ofertas destacadas en <strong>${VV.data.neighborhood}</strong> por el momento.</p>
                        <button class="btn-primary" onclick="VV.featured.requestFeatured()" style="margin-top:1rem; width:auto; padding:0.8rem 1.5rem;">
                           <i class="fas fa-star"></i> ¡Promocionar mi producto!
                        </button>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="featured-carousel" id="vv-main-carousel">
                <div class="featured-track" id="featured-track">
                    ${this.items.map(item => `
                        <div class="featured-slide">
                            <img src="${item.image_url || 'https://via.placeholder.com/800x400?text=Vecinos+Virtuales'}" alt="${item.product}">
                            <div class="featured-overlay">
                                <div class="featured-info">
                                    <span class="featured-tag"><i class="fas fa-map-marker-alt"></i> ${item.neighborhood}</span>
                                    <h3>${item.product}</h3>
                                    <p>${item.featured_message || item.business}</p>
                                </div>
                                <div class="featured-actions">
                                    <a href="https://wa.me/${item.contact}?text=Hola! Vi tu producto en Vecinos Virtuales (${item.neighborhood}): ${item.product}" target="_blank" class="btn-contact-wa">
                                        <i class="fab fa-whatsapp"></i> Contactar
                                    </a>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="carousel-indicators">
                    ${this.items.map((_, i) => `<div class="indicator-dot ${i===0?'active':''}"></div>`).join('')}
                </div>
            </div>
            <div style="text-align: center; margin-top: -1rem; margin-bottom: 2rem;">
                <button class="btn-primary" onclick="VV.featured.requestFeatured()" style="width:auto; font-size:0.8rem;">
                    <i class="fas fa-plus"></i> Quiero aparecer aquí
                </button>
            </div>
        `;

        this.initEvents();
        this.startAutoPlay();
    },

    initEvents() {
        const carousel = document.getElementById('vv-main-carousel');
        if (!carousel) return;

        let startX = 0;
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            this.stopAutoPlay();
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.next();
                else this.prev();
            }
            this.startAutoPlay();
        });
    },

    updateUI() {
        const track = document.getElementById('featured-track');
        const dots = document.querySelectorAll('.indicator-dot');
        if (!track) return;
        track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === this.currentIndex));
    },

    next() {
        if (this.items.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.updateUI();
    },

    prev() {
        if (this.items.length === 0) return;
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

console.log('✅ Módulo FEATURED Geo-localizado cargado correctamente');
