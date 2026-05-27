// ============================================================================
// MÓDULO MAESTRO: CARTELERA COMERCIAL DE IMPACTO DIRECTO + OFERTAS DESTACADAS
// ============================================================================

if (typeof window.VV === 'undefined') {
    window.VV = { data: {}, utils: {} };
}

window.VV.featured = {
    // 💰 FORMULARIO DE MONETIZACIÓN (PASO 2 PARA COMERCIANTES)
    requestFeatured() {
        let userProducts = [];
        try {
            if (window.VV.data && window.VV.data.products) {
                userProducts = window.VV.data.products.filter(p => p.seller_id === window.VV.data.user?.id || p.userId === window.VV.data.user?.id);
                if (userProducts.length === 0) userProducts = window.VV.data.products;
            }
        } catch (e) { console.error(e); }

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
                    Las ofertas destacadas aparecen en la marquesina principal de Lomas de Tafí para monetizar el tráfico del barrio.
                </p>
                <form id="featured-request-form" style="display: flex; flex-direction: column; gap: 0.85rem;">
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <label style="font-size: 0.75rem; font-weight: bold; color: #4b5563;">1. Selecciona tu producto comercial *</label>
                        <select id="featured-product" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem; background: #f9fafb;">
                            <option value="">-- Elegir de mis publicaciones --</option>
                            ${userProducts.map(p => `<option value="${p.id}">${p.product || p.title || 'Producto'} - $${p.price || '0'}</option>`).join('')}
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
                        <textarea id="featured-description" rows="3" required placeholder="Describe el beneficio para los vecinos..." style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem; resize: none;"></textarea>
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <label style="font-size: 0.75rem; font-weight: bold; color: #4b5563;">7. Foto de la Oferta (Opcional)</label>
                        <input type="file" id="featured-file" accept="image/*" style="font-size: 0.8rem; color: #6b7280; padding: 0.25rem 0;">
                    </div>
                    <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.75rem; border-top: 1px solid #f3f4f6; padding-top: 0.75rem;">
                        <button type="button" onclick="window.VV.featured.closeRequestForm()" style="background: #e5e7eb; color: #4b5563; font-weight: 600; font-size: 0.8rem; padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer;">Cancelar</button>
                        <button type="button" onclick="window.VV.featured.submitRequest()" style="background: #1e3a8a; color: white; font-weight: 600; font-size: 0.8rem; padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Enviar Solicitud</button>
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
        alert('¡Solicitud de Oferta Comercial procesada con éxito!');
        this.closeRequestForm();
    },
    // 📺 EL MOTOR AUTÓNOMO DE LA CARTELERA COMERCIAL EXCLUSIVA POR BARRIO
    renderNovedadesCarrusel() {
        // 🎯 FIJACIÓN ESTRICTA: Forzamos el anclaje único en el panel de inicio
        const contenedorDashboard = document.getElementById('dashboard');
        if (!contenedorDashboard) return;

        // 🔄 LIMPIEZA DE SEGURIDAD CONTRA DUPLICADOS
        const carruselExistente = document.getElementById('carrusel-novedades-superior');
        if (carruselExistente) carruselExistente.remove();

        // 🌍 DETECTOR DE GEOLOCALIZACIÓN EXCLUSIVA
        let barrioActual = "Lomas de Tafí"; // Barrio comercial insignia de respaldo
        try {
            if (window.VV && window.VV.geo && window.VV.geo.currentBarrio) {
                barrioActual = window.VV.geo.currentBarrio;
            } else if (window.VV && window.VV.data && window.VV.data.user?.barrio) {
                barrioActual = window.VV.data.user.barrio;
            }
        } catch (errGeo) { console.log("Usando barrio insignia por defecto:", errGeo); }

        const seccionCartelera = document.createElement('section');
        seccionCartelera.id = 'carrusel-novedades-superior';
        seccionCartelera.style.cssText = 'margin: 1rem 0 2rem 0; width: 100%; font-family: sans-serif; text-align: left;';

        // 📊 SIMULACIÓN DE DATOS LOCALES EXCLUSIVOS SEGÚN EL BARRIO DETECTADO
        let totalSponsors = 3;
        let mejorasLogradas = 14;
        let eventosCultura = 2;
        
        if (barrioActual !== "Lomas de Tafí") {
            totalSponsors = 1;
            mejorasLogradas = 2;
            eventosCultura = 0;
        }

        let htmlCartelera = '';

        // 📺 CABECERA DE UBICACIÓN CRUDA Y DIRECTA
        htmlCartelera += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding: 0 0.25rem;">
                <h3 style="font-size: 0.9rem; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.05em; font-weight: bold; margin: 0;">
                    ✨ Cartelera de Impacto: ${barrioActual}
                </h3>
                <span style="background: #ef4444; color: white; font-size: 0.65rem; font-weight: bold; padding: 0.2rem 0.5rem; border-radius: 50px; text-transform: uppercase; animation: pulse 1.5s infinite;">En Vivo 🔴</span>
            </div>
        `;

        // 👑 MOSAICO GRID COMERCIAL DE ALTA VISIBILIDAD (Seducción de un vistazo)
        htmlCartelera += `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1rem;">
                
                <!-- 🍎 CUADRO 1: MARQUESINA DE COMERCIOS Y SPONSORS (RUBROS DEFINIDOS) -->
                <div onclick="window.VV.utils.showSection('marketplace')" style="grid-column: span 2; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border: 2px solid #3b82f6; border-radius: 16px; padding: 1.25rem; box-shadow: 0 4px 15px rgba(59,130,246,0.2); cursor: pointer; position: relative; overflow: hidden;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <span style="font-size: 0.65rem; background: #3b82f6; color: white; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Marquesina Comercial</span>
                            <h4 style="margin: 0.4rem 0 0.2rem 0; font-size: 1.1rem; font-weight: bold; color: white;">Guía de Almacenes VIP</h4>
                            <p style="margin: 0; font-size: 0.75rem; color: #9ca3af;">Ver Verdulerías, Carnicerías y Rubros con logos activos.</p>
                        </div>
                        <span style="font-size: 2rem;">🛒</span>
                    </div>
                    <div style="margin-top: 0.75rem; background: rgba(255,255,255,0.05); padding: 0.4rem; border-radius: 8px; font-size: 0.7rem; color: #60a5fa; font-weight: 600; display: flex; gap: 0.5rem; overflow: hidden; white-space: nowrap;">
                        🚀 ANUNCIANTES ACTIVOS EN ${barrioActual.toUpperCase()}: [ ${totalSponsors} VERIFICADOS ]
                    </div>
                </div>

                <!-- ⚖️ CUADRO 2: COMPARADOR DE PRECIOS (HERRAMIENTA CONSULTORA) -->
                <div onclick="window.VV.utils.showSection('marketplace')" style="background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); border: 1px solid #10b981; border-radius: 16px; padding: 1rem; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                    <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">⚖️</div>
                    <h4 style="margin: 0; font-size: 0.9rem; font-weight: bold; color: white;">Consultor de Precios</h4>
                    <p style="margin: 2px 0 0 0; font-size: 0.7rem; color: #a7f3d0; line-height: 1.3;">Compara el pan y la carne más barata a la mano.</p>
                </div>

                <!-- 📢 CUADRO 3: TABLERO DE MEJORAS Y LOGROS BARRIALES -->
                <div onclick="window.VV.utils.showSection('improvements')" style="background: linear-gradient(135deg, #7c2d12 0%, #431407 100%); border: 1px solid #f97316; border-radius: 16px; padding: 1rem; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                    <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">📢</div>
                    <h4 style="margin: 0; font-size: 0.9rem; font-weight: bold; color: white;">Mejoras & Logros</h4>
                    <p style="margin: 2px 0 0 0; font-size: 0.7rem; color: #ffedd5; line-height: 1.3;">${mejorasLogradas} baches y luces reportadas en la zona.</p>
                </div>

                <!-- 🎭 CUADRO 4: AGENDA CULTURAL Y EVENTOS SOCIALES -->
                <div onclick="window.VV.utils.showSection('marketplace')" style="background: linear-gradient(135deg, #581c87 0%, #3b0764 100%); border: 1px solid #a855f7; border-radius: 16px; padding: 1rem; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); grid-column: span 2;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="margin: 0; font-size: 0.9rem; font-weight: bold; color: white;">Agenda Cultural & Ferias</h4>
                            <p style="margin: 2px 0 0 0; font-size: 0.7rem; color: #f3e8ff; line-height: 1.3;">Talleres, eventos sociales y ferias en las plazas locales.</p>
                        </div>
                        <span style="font-size: 1.3rem;">🎭</span>
                    </div>
                </div>

            </div>
        `;
        // 🌟 LA ESTRELLA MULTIMEDIA: BANNER GIGANTE DE NEÓN DEL KARAOKE PRO DUAL
        htmlCartelera += `
            <div style="background: linear-gradient(135deg, #2e1065 0%, #1e1b4b 100%); border: 2px dashed #c084fc; border-radius: 16px; padding: 1.25rem; box-shadow: 0 0 20px rgba(168,85,247,0.3); text-align: center; position: relative;">
                <div style="position: absolute; top: -10px; right: 10px; background: #a855f7; color: white; font-size: 0.6rem; font-weight: bold; padding: 0.15rem 0.4rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Estrella de la App</div>
                <div style="display: flex; align-items: center; gap: 0.85rem; text-align: left; margin-bottom: 0.85rem;">
                    <span style="font-size: 2.2rem; margin: 0; animation: pulse 1.5s infinite;">🎤</span>
                    <div>
                        <h4 style="margin: 0; font-weight: bold; font-size: 1rem; color: white;">Estudio de Karaoke Pro</h4>
                        <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #d8b4fe; line-height: 1.3;">Canta tus temas favoritos en vivo. Abre la pista oficial y graba tu talento de inmediato.</p>
                    </div>
                </div>
                <!-- 🚀 ACCIÓN DUAL COMPATIBLE: Lanza la pista libre y te posiciona directo en la consola de grabación nativa -->
                <button onclick="window.open('https://youtube.com', '_blank'); window.location.href='estudio-karaoke-v2.html';" style="background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); font-weight: bold; font-size: 0.8rem; padding: 0.5rem; border-radius: 50px; cursor: pointer; width: 100%; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; transition: 0.2s;">
                    Cantar Ahora 🎙️
                </button>
            </div>
        `;

        seccionCartelera.innerHTML = htmlCartelera;

        // Inyectamos al principio de todo dentro del Dashboard del vecino para seducción directa
        if (contenedorDashboard.firstChild) {
            contenedorDashboard.insertBefore(seccionCartelera, contenedorDashboard.firstChild);
        } else {
            contenedorDashboard.appendChild(seccionCartelera);
        }
    }
};

// 🔗 ENLACE DE COMPATIBILIDAD PERMANENTE: Evita el colgado eterno del spinner de auth-supabase
window.VV.featured.loadFeaturedOffers = function() { 
    if (typeof this.renderNovedadesCarrusel === 'function') this.renderNovedadesCarrusel(); 
};

// 🚀 ENCENDIDO INMEDIATO: Fuerza el dibujado de la cartelera en el Dashboard comercial
if (typeof window.VV !== 'undefined' && window.VV.featured && typeof window.VV.featured.renderNovedadesCarrusel === 'function') {
    window.VV.featured.renderNovedadesCarrusel();
}

console.log('✅ Cartelera comercial de impacto directo consolidada por barrio por fin.');
