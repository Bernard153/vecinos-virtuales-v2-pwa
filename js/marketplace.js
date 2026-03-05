// ========== MÓDULO MARKETPLACE ==========

const normalizeNeighborhood = (name) => {
    return name?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() || '';
};

const isSameNeighborhood = (neighborhood1, neighborhood2) => {
    return normalizeNeighborhood(neighborhood1) === normalizeNeighborhood(neighborhood2);
};

VV.marketplace = {
    load() {
        const container = document.getElementById('my-products');
        if (!container) return;
        const myProducts = VV.data.products.filter(p => p.seller_id === VV.data.user?.id);

        if (myProducts.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray-600);">
                    <i class="fas fa-store" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No tienes productos publicados</h3>
                    <p>Comienza vendiendo tu primer producto</p>
                    <button class="btn-primary" onclick="VV.marketplace.showForm()" style="margin: 1rem auto; width: auto;">
                        <i class="fas fa-plus"></i> Publicar Producto
                    </button>
                </div>`;
            return;
        }

        container.innerHTML = myProducts.map(p => `
            <div class="product-card">
                <div class="card-header">
                    <h3>${p.product}</h3>
                    ${p.featured ? '<span class="badge featured">Destacado</span>' : ''}
                </div>
                <p><strong>Negocio:</strong> ${p.business}</p>
                <p><strong>Categoría:</strong> ${p.category}</p>
                <p style="color: var(--gray-600); margin: 0.5rem 0;">${p.description || ''}</p>
                <div class="card-footer">
                    <div class="price"><span class="price-amount">$${p.price}</span><span class="price-unit">/ ${p.unit}</span></div>
                    <div class="contact"><i class="fas fa-phone"></i> ${p.contact}</div>
                </div>
                <div class="card-actions">
                    <button class="btn-edit" onclick="VV.marketplace.showForm('${p.id}')"><i class="fas fa-edit"></i> Editar</button>
                    ${!p.featured ? `<button class="btn-primary" onclick="VV.marketplace.requestFeatured('${p.id}')" style="background: var(--warning-yellow); color: var(--gray-800);"><i class="fas fa-star"></i> Solicitar Destacar</button>` : `<span class="badge" style="background: var(--warning-yellow); color: var(--gray-800); padding: 0.5rem 1rem;"><i class="fas fa-star"></i> Destacado</span>`}
                    <button class="btn-delete" onclick="VV.marketplace.deleteProduct('${p.id}')"><i class="fas fa-trash"></i> Eliminar</button>
                </div>
            </div>
        `).join('');
    },

    loadShopping() {
        const container = document.getElementById('all-products');
        if (!container) return;

        const neighborhoodProducts = VV.data.products.filter(p =>
            !p.neighborhood || isSameNeighborhood(p.neighborhood, VV.data.neighborhood)
        );

        if (neighborhoodProducts.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray-600);"><h3>No hay productos en tu barrio</h3></div>`;
            return;
        }

        container.innerHTML = neighborhoodProducts.map(p => {
            const isOwner = p.seller_id === VV.data.user?.id;
            const canModerate = VV.utils?.canModerate();

            return `
            <div class="product-card">
                <div class="card-header">
                    <h3>${p.product}</h3>
                    ${p.featured ? '<span class="badge featured">⭐ Destacado</span>' : ''}
                    <span class="badge" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white;">🔖 Reservable</span>
                    <span class="badge quality-${p.quality?.toLowerCase().replace(' ', '-') || 'buena'}">${p.quality || 'Buena'}</span>
                </div>
                <p><strong>Vendedor:</strong> ${p.seller_name} 
                    <button onclick="mostrarGaleriaVendedor('${p.seller_id}')" style="background: none; border: none; color: var(--primary-purple); cursor: pointer; font-size: 0.8rem; text-decoration: underline;">
                        <i class="fas fa-store"></i> Ver Galería
                    </button>
                </p>
                <p><strong>Negocio:</strong> ${p.business}</p>
                <p><strong>Categoría:</strong> ${p.category}</p>
                <p style="color: var(--gray-600); margin: 0.5rem 0;">${p.description || ''}</p>
                <div class="card-footer">
                    <div class="price"><span class="price-amount">$${p.price}</span><span class="price-unit">/ ${p.unit}</span></div>
                    <div class="contact"><i class="fas fa-phone"></i> ${p.contact}</div>
                </div>
                
                <div id="ai-promo-${p.id}" style="margin-top: 10px; font-size: 0.8rem; color: #059669; font-weight: 500; background: #f0fdf4; padding: 8px; border-radius: 6px; border: 1px dashed #bbf7d0;">
                    ✨ IA analizando oferta...
                </div>

                <div id="collab-prices-${p.id}" class="collab-prices-container" style="display: none; padding: 0.75rem; background: var(--gray-50); border: 1px dashed var(--gray-300); border-radius: 8px; margin-top: 0.5rem;"></div>
                <div style="text-align: right; margin-top: 0.25rem;">
                    <button class="btn-text" onclick="VV.marketplace.showCollabPriceForm('${p.id}', '${p.product.replace(/'/g, "\\'")}')" style="background: none; border: none; color: var(--primary-purple); font-size: 0.8rem; cursor: pointer; text-decoration: underline;">
                        <i class="fas fa-search-dollar"></i> ¿Lo viste más barato?
                    </button>
                </div>
                
                ${isOwner ? `
                    <div class="card-actions" style="margin-top: 1rem;">
                        <button class="btn-edit" onclick="VV.marketplace.showForm('${p.id}')"><i class="fas fa-edit"></i> Editar</button>
                        <button class="btn-delete" onclick="VV.marketplace.deleteProduct('${p.id}')"><i class="fas fa-trash"></i> Eliminar</button>
                    </div>
                ` : canModerate ? `
                    <div style="margin-top: 1rem;"><button class="btn-delete" onclick="VV.marketplace.deleteProduct('${p.id}')" style="width: 100%;"><i class="fas fa-trash"></i> Eliminar (Moderador)</button></div>
                ` : `
                    <div class="quantity-input" style="margin-top: 1rem;">
                        <label style="font-size: 0.85rem; color: var(--gray-600);">Cantidad:</label>
                        <input type="number" id="qty-${p.id}" min="0.01" step="0.01" value="1" style="width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 4px; margin: 0.25rem 0;">
                    </div>
                    <button class="btn-primary" onclick="VV.reservations.create('${p.id}')" style="width: 100%; margin-top: 0.5rem; background: linear-gradient(135deg, var(--primary-blue), var(--primary-purple));">
                        <i class="fas fa-calendar-check"></i> Reservar
                    </button>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <button class="btn-secondary" onclick="VV.marketplace.addToCart('${p.id}')" style="flex: 1; font-size: 0.85rem;"><i class="fas fa-plus"></i> Agenda</button>
                        <button class="btn-secondary" onclick="VV.marketplace.compareProduct('${p.product}')" style="flex: 1; font-size: 0.85rem;"><i class="fas fa-balance-scale"></i> Comparar</button>
                    </div>
                `}
            </div>`;
        }).join('');

        neighborhoodProducts.forEach(p => {
            activarSugerenciaIA(p.id, p.product, p.price);
        });
    }
};

// ========== FUNCIONES FUERA DEL OBJETO ==========
async function activarSugerenciaIA(id, nombre, precio) {
    const el = document.getElementById(`ai-promo-${id}`);
    if (!el) return;
    try {
        const res = await fetch('https://api-comercio-vecinos.cibernico01.workers.dev', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, precio })
        });
        const data = await res.json();
        el.innerText = "💡 Tip IA: " + (data.oferta || data.response || "¡Excelente precio!");
    } catch (e) { el.style.display = 'none'; }
}

function mostrarGaleriaVendedor(idVendedor) {
    alert("Próximamente: Galería completa del vendedor " + idVendedor);
}
