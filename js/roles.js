window.VV_ROLES = {
    getCurrentUser: function() {
        if (window.VV && window.VV.auth && window.VV.auth.currentUser) {
            return window.VV.auth.currentUser;
        }
        const stored = localStorage.getItem('vv_user');
        return stored ? JSON.parse(stored) : null;
    },

    getPermissions: function() {
        const user = this.getCurrentUser();
        if (!user) {
            return { role: 'invitado', displayRole: 'Invitado', isVecino: false, canPostEvent: false, canCommentImprovement: false, canFullKaraoke: false, hasFreeDraw: false, canGiftMedals: false, isAdmin: false, isModerator: false };
        }

        const currentNeighborhood = localStorage.getItem('current_neighborhood') || user.neighborhood || user.home_neighborhood;
        const homeNeighborhood = user.home_neighborhood || user.neighborhood;
        const isEnSuBarrio = homeNeighborhood === currentNeighborhood;
        let role = user.role || 'invitado';
        if (role === 'user') role = 'vecino';

        if (role === 'administrador' || role === 'admin') {
            return { role: role, displayRole: '👑 Administrador', isVecino: true, canPostEvent: true, canCommentImprovement: true, canFullKaraoke: true, hasFreeDraw: true, canGiftMedals: true, isAdmin: true, isModerator: true };
        }

        if (role === 'moderador' || role === 'moderator') {
            return { role: role, displayRole: '🛡️ Moderador', isVecino: true, canPostEvent: true, canCommentImprovement: true, canFullKaraoke: true, hasFreeDraw: true, canGiftMedals: false, isAdmin: false, isModerator: true };
        }

        if (role === 'invitado_honorifico') {
            return { role: role, displayRole: '🏅 Invitado Honorífico', isVecino: false, canPostEvent: false, canCommentImprovement: false, canFullKaraoke: true, hasFreeDraw: false, canGiftMedals: true, isAdmin: false, isModerator: false };
        }

        if (role === 'invitado_vip') {
            return { role: role, displayRole: '✨ Invitado VIP', isVecino: false, canPostEvent: false, canCommentImprovement: false, canFullKaraoke: true, hasFreeDraw: false, canGiftMedals: false, isVipLimited: true, isAdmin: false, isModerator: false };
        }

        if (role === 'vecino' && isEnSuBarrio) {
            return { role: role, displayRole: '🏠 Vecino', isVecino: true, canPostEvent: true, canCommentImprovement: true, canFullKaraoke: true, hasFreeDraw: true, canGiftMedals: false, isAdmin: false, isModerator: false };
        }

        if (role === 'vecino' && !isEnSuBarrio) {
            return { role: 'invitado', displayRole: '🌐 Visitante', isVecino: false, canPostEvent: false, canCommentImprovement: false, canFullKaraoke: false, hasFreeDraw: false, canGiftMedals: false, isAdmin: false, isModerator: false };
        }

        return { role: 'invitado', displayRole: 'Invitado', isVecino: false, canPostEvent: false, canCommentImprovement: false, canFullKaraoke: false, hasFreeDraw: false, canGiftMedals: false, isAdmin: false, isModerator: false };
    },

    hasPermission: function(permissionKey) {
        return !!this.getPermissions()[permissionKey];
    },

    trackAction: async function(actionType) {
        const user = this.getCurrentUser();
        if (!user || !user.id) return;
        try {
            await supabase.from('daily_user_actions').insert([{ user_id: user.id, action_type: actionType }]);
        } catch (e) { console.error('Error tracking action:', e); }
    },

    shouldShowOnboarding: function() {
        return !localStorage.getItem('vv_onboarding_seen');
    },

    markOnboardingSeen: function() {
        localStorage.setItem('vv_onboarding_seen', 'true');
    },

    shouldShowTermsReminder: function(actionKey) {
        const lastAccept = localStorage.getItem(`vv_terms_accept_${actionKey}`);
        const clearTime = 7 * 24 * 60 * 60 * 1000;
        return !lastAccept || (Date.now() - parseInt(lastAccept) > clearTime);
    },

    acceptTerms: function(actionKey) {
        localStorage.setItem(`vv_terms_accept_${actionKey}`, Date.now().toString());
    }
};
