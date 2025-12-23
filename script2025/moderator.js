// ========== MÓDULO MODERADOR ==========

VV.moderator = {
    // Cargar panel de moderador
    load() {
        if (!VV.utils.isModerator()) {
            alert('No tienes permisos de moderación');
            return;
        }
        
        // Mostrar nombre del barrio
        document.getElementById('moderator-neighborhood').textContent = VV.data.neighborhood;
        
        // Cargar tab activo
        VV.moderator.showTab('users');
    },
    
    // Cambiar tab
    showTab(tabName) {
        // Ocultar todos los tabs
        document.querySelectorAll('.moderator-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.moderator-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar tab seleccionado
        document.getElementById(`moderator-${tabName}`).classList.add('active');
        event.target.classList.add('active');
        
        // Cargar contenido según tab
        switch(tabName) {
            case 'users':
                VV.moderator.loadUsers();
                break;
            case 'content':
                VV.moderator.loadContent();
                break;
            case 'improvements':
                VV.moderator.loadImprovements();
                break;
            case 'stats':
                VV.moderator.loadStats();
                break;
        }
    },
    
    // Cargar usuarios del barrio (SIN datos personales sensibles)
    loadUsers() {
        const users = VV.auth.getAllUsers().filter(u => 
            u.neighborhood === VV.data.neighborhood && u.id !== VV.data.user.id
        );
        
        const container = document.getElementById('moderator-users-list');
        
        if (users.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay otros usuarios en tu barrio</p>';
            return;
        }
        
        container.innerHTML = users.map(user => `
            <div class="user-card">
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <p style="color: var(--gray-600); font-size: 0.9rem;">
                        Usuario #${user.uniqueNumber}
                    </p>
                    <p style="font-size: 0.85rem; color: var(--gray-500);">
                        <i class="fas fa-calendar"></i> Registrado: ${new Date(user.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div class="user-actions">
                    <button class="btn-delete" onclick="VV.moderator.removeUser('${user.id}', '${user.name}')">
                        <i class="fas fa-user-times"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    // Eliminar usuario problemático
    removeUser(userId, userName) {
        if (!confirm(`¿Eliminar al usuario "${userName}"?\n\nEsta acción no se puede deshacer.`)) return;
        
        const userKey = `vecinosVirtuales_user_${userId}`;
        localStorage.removeItem(userKey);
        
        // Registrar acción
        VV.utils.logModeratorAction('ELIMINAR_USUARIO', {
            usuarioId: userId,
            usuarioNombre: userName,
            motivo: 'Usuario problemático'
        });
        
        VV.moderator.loadUsers();
        VV.utils.showSuccess('Usuario eliminado');
    },
    
    // Cargar contenido para moderar
    loadContent() {
        // Productos del barrio
        const products = VV.data.products.filter(p => 
            p.neighborhood === VV.data.neighborhood
        );
        
        const productsContainer = document.getElementById('moderator-products-list');
        
        if (products.length === 0) {
            productsContainer.innerHTML = '<p style="color: var(--gray-600); padding: 1rem;">No hay productos</p>';
        } else {
            productsContainer.innerHTML = `
                <div class="products-grid">
                    ${products.map(p => `
                        <div class="product-card">
                            <h4>${p.product}</h4>
                            <p><strong>Vendedor:</strong> ${p.sellerName}</p>
                            <p style="font-size: 0.9rem; color: var(--gray-600);">${p.description || 'Sin descripción'}</p>
                            <button class="btn-delete" onclick="VV.moderator.removeProduct('${p.id}', '${p.product}')" style="width: 100%; margin-top: 0.5rem;">
                                <i class="fas fa-trash"></i> Eliminar Producto
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Publicaciones culturales del barrio
        const cultural = VV.data.culturalPosts.filter(c => 
            c.neighborhood === VV.data.neighborhood
        );
        
        const culturalContainer = document.getElementById('moderator-cultural-list');
        
        if (cultural.length === 0) {
            culturalContainer.innerHTML = '<p style="color: var(--gray-600); padding: 1rem;">No hay publicaciones culturales</p>';
        } else {
            culturalContainer.innerHTML = `
                <div class="cultural-grid">
                    ${cultural.map(c => `
                        <div class="cultural-card">
                            <h4>${c.title}</h4>
                            <p><strong>Por:</strong> ${c.userName}</p>
                            <p style="font-size: 0.9rem; color: var(--gray-600);">${c.description.substring(0, 100)}...</p>
                            <button class="btn-delete" onclick="VV.moderator.removeCultural('${c.id}', '${c.title}')" style="width: 100%; margin-top: 0.5rem;">
                                <i class="fas fa-trash"></i> Eliminar Publicación
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    },
    
    // Eliminar producto inapropiado
    removeProduct(productId, productName) {
        if (!confirm(`¿Eliminar el producto "${productName}"?`)) return;
        
        const index = VV.data.products.findIndex(p => p.id === productId);
        if (index > -1) {
            const product = VV.data.products[index];
            VV.data.products.splice(index, 1);
            
            // Guardar en localStorage
            localStorage.setItem('vecinosVirtuales_products', JSON.stringify(VV.data.products));
            
            // Registrar acción
            VV.utils.logModeratorAction('ELIMINAR_PRODUCTO', {
                productoId: productId,
                productoNombre: productName,
                vendedor: product.sellerName,
                motivo: 'Contenido inapropiado'
            });
            
            VV.moderator.loadContent();
            VV.utils.showSuccess('Producto eliminado');
        }
    },
    
    // Eliminar publicación cultural inapropiada
    removeCultural(culturalId, culturalTitle) {
        if (!confirm(`¿Eliminar la publicación "${culturalTitle}"?`)) return;
        
        const index = VV.data.culturalPosts.findIndex(c => c.id === culturalId);
        if (index > -1) {
            const cultural = VV.data.culturalPosts[index];
            VV.data.culturalPosts.splice(index, 1);
            
            // Guardar en localStorage
            localStorage.setItem('vecinosVirtuales_cultural', JSON.stringify(VV.data.culturalPosts));
            
            // Registrar acción
            VV.utils.logModeratorAction('ELIMINAR_PUBLICACION', {
                publicacionId: culturalId,
                publicacionTitulo: culturalTitle,
                autor: cultural.userName,
                tipo: cultural.type,
                motivo: 'Contenido inapropiado'
            });
            
            VV.moderator.loadContent();
            VV.utils.showSuccess('Publicación eliminada');
        }
    },
    
    // Cargar mejoras (pendientes y realizadas)
    loadImprovements() {
        const improvements = VV.data.improvements.filter(i => 
            i.neighborhood === VV.data.neighborhood
        );
        
        const pending = improvements.filter(i => i.status !== 'Completado');
        const completed = improvements.filter(i => i.status === 'Completado');
        
        // Pendientes
        const pendingContainer = document.getElementById('moderator-improvements-pending');
        if (pending.length === 0) {
            pendingContainer.innerHTML = '<p style="color: var(--gray-600); padding: 1rem;">No hay mejoras pendientes</p>';
        } else {
            pendingContainer.innerHTML = pending.map(i => `
                <div class="improvement-card" style="border-left: 4px solid var(--warning-orange);">
                    <h4>${i.title}</h4>
                    <p style="font-size: 0.9rem; color: var(--gray-600);">${i.description}</p>
                    <div style="margin-top: 0.5rem;">
                        <span class="badge status-${i.status.toLowerCase().replace(' ', '-')}">${i.status}</span>
                        <span class="badge priority-${i.priority.toLowerCase()}">${i.priority}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--gray-500); margin-top: 0.5rem;">
                        <i class="fas fa-thumbs-up"></i> ${i.votes} votos
                    </p>
                </div>
            `).join('');
        }
        
        // Realizadas
        const completedContainer = document.getElementById('moderator-improvements-completed');
        if (completed.length === 0) {
            completedContainer.innerHTML = '<p style="color: var(--gray-600); padding: 1rem;">No hay mejoras completadas</p>';
        } else {
            completedContainer.innerHTML = completed.map(i => `
                <div class="improvement-card" style="border-left: 4px solid var(--success-green);">
                    <h4>${i.title}</h4>
                    <p style="font-size: 0.9rem; color: var(--gray-600);">${i.description}</p>
                    <div style="margin-top: 0.5rem;">
                        <span class="badge status-completado">✓ Completado</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--gray-500); margin-top: 0.5rem;">
                        <i class="fas fa-thumbs-up"></i> ${i.votes} votos
                    </p>
                </div>
            `).join('');
        }
    },
    
    // Cargar estadísticas del barrio
    loadStats() {
        const users = VV.auth.getAllUsers().filter(u => u.neighborhood === VV.data.neighborhood);
        const products = VV.data.products.filter(p => p.neighborhood === VV.data.neighborhood);
        const cultural = VV.data.culturalPosts.filter(c => c.neighborhood === VV.data.neighborhood);
        const improvements = VV.data.improvements.filter(i => i.neighborhood === VV.data.neighborhood);
        
        document.getElementById('mod-stat-users').textContent = users.length;
        document.getElementById('mod-stat-products').textContent = products.length;
        document.getElementById('mod-stat-cultural').textContent = cultural.length;
        document.getElementById('mod-stat-improvements').textContent = improvements.length;
    }
};

console.log('✅ Módulo MODERADOR cargado');
