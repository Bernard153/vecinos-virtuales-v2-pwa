// ========== MÓDULO DE AUTENTICACIÓN POR CELULAR Y BARRIOS ==========

VV.auth = {
    userLocation: null,
    neighborhoods: [],
    
    // 1. Verificar sesión activa al abrir la app
    checkExistingUser() {
        const savedUser = localStorage.getItem('vecinosVirtualesUser');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            // Mapeo de seguridad: asegurar que unique_number se lea bien
            VV.data.user = user;
            VV.data.user.uniqueNumber = user.uniqueNumber || user.unique_number; 
            VV.data.neighborhood = user.neighborhood;
            return true;
        }
        return false;
    },

    // 2. Lógica de Geolocalización (Se mantiene igual para detección)
    requestGeolocation() {
        const content = document.getElementById('location-content');
        content.innerHTML = `
            <div class="loading-spinner"></div>
            <p class="description">Detectando tu ubicación...</p>
            <p style="font-size: 0.9rem; color: var(--gray-600); margin-top: 1rem;">
                Usamos tu ubicación para mostrarte los comercios de tu zona.
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

    async handleLocationSuccess(position) {
        VV.auth.userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${VV.auth.userLocation.lat}&longitude=${VV.auth.userLocation.lng}&localityLanguage=es`);
            const data = await response.json();
            const city = data.city || data.locality || 'Ciudad';
            const province = data.principalSubdivision || '';
            const neighborhood = data.locality || data.localityInfo?.administrative?.[3]?.name || '';
            
            VV.auth.locationData = { city, province, neighborhood };
            VV.auth.neighborhoods = VV.auth.generateNeighborhoods(city, province, neighborhood);
            VV.auth.showNeighborhoodSelection(city, province);
        } catch (error) {
            VV.auth.manualLocation();
        }
    },

    handleLocationError(error) {
        const content = document.getElementById('location-content');
        content.innerHTML = `
            <div class="error-message"><i class="fas fa-exclamation-circle"></i> No pudimos detectar tu ubicación.</div>
            <button class="btn-primary" onclick="VV.auth.requestGeolocation()"><i class="fas fa-redo"></i> Reintentar</button>
            <button class="btn-secondary" onclick="VV.auth.manualLocation()"><i class="fas fa-edit"></i> Ingresar manualmente</button>
        `;
    },

    // 3. Selección y Manejo de Barrios
    generateNeighborhoods(city, province, current) {
        const list = ['Administrador']; // Opción base
        if (current) list.push(current);
        list.push(`Centro de ${city}`, `${city} Norte`, `${city} Sur`);
        return [...new Set(list)];
    },

    // Obtener barrios con gente (Para UI)
    getExistingNeighborhoods() {
        // En una versión futura esto vendrá de una tabla 'neighborhoods' en Supabase
        return []; 
    },

    showNeighborhoodSelection(city, province) {
        const content = document.getElementById('location-content');
        content.innerHTML = `
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; color: #0369a1;">
                <i class="fas fa-map-marker-alt"></i> Ubicación: ${city}
            </div>
            <p class="description">¿En qué barrio estás ahora?</p>
            <div class="search-container">
                <input type="text" id="neighborhood-search" placeholder="Buscar o escribir nombre del barrio...">
                <i class="fas fa-search"></i>
            </div>
            <div class="neighborhoods-list" id="neighborhoods-list"></div>
        `;
        VV.auth.loadNeighborhoods();
        VV.auth.setupSearch();
    },

    loadNeighborhoods() {
        const list = document.getElementById('neighborhoods-list');
        list.innerHTML = VV.auth.neighborhoods.map(n => `
            <div class="neighborhood-item" onclick="VV.auth.selectNeighborhood('${n.replace(/'/g, "\\'")}')"> 
                ${n === 'Administrador' ? '👑 ' : '🏠 '} ${n}
            </div>
        `).join('');
    },

    setupSearch() {
        const input = document.getElementById('neighborhood-search');
        input.oninput = function() {
            const term = this.value.trim().toLowerCase();
            const filtered = VV.auth.neighborhoods.filter(n => n.toLowerCase().includes(term));
            const list = document.getElementById('neighborhoods-list');
            list.innerHTML = filtered.map(n => `<div class="neighborhood-item" onclick="VV.auth.selectNeighborhood('${n}')">${n}</div>`).join('');
            
            if (term.length > 2 && !VV.auth.neighborhoods.some(n => n.toLowerCase() === term)) {
                list.innerHTML += `<div class="neighborhood-item" style="border: 2px dashed #22c55e;" onclick="VV.auth.selectNeighborhood('${this.value}')">✨ Crear barrio "${this.value}"</div>`;
            }
        };
    },

    // 4. LÓGICA DE ACCESO (REGISTRO Y LOGIN)
    selectNeighborhood(neighborhood) {
        VV.data.neighborhood = neighborhood;
        if (neighborhood === 'Administrador') {
            VV.auth.showAdminPasswordPrompt();
            return;
        }

        // Al seleccionar barrio, mostramos pantalla de ingreso (Celular)
        VV.utils.showScreen('login-screen');
        document.getElementById('login-selected-neighborhood').textContent = neighborhood;
        VV.auth.setupAccessForm();
    },

    setupAccessForm() {
        const form = document.getElementById('login-form');
        form.onsubmit = async function(e) {
            e.preventDefault();
            const phone = document.getElementById('login-phone').value.trim();
            const neighborhood = VV.data.neighborhood;

            try {
                // Buscamos si el teléfono existe en ese barrio
                const { data: user, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('phone', phone)
                    .eq('neighborhood', neighborhood)
                    .single();

                if (user) {
                    // LOGIN EXITOSO
                    VV.auth.completeSession(user);
                } else {
                    // NO EXISTE: IR A REGISTRO
                    VV.auth.goToRegistration(phone);
                }
            } catch (err) {
                alert("Error de conexión");
            }
        };
    },

    goToRegistration(phone) {
        VV.utils.showScreen('registration-screen');
        document.getElementById('selected-neighborhood').textContent = VV.data.neighborhood;
        document.getElementById('user-phone').value = phone; // Mantenemos el teléfono que puso
        
        const regForm = document.getElementById('registration-form');
        regForm.onsubmit = (e) => VV.auth.registerByPhone(e);
    },

    async registerByPhone(e) {
        e.preventDefault();
        const name = document.getElementById('user-name').value.trim();
        const phone = document.getElementById('user-phone').value.trim();
        const neighborhood = VV.data.neighborhood;

        const userData = {
            id: VV.utils.generateId(),
            name: name,
            phone: phone,
            neighborhood: neighborhood,
            unique_number: Math.floor(100000 + Math.random() * 900000),
            role: 'user',
            home_neighborhood: neighborhood,
            current_neighborhood: neighborhood
        };

        try {
            const { error } = await supabase.from('users').insert(userData);
            if (error) {
                if (error.code === '23505') alert("Este celular ya está registrado en la base de datos.");
                else throw error;
                return;
            }
            VV.auth.completeSession(userData);
        } catch (err) {
            alert("Fallo al registrar: " + err.message);
        }
    },

    completeSession(user) {
        // Guardamos con los nombres correctos para el resto de la app
        const sessionUser = {
            id: user.id,
            name: user.name,
            phone: user.phone,
            neighborhood: user.neighborhood,
            uniqueNumber: user.unique_number || user.uniqueNumber,
            role: user.role
        };
        localStorage.setItem('vecinosVirtualesUser', JSON.stringify(sessionUser));
        VV.data.user = sessionUser;
        VV.auth.startApp();
    },

    // 5. Gestión de Admin
    showAdminPasswordPrompt() {
        const password = prompt('Clave de Administrador:');
        if (password === '123456') { // Cambiar por tu clave real o validación en DB
            const adminUser = {
                id: 'admin-root',
                name: 'Administrador',
                phone: '0000',
                neighborhood: 'Administrador',
                uniqueNumber: '000000',
                role: 'admin'
            };
            VV.auth.completeSession(adminUser);
        } else {
            alert('Clave incorrecta');
        }
    },

    // 6. Inicio y Cierre
    startApp() {
        // Cargar datos en cascada desde Supabase
        VV.data.loadFromSupabase();

        // UI Updates
        const isAdmin = VV.data.user.role === 'admin';
        document.getElementById('header-neighborhood').textContent = isAdmin ? '⚙️ Admin' : VV.data.user.neighborhood;
        document.getElementById('header-user-number').textContent = VV.data.user.uniqueNumber;
        document.getElementById('welcome-name').textContent = VV.data.user.name;
        document.getElementById('welcome-neighborhood').textContent = VV.data.user.neighborhood;
        
        VV.auth.updateMenuForRole();
        VV.utils.showScreen('main-app');
        VV.utils.showSection('dashboard');
        VV.auth.setupMobileMenu();
    },

    updateMenuForRole() {
        const role = VV.data.user.role;
        // Mostrar/Ocultar secciones según el rol del usuario
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = (role === 'admin' ? 'flex' : 'none'));
        document.querySelectorAll('.user-only').forEach(el => el.style.display = (role === 'user' ? 'flex' : 'none'));
    },

    setupMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        if (menuToggle) {
            menuToggle.onclick = () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            };
        }
        
        if (overlay) {
            overlay.onclick = () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            };
        }

        document.querySelectorAll('.menu-item').forEach(item => {
            item.onclick = (e) => {
                const section = item.getAttribute('data-section');
                if (section) VV.utils.showSection(section);
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            };
        });
    },

    async logout() {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('vecinosVirtualesUser');
            location.reload();
        }
    }
    // --- FUNCIONES DE UBICACIÓN MANUAL (RESTAURADAS) ---

    manualLocation() {
        const content = document.getElementById('location-content');
        if (!content) return;

        content.innerHTML = `
            <div class="auth-form" style="margin-top: 20px;">
                <p class="description">Ingresa tu ubicación para buscar barrios cercanos</p>
                <div class="form-group">
                    <label>Ciudad</label>
                    <input type="text" id="manual-city" placeholder="Ej: Buenos Aires" style="width:100%; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid #ddd;">
                </div>
                <div class="form-group">
                    <label>Barrio (opcional)</label>
                    <input type="text" id="manual-neighborhood" placeholder="Ej: Palermo" style="width:100%; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid #ddd;">
                </div>
                <button class="btn-primary" onclick="VV.auth.processManualLocation()" style="width:100%;">
                    <i class="fas fa-search"></i> Buscar Barrios
                </button>
                <button class="btn-secondary" onclick="VV.auth.requestGeolocation()" style="width:100%; margin-top:10px;">
                    <i class="fas fa-location-arrow"></i> Usar GPS
                </button>
            </div>
        `;
    },

    processManualLocation() {
        const city = document.getElementById('manual-city').value.trim();
        const neighborhood = document.getElementById('manual-neighborhood').value.trim();
        
        if (!city) {
            alert('Por favor ingresa al menos una ciudad');
            return;
        }
        
        // Generamos los barrios basados en lo que escribió el usuario
        VV.auth.neighborhoods = VV.auth.generateNeighborhoods(city, '', neighborhood);
        
        // Mostramos la lista de selección
        VV.auth.showNeighborhoodSelection(city, 'Manual');
    },
};

console.log('✅ Módulo AUTH Sincronizado con Supabase');
