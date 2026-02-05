// ========== INICIALIZACIÓN DE LA APLICACIÓN ==========

document.addEventListener('DOMContentLoaded', async function() {
    // 1. Ocultar todos los menús de admin por seguridad inicial
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');

    // 2. Pequeño delay para que Supabase esté listo
    setTimeout(async () => {
        const loggedIn = await VV.auth.checkExistingUser();
        if (loggedIn) {
            VV.auth.startApp();
        } else {
            VV.auth.requestGeolocation();
        }
    }, 1000);
});
