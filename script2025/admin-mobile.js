// admin-mobile.js - Menú de administración móvil
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const menuToggle = document.getElementById('admin-menu-toggle');
    const adminMenu = document.getElementById('admin-mobile-menu');
    const closeBtn = document.querySelector('.close-admin-menu');
    const overlay = document.getElementById('admin-menu-overlay');
    const menuItems = document.querySelectorAll('.admin-menu-item');

    // Verificar si el usuario es administrador
    function checkAdminStatus() {
        // Usar la función isAdmin() si existe, de lo contrario, verificar la clase en el body
        if (window.VV && typeof VV.isAdmin === 'function' && VV.isAdmin()) {
            return true;
        }
        // O si el body tiene la clase 'admin'
        return document.body.classList.contains('admin');
    }

    // Mostrar/ocultar menú
    function toggleMenu() {
        adminMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = adminMenu.classList.contains('active') ? 'hidden' : '';
    }

    // Cerrar menú
    function closeMenu() {
        adminMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Inicializar menú
    function initAdminMenu() {
        if (!checkAdminStatus()) {
            console.log('Usuario no es administrador, ocultando menú');
            if (menuToggle) menuToggle.style.display = 'none';
            return;
        }

        console.log('Inicializando menú de administración móvil');
        
        // Mostrar botón de menú
        if (menuToggle) {
            menuToggle.style.display = 'flex';
            menuToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleMenu();
            });
        }

        // Configurar botón de cierre
        if (closeBtn) {
            closeBtn.addEventListener('click', closeMenu);
        }

        // Configurar overlay
        if (overlay) {
            overlay.addEventListener('click', closeMenu);
        }

        // Cerrar menú al hacer clic en un ítem
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                closeMenu();
            });
        });

        // Cerrar menú al presionar ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && adminMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    // Inicializar cuando el DOM esté listo
    initAdminMenu();

    // Opcional: Escuchar cambios en el estado de autenticación
    if (window.VV && VV.onAuthStateChanged) {
        VV.onAuthStateChanged(function(user) {
            initAdminMenu();
        });
    }
});