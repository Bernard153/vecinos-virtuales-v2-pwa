// ============================================================
// MÓDULO IMPROVEMENTS COMPLETO Y CORREGIDO CON COFRE DE ESTIMULOS
// ============================================================

VV.improvements = {
    // Renderizar botón de voto (ACTUALIZADO CON COFRE DE PRIORIDAD)
    renderVoteButton(improvement) {
        const votedBy = improvement.voted_by || [];
        const hasVoted = votedBy.includes(VV.data.user.id);
        
        let botonVotoClasico = '';
        
        if (hasVoted) {
            botonVotoClasico = `
                <button class="vote-btn" disabled style="opacity: 0.6; cursor: not-allowed;">
                    <i class="fas fa-thumbs-up" style="color: var(--primary-blue);"></i> ${improvement.votes} (Ya votaste)
                </button>
            `;
        } else {
            botonVotoClasico = `
                <button class="vote-btn" onclick="VV.improvements.vote('${improvement.id}')">
                    <i class="fas fa-thumbs-up"></i> ${improvement.votes}
                </button>
            `;
        }

        // Unimos de forma armónica tu botón clásico y el nuevo megáfono
        return `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${botonVotoClasico}
                <button onclick="VV.improvements.abrirCofreMejoras('${improvement.id}', '${improvement.user_id}', this)" style="background: #f59e0b; color: white; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" title="Dar prioridad urgente con un Megáfono">
                    🎁
                </button>
            </div>
        `;
    },
    
    // Votar mejora - MIGRADO A SUPABASE
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
            const newVotes = improvement.votes + 1;
            const newVotedBy = [...votedBy, VV.data.user.id];
            
            const { error } = await supabase
                .from('improvements')
                .update({ 
                    votes: newVotes,
                    voted_by: newVotedBy
                })
                .eq('id', improvementId);
            
            if (error) throw error;
            
            improvement.votes = newVotes;
            improvement.voted_by = newVotedBy;
            VV.improvements.load();
            VV.utils.showSuccess('¡Voto registrado!');
            
        } catch (error) {
            console.error('Error votando mejora:', error);
            alert('Error al votar. Intenta nuevamente.');
        }
    },
    
    // Marcar mejora como completada (solo moderadores y admins)
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
                <p style="margin-bottom: 1rem;"><strong>${improvement.title}</strong></p>
                <form id="complete-form">
                    <div class="form-group">
                        <label>Foto de la mejora realizada (opcional)</label>
                        <p style="font-size: 0.85rem; color: var(--gray-600); margin-bottom: 0.5rem;">Documenta el resultado si es posible</p>
                        <input type="file" id="completed-photo" accept="image/*" style="padding: 0.5rem;">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="document.getElementById('complete-improvement-overlay').classList.remove('active')">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-check"></i> Confirmar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('complete-form').onsubmit = (e) => {
            e.preventDefault();
            
            const photoInput = document.getElementById('completed-photo');
            if (photoInput.files && photoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    improvement.completedPhotoUrl = e.target.result;
                    VV.improvements.completeImprovement(improvement);
                };
                reader.readAsDataURL(photoInput.files[0]);
            } else {
                VV.improvements.completeImprovement(improvement);
            }
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        };
    },
    
    // Completar mejora
    completeImprovement(improvement) {
        improvement.status = 'Completado';
        improvement.completedAt = new Date().toISOString();
        improvement.completedBy = VV.data.user.name;
        
        localStorage.setItem('vecinosVirtuales_improvements', JSON.stringify(VV.data.improvements));
        
        VV.utils.logModeratorAction('COMPLETAR_MEJORA', {
            mejoraId: improvement.id,
            mejoraTitulo: improvement.title,
            motivo: 'Mejora realizada'
        });
        
        document.getElementById('complete-improvement-overlay').classList.remove('active');
        VV.improvements.load();
        VV.utils.showSuccess('Mejora marcada como realizada');
    },
    
    // Ver foto en tamaño completo
    viewPhoto(photoUrl) {
        let overlay = document.getElementById('photo-viewer-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'photo-viewer-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 2rem;">
                <div style="position: relative; max-width: 90%; max-height: 90%;">
                    <button onclick="document.getElementById('photo-viewer-overlay').classList.remove('active')" style="position: absolute; top: -40px; right: 0; background: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                    <img src="${photoUrl}" style="max-width: 100%; max-height: 80vh; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        };
    },

    // 📢 ENVIAR MEGÁFONO CON MONEDAS REALES - NUEVA INNOVACIÓN FIJADA
    async abrirCofreMejoras(mejorasId, creadorPostId, elementoBoton) {
        try {
            if (!VV.data.user || !VV.data.user.id) {
                alert('¡Hola! Para apoyar este reclamo vecinal con megáfonos debes validar tu identidad por WhatsApp.');
                return;
            }

            const usuarioIdActual = VV.data.user.id;

            const { data: billetera, error: errorBilletera } = await supabase
                .from('billeteras')
                .select('saldo_monedas')
                .eq('user_id', usuarioIdActual)
                .single();

            if (errorBilletera || !billetera) {
                alert('No tienes saldo o tu billetera no está inicializada. Pásate por la sección Billetera.');
                return;
            }

            const COSTO_MEGAFONO = 5;

            if (billetera.saldo_monedas < COSTO_MEGAFONO) {
                alert(`Saldo insuficiente. Necesitas 🪙 ${COSTO_MEGAFONO} VecinoCoins para enviar un Megáfono.`);
                return;
            }

            if (!confirm(`¿Deseas aportar 1 Megáfono (🪙 ${COSTO_MEGAFONO}) de tu saldo para dar urgencia a este reclamo?`)) {
                return;
            }

            const { error: errorDescuento } = await supabase
                .from('billeteras')
                .update({ saldo_monedas: billetera.saldo_monedas - COSTO_MEGAFONO })
                .eq('user_id', usuarioIdActual);

            if (errorDescuento) throw errorDescuento;

            const { error: errorHistorial } = await supabase
                .from('regalos_enviados')
                .insert([{
                    emisor_id: usuarioIdActual,
Usa el código con precaución.receptor_id: creadorPostId,tipo_regalo: 'megafono',costo_monedas: COSTO_MEGAFONO,modulo_origen: 'mejoras',publicacion_id: mejorasId}]);if (errorHistorial) throw errorHistorial;const { data: billeteraReceptor } = await supabase.from('billeteras').select('puntos_xp').eq('user_id', creadorPostId).single();if (billeteraReceptor) {await supabase.from('billeteras').update({ puntos_xp: billeteraReceptor.puntos_xp + (COSTO_MEGAFONO * 10) }).eq('user_id', creadorPostId);}VV.utils.showSuccess('📢 ¡Megáfono de urgencia enviado!');const contenedor = document.createElement('div');contenedor.innerText = '📢';contenedor.style.cssText = 'position: fixed; font-size: 3rem; pointer-events: none; z-index: 9999; left: ' + elementoBoton.getBoundingClientRect().left + 'px; top: ' + elementoBoton.getBoundingClientRect().top + 'px; transition: all 1.5s ease-out; opacity: 1;';document.body.appendChild(contenedor);setTimeout(() => {contenedor.style.transform = 'translateY(-150px) scale(1.5)';contenedor.style.opacity = '0';}, 50);setTimeout(() => { contenedor.remove(); }, 1500);if (typeof VV.improvements.load === 'function') {VV.improvements.load();}} catch (err) {console.error("Fallo transaccional en mejoras:", err);alert("Hubo un error al procesar tu apoyo económico.");}}};console.log('✅ Módulo IMPROVEMENTS cargado');
