VV.authCelular = {
    
    startRegistration() {
        // Los términos ya se aceptaron en terminos.html, ir directo al registro
        VV.data.pendingRegistration = true;
        VV.authCelular.onNeighborhoodSelected(VV.data.neighborhood);
    },

    
    acceptTerms() {
        const accepted = document.getElementById('terms-check')?.checked;
        if (!accepted) {
            alert('Debés aceptar los términos para continuar');
            return;
        }
        VV.data.pendingRegistration = true;
        VV.utils.showScreen('location-screen');
        VV.auth.requestGeolocation();
        VV.data.neighborhood = VV.geo.formatNeighborhoodName(VV.data.neighborhood);
    },
    
    formatNeighborhoodName(name) {
        if (!name) return '';
        return name.trim();
    },

   
    onNeighborhoodSelected(neighborhood) {
        VV.data.neighborhood = neighborhood.trim();
        const el = document.getElementById('reg-selected-neighborhood');
        if (el) el.textContent = VV.data.neighborhood;
        VV.utils.showScreen('register-phone-screen');
    },
    
   async registerWithPin() {
    const name = document.getElementById('reg-name')?.value.trim();
    let phone = document.getElementById('reg-phone')?.value.trim();
    const pin = document.getElementById('reg-pin')?.value.trim();
    const pinConfirm = document.getElementById('reg-pin-confirm')?.value.trim();
    
    // Limpiar teléfono: solo dígitos
    phone = phone.replace(/\D/g, '');
    
    // === VALIDACIONES BÁSICAS ===
    if (!name || name.length < 2) return alert('Ingresá un nombre válido (mínimo 2 caracteres)');
    if (/@<>/.test(name)) return alert('El nombre no puede contener @ ni símbolos especiales');
    if (!phone) return alert('Ingresá un número de celular');
    
    if (phone.length < 6 || phone.length > 15) {
        return alert('Ingresá un número válido con código de área (ej: 11 1234 5678)');
    }
    
    if (!pin || pin.length < 6) return alert('La clave debe tener al menos 6 caracteres');
    if (pin !== pinConfirm) return alert('Las claves no coinciden');
    
    if (/^(\d)\1{5,}$/.test(pin)) return alert('La clave no puede ser todos números iguales');
    if (/^(012345|123456|234567|345678|456789|567890|987654|876543|765432|654321|543210)$/.test(pin)) {
        return alert('Elegí una clave más segura, no secuencial');
    }
    
    if (VV.data.neighborhood === 'Administrador') {
        alert('El barrio Administrador no está disponible para registro público.');
        return;
    }
    if (!VV.data.neighborhood) {
        alert('No se detectó tu barrio. Volvé atrás y seleccioná tu barrio manualmente.');
        return;
    }

    // === RATE LIMITING ===
    const lastAttempt = localStorage.getItem('vv_last_register_attempt');
    if (lastAttempt) {
        const elapsed = Date.now() - parseInt(lastAttempt);
        if (elapsed < 30000) {
            const wait = Math.ceil((30000 - elapsed) / 1000);
            return alert(`Esperá ${wait} segundos antes de intentar de nuevo`);
        }
    }
    localStorage.setItem('vv_last_register_attempt', Date.now().toString());
    
    try {
        // Verificar si ya existe en tabla users
        const { data: existing } = await supabase
            .from('users')
            .select('id, name, unique_number, neighborhood')
            .eq('phone', phone)
            .maybeSingle();
            
        if (existing) {
            alert(`Este celular ya está registrado como ${existing.name} (#${existing.unique_number}). Usá "Ya tengo cuenta" para ingresar.`);
            return;
        }
        
        const fakeEmail = `u${phone}@vv.app`;
        
        // Intentar signUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: fakeEmail,
            password: pin
        });
        
        // === Caso: el email ya existe en Auth (422) ===
        const yaRegistrado = authError && (
            authError.status === 422 ||
            authError.message?.toLowerCase().includes('already registered') ||
            authError.message?.toLowerCase().includes('already been registered')
        );
        
        if (yaRegistrado) {
            // El usuario existe en Auth pero no en users (sesión huérfana).
            // Intentar login con el PIN que ingresó.
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: fakeEmail,
                password: pin
            });
            
            if (loginError) {
                // El PIN no coincide con el que ya tenían
                alert('Este celular ya está registrado pero la clave no coincide. Si recordás tu clave, usá "Ya tengo cuenta". Si no, contactá al administrador.');
                return;
            }
            
            // Verificar si ya tiene fila en users (por las dudas)
            const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', loginData.user.id)
                .maybeSingle();
            
            if (existingUser) {
                // Ya tiene todo, solo loguear
                localStorage.setItem('vv_phone_auth', existingUser.id);
                VV.data.user = existingUser;
                VV.data.neighborhood = existingUser.neighborhood;
                VV.utils.showSuccess(`¡Bienvenido de nuevo, ${existingUser.name}!`);
                setTimeout(() => VV.auth.startApp(), 1500);
                return;
            }
            
            // No tiene fila en users: crearla ahora
            const uniqueNumber = await VV.auth.generateUniqueNumber(VV.data.neighborhood);
            const { data: userData, error: userError } = await supabase
                .from('users')
                .insert({
                    id: loginData.user.id,
                    email: fakeEmail,
                    name: name,
                    phone: phone,
                    neighborhood: VV.data.neighborhood,
                    home_neighborhood: VV.data.neighborhood,
                    current_neighborhood: VV.data.neighborhood,
                    unique_number: uniqueNumber,
                    folleto_credits: 3,
                    featured_credits: 1,
                    role: 'user',
                    avatar: 'basic-1',
                    unlocked_avatars: [],
                    blocked: false
                })
                .select()
                .maybeSingle();
            
            if (userError) throw userError;
            
            localStorage.setItem('vv_phone_auth', userData.id);
            VV.data.user = userData;
            VV.data.neighborhood = userData.neighborhood;
            
            VV.utils.showSuccess(`¡Bienvenido, ${userData.name}! Tu número es #${uniqueNumber}`);
            setTimeout(() => VV.auth.startApp(), 1500);
            return;
        }
        
        // Otro error de Auth que no es "already registered"
        if (authError) throw authError;
        
        // === SignUp exitoso (usuario nuevo de verdad) ===
        const uniqueNumber = await VV.auth.generateUniqueNumber(VV.data.neighborhood);
        
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: fakeEmail,
                name: name,
                phone: phone,
                neighborhood: VV.data.neighborhood,
                home_neighborhood: VV.data.neighborhood,
                current_neighborhood: VV.data.neighborhood,
                unique_number: uniqueNumber,
                folleto_credits: 3,
                featured_credits: 1,
                role: 'user',
                avatar: 'basic-1',
                unlocked_avatars: [],
                blocked: false
            })
            .select()
            .maybeSingle();
        
        if (userError) throw userError;
        
        localStorage.setItem('vv_phone_auth', userData.id);
        VV.data.user = userData;
        VV.data.neighborhood = userData.neighborhood;
        
        VV.utils.showSuccess(`¡Bienvenido, ${userData.name}! Tu número es #${uniqueNumber}`);
        setTimeout(() => VV.auth.startApp(), 1500);
        
    } catch (error) {
        console.error('Error en registro:', error);
        alert('Error al crear la cuenta: ' + error.message);
    }
},


    
    async loginWithPin() {
        let phone = document.getElementById('login-phone')?.value.trim();
        const pin = document.getElementById('login-pin')?.value.trim();
        
        phone = phone.replace(/\D/g, '');
        
        if (!phone || !pin) return alert('Completá todos los campos');
        if (pin.length < 6) return alert('La clave debe tener al menos 6 caracteres');
        
        const fakeEmail = `u${phone}@vv.app`;
        
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: fakeEmail,
                password: pin
            });
            
            if (authError) {
                alert('Celular o clave incorrectos.');
                return;
            }
            
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();
            
            if (userError || !userData) {
                alert('Error al cargar tu cuenta. Contactá al administrador.');
                return;
            }
            
            // Verificar si está bloqueado
            if (userData.blocked) {
                await supabase.auth.signOut();
                alert(`Tu cuenta está bloqueada. Razón: ${userData.blocked_reason || 'Contacta al administrador'}`);
                return;
            }
            
            // Guardar sesión
            localStorage.setItem('vv_phone_auth', userData.id);
            VV.data.user = userData;
            VV.data.neighborhood = userData.neighborhood;
            
            VV.utils.showSuccess(`¡Bienvenido de nuevo, ${userData.name}!`);
            setTimeout(() => VV.auth.startApp(), 1000);
            
        } catch (error) {
            console.error('Error en login:', error);
            alert('Error al ingresar: ' + error.message);
        }
    },
    
    showLogin() {
        VV.utils.showScreen('login-phone-screen');
    }
};

console.log('✅ Módulo AUTH-CELULAR cargado');
