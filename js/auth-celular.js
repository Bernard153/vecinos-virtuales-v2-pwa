VV.authCelular = {
    tempData: {},
    devCode: null, // Eliminar en producción cuando tengas SMS real
    
    startRegistration() {
        VV.utils.showScreen('terms-screen');
    },
    
    acceptTerms() {
        const accepted = document.getElementById('terms-check')?.checked;
        if (!accepted) {
            alert('Debés aceptar los términos para continuar');
            return;
        }
        VV.data.pendingRegistration = true; // <-- AGREGAR ESTA LÍNEA
        // Ir a geolocalización (reutilizamos geo.js)
        VV.utils.showScreen('location-screen');
        VV.auth.requestGeolocation();
    },
    
    // Llamado desde geo.js cuando selecciona barrio
    onNeighborhoodSelected(neighborhood) {
        VV.data.neighborhood = neighborhood;
        const el = document.getElementById('reg-selected-neighborhood');
        if (el) el.textContent = neighborhood;
        VV.utils.showScreen('register-phone-screen');
    },
    
    async sendCode() {
        const name = document.getElementById('reg-name')?.value.trim();
        const phone = document.getElementById('reg-phone')?.value.trim();
        
        if (!name || name.length < 2) return alert('Ingresá un nombre válido');
        if (!phone || phone.length < 8) return alert('Ingresá un número de celular válido');
        
        // Verificar si celular ya existe
        const { data: existing, error: errCheck } = await supabase
            .from('users')
            .select('id, phone')
            .eq('phone', phone)
            .maybeSingle();
            
        if (existing) {
            alert('Este celular ya está registrado. Intentá iniciar sesión.');
            return;
        }
        
        this.tempData = { name, phone, neighborhood: VV.data.neighborhood };
        
        // ===== OPCIÓN A: Supabase Auth OTP (requiere Twilio configurado) =====
        // const { error } = await supabase.auth.signInWithOtp({ phone: '+54' + phone });
        // if (error) { alert('Error enviando SMS: ' + error.message); return; }
        
        // ===== OPCIÓN B: Modo desarrollo (sin SMS) =====
        this.devCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔑 CÓDIGO DEV:', this.devCode);
        alert('Modo desarrollo — Tu código es: ' + this.devCode);
        
        VV.utils.showScreen('verify-code-screen');
        document.getElementById('verify-code')?.focus();
    },
    
    async verifyAndRegister() {
        const inputCode = document.getElementById('verify-code')?.value.trim();
        if (!inputCode || inputCode.length !== 6) return alert('Ingresá el código de 6 dígitos');
        
        // Validar código (en dev comparamos con devCode; en prod usar supabase.auth.verifyOtp)
        if (this.devCode && inputCode !== this.devCode) {
            alert('Código incorrecto');
            return;
        }
        
        try {
            // Generar email ficticio (Supabase Auth requiere email)
            const fakeEmail = `u${this.tempData.phone.replace(/\D/g,'')}@vv.app`;
            const fakePassword = crypto.randomUUID();
            
            // 1. Crear auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: fakeEmail,
                password: fakePassword,
                options: { data: { phone: this.tempData.phone } }
            });
            
            if (authError) throw authError;
            
            // 2. Generar número único
            const uniqueNumber = await VV.auth.generateUniqueNumber(this.tempData.neighborhood);
            
            // 3. Insertar en tabla users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: fakeEmail,
                    name: this.tempData.name,
                    phone: this.tempData.phone,
                    neighborhood: this.tempData.neighborhood,
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
            
            // 4. Guardar sesión local
            VV.data.user = userData;
            VV.data.neighborhood = userData.neighborhood;
            
            VV.utils.showSuccess(`¡Bienvenido, ${userData.name}! Tu número es #${uniqueNumber}`);
            
            setTimeout(() => {
                VV.auth.startApp();
            }, 1500);
            
        } catch (error) {
            console.error('Error en registro:', error);
            alert('Error al crear la cuenta: ' + error.message);
        }
    },
    
    // Login rápido para usuarios con celular (futuro)
    async loginWithPhone() {
        // Implementar si querés login sin password en el futuro
    }
};

console.log('✅ Módulo AUTH-CELULAR cargado');
