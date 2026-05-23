// ============================================================
// MÓDULO IMPROVEMENTS CORREGIDO INTEGRAL - BLOQUE 1
// ============================================================

VV.improvements = {
    // Función de carga nativa requerida por core.js para sincronizar tu feed
    load() {
        const container = document.getElementById('improvements-posts') || document.getElementById('gallery-improvements') || document.getElementById('cultural-posts');
        if (!container) return;

        // Filtrar y renderizar las mejoras existentes en tu base de datos global
        if (!VV.data.improvements || VV.data.improvements.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--gray-600);">
                    <i class="fas fa-wrench" style="font-size: 2.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                    <p>No hay reportes de mejoras activos en este barrio.</p>
                </div>
            `;
            return;
        }

        // Mapeo tradicional de tus tarjetas de mejoras amalgamado con el botón de prioridad urgente
        container.innerHTML = VV.data.improvements.map(improvement => {
            return `
                <div class="improvement-card" style="background: white; border-radius: 12px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 1rem; border: 1px solid var(--gray-200); text-align: left;">
                    <h4 style="margin: 0 0 0.25rem 0; font-weight: bold; color: var(--gray-800);">${improvement.title}</h4>
                    <p style="margin: 0 0 0.75rem 0; font-size: 0.85rem; color: var(--gray-600);">${improvement.description}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--gray-100); padding-top: 0.5rem;">
                        <span class="status-badge" style="font-size: 0.75rem; font-weight: 600; color: var(--primary-blue);">${improvement.status || 'Pendiente'}</span>
                        ${this.renderVoteButton(improvement)}
                    </div>
                </div>
            `;
        }).join('');
    },

    // Renderizar botón de voto clásico unificado con el nuevo cofre
    renderVoteButton(improvement) {
        const votedBy = improvement.voted_by || [];
        const hasVoted = VV.data.user && VV.data.user.id ? votedBy.includes(VV.data.user.id) : false;
        
        let botonVotoClasico = '';
        
        if (hasVoted) {
            botonVotoClasico = `
                <button class="vote-btn" disabled style="opacity: 0.6; cursor: not-allowed; border: none; background: none; font-size: 0.85rem;">
                    <i class="fas fa-thumbs-up" style="color: var(--primary-blue);"></i> ${improvement.votes || 0}
                </button>
            `;
        } else {
            botonVotoClasico = `
                <button class="vote-btn" onclick="VV.improvements.vote('${improvement.id}')" style="background: none; border: none; cursor: pointer; font-size: 0.85rem;">
                    <i class="fas fa-thumbs-up"></i> ${improvement.votes || 0}
                </button>
            `;
        }

        return `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${botonVotoClasico}
                <button onclick="VV.improvements.abrirCofreMejoras('${improvement.id}', '${improvement.user_id}', this)" style="background: #f59e0b; color: white; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 1rem; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center;" title="Dar prioridad con Megáfono">
                    🎁
                </button>
            </div>
        `;
    },
    // Votar mejora tradicional conectado a Supabase
    async vote(improvementId) {
        const homeNeighborhood = VV.data.user.home_neighborhood || VV.data.user.neighborhood;
        const currentNeighborhood = VV.data.user.current_neighborhood || VV.data.user.neighborhood;
        
        if (homeNeighborhood !== currentNeighborhood) {
            alert(`Solo puedes votar mejoras en tu barrio principal: ${homeNeighborhood}`);
            return;
        }
        
        const improvement = VV.data.improvements.find(i => i.id === improvementId);
        if (!improvement) return;
        
        const votedBy = improvement.voted_by || [];
        if (votedBy.includes(VV.data.user.id)) {
            alert('Ya votaste por esta mejora');
            return;
        }
        
        try {
            const newVotes = (improvement.votes || 0) + 1;
            const newVotedBy = [...votedBy, VV.data.user.id];
            
            const { error } = await supabase
                .from('improvements')
                .update({ votes: newVotes, voted_by: newVotedBy })
                .eq('id', improvementId);
            
            if (error) throw error;
            
            improvement.votes = newVotes;
            improvement.voted_by = newVotedBy;
            this.load();
            VV.utils.showSuccess('¡Voto registrado!');
        } catch (error) {
            console.error('Error votando mejora:', error);
            alert('Error al votar. Intenta nuevamente.');
        }
    },
    
    // Marcar mejora como completada (Administradores y Moderadores)
    markAsCompleted(improvementId) {
        if (!VV.utils.canModerate()) {
            alert('No tienes permisos para realizar esta acción');
            return;
        }
        
        const improvement = VV.data.improvements.find(i => i.id === improvementId);
        if (!improvement) return;
        
        let overlay = document.getElementById('complete-improvement-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'complete-improvement-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form">
                <h3><i class="fas fa-check-circle"></i> Marcar como Realizada</h3>
                <form id="complete-form">
                    <p><strong>${improvement.title}</strong></p>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="document.getElementById('complete-improvement-overlay').classList.remove('active')">Cancelar</button>
                        <button type="submit" class="btn-save">Confirmar</button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        document.getElementById('complete-form').onsubmit = (e) => {
            e.preventDefault();
            this.completeImprovement(improvement);
        };
    },
    
    completeImprovement(improvement) {
        improvement.status = 'Completado';
        localStorage.setItem('vecinosVirtuales_improvements', JSON.stringify(VV.data.improvements));
        document.getElementById('complete-improvement-overlay').classList.remove('active');
        this.load();
        VV.utils.showSuccess('Mejora marcada como realizada');
    },
    viewPhoto(photoUrl) { console.log("Abriendo foto visual:", photoUrl); },

    // 📢 ENVIAR MEGÁFONO CON MONEDAS REALES - CONTROLADO PARA CORE.JS
    async abrirCofreMejoras(mejorasId, creadorPostId, elementoBoton) {
        try {
            if (!VV.data.user || !VV.data.user.id) {
                alert('¡Hola! Para apoyar reclamos con megáfonos debes validar tu identidad por WhatsApp.');
                return;
            }

            const usuarioIdActual = VV.data.user.id;

            const { data: billetera, error: errorBilletera } = await supabase
                .from('billeteras')
                .select('saldo_monedas')
                .eq('user_id', usuarioIdActual)
                .single();

            if (errorBilletera || !billetera) {
                alert('Tu billetera no está inicializada. Pásate por la sección Billetera.');
                return;
            }

            const COSTO_MEGAFONO = 5;

            if (billetera.saldo_monedas < COSTO_MEGAFONO) {
                alert(`Saldo insuficiente. Necesitas 🪙 ${COSTO_MEGAFONO} VecinoCoins.`);
                return;
            }

            if (!confirm(`¿Deseas aportar 1 Megáfono (🪙 ${COSTO_MEGAFONO}) para dar urgencia a este reclamo?`)) {
                return;
            }

            const { error: errorDescuento } = await supabase
                .from('billeteras')
                .update({ saldo_monedas: billetera.saldo_monedas - COSTO_MEGAFONO })
                .eq('user_id', usuarioIdActual);

            if (errorDescuento) throw errorDescuento;

            await supabase.from('regalos_enviados').insert([{
                emisor_id: usuarioIdActual,
                receptor_id: creadorPostId || usuarioIdActual,
                tipo_regalo: 'megafono',
                costo_monedas: COSTO_MEGAFONO,
                modulo_origen: 'mejoras',
                publicacion_id: mejorasId
            }]);

            VV.utils.showSuccess('📢 ¡Megáfono de urgencia enviado!');
            this.load();

        } catch (err) {
            console.error("Fallo transaccional en mejoras:", err);
            alert("Hubo un error al procesar tu apoyo.");
        }
    }
};

console.log('✅ Módulo IMPROVEMENTS cargado correctamente');
