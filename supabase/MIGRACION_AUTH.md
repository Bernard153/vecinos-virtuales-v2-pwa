# 🔐 Migración del Módulo de Autenticación a Supabase

## ✅ Estado Actual
- Respaldo creado: `auth.js.backup`
- Conexión a Supabase funcionando
- Usuario admin creado en Supabase

## 🎯 Cambios Principales

### **De localStorage a Supabase:**

**ANTES (localStorage):**
- Usuarios guardados en: `localStorage.getItem('vecinosVirtualesUser')`
- Cada navegador tiene sus propios datos
- No hay sincronización entre dispositivos

**DESPUÉS (Supabase):**
- Usuarios en base de datos PostgreSQL
- Autenticación con Supabase Auth
- Datos compartidos entre todos los usuarios
- Sincronización automática

## 📋 Funciones a Migrar

### 1. **Registro de Usuario**
```javascript
// ANTES: localStorage
register() {
    const user = { id, email, name, ... };
    localStorage.setItem('user_id', JSON.stringify(user));
}

// DESPUÉS: Supabase
async register() {
    // 1. Crear usuario en Auth
    const { data: authData } = await supabase.auth.signUp({
        email, password
    });
    
    // 2. Crear registro en tabla users
    await supabase.from('users').insert({
        id: authData.user.id,
        email, name, phone, neighborhood, ...
    });
}
```

### 2. **Login**
```javascript
// ANTES: localStorage
login() {
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.email === email);
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// DESPUÉS: Supabase
async login() {
    // 1. Autenticar con Supabase
    const { data } = await supabase.auth.signInWithPassword({
        email, password
    });
    
    // 2. Obtener datos del usuario
    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
    
    VV.data.user = userData;
}
```

### 3. **Logout**
```javascript
// ANTES: localStorage
logout() {
    localStorage.removeItem('currentUser');
}

// DESPUÉS: Supabase
async logout() {
    await supabase.auth.signOut();
    VV.data.user = null;
}
```

### 4. **Verificar Sesión**
```javascript
// ANTES: localStorage
checkSession() {
    return localStorage.getItem('currentUser') !== null;
}

// DESPUÉS: Supabase
async checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        // Obtener datos del usuario
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
        VV.data.user = userData;
        return true;
    }
    return false;
}
```

## 🔧 Implementación

Voy a modificar el archivo `auth.js` para usar Supabase manteniendo TODAS las funcionalidades actuales:

- ✅ Geolocalización
- ✅ Selección de barrio
- ✅ Registro de usuarios
- ✅ Login
- ✅ Roles (admin, moderator, user)
- ✅ Números únicos por barrio
- ✅ Validaciones

## ⚠️ Importante

Durante la migración:
1. La aplicación seguirá funcionando
2. Los usuarios existentes en localStorage NO se migrarán automáticamente
3. Necesitarás registrarte de nuevo (o crear usuarios manualmente)
4. Una vez migrado, TODOS los usuarios compartirán la misma base de datos

## 🚀 Próximos Pasos

1. Migrar `auth.js` completo
2. Probar registro
3. Probar login
4. Probar logout
5. Verificar roles
6. Continuar con siguiente módulo

---

**¿Procedo con la migración del código?**
