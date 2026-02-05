// ========== MÓDULO MARKETPLACE ==========

// Función helper para normalizar nombres de barrios
const normalizeNeighborhood = (name) => {
    return name?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() || '';
};

// Función helper para comparar barrios (ignora tildes y mayúsculas)
const isSameNeighborhood = (neighborhood1, neighborhood2) => {
    return normalizeNeighborhood(neighborhood1) === normalizeNeighborhood(neighborhood2);
};

VV.marketplace = {
    // Cargar mis productos
    load() {
        const container = document.getElementById('my-products');
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
                </div>
            `;
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
                    <div class="price">
                        <span class="price-amount">$${p.price}</span>
                        <span class="price-unit">/ ${p.unit}</span>
                    </div>
                    <div class="contact">
                        <i class="fas fa-phone"></i> ${p.contact}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-edit" onclick="VV.marketplace.showForm('${p.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    ${!p.featured ? `
                        <button class="btn-primary" onclick="VV.marketplace.requestFeatured('${p.id}')" style="background: var(--warning-yellow); color: var(--gray-800);">
                            <i class="fas fa-star"></i> Solicitar Destacar
                        </button>
                    ` : `
                        <span class="badge" style="background: var(--warning-yellow); color: var(--gray-800); padding: 0.5rem 1rem;">
                            <i class="fas fa-star"></i> Destacado
                        </span>
                    `}
                    <button class="btn-delete" onclick="VV.marketplace.deleteProduct('${p.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    // Cargar todos los productos (comprar)
    loadShopping() {
        const container = document.getElementById('all-products');
        
        // Filtrar solo productos del mismo barrio
        const neighborhoodProducts = VV.data.products.filter(p => 
            !p.neighborhood || isSameNeighborhood(p.neighborhood, VV.data.neighborhood)
        );
        
        if (neighborhoodProducts.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray-600);">
                    <i class="fas fa-shopping-bag" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No hay productos en tu barrio</h3>
                    <p>Sé el primero en publicar productos en ${VV.data.neighborhood}</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = neighborhoodProducts.map(p => {
            const isOwner = p.seller_id === VV.data.user.id;
            const canModerate = VV.utils.canModerate();
            
            return `
            <div class="product-card">
                <div class="card-header">
                    <h3>${p.product}</h3>
                    ${p.featured ? '<span class="badge featured">⭐ Destacado</span>' : ''}
                    <span class="badge quality-${p.quality?.toLowerCase().replace(' ', '-') || 'buena'}">${p.quality || 'Buena'}</span>
                </div>
                <p><strong>Vendedor:</strong> ${p.seller_name || 'Vecino'}</p>
                <p><strong>Negocio:</strong> ${p.business}</p>
                <p><strong>Categoría:</strong> ${p.category}</p>
                <p style="color: var(--gray-600); margin: 0.5rem 0;">${p.description || ''}</p>
                <div class="card-footer">
                    <div class="price">
                        <span class="price-amount">$${p.price}</span>
                        <span class="price-unit">/ ${p.unit}</span>
                    </div>
                    <div class="contact">
                        <i class="fas fa-phone"></i> ${p.contact}
                    </div>
                </div>
                ${isOwner ? `
                    <div class="card-actions" style="margin-top: 1rem;">
                        <button class="btn-edit" onclick="VV.marketplace.showForm('${p.id}')">Editar</button>
                    </div>
                ` : `
                    <button class="btn-primary" onclick="VV.marketplace.addToCart('${p.id}')" style="width: 100%; margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Agregar a Agenda
                    </button>
                `}
            </div>
        `;
        }).join('');
        
        VV.marketplace.setupFilters();
    },
    
    // Setup filtros
    setupFilters() {
        const categoryFilter = document.getElementById('category-filter');
        if (!categoryFilter) return;
        const categories = [...new Set(VV.data.products.map(p => p.category))];
        categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
        categories.forEach(cat => { categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`; });
    },
    
    // Filtrar productos
    filterProducts() {
        const search = document.getElementById('product-search').value.toLowerCase();
        const filtered = VV.data.products.filter(p => 
            isSameNeighborhood(p.neighborhood, VV.data.neighborhood) &&
            (p.product.toLowerCase().includes(search) || p.business.toLowerCase().includes(search))
        );
        // ... Lógica de renderizado simplificada para filtros
    },
    
    // Mostrar formulario
    showForm(productId = null) {
        const product = productId ? VV.data.products.find(p => p.id === productId) : null;
        const isEdit = product !== null;
        let overlay = document.getElementById('product-form-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'product-form-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form">
                <h3>${isEdit ? 'Editar' : 'Nuevo'} Producto</h3>
                <form id="product-form">
                    <div class="form-group"><label>Producto</label><input type="text" id="product-name" value="${product?.product || ''}" required></div>
                    <div class="form-group"><label>Precio</label><input type="number" id="product-price" value="${product?.price || ''}" required></div>
                    <div class="form-group"><label>Unidad</label><input type="text" id="product-unit" value="${product?.unit || 'unidad'}" required></div>
                    <div class="form-group"><label>Negocio</label><input type="text" id="product-business" value="${product?.business || VV.data.user.business_name || ''}" required></div>
                    <div class="form-group"><label>Categoría</label><select id="product-category"><option>Almacén</option><option>Verdulería</option><option>Otros</option></select></div>
                    <div class="form-actions">
                        <button type="button" onclick="VV.marketplace.closeForm()">Cancelar</button>
                        <button type="submit">Guardar</button>
                    </div>
                </form>
            </div>
        `;
        overlay.classList.add('active');
        document.getElementById('product-form').onsubmit = (e) => {
            e.preventDefault();
            VV.marketplace.saveProduct(product);
        };
    },
    
    closeForm() { document.getElementById('product-form-overlay').classList.remove('active'); },
    
    async saveProduct(existing) {
        // Lógica de guardado en Supabase (Versión original)
        const formData = {
            product: document.getElementById('product-name').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            unit: document.getElementById('product-unit').value.trim(),
            business: document.getElementById('product-business').value.trim(),
            category: document.getElementById('product-category').value,
            neighborhood: VV.data.neighborhood,
            seller_id: VV.data.user.id,
            seller_name: VV.data.user.name,
            contact: VV.data.user.phone
        };
        
        try {
            if (existing) {
                await supabase.from('products').update(formData).eq('id', existing.id);
            } else {
                await supabase.from('products').insert(formData);
            }
            VV.marketplace.closeForm();
            await VV.data.loadFromSupabase();
            VV.marketplace.load();
        } catch (e) { alert("Error al guardar"); }
    },

    async deleteProduct(id) {
        if (!confirm('¿Eliminar producto?')) return;
        await supabase.from('products').delete().eq('id', id);
        await VV.data.loadFromSupabase();
        VV.marketplace.load();
    }
};

window.toggleCart = () => document.getElementById('shopping-cart').classList.toggle('active');
console.log('✅ Módulo MARKETPLACE original cargado');
