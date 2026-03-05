// ========== MÓDULO MARKETPLACE (ESTABLE V1.0) ==========

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
            container.innerHTML = `<div style="text-align:center;padding:2rem;"><h3>No tienes productos</h3><button class="btn-primary" onclick="VV.marketplace.showForm()">+ Publicar</button></div>`;
            return;
        }

        container.innerHTML = myProducts.map(p => `
            <div class="product-card" style="border:1px solid #ddd; padding:15px; margin-bottom:10px; border-radius:8px;">
                <div class="card-header"><h3>${p.product}</h3></div>
                <p><strong>Negocio:</strong> ${p.business}</p>
                <div class="card-footer">
                    <span>$${p.price} / ${p.unit}</span>
                </div>
                <div class="card-actions" style="margin-top:10px;">
                    <button class="btn-edit" onclick="VV.marketplace.showForm('${p.id}')">Editar</button>
                    <button class="btn-delete" onclick="VV.marketplace.deleteProduct('${p.id}')">Eliminar</button>
                </div>
            </div>`).join('');
    },

    loadShopping() {
        const container = document.getElementById('all-products');
        if (!container) return;

        const neighborhoodProducts = VV.data.products.filter(p =>
            !p.neighborhood || isSameNeighborhood(p.neighborhood, VV.data.neighborhood)
        );

        container.innerHTML = neighborhoodProducts.map(p => {
            const isOwner = p.seller_id === VV.data.user?.id;
            return `
            <div class="product-card" style="border:1px solid #eee; padding:15px; margin-bottom:15px; border-radius:10px; background:#fff;">
                <div class="card-header">
                    <h3>${p.product}</h3>
                    <span class="badge" style="background:#e0f2fe;color:#0369a1;font-size:0.7rem;">✨ IA Verificado</span>
                </div>
                <p><strong>Vendedor:</strong> ${p.seller_name} 
                    <button onclick="mostrarGaleriaVendedor('${p.seller_id}')" style="background:none;border:none;color:blue;text-decoration:underline;cursor:pointer;">Ver Tienda</button>
                </p>
                <p><strong>Categoría:</strong> ${p.category}</p>
                <div id="ai-promo-${p.id}" style="margin:10px 0; padding:8px; background:#f0fdf4; border:1px dashed #bbf7d0; font-size:0.8rem; color:#166534;">
                    ⌛ IA pensando oferta...
                </div>
                <div class="card-footer" style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:bold; color:green; font-size:1.2rem;">$${p.price}</span>
                    <button class="btn-primary" onclick="VV.reservations.create('${p.id}')">Reservar</button>
                </div>
                <div style="display:flex; gap:5px; margin-top:10px;">
                    <button class="btn-secondary" style="flex:1;font-size:0.7rem;" onclick="VV.marketplace.addToCart('${p.id}')">Agenda</button>
                    <button class="btn-secondary" style="flex:1;font-size:0.7rem;" onclick="VV.marketplace.compareProduct('${p.product}')">Comparar</button>
                </div>
            </div>`;
        }).join('');

        neighborhoodProducts.forEach(p => {
            if (typeof activarSugerenciaIA === 'function') activarSugerenciaIA(p.id, p.product, p.price);
        });
    },

    showForm(productId = null) {
        alert("Formulario en mantenimiento. Función ID: " + productId);
    },

    closeForm() {
        const overlay = document.getElementById('product-form-overlay');
        if (overlay) overlay.remove();
    }
};

// ========== FUNCIONES GLOBALES (FUERA DE TODO OBJETO) ==========
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
        el.innerText = "💡 Tip: " + (data.oferta || data.response || "¡Precio de barrio!");
    } catch (e) {
        el.style.display = 'none';
    }
}

function mostrarGaleriaVendedor(idVendedor) {
    alert("Próximamente: Galería del vendedor " + idVendedor);
}
