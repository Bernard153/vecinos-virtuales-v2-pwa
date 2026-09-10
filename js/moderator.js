// ========== MÓDULO MODERADOR (Supabase) ==========

VV.moderator = {
    // Cargar panel de moderador
    load() {
        if (!VV.utils.isModerator()) {
            alert('No tienes permisos de moderación');
            return;
        }
        document.getElementById('moderator-neighborhood').textContent = VV.data.neighborhood;
        VV.moderator.showTab('users');
    },

    // Cambiar tab
    showTab(tabName) {
        document.querySelectorAll('.moderator-tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.moderator-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));

        const tabEl = document.getElementById(`moderator-${tabName}`);
        if (tabEl) tabEl.classList.add('active');

        // Activar botón correspondiente
        const btns = document.querySelectorAll('.moderator-tabs .tab-btn');
        btns.forEach((btn, i) => {
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabName}'`)) {
                btn.classList.add('active');
            }
        });

        switch(tabName) {
            case 'users': VV.moderator.loadUsers(); break;
            case 'content': VV.moderator.loadContent(); break;
            case 'improvements': VV.moderator.loadImprovements(); break;
            case 'reports': VV.moderator.loadReports(); break;
            case 'stats': VV.moderator.loadStats(); break;
        }
    },

    // Registrar acción de moderador en Supabase
    async logAction(action, details) {
        try {
            await supabase.from('moderator_logs').insert([{
                moderator_id: VV.data.user.id,
                moderator_name: VV.data.user.name,
                neighborhood: VV.data.neighborhood,
                action: action,
                details: JSON.stringify(details),
                created_at: new Date().toISOString()
            }]);
        } catch (err) {
            console.error('Error registrando log:', err);
        }
    },

    // Cargar usuarios del barrio
    async loadUsers() {
        const container = document.getElementById('moderator-users-list');
        if (!container) return;

        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('id, name, unique_number, role, blocked, created_at')
                .eq('neighborhood', VV.data.neighborhood)
                .neq('id', VV.data.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!users || users.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-600);">No hay otros usuarios en tu barrio</p>';
                return;
            }

            container.innerHTML = users.map(user => `
                <div class="user-card" style="opacity: ${user.blocked ? 0.6 : 1};">
                    <div class="user-info">
                        <h4>${sanitizeText(user.name)} ${user.blocked ? '<span style="color:#ef4444;font-size:0.75rem;">🚫 BLOQUEADO</span>' : ''}</h4>
                        <p style="color: var(--gray-600); font-size: 0.9rem;">Usuario #${user.unique_number}</p>
                        <p style="font-size: 0.85rem; color: var(--gray-500);">
                            <i class="fas fa-calendar"></i> Registrado: ${new Date(user.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div class="user-actions">
                        ${user.blocked
                            ? `<button class="btn-approve" onclick="VV.moderator.toggleBlockUser('${user.id}', '${user.name.replace(/'/g, "\\'")}', false)">
                                <i class="fas fa-user-check"></i> Desbloquear
                              </button>`
                            : `<button class="btn-delete" onclick="VV.moderator.toggleBlockUser('${user.id}', '${user.name.replace(/'/g, "\\'")}', true)">
                                <i class="fas fa-user-times"></i> Bloquear
                              </button>`
                        }
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error cargando usuarios:', err);
            container.innerHTML = '<p style="color: var(--gray-600); padding: 1rem;">Error al cargar usuarios</p>';
        }
    },

    // Bloquear/desbloquear usuario
    async toggleBlockUser(userId, userName, block) {
        if (!confirm(`¿${block ? 'Bloquear' : 'Desbloquear'} al usuario "${userName}"?\n\nUn usuario bloqueado no puede ingresar a la app.`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({ blocked: block, blocked_reason: block ? 'Bloqueado por moderador' : null })
                .eq('id', userId);

            if (error) throw error;

            await VV.moderator.logAction(block ? 'BLOQUEAR_USUARIO' : 'DESBLOQUEAR_USUARIO', {
                usuarioId: userId, usuarioNombre: userName
            });

            VV.moderator.loadUsers();
            VV.utils.showSuccess(`Usuario ${block ? 'bloqueado' : 'desbloqueado'}`);
        } catch (err) {
            console.error('Error:', err);
            alert('Error: ' + err.message);
        }
    },

    // Cargar contenido para moderar
    async loadContent() {
        // Productos
        const productsContainer = document.getElementById('moderator-products-list');
        if (productsContainer) {
            try {
                const { data: products, error } = await supabase
                    .from('products')
                    .select('id, product, seller_name, description, neighborhood, created_at')
                    .eq('neighborhood', VV.data.neighborhood)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (!products || products.length === 0) {
                    productsContainer.innerHTML = '<p style="color: var(--gray-600); padding: 1rem;">No hay productos</p>';
                } else {
                    productsContainer.innerHTML = products.map(p => `
                        <div class="product-card" style="border:1px solid var(--gray-200);border-radius:8px;padding:1rem;margin-bottom:0.5rem;">
                            <h4>${sanitizeText(p.product)}</h4>
                            <p><strong>Vendedor:</strong> ${sanitizeText(p.seller_name || '')}</p>
                            <p style="font-size: 0.9rem; color: var(--gray-600);">${sanitizeText(p.description || 'Sin descripción')}</p>
                            <button class="btn-delete" onclick="VV.moderator.removeProduct('${p.id}', '${p.product.replace(/'/g, "\\'")}')" style="width: 100%; margin-top: 0.5rem;">
                                <i class="fas fa-trash"></i> Eliminar Producto
                            </button>
                        </div>
                    `).join('');
                }
            } catch (err) {
                console.error('Error cargando productos:', err);
                productsContainer.innerHTML = '<p style="color: var(--gray-600); padding: 1rem;">Error al cargar productos</p>';
            }
        }

        // Publicaciones culturales
        const culturalContainer = document.getElementById('moderator-cultural-list');
        if (culturalContainer) {
            try {
                const { data: cultural, error } = await supabase
                    .from('cultural_posts')
                    .select('id, title, type, description, author_name, neighborhood, created_at')
                    .eq('neighborhood', VV.data.neighborhood)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (!cultural || cultural.length === 0) {
                    culturalContainer.innerHTML = '<p style="color: var(--gray-600); padding: 1rem;">No hay publicaciones culturales</p>';
                } else {
                    culturalContainer.innerHTML = cultural.map(c => `
                        <div class="cultural-card" style="border:1px solid var(--gray-200);border-radius:8px;padding:1rem;margin-bottom:0.5rem;">
                            <h4>${sanitizeText(c.title)}</h4>
                            <p><strong>Por:</strong> ${sanitizeText(c.author_name || '')}</p>
                            <p style="font-size: 0.9rem; color: var(--gray-600);">${sanitizeText((c.description || '').substring(0, 100))}...</p>
                            <button class="btn-delete" onclick="VV.moderator.removeCultural('${c.id}', '${c.title.replace(/'/g, "\\'")}')" style="width: 100%; margin-top: 0.5rem;">
                                <i class="fas fa-trash"></i> Eliminar Publicación
                            </button>
                        </div>
                    `).join('');
                }
            } catch (err) {
                console.error('Error cargando cultural:', err);
                culturalContainer.innerHTML = '<p style="color: var(--gray-600); padding: 1rem;">Error al cargar publicaciones</p>';
            }
        }
    },

    // Eliminar producto
    async removeProduct(productId, productName) {
        if (!confirm(`¿Eliminar el producto "${productName}"?`)) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            await VV.moderator.logAction('ELIMINAR_PRODUCTO', {
                productoId: productId, productoNombre: productName
            });

            VV.moderator.loadContent();
            VV.utils.showSuccess('Producto eliminado');
        } catch (err) {
            console.error('Error:', err);
            alert('Error: ' + err.message);
        }
    },

    // Eliminar publicación cultural
    async removeCultural(culturalId, culturalTitle) {
        if (!confirm(`¿Eliminar la publicación "${culturalTitle}"?`)) return;

        try {
            const { error } = await supabase
                .from('cultural_posts')
                .delete()
                .eq('id', culturalId);

            if (error) throw error;

            await VV.moderator.logAction('ELIMINAR_PUBLICACION', {
                publicacionId: culturalId, publicacionTitulo: culturalTitle
            });

            VV.moderator.loadContent();
            VV.utils.showSuccess('Publicación eliminada');
        } catch (err) {
            console.error('Error:', err);
            alert('Error: ' + err.message);
        }
    },

    // Cargar mejoras
    async loadImprovements() {
        try {
            const { data: improvements, error } = await supabase
                .from('improvements')
                .select('*')
                .eq('neighborhood', VV.data.neighborhood)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const pending = (improvements || []).filter(i => i.status !== 'Completado' && i.status !== 'completed');
            const completed = (improvements || []).filter(i => i.status === 'Completado' || i.status === 'completed');

            const pendingContainer = document.getElementById('moderator-improvements-pending');
            if (pendingContainer) {
                pendingContainer.innerHTML = pending.length === 0
                    ? '<p style="color: var(--gray-600); padding: 1rem;">No hay mejoras pendientes</p>'
                    : pending.map(i => `
                        <div class="improvement-card" style="border-left: 4px solid var(--warning-orange); padding: 1rem; margin-bottom: 0.5rem; background: var(--gray-50); border-radius: 8px;">
                            <h4>${sanitizeText(i.title)}</h4>
                            <p style="font-size: 0.9rem; color: var(--gray-600);">${sanitizeText(i.description || '')}</p>
                            <div style="margin-top: 0.5rem;">
                                <span class="badge" style="background: #f1f5f9; color: #475569; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">${sanitizeText(i.status || 'Pendiente')}</span>
                                <span class="badge" style="background: #fef3c7; color: #92400e; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">${sanitizeText(i.priority || 'Normal')}</span>
                            </div>
                            <p style="font-size: 0.85rem; color: var(--gray-500); margin-top: 0.5rem;">
                                <i class="fas fa-thumbs-up"></i> ${i.votes || 0} votos
                            </p>
                        </div>
                    `).join('');
            }

            const completedContainer = document.getElementById('moderator-improvements-completed');
            if (completedContainer) {
                completedContainer.innerHTML = completed.length === 0
                    ? '<p style="color: var(--gray-600); padding: 1rem;">No hay mejoras completadas</p>'
                    : completed.map(i => `
                        <div class="improvement-card" style="border-left: 4px solid var(--success-green); padding: 1rem; margin-bottom: 0.5rem; background: var(--gray-50); border-radius: 8px;">
                            <h4>${sanitizeText(i.title)}</h4>
                            <p style="font-size: 0.9rem; color: var(--gray-600);">${sanitizeText(i.description || '')}</p>
                            <span class="badge" style="background: #dcfce7; color: #166534; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">✅ Completado</span>
                        </div>
                    `).join('');
            }
        } catch (err) {
            console.error('Error cargando mejoras:', err);
        }
    },

    // Cargar denuncias
    async loadReports() {
        const container = document.getElementById('moderator-reports-list');
        if (!container) return;

        try {
            const { data: reports, error } = await supabase
                .from('denuncias')
                .select('*')
                .eq('neighborhood', VV.data.neighborhood)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!reports || reports.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #94a3b8; grid-column: 1/-1; padding: 2rem;">No hay denuncias en tu barrio 🎉</p>';
                return;
            }

            container.innerHTML = reports.map(r => `
                <div class="admin-card-solicitud" style="border-left: 4px solid #ef4444;">
                    <div class="info">
                        <strong>🚨 ${sanitizeText(r.tipo || 'Denuncia')}</strong>
                        <p>${sanitizeText(r.motivo || r.reason || 'Sin motivo especificado')}</p>
                        <p style="font-size:0.75rem;color:#94a3b8;">
                            Por: ${sanitizeText(r.reporter_name || r.denunciante || 'Anónimo')} |
                            ${new Date(r.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div class="acciones">
                        <button class="btn-approve" onclick="VV.moderator.resolveReport('${r.id}')" style="font-size:0.75rem;">
                            <i class="fas fa-check"></i> Resolver
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error cargando denuncias:', err);
            container.innerHTML = '<p style="color: var(--gray-600); padding: 1rem;">Error al cargar denuncias</p>';
        }
    },

    // Resolver denuncia
    async resolveReport(reportId) {
        if (!confirm('¿Marcar esta denuncia como resuelta?')) return;

        try {
            const { error } = await supabase
                .from('denuncias')
                .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: VV.data.user.id })
                .eq('id', reportId);

            if (error) throw error;

            await VV.moderator.logAction('RESOLVER_DENUNCIA', { denunciaId: reportId });

            VV.moderator.loadReports();
            VV.utils.showSuccess('Denuncia resuelta');
        } catch (err) {
            console.error('Error:', err);
            alert('Error: ' + err.message);
        }
    },

    // Cargar estadísticas
    async loadStats() {
        try {
            // Usuarios
            const { count: usersCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('neighborhood', VV.data.neighborhood);

            // Productos
            const { count: productsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('neighborhood', VV.data.neighborhood);

            // Cultural
            const { count: culturalCount } = await supabase
                .from('cultural_posts')
                .select('*', { count: 'exact', head: true })
                .eq('neighborhood', VV.data.neighborhood);

            // Mejoras
            const { count: improvementsCount } = await supabase
                .from('improvements')
                .select('*', { count: 'exact', head: true })
                .eq('neighborhood', VV.data.neighborhood);

            const elUsers = document.getElementById('mod-stat-users');
            const elProducts = document.getElementById('mod-stat-products');
            const elCultural = document.getElementById('mod-stat-cultural');
            const elImprovements = document.getElementById('mod-stat-improvements');

            if (elUsers) elUsers.textContent = usersCount || 0;
            if (elProducts) elProducts.textContent = productsCount || 0;
            if (elCultural) elCultural.textContent = culturalCount || 0;
            if (elImprovements) elImprovements.textContent = improvementsCount || 0;
        } catch (err) {
            console.error('Error cargando stats:', err);
        }
    }
};

console.log('✅ Módulo MODERADOR cargado');
