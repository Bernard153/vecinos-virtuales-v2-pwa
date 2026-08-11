VV.authCelular = {
    
    startRegistration() {
        VV.utils.showScreen('terms-screen');
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
        return name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .toUpperCase()
            .trim();
    },
   
    onNeighborhoodSelected(neighborhood) {
        const el = document.getElementById('reg-selected-neighborhood');
        if (el) el.textContent = neighborhood;
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
    if (!phone) return alert('Ingresá un número de celular');
    
    // Validar formato argentino: 10 u 11 dígitos (ej: 11 1234 5678 o 381 123 4567)
    if (phone.length < 6 || phone.length > 15) {
        return alert('Ingresá un número válido con código de área (ej: 11 1234 5678)');
    }
    
    if (!pin || pin.length < 6) return alert('La clave debe tener al menos 6 caracteres');
    if (pin !== pinConfirm) return alert('Las claves no coinciden');
    
    // Validar que el PIN no sea secuencial (123456) ni repetido (111111)
    if (/^(\d)\1{5,}$/.test(pin)) return alert('La clave no puede ser todos números iguales');
    if (/^(012345|123456|234567|345678|456789|567890|987654|876543|765432|654321|543210)$/.test(pin)) {
        return alert('Elegí una clave más segura, no secuencial');
    }
    
    if (VV.data.neighborhood === 'Administrador') {
        alert('El barrio Administrador no está disponible para registro público.');
        return;
    }
    
    // === RATE LIMITING: evitar intentos rápidos ===
    const lastAttempt = localStorage.getItem('vv_last_register_attempt');
    if (lastAttempt) {
        const elapsed = Date.now() - parseInt(lastAttempt);
        if (elapsed < 30000) { // 30 segundos entre intentos
            const wait = Math.ceil((30000 - elapsed) / 1000);
            return alert(`Esperá ${wait} segundos antes de intentar de nuevo`);
        }
    }
    localStorage.setItem('vv_last_register_attempt', Date.now().toString());
    
    try {
        // Verificar si ya existe en tabla users
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('phone', phone)
            .maybeSingle();
            
        if (existing) {
            alert('Este celular ya está registrado. Usá "Ya tengo cuenta" para ingresar.');
            return;
        }
        
        // Verificar también en Auth si el email ya existe
        const fakeEmail = `u${phone}@vv.app`;
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: fakeEmail,
            password: pin
        });
        
        if (authError) {
            if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email: fakeEmail,
                    password: pin
                });
                
                if (loginError) {
                    alert('Este celular ya tiene una cuenta. Si recordás tu clave, usá "Ya tengo cuenta". Si no, contactá al administrador.');
                    return;
                }
                
                const uniqueNumber = await VV.auth.generateUniqueNumber(VV.data.neighborhood);
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .insert({
                        id: loginData.user.id,
                        email: fakeEmail,
                        name: name,
                        phone: phone,
                        neighborhood: VV.data.neighborhood,
                        unique_number: uniqueNumber,
                        folleto_credits: 3,
                        featured_credits: 1,
                        role: 'user',
                        avatar: 'basic-1',
                        unlocked_avatars: [],
                        blocked: false
                    })
                    .select()
                    .single();
                
                if (userError) throw userError;
                
                localStorage.setItem('vv_phone_auth', userData.id);
                VV.data.user = userData;
                VV.data.neighborhood = userData.neighborhood;
                
                VV.utils.showSuccess(`¡Bienvenido, ${userData.name}! Tu número es #${uniqueNumber}`);
                setTimeout(() => VV.auth.startApp(), 1500);
                return;
            }
            throw authError;
        }
        
        const uniqueNumber = await VV.auth.generateUniqueNumber(VV.data.neighborhood);
        
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: fakeEmail,
                name: name,
                phone: phone,
                neighborhood: VV.data.neighborhood,
                unique_number: uniqueNumber,
                folleto_credits: 3,
                featured_credits: 1,
                role: 'user',
                avatar: 'basic-1',
                unlocked_avatars: [],
                blocked: false
            })
            .select()
            .single();
        
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
