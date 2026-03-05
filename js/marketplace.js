// ========== MÓDULO MARKETPLACE (ESTABLE + IA) ==========

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
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><h3>No tienes productos publicados</h3></div>`;
            return;
        }

        container.innerHTML = myProducts.map(p => `
            <div class="product-card">
                <div class="card-header"><h3>${p.product}</h3></div>
                <p><strong>Negocio:</strong> ${p.business}</p>
                <div class="card-footer"><span>$${p.price}</span></div>
                <div class="card-actions">
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
            const canModerate = VV.utils?.canModerate();

            return `
            <div class="product-card">
                <div class="card-header">
                    <h3>${p.product}</h3>
                    ${p.featured ? '<span class="badge featured">⭐ Destacado</span>' : ''}
                    <span class="badge quality-${p.quality?.toLowerCase().replace(' ', '-') || 'buena'}">${p.quality || 'Buena'}</span>
                </div>
                <p><strong>Vendedor:</strong> ${p.seller_name} 
                    <button onclick="mostrarGaleriaVendedor('${p.seller_id}')" style="background:none; border:none; color:var(--primary-purple); text-decoration:underline; cursor:pointer;">
                        Ver Galería
                    </button>
                </p>
                <p><strong>Categoría:</strong> ${p.category}</p>
                
                <!-- BLOQUE IA DE CLOUDFLARE -->
                <div id="ai-promo-${p.id}" style="margin:10px 0; padding:8px; background:#f0fdf4; border:1px dashed #bbf7d0; font-size:0.85rem; color:#166534; border-radius:6px;">
                    ✨ IA pensando oferta...
                </div>

                <div class="card-footer">
                    <div class="price"><span>$${p.price}</span></div>
                </div>

                ${isOwner ? `
                    <div class="card-actions"><button class="btn-edit" onclick="VV.marketplace.showForm('${p.id}')">Editar</button></div>
                ` : `
                    <button class="btn-primary" onclick="VV.reservations.create('${p.id}')" style="width:100%;">Reservar</button>
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        <button class="btn-secondary" style="flex:1" onclick="VV.marketplace.addToCart('${p.id}')">Agenda</button>
                        <button class="btn-secondary" style="flex:1" onclick="VV.marketplace.compareProduct('${p.product}')">Comparar</button>
                    </div>
                `}
            </div>`;
        }).join('');

        neighborhoodProducts.forEach(p => {
            if (typeof activarSugerenciaIA === 'function') activarSugerenciaIA(p.id, p.product, p.price);
        });
    }
};

// FUNCIONES FUERA DEL OBJETO PARA EVITAR ERRORES DE SINTAXIS
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
        el.innerText = "💡 IA: " + (data.oferta || data.response);
    } catch (e) { el.style.display = 'none'; }
}

function mostrarGaleriaVendedor(idVendedor) {
    alert("Próximamente galería del vendedor: " + idVendedor);
}
