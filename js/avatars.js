// ========== MÓDULO DE AVATARES ==========

VV.avatars = {
    // Avatares predefinidos
    defaultAvatars: [
        // BÁSICOS - Disponibles para todos
        { id: 'basic-1', emoji: '😊', name: 'Feliz', category: 'Básicos', rarity: 'common', premium: false },
        { id: 'basic-2', emoji: '😎', name: 'Cool', category: 'Básicos', rarity: 'common', premium: false },
        { id: 'basic-3', emoji: '🙂', name: 'Sonriente', category: 'Básicos', rarity: 'common', premium: false },
        { id: 'basic-4', emoji: '😄', name: 'Alegre', category: 'Básicos', rarity: 'common', premium: false },
        { id: 'basic-5', emoji: '🤗', name: 'Abrazo', category: 'Básicos', rarity: 'common', premium: false },
        
        // ANIMALES - Disponibles para todos
        { id: 'animal-1', emoji: '🐶', name: 'Perro', category: 'Animales', rarity: 'common', premium: false },
        { id: 'animal-2', emoji: '🐱', name: 'Gato', category: 'Animales', rarity: 'common', premium: false },
        { id: 'animal-3', emoji: '🐼', name: 'Panda', category: 'Animales', rarity: 'common', premium: false },
        { id: 'animal-4', emoji: '🦊', name: 'Zorro', category: 'Animales', rarity: 'common', premium: false },
        { id: 'animal-5', emoji: '🐨', name: 'Koala', category: 'Animales', rarity: 'common', premium: false },
        { id: 'animal-6', emoji: '🦁', name: 'León', category: 'Animales', rarity: 'common', premium: false },
        
        // NATURALEZA - Disponibles para todos
        { id: 'nature-1', emoji: '🌻', name: 'Girasol', category: 'Naturaleza', rarity: 'common', premium: false },
        { id: 'nature-2', emoji: '🌺', name: 'Flor', category: 'Naturaleza', rarity: 'common', premium: false },
        { id: 'nature-3', emoji: '🌈', name: 'Arcoíris', category: 'Naturaleza', rarity: 'common', premium: false },
        { id: 'nature-4', emoji: '⭐', name: 'Estrella', category: 'Naturaleza', rarity: 'common', premium: false },
        
        // PREMIUM - Raros
        { id: 'premium-1', emoji: '👑', name: 'Corona Real', category: 'Premium', rarity: 'rare', premium: true },
        { id: 'premium-2', emoji: '💎', name: 'Diamante', category: 'Premium', rarity: 'rare', premium: true },
        { id: 'premium-3', emoji: '🏆', name: 'Trofeo', category: 'Premium', rarity: 'rare', premium: true },
        { id: 'premium-4', emoji: '🎭', name: 'Teatro', category: 'Premium', rarity: 'rare', premium: true },
        { id: 'premium-5', emoji: '🎨', name: 'Artista', category: 'Premium', rarity: 'rare', premium: true },
        
        // PREMIUM - Épicos
        { id: 'epic-1', emoji: '🦄', name: 'Unicornio', category: 'Premium', rarity: 'epic', premium: true },
        { id: 'epic-2', emoji: '🐉', name: 'Dragón', category: 'Premium', rarity: 'epic', premium: true },
        { id: 'epic-3', emoji: '🦅', name: 'Águila', category: 'Premium', rarity: 'epic', premium: true },
        { id: 'epic-4', emoji: '🔥', name: 'Fuego', category: 'Premium', rarity: 'epic', premium: true },
        
        // PREMIUM - Legendarios
        { id: 'legendary-1', emoji: '⚡', name: 'Rayo Dorado', category: 'Premium', rarity: 'legendary', premium: true },
        { id: 'legendary-2', emoji: '🌟', name: 'Estrella Brillante', category: 'Premium', rarity: 'legendary', premium: true },
        { id: 'legendary-3', emoji: '💫', name: 'Cometa', category: 'Premium', rarity: 'legendary', premium: true }
    ],
    
    // Obtener avatar del usuario
    getUserAvatar(userId) {
        // Si es el usuario actual, usar VV.data.user
        const user = (userId === VV.data.user?.id) ? VV.data.user : null;
        
        if (!user || !user.avatar) {
            return VV.avatars.defaultAvatars[0]; // Avatar por defecto
        }
        
        const avatar = VV.avatars.defaultAvatars.find(a => a.id === user.avatar);
        return avatar || VV.avatars.defaultAvatars[0];
    },
    
    // Verificar si el usuario tiene un avatar desbloqueado
    hasAvatar(userId, avatarId) {
        // Si es el usuario actual, usar VV.data.user
        const user = (userId === VV.data.user?.id) ? VV.data.user : null;
        
        if (!user) return false;
        
        const avatar = VV.avatars.defaultAvatars.find(a => a.id === avatarId);
        if (!avatar) return false;
        
        // Los avatares comunes están disponibles para todos
        if (!avatar.premium) return true;
        
        // Verificar si tiene el avatar premium desbloqueado
        const unlockedAvatars = user.unlocked_avatars || [];
        return unlockedAvatars.includes(avatarId);
    },
    
    // Desbloquear avatar para un usuario
    async unlockAvatar(userId, avatarId) {
        try {
            // Obtener usuario actual
            const { data: user, error: fetchError } = await supabase
                .from('users')
                .select('unlocked_avatars')
                .eq('id', userId)
                .single();
            
            if (fetchError) throw fetchError;
            
            const unlockedAvatars = user.unlocked_avatars || [];
            
            if (unlockedAvatars.includes(avatarId)) {
                return true; // Ya lo tiene
            }
            
            // Agregar avatar a la lista
            unlockedAvatars.push(avatarId);
            
            // Actualizar en Supabase
            const { error: updateError } = await supabase
                .from('users')
                .update({ unlocked_avatars: unlockedAvatars })
                .eq('id', userId);
            
            if (updateError) throw updateError;
            
            // Actualizar usuario actual si es el mismo
            if (VV.data.user.id === userId) {
                VV.data.user.unlocked_avatars = unlockedAvatars;
            }
            
            return true;
        } catch (error) {
            console.error('Error desbloqueando avatar:', error);
            return false;
        }
    },
    
    // Cambiar avatar del usuario
    async changeAvatar(avatarId) {
        if (!VV.avatars.hasAvatar(VV.data.user.id, avatarId)) {
            alert('Este avatar no está disponible para ti');
            return false;
        }
        
        try {
            // Actualizar en Supabase
            const { error } = await supabase
                .from('users')
                .update({ avatar: avatarId })
                .eq('id', VV.data.user.id);
            
            if (error) throw error;
            
            // Actualizar usuario actual
            VV.data.user.avatar = avatarId;
            
            // Actualizar UI
            VV.avatars.updateAvatarDisplay();
            
            return true;
        } catch (error) {
            console.error('Error cambiando avatar:', error);
            alert('Error al cambiar el avatar');
            return false;
        }
    },
    
    // Actualizar visualización del avatar en el header
    updateAvatarDisplay() {
        const avatar = VV.avatars.getUserAvatar(VV.data.user.id);
        const avatarElements = document.querySelectorAll('.user-avatar');
        
        avatarElements.forEach(el => {
            el.textContent = avatar.emoji;
        });
    },
    
    // Mostrar perfil del usuario
    showProfile() {
        const avatar = VV.avatars.getUserAvatar(VV.data.user.id);
        const unlockedAvatars = VV.data.user.unlockedAvatars || [];
        const totalAvatars = VV.avatars.defaultAvatars.length;
        const availableAvatars = VV.avatars.defaultAvatars.filter(a => 
            !a.premium || unlockedAvatars.includes(a.id)
        ).length;
        
        let overlay = document.getElementById('profile-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'profile-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 800px;">
                <h3><i class="fas fa-user-circle"></i> Mi Perfil</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; margin: 2rem 0;">
                    <!-- Avatar actual -->
                    <div style="text-align: center;">
                        <div style="width: 150px; height: 150px; background: linear-gradient(135deg, var(--primary-blue), var(--primary-purple)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 5rem; margin: 0 auto 1rem; box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
                            ${avatar.emoji}
                        </div>
                        <h4 style="margin: 0.5rem 0;">${avatar.name}</h4>
                        <p style="margin: 0; color: var(--gray-600); font-size: 0.85rem;">
                            ${VV.avatars.getRarityBadge(avatar.rarity)}
                        </p>
                        <button class="btn-primary" onclick="VV.avatars.showAvatarGallery()" style="margin-top: 1rem; width: 100%;">
                            <i class="fas fa-edit"></i> Cambiar Avatar
                        </button>
                    </div>
                    
                    <!-- Información del usuario -->
                    <div>
                        <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                            <h4 style="margin: 0 0 1rem 0; color: var(--primary-blue);">
                                <i class="fas fa-info-circle"></i> Información
                            </h4>
                            <div style="display: grid; gap: 0.75rem;">
                                <p style="margin: 0;"><strong>Nombre:</strong> ${VV.data.user.name}</p>
                                <p style="margin: 0;"><strong>Número único:</strong> #${VV.data.user.uniqueNumber}</p>
                                <p style="margin: 0;"><strong>Barrio:</strong> ${VV.data.neighborhood}</p>
                                <p style="margin: 0;"><strong>Email:</strong> ${VV.data.user.email}</p>
                                <p style="margin: 0;"><strong>Teléfono:</strong> ${VV.data.user.phone}</p>
                            </div>
                        </div>
                        
                        <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 12px;">
                            <h4 style="margin: 0 0 1rem 0; color: var(--primary-purple);">
                                <i class="fas fa-trophy"></i> Colección de Avatares
                            </h4>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                                <div style="text-align: center; padding: 1rem; background: white; border-radius: 8px;">
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-blue);">
                                        ${availableAvatars}
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--gray-600);">Disponibles</div>
                                </div>
                                <div style="text-align: center; padding: 1rem; background: white; border-radius: 8px;">
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--warning-orange);">
                                        ${totalAvatars - availableAvatars}
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--gray-600);">Bloqueados</div>
                                </div>
                            </div>
                            <div style="margin-top: 1rem; padding: 1rem; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 8px; text-align: center;">
                                <p style="margin: 0; font-size: 0.9rem; color: var(--gray-800);">
                                    <i class="fas fa-star"></i> Progreso: ${Math.round((availableAvatars / totalAvatars) * 100)}%
                                </p>
                                <div style="background: white; height: 8px; border-radius: 4px; margin-top: 0.5rem; overflow: hidden;">
                                    <div style="background: linear-gradient(90deg, var(--primary-blue), var(--primary-purple)); height: 100%; width: ${(availableAvatars / totalAvatars) * 100}%; transition: width 0.3s;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <button class="btn-secondary" onclick="VV.avatars.closeProfile()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.avatars.closeProfile();
        };
    },
    
    // Cerrar perfil
    closeProfile() {
        const overlay = document.getElementById('profile-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Mostrar galería de avatares
    showAvatarGallery() {
        const unlockedAvatars = VV.data.user.unlockedAvatars || [];
        const currentAvatar = VV.data.user.avatar || 'basic-1';
        
        // Agrupar por categoría
        const byCategory = {};
        VV.avatars.defaultAvatars.forEach(avatar => {
            if (!byCategory[avatar.category]) {
                byCategory[avatar.category] = [];
            }
            byCategory[avatar.category].push(avatar);
        });
        
        let overlay = document.getElementById('avatar-gallery-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'avatar-gallery-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="modal-form" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <h3><i class="fas fa-images"></i> Galería de Avatares</h3>
                <p style="color: var(--gray-600); margin-bottom: 2rem;">
                    Selecciona tu avatar favorito. Los avatares premium se desbloquean mediante sorteos y logros.
                </p>
                
                ${Object.keys(byCategory).map(category => `
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: var(--primary-blue); margin-bottom: 1rem;">
                            <i class="fas fa-folder"></i> ${category}
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem;">
                            ${byCategory[category].map(avatar => {
                                const isAvailable = !avatar.premium || unlockedAvatars.includes(avatar.id);
                                const isCurrent = avatar.id === currentAvatar;
                                
                                return `
                                    <div 
                                        onclick="${isAvailable ? `VV.avatars.selectAvatar('${avatar.id}')` : ''}"
                                        style="
                                            position: relative;
                                            padding: 1rem;
                                            background: ${isCurrent ? 'linear-gradient(135deg, var(--primary-blue), var(--primary-purple))' : 'white'};
                                            border: 3px solid ${isCurrent ? 'var(--success-green)' : isAvailable ? 'var(--gray-300)' : 'var(--gray-200)'};
                                            border-radius: 12px;
                                            text-align: center;
                                            cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
                                            opacity: ${isAvailable ? '1' : '0.5'};
                                            transition: all 0.3s;
                                            ${isAvailable ? 'box-shadow: 0 2px 8px rgba(0,0,0,0.1);' : ''}
                                        "
                                        ${isAvailable ? 'onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'"' : ''}
                                    >
                                        ${!isAvailable ? `
                                            <div style="position: absolute; top: 5px; right: 5px; background: var(--error-red); color: white; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem;">
                                                <i class="fas fa-lock"></i>
                                            </div>
                                        ` : ''}
                                        ${isCurrent ? `
                                            <div style="position: absolute; top: 5px; left: 5px; background: var(--success-green); color: white; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem;">
                                                <i class="fas fa-check"></i>
                                            </div>
                                        ` : ''}
                                        <div style="font-size: 3rem; margin: 0.5rem 0; ${isAvailable ? '' : 'filter: grayscale(100%);'}">
                                            ${avatar.emoji}
                                        </div>
                                        <div style="font-size: 0.75rem; font-weight: 600; color: ${isCurrent ? 'white' : 'var(--gray-800)'}; margin-bottom: 0.25rem;">
                                            ${avatar.name}
                                        </div>
                                        <div style="font-size: 0.7rem;">
                                            ${VV.avatars.getRarityBadge(avatar.rarity, isCurrent)}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
                
                <div style="text-align: center; margin-top: 2rem;">
                    <button class="btn-secondary" onclick="VV.avatars.closeGallery()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
        
        overlay.onclick = (e) => {
            if (e.target === overlay) VV.avatars.closeGallery();
        };
    },
    
    // Cerrar galería
    closeGallery() {
        const overlay = document.getElementById('avatar-gallery-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Seleccionar avatar
    selectAvatar(avatarId) {
        if (VV.avatars.changeAvatar(avatarId)) {
            VV.utils.showSuccess('Avatar actualizado');
            VV.avatars.closeGallery();
            VV.avatars.showProfile();
        }
    },
    
    // Obtener badge de rareza
    getRarityBadge(rarity, isWhite = false) {
        const rarityConfig = {
            'common': { label: 'Común', color: isWhite ? 'rgba(255,255,255,0.8)' : 'var(--gray-600)' },
            'rare': { label: 'Raro', color: isWhite ? 'rgba(255,255,255,0.9)' : '#3b82f6' },
            'epic': { label: 'Épico', color: isWhite ? 'rgba(255,255,255,0.9)' : '#8b5cf6' },
            'legendary': { label: 'Legendario', color: isWhite ? 'rgba(255,255,255,1)' : '#f59e0b' }
        };
        
        const config = rarityConfig[rarity] || rarityConfig['common'];
        return `<span style="color: ${config.color}; font-weight: 600;">${config.label}</span>`;
    }
};

console.log('✅ Módulo AVATARS cargado');
