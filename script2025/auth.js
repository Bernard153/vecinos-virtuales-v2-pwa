// ========== MÓDULO DE AUTENTICACIÓN Y BARRIOS ==========

VV.auth = {
    userLocation: null,
    neighborhoods: [],
    
    // Verificar usuario existente
    checkExistingUser() {
        const savedUser = localStorage.getItem('vecinosVirtualesUser');
        if (savedUser) {
            VV.data.user = JSON.parse(savedUser);
            VV.data.neighborhood = VV.data.user.neighborhood;
            return true;
        }
        return false;
    },
    
    // Solicitar geolocalización
    requestGeolocation() {
        const content = document.getElementById('location-content');
        content.innerHTML = `
            <div class="loading-spinner"></div>
            <p class="description">Detectando tu ubicación...</p>
            <p style="font-size: 0.9rem; color: var(--gray-600); margin-top: 1rem;">
                Necesitamos tu ubicación para mostrarte barrios cercanos
            </p>
            <button class="btn-secondary" onclick="VV.auth.manualLocation()">
                <i class="fas fa-edit"></i> Ingresar manualmente
            </button>
        `;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => VV.auth.handleLocationSuccess(position),
                error => VV.auth.handleLocationError(error),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            VV.auth.handleLocationError({ code: 0 });
        }
    },
    
    // Ubicación exitosa
    async handleLocationSuccess(position) {
        VV.auth.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        try {
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${VV.auth.userLocation.lat}&longitude=${VV.auth.userLocation.lng}&localityLanguage=es`
            );
            const data = await response.json();
            
            const city = data.city || data.locality || 'Ciudad';
            const province = data.principalSubdivision || '';
            // Mejorar detección de barrio real
            const neighborhood = data.locality || 
                               data.localityInfo?.administrative?.[3]?.name || 
                               data.localityInfo?.administrative?.[2]?.name || 
                               data.neighbourhood || 
                               '';
            
            // Guardar datos de ubicación para mostrar después
            VV.auth.locationData = { city, province, neighborhood };
            
            VV.auth.neighborhoods = VV.auth.generateNeighborhoods(city, province, neighborhood);
            VV.auth.showNeighborhoodSelection(city, province);
        } catch (error) {
            console.error('Error geolocalización:', error);
            VV.auth.manualLocation();
        }
    },
    
    // Error de ubicación
    handleLocationError(error) {
        const content = document.getElementById('location-content');
        let message = 'No se pudo obtener tu ubicación';
        
        if (error.code === 1) message = 'Acceso denegado. Por favor permite el acceso.';
        
        content.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i> ${message}
            </div>
            <button class="btn-primary" onclick="VV.auth.requestGeolocation()">
                <i class="fas fa-redo"></i> Reintentar
            </button>
            <button class="btn-secondary" onclick="VV.auth.manualLocation()">
                <i class="fas fa-edit"></i> Ingresar manualmente
            </button>
        `;
    },
    
    // Generar barrios
    generateNeighborhoods(city, province, current) {
        // Obtener barrios existentes de usuarios registrados
        const existingNeighborhoods = VV.auth.getExistingNeighborhoods();
        
        const list = [];
        
        // Solo incluir "Administrador" si NO existe un admin registrado
        const existingAdmin = VV.auth.getExistingAdmin();
        if (!existingAdmin) {
            list.push('Administrador');
        }
        
        // Agregar barrios existentes (excepto Administrador)
        list.push(...existingNeighborhoods.filter(n => n !== 'Administrador'));
        
        // Agregar barrio detectado si existe
        if (current) list.push(current);
        
        // Agregar sugerencias genéricas
        list.push(
            `Centro de ${city}`,
            `${city} Norte`,
            `${city} Sur`,
            `${city} Este`,
            `${city} Oeste`
        );
        
        // Eliminar duplicados y retornar
        return [...new Set(list)];
    },
    
    // Obtener barrios existentes de todos los usuarios
    getExistingNeighborhoods() {
        const neighborhoods = new Set();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vecinosVirtuales_user_')) {
                const userData = JSON.parse(localStorage.getItem(key));
                if (userData.neighborhood) {
                    neighborhoods.add(userData.neighborhood);
                }
            }
        }
        return Array.from(neighborhoods).sort();
    },
    
    // Mostrar selección de barrios
    showNeighborhoodSelection(city, province) {
        const content = document.getElementById('location-content');
        const existingCount = VV.auth.getExistingNeighborhoods().length;
        
        content.innerHTML = `
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; color: #0369a1;">
                <i class="fas fa-check-circle"></i> Ubicación: ${city}, ${province}
            </div>
            <p class="description">Selecciona tu barrio o crea uno nuevo</p>
            ${existingCount > 0 ? `<p style="font-size: 0.9rem; color: var(--success-green); margin-bottom: 1rem;"><i class="fas fa-users"></i> ${existingCount} barrio(s) con vecinos registrados</p>` : ''}
            <div class="search-container">
                <input type="text" id="neighborhood-search" placeholder="Buscar o escribir nombre del barrio...">
                <i class="fas fa-search"></i>
            </div>
            <div class="neighborhoods-list" id="neighborhoods-list"></div>
        `;
        
        VV.auth.loadNeighborhoods();
        VV.auth.setupSearch();
    },
    
    // Cargar lista de barrios
    loadNeighborhoods() {
        const list = document.getElementById('neighborhoods-list');
        const existingNeighborhoods = VV.auth.getExistingNeighborhoods();
        
        // Separar "Administrador" del resto
        const adminOption = VV.auth.neighborhoods.find(n => n === 'Administrador');
        const otherNeighborhoods = VV.auth.neighborhoods.filter(n => n !== 'Administrador');
        
        // Separar barrios con usuarios de los sugeridos
        const withUsers = otherNeighborhoods.filter(n => existingNeighborhoods.includes(n));
        const suggestions = otherNeighborhoods.filter(n => !existingNeighborhoods.includes(n));
        
        let html = '';
        
        // Mostrar opción de Administrador primero si existe
        if (adminOption) {
            html += '<div style="font-size: 0.85rem; color: var(--primary-purple); margin: 0.5rem 0; font-weight: 600;">⚙️ Acceso Especial:</div>';
            html += `
                <div class="neighborhood-item" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(37, 99, 235, 0.1)); border: 2px solid var(--primary-purple);" onclick="VV.auth.selectNeighborhood('Administrador')">
                    <i class="fas fa-crown" style="color: var(--primary-purple);"></i> Administrador
                    <span style="font-size: 0.75rem; color: var(--primary-purple); margin-left: 0.5rem;">(Panel de Control)</span>
                </div>
            `;
        }
        
        // Mostrar barrios con usuarios
        if (withUsers.length > 0) {
            html += '<div style="font-size: 0.85rem; color: var(--gray-600); margin: 1rem 0 0.5rem 0; font-weight: 600;">Barrios con vecinos:</div>';
            html += withUsers.map(n => `
                <div class="neighborhood-item" onclick="VV.auth.selectNeighborhood('${n.replace(/'/g, "\\'")}')"> 
                    ${n}
                    <span style="color: var(--success-green); font-size: 0.85rem; margin-left: 0.5rem;"><i class="fas fa-users"></i></span>
                </div>
            `).join('');
        }
        
        // Luego sugerencias
        if (suggestions.length > 0) {
            html += '<div style="font-size: 0.85rem; color: var(--gray-600); margin: 1rem 0 0.5rem 0; font-weight: 600;">Sugerencias:</div>';
            html += suggestions.map(n => `
                <div class="neighborhood-item" onclick="VV.auth.selectNeighborhood('${n.replace(/'/g, "\\'")}')"> 
                    ${n}
                </div>
            `).join('');
        }
        
        list.innerHTML = html;
    },
    
    // Búsqueda de barrios
    setupSearch() {
        const input = document.getElementById('neighborhood-search');
        input.addEventListener('input', function() {
            const term = this.value.trim();
            const termLower = term.toLowerCase();
            const filtered = VV.auth.neighborhoods.filter(n => n.toLowerCase().includes(termLower));
            
            const list = document.getElementById('neighborhoods-list');
            
            // Si hay resultados, mostrarlos
            if (filtered.length > 0) {
                const existingNeighborhoods = VV.auth.getExistingNeighborhoods();
                list.innerHTML = filtered.map(n => {
                    const hasUsers = existingNeighborhoods.includes(n);
                    return `
                        <div class="neighborhood-item" onclick="VV.auth.selectNeighborhood('${n.replace(/'/g, "\\'")}')"> 
                            ${n}
                            ${hasUsers ? '<span style="color: var(--success-green); font-size: 0.85rem; margin-left: 0.5rem;"><i class="fas fa-users"></i></span>' : ''}
                        </div>
                    `;
                }).join('');
            }
            
            // Si escribió algo y no hay coincidencias exactas, permitir crear
            if (term.length > 2) {
                const exactMatch = VV.auth.neighborhoods.find(n => n.toLowerCase() === termLower);
                if (!exactMatch) {
                    list.innerHTML += `
                        <div class="neighborhood-item" style="background: #f0fdf4; border: 2px dashed var(--success-green);" onclick="VV.auth.createNeighborhood('${term.replace(/'/g, "\\'")}')"> 
                            <i class="fas fa-plus-circle" style="color: var(--success-green);"></i> Crear barrio "${term}"
                        </div>
                    `;
                }
            }
            
            // Si no escribió nada, mostrar todos
            if (term.length === 0) {
                VV.auth.loadNeighborhoods();
            }
        });
    },
    
    // Crear nuevo barrio
    createNeighborhood(name) {
        const cleanName = name.trim();
        if (!cleanName) return;
        
        // Capitalizar primera letra de cada palabra
        const formattedName = cleanName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        if (!VV.auth.neighborhoods.includes(formattedName)) {
            VV.auth.neighborhoods.unshift(formattedName);
        }
        VV.auth.selectNeighborhood(formattedName);
    },
    
    // Seleccionar barrio
    selectNeighborhood(neighborhood) {
        VV.data.neighborhood = neighborhood;
        
        // Si es Administrador, verificar clave única
        if (neighborhood === 'Administrador') {
            VV.auth.showAdminPasswordPrompt();
            return;
        }
        
        // Verificar si hay usuarios en este barrio
        const existingUsers = VV.auth.getExistingUsers(neighborhood);
        
        if (existingUsers.length > 0) {
            document.getElementById('login-selected-neighborhood').textContent = neighborhood;
            VV.utils.showScreen('login-screen');
            VV.auth.setupLoginForm();
        } else {
            document.getElementById('selected-neighborhood').textContent = neighborhood;
            VV.utils.showScreen('registration-screen');
            VV.auth.setupRegistrationForm();
        }
    },
    
    // Mostrar prompt de clave de administrador
    showAdminPasswordPrompt() {
        const existingAdmin = VV.auth.getExistingAdmin();
        
        if (existingAdmin) {
            // Ya existe un admin, pedir clave para login
            const password = prompt('Ingresa la clave de administrador (6 dígitos):');
            if (!password) {
                location.reload();
                return;
            }
            
            const adminPassword = localStorage.getItem('adminPassword');
            if (password === adminPassword) {
                // Login exitoso - guardar sesión
                VV.data.user = existingAdmin;
                VV.data.neighborhood = 'Administrador';
                localStorage.setItem('vecinosVirtualesUser', JSON.stringify(existingAdmin));
                VV.auth.startApp();
            } else {
                alert('Clave incorrecta');
                location.reload();
            }
        } else {
            // No existe admin, crear uno con clave
            const password = prompt('Crea una clave de administrador (mínimo 6 caracteres):');
            if (!password || password.length < 6) {
                alert('La clave debe tener al menos 6 caracteres');
                location.reload();
                return;
            }
            
            const confirmPassword = prompt('Confirma la clave:');
            if (password !== confirmPassword) {
                alert('Las claves no coinciden');
                location.reload();
                return;
            }
            
            // Guardar clave y continuar con registro
            localStorage.setItem('adminPassword', password);
            document.getElementById('selected-neighborhood').textContent = 'Administrador';
            VV.utils.showScreen('registration-screen');
            VV.auth.setupRegistrationForm();
        }
    },
    
    // Obtener administrador existente
    getExistingAdmin() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vecinosVirtuales_user_')) {
                const userData = JSON.parse(localStorage.getItem(key));
                if (userData.role === 'admin') {
                    return userData;
                }
            }
        }
        return null;
    },
    
    // Obtener usuarios existentes
    getExistingUsers(neighborhood) {
        const users = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vecinosVirtuales_user_')) {
                const userData = JSON.parse(localStorage.getItem(key));
                if (userData.neighborhood === neighborhood) {
                    users.push(userData);
                }
            }
        }
        return users;
    },
    
    // Entrada manual de ubicación
    manualLocation() {
        const content = document.getElementById('location-content');
        content.innerHTML = `
            <p class="description">Ingresa tu ubicación</p>
            <div class="auth-form">
                <div class="form-group">
                    <label>Ciudad *</label>
                    <input type="text" id="manual-city" placeholder="Ej: Buenos Aires">
                </div>
                <div class="form-group">
                    <label>Barrio *</label>
                    <input type="text" id="manual-neighborhood" placeholder="Ej: Palermo">
                </div>
                <button class="btn-primary" onclick="VV.auth.processManualLocation()">
                    <i class="fas fa-check"></i> Continuar
                </button>
            </div>
        `;
    },
    
    // Procesar ubicación manual
    processManualLocation() {
        const city = document.getElementById('manual-city').value.trim();
        const neighborhood = document.getElementById('manual-neighborhood').value.trim();
        
        if (!city || !neighborhood) {
            alert('Completa todos los campos');
            return;
        }
        
        VV.auth.neighborhoods = VV.auth.generateNeighborhoods(city, '', neighborhood);
        VV.auth.showNeighborhoodSelection(city, 'Manual');
    },
    
    // Setup formulario de login
    setupLoginForm() {
        const form = document.getElementById('login-form');
        form.onsubmit = function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value.trim();
            const phone = document.getElementById('login-phone').value.trim();
            
            const user = VV.auth.findUser(email, VV.data.neighborhood);
            
            if (!user) {
                VV.auth.showLoginError('Usuario no encontrado en este barrio');
                return;
            }
            
            if (user.phone !== phone) {
                VV.auth.showLoginError('Teléfono incorrecto');
                return;
            }
            
            VV.data.user = user;
            localStorage.setItem('vecinosVirtualesUser', JSON.stringify(user));
            VV.auth.startApp();
        };
    },
    
    // Ir a registro desde login
    goToRegistration() {
        document.getElementById('selected-neighborhood').textContent = VV.data.neighborhood;
        VV.utils.showScreen('registration-screen');
        VV.auth.setupRegistrationForm();
    },
    
    // Mostrar error de login
    showLoginError(message) {
        const errorDiv = document.getElementById('login-error');
        const errorText = document.getElementById('login-error-text');
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    },
    
    // Buscar usuario
    findUser(email, neighborhood) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vecinosVirtuales_user_')) {
                const userData = JSON.parse(localStorage.getItem(key));
                if (userData.email === email && userData.neighborhood === neighborhood) {
                    return userData;
                }
            }
        }
        return null;
    },
    
    // Setup formulario de registro
    setupRegistrationForm() {
        const form = document.getElementById('registration-form');
        form.onsubmit = function(e) {
            e.preventDefault();
            
            const email = document.getElementById('user-email').value.trim();
            
            // Validación de emails únicos globalmente (no solo en el barrio)
            if (VV.auth.emailExistsGlobally(email)) {
                alert('Ya existe una cuenta con este email en otro barrio. Por favor usa otro email.');
                return;
            }
            
            const userData = {
                id: VV.utils.generateId(),
                uniqueNumber: Math.floor(100000 + Math.random() * 900000),
                name: document.getElementById('user-name').value.trim(),
                email: email,
                phone: document.getElementById('user-phone').value.trim(),
                address: document.getElementById('user-address').value.trim(),
                neighborhood: VV.data.neighborhood,
                role: 'user',
                createdAt: new Date().toISOString()
            };
            
            // Si el barrio es "Administrador", el usuario es admin global
            if (VV.data.neighborhood === 'Administrador') {
                // Verificar que no exista ya un administrador
                const existingAdmin = VV.auth.getGlobalAdmin();
                if (existingAdmin) {
                    alert('Ya existe un administrador en el sistema. Solo puede haber uno.');
                    return;
                }
                userData.role = 'admin';
            }
            
            VV.data.user = userData;
            
            // Guardar
            const userKey = `vecinosVirtuales_user_${userData.id}`;
            localStorage.setItem(userKey, JSON.stringify(userData));
            localStorage.setItem('vecinosVirtualesUser', JSON.stringify(userData));
            
            VV.auth.startApp();
        };
    },
    
    // Obtener todos los usuarios
    getAllUsers() {
        const users = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vecinosVirtuales_user_')) {
                users.push(JSON.parse(localStorage.getItem(key)));
            }
        }
        return users;
    },
    
    // Verificar si email existe globalmente
    emailExistsGlobally(email) {
        const users = VV.auth.getAllUsers();
        return users.some(user => user.email === email);
    },
    
    // Obtener administrador global
    getGlobalAdmin() {
        const users = VV.auth.getAllUsers();
        return users.find(user => user.role === 'admin');
    },
    
    // Iniciar aplicación
    startApp() {
        // Cargar productos desde localStorage
        const savedProducts = localStorage.getItem('vecinosVirtuales_products');
        if (savedProducts) {
            VV.data.products = JSON.parse(savedProducts);
        }
        
        // Cargar mejoras desde localStorage
        const savedImprovements = localStorage.getItem('vecinosVirtuales_improvements');
        if (savedImprovements) {
            VV.data.improvements = JSON.parse(savedImprovements);
        }
        
        // Cargar publicaciones culturales desde localStorage
        const savedCultural = localStorage.getItem('vecinosVirtuales_cultural');
        if (savedCultural) {
            VV.data.culturalPosts = JSON.parse(savedCultural);
        }
        
        // Cargar servicios desde localStorage
        const savedServices = localStorage.getItem('vecinosVirtuales_services');
        if (savedServices) {
            VV.data.services = JSON.parse(savedServices);
        }
        
        // Cargar datos de ejemplo
        VV.data.sponsors = [...VV.sampleData.sponsors];
        
        // Actualizar UI con mensaje de bienvenida personalizado
        const isAdmin = VV.utils.isAdmin();
        document.getElementById('header-neighborhood').textContent = isAdmin ? '⚙️ Panel Admin' : VV.data.neighborhood;
        document.getElementById('header-user-number').textContent = VV.data.user.uniqueNumber;
        document.getElementById('welcome-name').textContent = VV.data.user.name;
        document.getElementById('welcome-neighborhood').textContent = isAdmin ? 'Panel de Administración Global' : `Bienvenido a ${VV.data.neighborhood}`;
        document.getElementById('welcome-number').textContent = VV.data.user.uniqueNumber;
        
        // Mostrar menús según rol
        VV.auth.updateMenuForRole();
        
        // Inicializar banner
        VV.banner.init();
        
        // Cargar ofertas destacadas
        if (typeof VV.featured !== 'undefined') {
            VV.featured.loadFeaturedOffers();
        }
        
        // Cargar avatar del usuario
        if (typeof VV.avatars !== 'undefined') {
            VV.avatars.updateAvatarDisplay();
        }
        
        // Mostrar app
        VV.utils.showScreen('main-app');
        VV.utils.showSection('dashboard');
        
        // Setup menú móvil
        VV.auth.setupMobileMenu();
    },
    
    // Actualizar menú según rol
    updateMenuForRole() {
        const adminMenu = document.getElementById('admin-menu-item');
        const usersMenu = document.getElementById('users-menu-item');
        const adminNeighborhoodsMenu = document.getElementById('admin-neighborhoods-menu');
        const adminProductsMenu = document.getElementById('admin-products-menu');
        const adminImprovementsMenu = document.getElementById('admin-improvements-menu');
        const moderatorMenu = document.getElementById('moderator-menu-item');
        const sponsorRequestMenu = document.getElementById('sponsor-request-menu-item');
        const editBannerBtn = document.getElementById('edit-banner-btn');
        
        if (VV.utils.isAdmin()) {
            // Admin ve todo
            if (adminMenu) adminMenu.style.display = 'flex';
            if (usersMenu) usersMenu.style.display = 'flex';
            if (adminNeighborhoodsMenu) adminNeighborhoodsMenu.style.display = 'flex';
            if (adminProductsMenu) adminProductsMenu.style.display = 'flex';
            if (adminImprovementsMenu) adminImprovementsMenu.style.display = 'flex';
            if (moderatorMenu) moderatorMenu.style.display = 'none';
            if (sponsorRequestMenu) sponsorRequestMenu.style.display = 'none';
            if (editBannerBtn) editBannerBtn.style.display = 'inline-block';
            VV.admin.loadBannerImage();
        } else if (VV.utils.isModerator()) {
            // Moderador solo ve su panel
            if (adminMenu) adminMenu.style.display = 'none';
            if (usersMenu) usersMenu.style.display = 'none';
            if (adminNeighborhoodsMenu) adminNeighborhoodsMenu.style.display = 'none';
            if (adminProductsMenu) adminProductsMenu.style.display = 'none';
            if (adminImprovementsMenu) adminImprovementsMenu.style.display = 'none';
            if (moderatorMenu) moderatorMenu.style.display = 'flex';
            if (sponsorRequestMenu) sponsorRequestMenu.style.display = 'none';
            if (editBannerBtn) editBannerBtn.style.display = 'none';
            VV.admin.loadBannerImage();
        } else {
            // Usuario normal
            if (adminMenu) adminMenu.style.display = 'none';
            if (usersMenu) usersMenu.style.display = 'none';
            if (adminNeighborhoodsMenu) adminNeighborhoodsMenu.style.display = 'none';
            if (adminProductsMenu) adminProductsMenu.style.display = 'none';
            if (adminImprovementsMenu) adminImprovementsMenu.style.display = 'none';
            if (moderatorMenu) moderatorMenu.style.display = 'none';
            if (sponsorRequestMenu) sponsorRequestMenu.style.display = 'flex';
            if (editBannerBtn) editBannerBtn.style.display = 'none';
            VV.admin.loadBannerImage();
        }
    },
    
    // Setup menú móvil
    setupMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        menuToggle.onclick = () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        };
        
        overlay.onclick = () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        };
        
        // Cerrar menú al hacer clic en item Y cambiar sección
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.getAttribute('data-section');
                if (sectionId) {
                    VV.utils.showSection(sectionId);
                }
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        });
        
        // Botón de cuenta (sidebar)
        document.querySelector('.contact-admin-btn').onclick = () => {
            VV.auth.logout();
        };
        
        // Botón de solicitar ser anunciante
        const sponsorRequestBtn = document.getElementById('sponsor-request-menu-item');
        if (sponsorRequestBtn) {
            sponsorRequestBtn.addEventListener('click', (e) => {
                e.preventDefault();
                requestSponsorStatus();
            });
        }
    },
    
    // Cerrar sesión
    async logout() {
        if (confirm('¿Cerrar sesión?')) {
            try {
                // Cerrar sesión en Supabase
                const { error } = await supabase.auth.signOut();
                if (error) console.error('Error cerrando sesión en Supabase:', error);
                
                // Limpiar localStorage completamente
                localStorage.removeItem('vecinosVirtualesUser');
                
                // Limpiar datos en memoria
                VV.data.user = null;
                VV.data.neighborhood = null;
                
                // Redirigir a la página de login (forzar recarga completa)
                window.location.href = window.location.origin + window.location.pathname;
            } catch (error) {
                console.error('Error en logout:', error);
                // Forzar limpieza aunque haya error
                localStorage.removeItem('vecinosVirtualesUser');
                VV.data.user = null;
                VV.data.neighborhood = null;
                window.location.href = window.location.origin + window.location.pathname;
            }
        }
    }
};

console.log('✅ Módulo AUTH cargado');
