// ========== MÓDULO DE AUTENTICACIÓN CON SUPABASE ==========
// Versión migrada de localStorage a Supabase
// Mantiene TODAS las funcionalidades originales

VV.auth = {
    userLocation: null,
    neighborhoods: [],
    
    // Verificar sesión existente en Supabase
    async checkExistingUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                // Obtener datos completos del usuario desde la tabla users
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (error) throw error;
                
                if (userData) {
                    VV.data.user = userData;
                    VV.data.neighborhood = userData.neighborhood;
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error verificando sesión:', error);
            return false;
        }
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
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            const data = await response.json();
            
            const suburb = data.address.suburb || data.address.neighbourhood || data.address.city_district;
            
            if (suburb) {
                VV.auth.neighborhoods = [suburb];
                VV.auth.showNeighborhoodSelection();
            } else {
                VV.auth.manualLocation();
            }
        } catch (error) {
            console.error('Error obteniendo barrio:', error);
            VV.auth.manualLocation();
        }
    },
    
    // Error de ubicación
    handleLocationError(error) {
        let message = 'No pudimos detectar tu ubicación.';
        
        switch(error.code) {
            case 1:
                message = 'Permiso de ubicación denegado.';
                break;
            case 2:
                message = 'Ubicación no disponible.';
                break;
            case 3:
                message = 'Tiempo de espera agotado.';
                break;
        }
        
        const content = document.getElementById('location-content');
        content.innerHTML = `
            <div class="error-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <p class="description">${message}</p>
            <button class="btn-primary" onclick="VV.auth.manualLocation()">
                <i class="fas fa-edit"></i> Ingresar Barrio Manualmente
            </button>
        `;
    },
    
    // Ingreso manual de ubicación
    manualLocation() {
        const content = document.getElementById('location-content');
        content.innerHTML = `
            <h3 style="margin-bottom: 1rem;">Ingresa tu Barrio</h3>
            <p class="description">Escribe el nombre de tu barrio o zona</p>
            <input type="text" id="manual-neighborhood" placeholder="Ej: Palermo, Recoleta, Belgrano..." 
                   style="width: 100%; padding: 1rem; border: 2px solid var(--gray-300); border-radius: 12px; font-size: 1rem; margin: 1rem 0;">
            <button class="btn-primary" onclick="VV.auth.confirmManualNeighborhood()">
                <i class="fas fa-check"></i> Confirmar
            </button>
        `;
        
        document.getElementById('manual-neighborhood').focus();
        document.getElementById('manual-neighborhood').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') VV.auth.confirmManualNeighborhood();
        });
    },
    
    // Confirmar barrio manual
    confirmManualNeighborhood() {
        const input = document.getElementById('manual-neighborhood');
        const neighborhood = input.value.trim();
        
        if (neighborhood.length < 3) {
            alert('Por favor ingresa un nombre de barrio válido');
            return;
        }
        
        VV.auth.neighborhoods = [neighborhood];
        VV.auth.showNeighborhoodSelection();
    },
    
    // Mostrar selección de barrio
    showNeighborhoodSelection() {
        const content = document.getElementById('location-content');
        
        content.innerHTML = `
            <div class="success-icon">
                <i class="fas fa-map-marker-alt"></i>
            </div>
            <h3 style="margin-bottom: 0.5rem;">¡Barrio Detectado!</h3>
            <p class="description">Confirma tu barrio para continuar</p>
            <div class="neighborhood-options">
                ${VV.auth.neighborhoods.map(n => `
                    <button class="neighborhood-btn" onclick="VV.auth.selectNeighborhood('${n}')">
                        <i class="fas fa-home"></i> ${n}
                    </button>
                `).join('')}
            </div>
            <button class="btn-secondary" onclick="VV.auth.manualLocation()" style="margin-top: 1rem;">
                <i class="fas fa-edit"></i> Cambiar Barrio
            </button>
        `;
    },
    
    // Seleccionar barrio
    selectNeighborhood(neighborhood) {
        VV.data.neighborhood = neighborhood;
        VV.utils.showScreen('register');
    },
    
    // Obtener barrios existentes desde Supabase
    async getExistingNeighborhoods() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('neighborhood')
                .neq('neighborhood', 'Administrador');
            
            if (error) throw error;
            
            const neighborhoods = [...new Set(data.map(u => u.neighborhood))];
            return neighborhoods.sort();
        } catch (error) {
            console.error('Error obteniendo barrios:', error);
            return [];
        }
    },
    
    // Obtener todos los usuarios desde Supabase
    async getAllUsers() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo usuarios:', error);
            return [];
        }
    },
    
    // Obtener siguiente número único para el barrio
    async getNextUniqueNumber(neighborhood) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('unique_number')
                .eq('neighborhood', neighborhood)
                .order('unique_number', { ascending: false })
                .limit(1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                return data[0].unique_number + 1;
            }
            return 1;
        } catch (error) {
            console.error('Error obteniendo número único:', error);
            return 1;
        }
    },
    
    // Registrar nuevo usuario
    async register() {
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const name = document.getElementById('register-name').value.trim();
        const phone = document.getElementById('register-phone').value.trim();
        
        // Validaciones
        if (!email || !password || !confirmPassword || !name || !phone) {
            alert('Por favor completa todos los campos');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        
        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        if (!VV.data.neighborhood) {
            alert('Por favor selecciona tu barrio primero');
            return;
        }
        
        try {
            // 1. Crear usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password
            });
            
            if (authError) throw authError;
            
            // 2. Obtener siguiente número único
            const uniqueNumber = await VV.auth.getNextUniqueNumber(VV.data.neighborhood);
            
            // 3. Crear registro en tabla users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: email,
                    name: name,
                    phone: phone,
                    neighborhood: VV.data.neighborhood,
                    unique_number: uniqueNumber,
                    role: 'user',
                    avatar: 'basic-1',
                    unlocked_avatars: [],
                    featured_credits: 0,
                    blocked: false
                })
                .select()
                .single();
            
            if (userError) throw userError;
            
            // 4. Guardar datos del usuario
            VV.data.user = userData;
            
            // 5. Mostrar éxito
            VV.utils.showSuccess(`¡Bienvenido ${name}! Tu número único es #${uniqueNumber}`);
            
            // 6. Iniciar aplicación
            setTimeout(() => {
                VV.auth.startApp();
            }, 1500);
            
        } catch (error) {
            console.error('Error en registro:', error);
            if (error.message.includes('already registered')) {
                alert('Este email ya está registrado. Por favor inicia sesión.');
            } else {
                alert('Error al registrar: ' + error.message);
            }
        }
    },
    
    // Iniciar sesión
    async login() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            alert('Por favor completa todos los campos');
            return;
        }
        
        try {
            // 1. Autenticar con Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (authError) throw authError;
            
            // 2. Obtener datos del usuario desde la tabla users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();
            
            if (userError) throw userError;
            
            // 3. Verificar si está bloqueado
            if (userData.blocked) {
                await supabase.auth.signOut();
                alert(`Tu cuenta está bloqueada. Razón: ${userData.blocked_reason || 'Contacta al administrador'}`);
                return;
            }
            
            // 4. Guardar datos del usuario
            VV.data.user = userData;
            VV.data.neighborhood = userData.neighborhood;
            
            // 5. Mostrar éxito
            VV.utils.showSuccess(`¡Bienvenido de nuevo, ${userData.name}!`);
            
            // 6. Iniciar aplicación
            setTimeout(() => {
                VV.auth.startApp();
            }, 1000);
            
        } catch (error) {
            console.error('Error en login:', error);
            if (error.message.includes('Invalid login credentials')) {
                alert('Email o contraseña incorrectos');
            } else {
                alert('Error al iniciar sesión: ' + error.message);
            }
        }
    },
    
    // Cerrar sesión
    async logout() {
        if (confirm('¿Cerrar sesión?')) {
            try {
                await supabase.auth.signOut();
                VV.data.user = null;
                VV.data.neighborhood = null;
                location.reload();
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                location.reload();
            }
        }
    },
    
    // Iniciar aplicación
    startApp() {
        // Cargar datos del usuario
        document.getElementById('header-neighborhood').textContent = VV.data.neighborhood;
        document.getElementById('header-user-number').textContent = VV.data.user.uniqueNumber;
        
        // Cargar datos desde Supabase
        VV.data.loadFromSupabase();
        
        // Actualizar menú según rol
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
        const adminMenu = document.getElementById('admin-menu');
        const moderatorMenu = document.getElementById('moderator-menu');
        
        if (VV.utils.isAdmin()) {
            adminMenu.style.display = 'block';
            if (moderatorMenu) moderatorMenu.style.display = 'none';
        } else if (VV.utils.isModerator()) {
            if (moderatorMenu) moderatorMenu.style.display = 'block';
            adminMenu.style.display = 'none';
        } else {
            adminMenu.style.display = 'none';
            if (moderatorMenu) moderatorMenu.style.display = 'none';
        }
    },
    
    // Setup menú móvil
    setupMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('overlay');
        
        if (menuToggle && sidebar && overlay) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
            
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
    }
};

console.log('✅ Módulo AUTH (Supabase) cargado');
