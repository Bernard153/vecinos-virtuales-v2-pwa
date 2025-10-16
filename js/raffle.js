// ========== MÓDULO RULETA DE LA SUERTE ==========

VV.raffle = {
    // Crear nuevo sorteo (solo admin)
    async createRaffle() {
        if (!VV.utils.isAdmin()) {
            alert('Solo el administrador puede crear sorteos');
            return;
        }
        
        // Obtener usuarios desde Supabase
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .neq('role', 'admin');
        
        if (error) {
            console.error('Error obteniendo usuarios:', error);
            alert('Error al cargar usuarios');
            return;
        }
        
        if (users.length === 0) {
            alert('No hay usuarios registrados para el sorteo');
            return;
        }
        
        let overlay = document.getElementById('raffle-create-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'raffle-create-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        const premiumAvatars = VV.avatars?.defaultAvatars?.filter(a => a.premium) || [];
        
        // Obtener barrios únicos de los usuarios
        const neighborhoods = [...new Set(users.map(u => u.neighborhood))].filter(n => n !== 'Administrador').sort();
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 700px;">
                <h3><i class="fas fa-dice"></i> Crear Nuevo Sorteo</h3>
                <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                    Todos los usuarios registrados participan automáticamente con su número único.
                </p>
                
                <form id="raffle-create-form">
                    <div class="form-group">
                        <label>Título del sorteo *</label>
                        <input type="text" id="raffle-title" required placeholder="Ej: Sorteo de Avatar Legendario">
                    </div>
                    
                    <div class="form-group">
                        <label>Descripción *</label>
                        <textarea id="raffle-description" rows="3" required placeholder="Describe el premio..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Tipo de premio *</label>
                        <select id="raffle-prize-type" onchange="VV.raffle.updatePrizeOptions()" required>
                            <option value="">Seleccionar tipo</option>
                            <option value="avatar">🎨 Avatar Premium</option>
                            <option value="credits">⭐ Créditos para Destacados</option>
                            <option value="product">🎁 Producto/Canasta</option>
                            <option value="custom">💎 Premio Personalizado</option>
                        </select>
                    </div>
                    
                    <div id="prize-options-container" style="display: none;">
                        <!-- Opciones específicas según el tipo de premio -->
                    </div>
                    
                    <div class="form-group">
                        <label>Dirigido a:</label>
                        <select id="raffle-target">
                            <option value="all">Todos los barrios</option>
                            ${neighborhoods.map(n => 
                                `<option value="${n}">${n}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                        <p style="margin: 0; font-size: 0.9rem;">
                            <i class="fas fa-users"></i> <strong>Participantes:</strong> ${users.length} usuarios
                        </p>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="VV.raffle.closeCreateForm()">Cancelar</button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-plus"></i> Crear Sorteo
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('raffle-create-form').onsubmit = (e) => {
            e.preventDefault();
            VV.raffle.saveRaffle();
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.raffle.closeCreateForm();
        };
    },
    
    // Actualizar opciones de premio según el tipo
    updatePrizeOptions() {
        const prizeType = document.getElementById('raffle-prize-type').value;
        const container = document.getElementById('prize-options-container');
        
        if (!prizeType) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        
        switch(prizeType) {
            case 'avatar':
                const premiumAvatars = VV.avatars.defaultAvatars.filter(a => a.premium);
                container.innerHTML = `
                    <div class="form-group">
                        <label>Selecciona el avatar *</label>
                        <select id="raffle-avatar-select" required>
                            <option value="">Seleccionar avatar</option>
                            ${premiumAvatars.map(a => `
                                <option value="${a.id}">${a.emoji} ${a.name} (${a.rarity})</option>
                            `).join('')}
                        </select>
                    </div>
                `;
                break;
                
            case 'credits':
                container.innerHTML = `
                    <div class="form-group">
                        <label>Cantidad de días destacados *</label>
                        <select id="raffle-credits-days" required>
                            <option value="3">3 días</option>
                            <option value="7">7 días</option>
                            <option value="15">15 días</option>
                            <option value="30">30 días</option>
                        </select>
                    </div>
                `;
                break;
                
            case 'product':
                container.innerHTML = `
                    <div class="form-group">
                        <label>Descripción del producto *</label>
                        <textarea id="raffle-product-desc" rows="3" required placeholder="Describe el producto o canasta..."></textarea>
                    </div>
                `;
                break;
                
            case 'custom':
                container.innerHTML = `
                    <div class="form-group">
                        <label>Descripción del premio *</label>
                        <textarea id="raffle-custom-desc" rows="3" required placeholder="Describe el premio personalizado..."></textarea>
                    </div>
                `;
                break;
        }
    },
    
    // Cerrar formulario de creación
    closeCreateForm() {
        const overlay = document.getElementById('raffle-create-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Guardar sorteo
    saveRaffle() {
        const title = document.getElementById('raffle-title').value.trim();
        const description = document.getElementById('raffle-description').value.trim();
        const prizeType = document.getElementById('raffle-prize-type').value;
        const target = document.getElementById('raffle-target').value;
        
        let prizeData = {};
        
        switch(prizeType) {
            case 'avatar':
                prizeData.avatarId = document.getElementById('raffle-avatar-select').value;
                const avatar = VV.avatars.defaultAvatars.find(a => a.id === prizeData.avatarId);
                prizeData.prizeDisplay = `${avatar.emoji} ${avatar.name}`;
                break;
            case 'credits':
                prizeData.days = document.getElementById('raffle-credits-days').value;
                prizeData.prizeDisplay = `${prizeData.days} días de destacado`;
                break;
            case 'product':
                prizeData.productDesc = document.getElementById('raffle-product-desc').value.trim();
                prizeData.prizeDisplay = prizeData.productDesc;
                break;
            case 'custom':
                prizeData.customDesc = document.getElementById('raffle-custom-desc').value.trim();
                prizeData.prizeDisplay = prizeData.customDesc;
                break;
        }
        
        const raffle = {
            id: VV.utils.generateId(),
            title: title,
            description: description,
            prizeType: prizeType,
            prizeData: prizeData,
            target: target,
            status: 'active',
            winnerId: null,
            winnerName: null,
            winnerNumber: null,
            createdAt: new Date().toISOString(),
            drawnAt: null
        };
        
        const raffles = JSON.parse(localStorage.getItem('raffles') || '[]');
        raffles.push(raffle);
        localStorage.setItem('raffles', JSON.stringify(raffles));
        
        VV.raffle.closeCreateForm();
        VV.utils.showSuccess('Sorteo creado exitosamente');
        
        // Publicar anuncio del sorteo
        VV.raffle.announceRaffle(raffle);
    },
    
    // Anunciar sorteo en el visor de destacados
    announceRaffle(raffle) {
        const announcement = {
            id: VV.utils.generateId(),
            type: 'event',
            title: `🎰 ${raffle.title}`,
            message: `${raffle.description}\n\n🎁 Premio: ${raffle.prizeData.prizeDisplay}\n\n¡Todos los usuarios participan automáticamente con su número único!`,
            target: raffle.target,
            important: true,
            isOfficial: true,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
        };
        
        const announcements = JSON.parse(localStorage.getItem('adminAnnouncements') || '[]');
        announcements.push(announcement);
        localStorage.setItem('adminAnnouncements', JSON.stringify(announcements));
        
        if (typeof VV.featured !== 'undefined') {
            VV.featured.loadFeaturedOffers();
        }
    },
    
    // Ejecutar sorteo (mostrar ruleta)
    async executeRaffle(raffleId) {
        const raffles = JSON.parse(localStorage.getItem('raffles') || '[]');
        const raffle = raffles.find(r => r.id === raffleId);
        
        if (!raffle) {
            alert('Sorteo no encontrado');
            return;
        }
        
        if (raffle.status !== 'active') {
            alert('Este sorteo ya fue realizado');
            return;
        }
        
        // Obtener participantes desde Supabase
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .neq('role', 'admin');
        
        if (error) {
            console.error('Error obteniendo usuarios:', error);
            alert('Error al cargar participantes');
            return;
        }
        
        // Filtrar por barrio si es necesario
        const participants = users.filter(u => 
            raffle.target === 'all' || u.neighborhood === raffle.target
        );
        
        if (participants.length === 0) {
            alert('No hay participantes para este sorteo');
            return;
        }
        
        VV.raffle.showRoulette(raffle, participants);
    },
    
    // Mostrar ruleta animada
    showRoulette(raffle, participants) {
        // Guardar participantes en una variable temporal
        VV.raffle.currentParticipants = participants;
        VV.raffle.currentRaffleId = raffle.id;
        
        let overlay = document.getElementById('roulette-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'roulette-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 900px; text-align: center;">
                <h2 style="color: var(--primary-purple); margin-bottom: 1rem;">
                    <i class="fas fa-dice"></i> ${raffle.title}
                </h2>
                <p style="color: var(--gray-600); margin-bottom: 2rem;">
                    🎁 Premio: <strong>${raffle.prizeData.prizeDisplay}</strong>
                </p>
                
                <div style="position: relative; margin: 2rem auto; width: 400px; height: 400px;">
                    <!-- Indicador superior -->
                    <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); z-index: 10;">
                        <div style="width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 30px solid var(--error-red);"></div>
                    </div>
                    
                    <!-- Ruleta -->
                    <div id="roulette-wheel" style="
                        width: 400px;
                        height: 400px;
                        border-radius: 50%;
                        background: conic-gradient(
                            from 0deg,
                            #3b82f6 0deg 45deg,
                            #8b5cf6 45deg 90deg,
                            #ec4899 90deg 135deg,
                            #f59e0b 135deg 180deg,
                            #10b981 180deg 225deg,
                            #3b82f6 225deg 270deg,
                            #8b5cf6 270deg 315deg,
                            #ec4899 315deg 360deg
                        );
                        border: 10px solid white;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        position: relative;
                        transition: transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99);
                    ">
                        <!-- Números en la ruleta -->
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%;">
                            ${participants.slice(0, 8).map((user, index) => {
                                const angle = (index * 45) - 90;
                                const radius = 140;
                                const x = Math.cos(angle * Math.PI / 180) * radius;
                                const y = Math.sin(angle * Math.PI / 180) * radius;
                                return `
                                    <div style="
                                        position: absolute;
                                        top: 50%;
                                        left: 50%;
                                        transform: translate(-50%, -50%) translate(${x}px, ${y}px);
                                        background: white;
                                        width: 60px;
                                        height: 60px;
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 1.2rem;
                                        font-weight: 700;
                                        color: var(--primary-purple);
                                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                    ">
                                        #${user.unique_number}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        
                        <!-- Centro de la ruleta -->
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 80px;
                            height: 80px;
                            background: linear-gradient(135deg, var(--primary-blue), var(--primary-purple));
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 2rem;
                            color: white;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        ">
                            🎰
                        </div>
                    </div>
                </div>
                
                <div id="winner-announcement" style="display: none; margin: 2rem 0;">
                    <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 2rem; border-radius: 12px; color: white;">
                        <h2 style="margin: 0 0 1rem 0; font-size: 2rem;">🎉 ¡GANADOR! 🎉</h2>
                        <div id="winner-info" style="font-size: 1.5rem; font-weight: 700;"></div>
                    </div>
                </div>
                
                <div style="margin-top: 2rem;">
                    <button id="spin-button" class="btn-primary" onclick="VV.raffle.spinRoulette()" style="font-size: 1.2rem; padding: 1rem 2rem;">
                        <i class="fas fa-play"></i> GIRAR RULETA
                    </button>
                    <button class="btn-secondary" onclick="VV.raffle.closeRoulette()" style="margin-left: 1rem;">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
            
            <style>
                @keyframes confetti-fall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .confetti {
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: var(--primary-blue);
                    animation: confetti-fall 3s linear infinite;
                }
            </style>
        `;
        
        overlay.classList.add('active');
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.raffle.closeRoulette();
        };
    },
    
    // Girar ruleta
    spinRoulette() {
        const raffleId = VV.raffle.currentRaffleId;
        const participants = VV.raffle.currentParticipants;
        
        const spinButton = document.getElementById('spin-button');
        spinButton.disabled = true;
        spinButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Girando...';
        
        // Seleccionar ganador aleatorio
        const winner = participants[Math.floor(Math.random() * participants.length)];
        
        // Calcular rotación (múltiples vueltas + posición final)
        const wheel = document.getElementById('roulette-wheel');
        const spins = 5 + Math.random() * 3; // 5-8 vueltas
        const finalAngle = Math.random() * 360;
        const totalRotation = (spins * 360) + finalAngle;
        
        wheel.style.transform = `rotate(${totalRotation}deg)`;
        
        // Después de la animación, mostrar ganador
        setTimeout(() => {
            VV.raffle.announceWinner(raffleId, winner);
        }, 5000);
    },
    
    // Anunciar ganador
    announceWinner(raffleId, winner) {
        const raffles = JSON.parse(localStorage.getItem('raffles') || '[]');
        const raffleIndex = raffles.findIndex(r => r.id === raffleId);
        
        if (raffleIndex === -1) return;
        
        const raffle = raffles[raffleIndex];
        raffle.status = 'completed';
        raffle.winnerId = winner.id;
        raffle.winnerName = winner.name;
        raffle.winnerNumber = winner.unique_number;
        raffle.drawnAt = new Date().toISOString();
        
        raffles[raffleIndex] = raffle;
        localStorage.setItem('raffles', JSON.stringify(raffles));
        
        // Aplicar premio
        VV.raffle.applyPrize(raffle, winner);
        
        // Mostrar ganador
        const winnerInfo = document.getElementById('winner-info');
        winnerInfo.innerHTML = `${winner.name} #${winner.unique_number}`;
        
        document.getElementById('winner-announcement').style.display = 'block';
        document.getElementById('spin-button').style.display = 'none';
        
        // Confetti
        VV.raffle.showConfetti();
        
        // Publicar resultado
        VV.raffle.announceWinnerPublic(raffle);
        
        // Recargar panel de admin si está abierto
        if (typeof VV.admin !== 'undefined' && VV.utils.isAdmin()) {
            setTimeout(() => {
                VV.admin.loadRafflesManagement();
            }, 1000);
        }
    },
    
    // Aplicar premio al ganador
    applyPrize(raffle, winner) {
        switch(raffle.prizeType) {
            case 'avatar':
                VV.avatars.unlockAvatar(winner.id, raffle.prizeData.avatarId);
                break;
            case 'credits':
                // Guardar créditos en el usuario
                const users = VV.auth.getAllUsers();
                const userIndex = users.findIndex(u => u.id === winner.id);
                if (userIndex !== -1) {
                    if (!users[userIndex].featuredCredits) users[userIndex].featuredCredits = 0;
                    users[userIndex].featuredCredits += parseInt(raffle.prizeData.days);
                    const userKey = `vecinosVirtuales_user_${winner.id}`;
                    localStorage.setItem(userKey, JSON.stringify(users[userIndex]));
                }
                break;
            // Los premios de producto y custom son manuales
        }
    },
    
    // Anunciar ganador públicamente
    announceWinnerPublic(raffle) {
        const announcement = {
            id: VV.utils.generateId(),
            type: 'success',
            title: `🎉 Ganador del Sorteo: ${raffle.title}`,
            message: `¡Felicitaciones a ${raffle.winnerName} #${raffle.winnerNumber}!\n\nHa ganado: ${raffle.prizeData.prizeDisplay}\n\n¡Enhorabuena!`,
            target: raffle.target,
            important: true,
            isOfficial: true,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 días
        };
        
        const announcements = JSON.parse(localStorage.getItem('adminAnnouncements') || '[]');
        announcements.push(announcement);
        localStorage.setItem('adminAnnouncements', JSON.stringify(announcements));
    },
    
    // Mostrar confetti
    showConfetti() {
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 2 + 's';
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3000);
            }, i * 30);
        }
    },
    
    // Cerrar ruleta
    closeRoulette() {
        const overlay = document.getElementById('roulette-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Mostrar sorteos activos para usuarios
    showActiveRaffles() {
        const raffles = JSON.parse(localStorage.getItem('raffles') || '[]');
        const activeRaffles = raffles.filter(r => 
            r.status === 'active' && 
            (r.target === 'all' || r.target === VV.data.neighborhood)
        );
        const completedRaffles = raffles.filter(r => 
            r.status === 'completed' && 
            (r.target === 'all' || r.target === VV.data.neighborhood)
        ).slice(0, 5); // Últimos 5
        
        let overlay = document.getElementById('raffles-view-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'raffles-view-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <h3><i class="fas fa-dice"></i> Sorteos y Premios</h3>
                <p style="color: var(--gray-600); margin-bottom: 2rem;">
                    Todos los usuarios participan automáticamente con su número único. ¡Buena suerte!
                </p>
                
                ${activeRaffles.length > 0 ? `
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: var(--primary-purple); margin-bottom: 1rem;">
                            <i class="fas fa-star"></i> Sorteos Activos (${activeRaffles.length})
                        </h4>
                        <div style="display: grid; gap: 1.5rem;">
                            ${activeRaffles.map(raffle => `
                                <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 3px solid var(--primary-purple); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                        <h5 style="margin: 0; color: var(--primary-purple); font-size: 1.2rem;">
                                            🎰 ${raffle.title}
                                        </h5>
                                        <span style="background: var(--success-green); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; animation: pulse 2s infinite;">
                                            ACTIVO
                                        </span>
                                    </div>
                                    <p style="margin: 0 0 1rem 0; color: var(--gray-700);">${raffle.description}</p>
                                    <div style="background: white; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                                        <p style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">
                                            <strong>🎁 Premio:</strong> <span style="color: var(--primary-purple); font-weight: 700;">${raffle.prizeData.prizeDisplay}</span>
                                        </p>
                                        <p style="margin: 0; font-size: 0.9rem; color: var(--gray-600);">
                                            <i class="fas fa-calendar"></i> Creado el ${new Date(raffle.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 1rem; border-radius: 8px; text-align: center; color: white;">
                                        <p style="margin: 0; font-size: 0.9rem;">
                                            <i class="fas fa-ticket-alt"></i> Estás participando con tu número único
                                        </p>
                                        <p style="margin: 0.5rem 0 0 0; font-size: 1.5rem; font-weight: 700;">
                                            #${VV.data.user.unique_number}
                                        </p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div style="background: var(--gray-50); padding: 2rem; border-radius: 12px; text-align: center; margin-bottom: 2rem;">
                        <i class="fas fa-dice" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                        <h4 style="margin: 0 0 0.5rem 0; color: var(--gray-600);">No hay sorteos activos</h4>
                        <p style="margin: 0; color: var(--gray-500);">Vuelve pronto para participar en nuevos sorteos</p>
                    </div>
                `}
                
                ${completedRaffles.length > 0 ? `
                    <div>
                        <h4 style="color: var(--success-green); margin-bottom: 1rem;">
                            <i class="fas fa-trophy"></i> Ganadores Recientes
                        </h4>
                        <div style="display: grid; gap: 1rem;">
                            ${completedRaffles.map(raffle => `
                                <div style="background: white; border-left: 4px solid var(--success-green); border-radius: 8px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div style="flex: 1;">
                                            <h6 style="margin: 0 0 0.25rem 0; color: var(--gray-800);">${raffle.title}</h6>
                                            <p style="margin: 0; font-size: 0.85rem; color: var(--gray-600);">
                                                🎁 ${raffle.prizeData.prizeDisplay}
                                            </p>
                                        </div>
                                        <div style="text-align: right;">
                                            <p style="margin: 0; font-weight: 700; color: var(--success-green);">
                                                🎉 ${raffle.winnerName}
                                            </p>
                                            <p style="margin: 0; font-size: 0.85rem; color: var(--gray-600);">
                                                #${raffle.winnerNumber}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 2rem;">
                    <button class="btn-secondary" onclick="VV.raffle.closeActiveRaffles()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                </div>
            </div>
            
            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            </style>
        `;
        
        overlay.classList.add('active');
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.raffle.closeActiveRaffles();
        };
    },
    
    // Cerrar vista de sorteos
    closeActiveRaffles() {
        const overlay = document.getElementById('raffles-view-overlay');
        if (overlay) overlay.classList.remove('active');
    }
};

console.log('✅ Módulo RAFFLE cargado');
