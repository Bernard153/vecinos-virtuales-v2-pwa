// ============================================================
// MÓDULO OFERTAS DESTACADAS + FORMULARIO EXTENDIDO PROFESIONAL
// ============================================================

VV.featured = {
    // FORMULARIO INTEGRAL EXPANDIDO
    requestFeatured() {
        const userProducts = VV.data.products.filter(p => p.seller_id === VV.data.user?.id || p.userId === VV.data.user?.id);

        let overlay = document.getElementById('featured-request-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'featured-request-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="modal-form" style="background: white; border-radius: 20px; padding: 1.5rem; max-width: 420px; width: 90%; margin: 2rem auto; box-shadow: 0 10px 25px rgba(0,0,0,0.15); font-family: sans-serif; text-align: left; color: #374151;">
                <h3 style="font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; color: #1e3a8a;"><i class="fas fa-star" style="color: #eab308;"></i> Solicitar Oferta Destacada</h3>
                <p style="color: #6b7280; font-size: 0.8rem; margin-bottom: 1.25rem; line-height: 1.4;">
                    Las ofertas destacadas aparecen arriba de todo en el muro de Lomas de Tafí y reciben el voto directo de la comunidad.
                </p>
                <form id="featured-request-form" style="display: flex; flex-direction: column; gap: 0.85rem;">
                    
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <label style="font-size: 0.75rem; font-weight: bold; text-transform: uppercase; color: #4b5563;">1. Selecciona tu producto comercial *</label>
                        <select id="featured-product" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem; background: #f9fafb;">
                            <option value="">-- Elegir de mis publicaciones --</option>
                            \${userProducts.length > 0 ? userProducts.map(p => \`
                                <option value="\${p.id}">\${p.product || p.title} - \${p.price}</option>
                            \`).join('') : '<option value="demo">Producto Demo de Muestra - $1500</option>'}
                        </select>
                    </div>

                    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <label style="font-size: 0.75rem; font-weight: bold; color: #4b5563;">2. Título de la Promoción *</label>
                        <input type="text" id="featured-title" required placeholder="Ej: ¡2x1 solo por este Domingo!" style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem;">
                    </div>

                    <div class="grid-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                        <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
                            <label style="font-size: 0.75rem; font-weight: bold; color: #4b5563;">3. % Descuento</label>
                            <input type="number" id="featured-discount" placeholder="Ej: 20" min="0" max="100" style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem;">
                        </div>
                        <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
                            <label style="font-size: 0.75rem; font-weight: bold; color: #4b5563;">4. Stock Disponible</label>
                            <input type="number" id="featured-stock" placeholder="Ej: 15 unidades" style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem;">
                        </div>
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <label style="font-size: 0.75rem; font-weight: bold; color: #4b5563;">5. Fecha Límite de Vigencia *</label>
                        <input type="date" id="featured-expiry" required style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem; color: #374151;">
                    </div>

                    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <label style="font-size: 0.75rem; font-weight: bold; color: #4b5563;">6. Detalles y condiciones comerciales *</label>
                        <textarea id="featured-description" rows="3" required placeholder="Describe el beneficio de tu oferta para los vecinos..." style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem; resize: none;"></textarea>
                    </div>

                    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <label style="font-size: 0.75rem; font-weight: bold; color: #4b5563;">7. Foto de la Oferta (Opcional)</label>
                        <input type="file" id="featured-file" accept="image/*" style="font-size: 0.8rem; color: #6b7280; padding: 0.25rem 0;">
                    </div>

                    <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.75rem; border-top: 1px solid #f3f4f6; padding-top: 0.75rem;">
                        <button type="button" onclick="VV.featured.closeRequestForm()" style="background: #e5e7eb; color: #4b5563; font-weight: 600; font-size: 0.8rem; padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer;">Cancelar</button>
                        <button type="button" onclick="VV.featured.submitRequest()" style="background: #1e3a8a; color: white; font-weight: 600; font-size: 0.8rem; padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Enviar Solicitud</button>
                    </div>
                </form>
            </div>
        `;

        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '99999';
        overlay.style.display = 'block';
    },

    closeRequestForm() {
        const overlay = document.getElementById('featured-request-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    async submitRequest() {
        VV.utils.showSuccess('¡Solicitud de Oferta Expandida procesada con éxito!');
        this.closeRequestForm();
    },
    // 🌟 EL CARRUSEL SUPERIOR DE NOVEDADES DE LOMAS DE TAFÍ
    renderNovedadesCarrusel() {
        const contenedorDashboard = document.getElementById('featured-container') || document.body;
        
        if (document.getElementById('carrusel-novedades-superior')) return;

        const seccionNovedades = document.createElement('section');
        seccionNovedades.id = 'carrusel-novedades-superior';
        seccionNovedades.style.cssText = 'margin-bottom: 1.5rem; width: 100%; overflow: hidden; padding: 0.5rem 0; font-family: sans-serif;';

        const itemsNovedades = [
            {
                icono: "🎤",
                titulo: "¡Estudio de Karaoke!",
                desc: "Canta tus temas favoritos con eco real. ¡Suma aplausos en el barrio!",
                accion: "window.location.href='estudio-karaoke.html'",
                textoBoton: "Cantar Ahora 🎙️",
                fondo: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)"
            },
            {
                icono: "🛒",
                titulo: "Ahorra en tu Barrio",
                desc: "Compara precios en tiempo real entre los almacenes de Lomas de Tafí.",
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

        seccionNovedades.innerHTML = \`
            <h3 style="font-size: 0.85rem; text-transform: uppercase; color: #4b5563; letter-spacing: 0.05em; margin: 0 0 0.5rem 0.5rem; font-weight: bold; text-align: left;">
                ✨ Novedades en Lomas de Tafí
            </h3>
            <div style="display: flex; gap: 1rem; overflow-x: auto; padding: 0.25rem 0.5rem; -webkit-overflow-scrolling: touch;">
                \${itemsNovedades.map(item => \`
                    <div style="background: \\\${item.fondo}; color: white; min-width: 260px; width: 260px; border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <span style="font-size: 2.2rem; margin: 0;">\\\${item.icono}</span>
                            <div style="text-align: left;">
                                <h4 style="margin: 0; font-weight: bold; font-size: 0.95rem; color: white;">\\\${item.titulo}</h4>
                                <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: rgba(255,255,255,0.7); line-height: 1.3;">\\\${item.desc}</p>
                            </div>
                        </div>
                        <button onclick="\\\${item.accion}" style="background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.2); font-weight: 600; font-size: 0.75rem; padding: 0.4rem; border-radius: 50px; cursor: pointer; width: 100%; text-align: center;">
                            \\\${item.textoBoton}
                        </button>
                    </div>
                \\\`).join('')}
            </div>
        \`;

        if (contenedorDashboard.firstChild) {
            contenedorDashboard.insertBefore(seccionNovedades, contenedorDashboard.firstChild);
        } else {
            contenedorDashboard.appendChild(seccionNovedades);
        }
    }
};

console.log('✅ Módulo FEATURED unificado con formulario extendido');
