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
        if (!content) return;
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
            const neighborhood = data.locality || 
                               data.localityInfo?.administrative?.[3]?.name || 
                               data.localityInfo?.administrative?.[2]?.name || 
                               data.neighbourhood || 
                               '';
            
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
        if (!content) return;
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
        const existingNeighborhoods = VV.auth.getExistingNeighborhoods();
        const list = [];
        const existingAdmin = VV.auth.getExistingAdmin();
        if (!existingAdmin) {
            list.push('Administrador');
        }
        list.push(...existingNeighborhoods.filter(n => n !== 'Administrador'));
        if (current) list.push(current);
        list.push(
            `Centro de ${city}`,
            `${city} Norte`,
            `${city} Sur`,
            `${city} Este`,
            `${city} Oeste`
        );
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
        if (!content) return;
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
        if (!list) return;
        const existingNeighborhoods = VV.auth.getExistingNeighborhoods();
        const adminOption = VV.auth.neighborhoods.find(n => n === 'Administrador');
        const otherNeighborhoods = VV.auth.neighborhoods.filter(n => n !== 'Administrador');
        const withUsers = otherNeighborhoods.filter(n => existingNeighborhoods.includes(n));
        const suggestions = otherNeighborhoods.filter(n => !existingNeighborhoods.includes(n));
        
        let html = '';
        if (adminOption) {
            html += '<div style="font-size: 0.85rem; color: var(--primary-purple); margin: 0.5rem 0; font-weight: 600;">⚙️ Acceso Especial:</div>';
            html += `<div class="neighborhood-item" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(37, 99, 235, 0.1)); border: 2px solid var(--primary-purple);" onclick="VV.auth.selectNeighborhood('Administrador')"><i class="fas fa-crown"></i> Administrador</div>`;
        }
        if (withUsers.length > 0) {
            html += '<div style="font-size: 0.85rem; color: var(--gray-600); margin: 1rem 0 0.5rem 0; font-weight: 600;">Barrios con vecinos:</div>';
            html += withUsers.map(n => `<div class="neighborhood-item" onclick="VV.auth.selectNeighborhood('${n.replace(/'/g, "\\'")}')">${n} <i class="fas fa-users"></i></div>`).join('');
        }
        if (suggestions.length > 0) {
            html += '<div style="font-size: 0.85rem; color: var(--gray-600); margin: 1rem 0 0.5rem 0; font-weight: 600;">Sugerencias:</div>';
            html += suggestions.map(n => `<div class="neighborhood-item" onclick="VV.auth.selectNeighborhood('${n.replace(/'/g, "\\'")}')">${n}</div>`).join('');
        }
        list.innerHTML = html;
    },
    
    // Búsqueda de barrios
    setupSearch() {
        const input = document.getElementById('neighborhood-search');
        if (!input) return;
        input.addEventListener('input', function() {
            const term = this.value.trim().toLowerCase();
            const filtered = VV.auth.neighborhoods.filter(n => n.toLowerCase().includes(term));
            const list = document.getElementById('neighborhoods-list');
            if (filtered.length > 0) {
                list.innerHTML = filtered.map(n => `<div class="neighborhood-item" onclick="VV.auth.selectNeighborhood('${n.replace(/'/g, "\\'")}')">${n}</div>`).join('');
            }
            if (term.length > 2 && !VV.auth.neighborhoods.some(n => n.toLowerCase() === term)) {
                list.innerHTML += `<div class="neighborhood-item" style="background: #f0fdf4; border: 2px dashed var(--success-green);" onclick="VV.auth.createNeighborhood('${this.value}')">Crear barrio "${this.value}"</div>`;
            }
        });
    },
    
    createNeighborhood(name) {
        const formattedName = name.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        if (!VV.auth.neighborhoods.includes(formattedName)) VV.auth.neighborhoods.unshift(formattedName);
        VV.auth.selectNeighborhood(formattedName);
    },
    
    selectNeighborhood(neighborhood) {
        VV.data.neighborhood = neighborhood;
        if (neighborhood === 'Administrador') {
            VV.auth.showAdminPasswordPrompt();
            return;
        }
        const users = VV.auth.getExistingUsers(neighborhood);
        if (users.length > 0) {
            document.getElementById('login-selected-neighborhood').textContent = neighborhood;
            VV.utils.showScreen('login-screen');
            VV.auth.setupLoginForm();
        } else {
            document.getElementById('selected-neighborhood').textContent = neighborhood;
            VV.utils.showScreen('registration-screen');
            VV.auth.setupRegistrationForm();
        }
    },
    
    showAdminPasswordPrompt() {
        const admin = VV.auth.getExistingAdmin();
        const password = prompt('Ingresa la clave de administrador:');
        if (!password) return;
        if (admin) {
            if (password === localStorage.getItem('adminPassword')) {
                VV.data.user = admin;
                VV.data.neighborhood = 'Administrador';
                localStorage.setItem('vecinosVirtualesUser', JSON.stringify(admin));
                VV.auth.startApp();
            } else alert('Clave incorrecta');
        } else {
            const confirmPass = prompt('Confirma la nueva clave:');
            if (password === confirmPass) {
                localStorage.setItem('adminPassword', password);
                document.getElementById('selected-neighborhood').textContent = 'Administrador';
                VV.utils.showScreen('registration-screen');
                VV.auth.setupRegistrationForm();
            } else alert('No coinciden');
        }
    },
    
    getExistingAdmin() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vecinosVirtuales_user_')) {
                const user = JSON.parse(localStorage.getItem(key));
                if (user.role === 'admin') return user;
            }
        }
        return null;
    },
    
    getExistingUsers(neighborhood) {
        const users = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vecinosVirtuales_user_')) {
                const user = JSON.parse(localStorage.getItem(key));
                if (user.neighborhood === neighborhood) users.push(user);
            }
        }
        return users;
    },
    
    manualLocation() {
        const content = document.getElementById('location-content');
        if (!content) return;
        content.innerHTML = `
            <p class="description">Ingresa tu ubicación</p>
            <div class="auth-form">
                <input type="text" id="manual-city" placeholder="Ciudad *">
                <input type="text" id="manual-neighborhood" placeholder="Barrio *">
                <button class="btn-primary" onclick="VV.auth.processManualLocation()">Continuar</button>
            </div>
        `;
    },
    
    processManualLocation() {
        const city = document.getElementById('manual-city').value.trim();
        const neighborhood = document.getElementById('manual-neighborhood').value.trim();
        if (city && neighborhood) {
            VV.auth.neighborhoods = VV.auth.generateNeighborhoods(city, '', neighborhood);
            VV.auth.showNeighborhoodSelection(city, 'Manual');
        }
    },
    
    setupLoginForm() {
        const form = document.getElementById('login-form');
        form.onsubmit = e => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const phone = document.getElementById('login-phone').value.trim();
            const user = VV.auth.findUser(email, VV.data.neighborhood);
            if (user && user.phone === phone) {
                VV.data.user = user;
                localStorage.setItem('vecinosVirtualesUser', JSON.stringify(user));
                VV.auth.startApp();
            } else VV.auth.showLoginError('Datos incorrectos');
        };
    },
    
    findUser(email, neighborhood) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vecinosVirtuales_user_')) {
                const user = JSON.parse(localStorage.getItem(key));
                if (user.email === email && user.neighborhood === neighborhood) return user;
            }
        }
        return null;
    },
    
    setupRegistrationForm() {
        const form = document.getElementById('registration-form');
        form.onsubmit = e => {
            e.preventDefault();
            const email = document.getElementById('register-email').value.trim();
            if (VV.auth.emailExistsGlobally(email)) {
                alert('Email ya registrado en otro barrio.');
                return;
            }
            const userData = {
                id: VV.utils.generateId(),
                uniqueNumber: Math.floor(100000 + Math.random() * 900000),
                name: document.getElementById('register-name').value.trim(),
                email: email,
                phone: document.getElementById('register-phone').value.trim(),
                neighborhood: VV.data.neighborhood,
                role: (VV.data.neighborhood === 'Administrador') ? 'admin' : 'user',
                createdAt: new Date().toISOString()
            };
            VV.data.user = userData;
            localStorage.setItem(`vecinosVirtuales_user_${userData.id}`, JSON.stringify(userData));
            localStorage.setItem('vecinosVirtualesUser', JSON.stringify(userData));
            VV.auth.startApp();
        };
    },
    
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
    
    emailExistsGlobally(email) {
        return VV.auth.getAllUsers().some(u => u.email === email);
    },
    
    startApp() {
        const isAdmin = VV.utils.isAdmin();
        document.getElementById('header-neighborhood').textContent = isAdmin ? '⚙️ Panel Admin' : VV.data.neighborhood;
        document.getElementById('header-user-number').textContent = VV.data.user.uniqueNumber;
        document.getElementById('welcome-name').textContent = VV.data.user.name;
        document.getElementById('welcome-neighborhood').textContent = isAdmin ? 'Panel de Administración Global' : `Bienvenido a ${VV.data.neighborhood}`;
        document.getElementById('welcome-number').textContent = VV.data.user.uniqueNumber;
        
        VV.auth.updateMenuForRole();
        if (typeof VV.featured !== 'undefined') VV.featured.loadFeaturedOffers();
        VV.utils.showScreen('main-app');
        VV.utils.showSection('dashboard');
    },
    
    updateMenuForRole() {
        const isAdmin = VV.utils.isAdmin();
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? 'flex' : 'none');
        const adminNeighborhoodsMenu = document.getElementById('admin-neighborhoods-menu');
        if (adminNeighborhoodsMenu) adminNeighborhoodsMenu.style.display = isAdmin ? 'flex' : 'none';
        const usersMenu = document.getElementById('users-menu-item');
        if (usersMenu) usersMenu.style.display = isAdmin ? 'flex' : 'none';
    },

    logout() {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('vecinosVirtualesUser');
            location.reload();
        }
    }
};

console.log('✅ Módulo AUTH original cargado');
