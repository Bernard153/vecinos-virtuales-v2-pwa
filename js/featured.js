// ============================================================
// MÓDULO OFERTAS DESTACADAS + CAROUSEL SUPERIOR - PARTE A
// ============================================================

VV.featured = {
    // Solicitar destacar oferta
    requestFeatured() {
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
                    Las ofertas destacadas aparecen en el dashboard principal y son votadas por la comunidad.
                </p>
                <form id="featured-request-form">
                    <div class="form-group">
                        <label>Selecciona tu producto *</label>
                        <select id="featured-product" required>
                            <option value="">Seleccionar producto</option>
                            ${userProducts.map(p => `
                                <option value="${p.id}">${p.product} - $${p.price}/${p.unit}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Título de la oferta *</label>
                        <input type="text" id="featured-title" required placeholder="Ej: ¡Oferta especial!">
                    </div>
                    <div class="form-group">
                        <label>Descripción de la oferta *</label>
                        <textarea id="featured-description" rows="3" required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.featured.closeRequestForm()">Cancelar</button>
                        <button type="button" class="btn-save" onclick="VV.featured.submitRequest()">Enviar</button>
                    </div>
                </form>
            </div>
        `;

        overlay.classList.add('active');
        const form = document.getElementById('featured-request-form');
        if (form) { e => e.preventDefault(); }
    },

    previewImage(input) { console.log("Previsualizando..."); },
    closeRequestForm() {
        const overlay = document.getElementById('featured-request-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    async submitRequest() {
        const productSelect = document.getElementById('featured-product');
        const productId = productSelect ? productSelect.value : null;
        if (!productId) { alert('Selecciona un producto'); return; }
        VV.utils.showSuccess('Solicitud simulada');
        this.closeRequestForm();
    },
    // Cargar ofertas destacadas reales en el carrusel inferior
    async loadFeaturedOffers() {
        const container = document.getElementById('featured-offers-carousel');
        if (!container) return;

        try {
            const { data: offers, error } = await supabase
                .from('featured_offers')
                .select('*')
                .eq('neighborhood', VV.data.neighborhood)
                .eq('status', 'aprobado');

            if (error) throw error;

            if (!offers || offers.length === 0) {
                container.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: var(--gray-500); width: 100%;">
                        <p>No hay ofertas destacadas esta semana.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = offers.map(offer => this.renderOfferCard(offer)).join('');
        } catch (error) {
            console.error('Error cargando ofertas:', error);
        }
    },

    // Renderizador comercial de ofertas tradicionales
    renderOfferCard(offer) {
        return `
            <div class="featured-card" style="min-width: 240px; background: white; border-radius: 12px; padding: 0.75rem; border: 1px solid var(--gray-200);">
                <h4>${offer.title}</h4>
                <p>${offer.description}</p>
                <span style="font-weight: bold; color: var(--primary-blue);">$${offer.price}</span>
            </div>
        `;
    },
    // 🌟 NUEVA INNOVACIÓN CORREGIDA: El Carrusel Superior de Avances del Barrio
    renderNovedadesCarrusel() {
        // Buscamos tu contenedor principal en el index.html
        const contenedorDashboard = document.getElementById('featured-container') || document.body;
        
        if (document.getElementById('carrusel-novedades-superior')) return;

        const seccionNovedades = document.createElement('section');
        seccionNovedades.id = 'carrusel-novedades-superior';
        seccionNovedades.style.cssText = 'margin-bottom: 1.5rem; width: 100%; overflow: hidden; padding: 0.5rem 0; font-family: sans-serif;';

        const itemsNovedades = [
            {
                icono: "🎤",
                titulo: "¡Estudio de Karaoke!",
                desc: "Canta tus temas favoritos con eco real y filtros estéticos. ¡Suma aplausos!",
                accion: "window.location.href='estudio-karaoke.html'",
                textoBoton: "Cantar Ahora 🎙️",
                fondo: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)"
            },
            {
                icono: "🛒",
                titulo: "Ahorra en tu Barrio",
                desc: "Compara precios en tiempo real entre los almacenes y comercios de tu zona.",
                accion: "VV.utils.showSection('marketplace')",
                textoBoton: "Ver Almacenes 🍎",
                fondo: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)"
            },
            {
                icono: "📢",
                titulo: "Reportes de Mejoras",
                desc: "Publica baches o caños rotos. Apoya reclamos con tu cofre de megáfonos.",
                accion: "VV.utils.showSection('improvements')",
                textoBoton: "Ver Reclamos ⚠️",
                fondo: "linear-gradient(135deg, #7c2d12 0%, #431407 100%)"
            }
        ];

        // Construimos el diseño HTML usando comillas seguras sin interferencias de estilos
        seccionNovedades.innerHTML = `
            <h3 style="font-size: 0.85rem; text-transform: uppercase; color: #4b5563; letter-spacing: 0.05em; margin: 0 0 0.5rem 0.5rem; font-weight: bold; text-align: left;">
                ✨ Descubre Vecinos Virtuales
            </h3>
            <div style="display: flex; gap: 1rem; overflow-x: auto; padding: 0.25rem 0.5rem; -webkit-overflow-scrolling: touch;">
                ${itemsNovedades.map(item => `
                    <div style="background: ${item.fondo}; color: white; min-width: 260px; width: 260px; border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <span style="font-size: 2.2rem; margin: 0;">${item.icono}</span>
                            <div style="text-align: left;">
                                <h4 style="margin: 0; font-weight: bold; font-size: 0.95rem; color: white;">${item.titulo}</h4>
                                <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: rgba(255,255,255,0.7); line-height: 1.3;">${item.desc}</p>
                            </div>
                        </div>
                        <button onclick="${item.accion}" style="background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.2); font-weight: 600; font-size: 0.75rem; padding: 0.4rem; border-radius: 50px; cursor: pointer; width: 100%; text-align: center;">
                            ${item.textoBoton}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        if (contenedorDashboard.firstChild) {
            contenedorDashboard.insertBefore(seccionNovedades, contenedorDashboard.firstChild);
        } else {
            contenedorDashboard.appendChild(seccionNovedades);
        }
        console.log("🎬 Carrusel superior inyectado sin interferencias de sintaxis.");
    }
};

console.log('✅ Módulo FEATURED cargado correctamente con carrusel limpio');
