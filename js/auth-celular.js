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
        
        // Normalizar celular
        phone = phone.replace(/\D/g, '');
        
        // Validaciones
        if (!name || name.length < 2) return alert('Ingresá un nombre válido');
        if (!phone || phone.length < 8) return alert('Ingresá un número de celular válido');
        if (!pin || pin.length < 4) return alert('La clave debe tener al menos 4 dígitos');
        if (pin !== pinConfirm) return alert('Las claves no coinciden');
        
        // Bloquear Admin
        if (VV.data.neighborhood === 'Administrador') {
            alert('El barrio Administrador no está disponible para registro público.');
            return;
        }
        
        try {
            // Verificar celular duplicado
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('phone', phone)
                .maybeSingle();
                
            if (existing) {
                alert('Este celular ya está registrado. Usá "Ya tengo cuenta" para ingresar.');
                return;
            }
            
            // Crear email falso único
            const fakeEmail = `u${phone}@vv.app`;
            
            // 1. Crear usuario en Supabase Auth con el PIN como contraseña
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: fakeEmail,
                password: pin
            });
            
            if (authError) throw authError;
            
            // 2. Generar número único
            const uniqueNumber = await VV.auth.generateUniqueNumber(VV.data.neighborhood);
            
            // 3. Insertar en tabla users
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
                    featured_credits: 0,
                    blocked: false
                })
                .select()
                .single();
            
            if (userError) throw userError;
            
            // 4. Iniciar sesión local
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
         // ===== AGREGAR ESTO =====
        console.log('🔍 Buscando celular limpio:', phone);
         // ========================
        if (!phone || !pin) return alert('Completá todos los campos');
        
        try {
            // Buscar email falso asociado a este celular
            const { data: userRow, error: findError } = await supabase
                .from('users')
                .select('email, phone')
                .eq('phone', phone)
                .maybeSingle();
                 // ===== AGREGAR ESTO =====
            console.log('👤 Resultado de búsqueda:', userRow);
                // ========================
            if (!userRow) {
                alert('No encontramos una cuenta con ese número.');
                return;
            }
            
            // Login con Supabase Auth usando el email falso + PIN
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: userRow.email,
                password: pin
            });
            
            if (authError) {
                alert('Celular o clave incorrectos.');
                return;
            }
            
            // Obtener datos completos del usuario
            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();
            
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
