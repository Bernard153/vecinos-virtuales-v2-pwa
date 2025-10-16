# 🚀 Guía de Migración a Supabase - Vecinos Virtuales

## Paso 1: Configurar Proyecto en Supabase

### 1.1 Acceder a Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta

### 1.2 Crear Nuevo Proyecto (si no lo has hecho)
1. Click en "New Project"
2. Completa:
   - **Name**: `vecinos-virtuales`
   - **Database Password**: (Guárdala en un lugar seguro)
   - **Region**: Selecciona la más cercana (ej: South America - São Paulo)
3. Click en "Create new project"
4. Espera 2-3 minutos mientras se crea el proyecto

### 1.3 Obtener Credenciales
1. Una vez creado, ve a **Settings** (⚙️) en el menú lateral
2. Click en **API**
3. Copia y guarda:
   - **Project URL** (ej: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public key** (una clave larga que empieza con `eyJ...`)

---

## Paso 2: Ejecutar el Script SQL

### 2.1 Abrir el Editor SQL
1. En Supabase, ve a **SQL Editor** en el menú lateral
2. Click en "New query"

### 2.2 Copiar y Ejecutar el Schema
1. Abre el archivo `supabase/schema.sql`
2. Copia TODO el contenido
3. Pégalo en el editor SQL de Supabase
4. Click en **RUN** (o presiona Ctrl+Enter)
5. Espera a que termine (debería decir "Success")

### 2.3 Verificar las Tablas
1. Ve a **Table Editor** en el menú lateral
2. Deberías ver todas estas tablas:
   - ✅ users
   - ✅ products
   - ✅ services
   - ✅ cultural_posts
   - ✅ improvements
   - ✅ sponsors
   - ✅ featured_requests
   - ✅ featured_offers
   - ✅ offer_votes
   - ✅ raffles
   - ✅ announcements
   - ✅ moderator_logs

---

## Paso 3: Configurar Autenticación

### 3.1 Habilitar Email/Password
1. Ve a **Authentication** → **Providers**
2. Asegúrate que **Email** esté habilitado
3. Desactiva "Confirm email" (para desarrollo)
   - Settings → Auth → Email Auth → Desmarcar "Enable email confirmations"

### 3.2 Configurar URLs (Opcional para producción)
1. En **Authentication** → **URL Configuration**
2. Agrega tu dominio cuando lo tengas

---

## Paso 4: Configurar el Código

### 4.1 Agregar Librería de Supabase
1. Abre `index.html`
2. Agrega ANTES de todos los scripts:
```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 4.2 Configurar Credenciales
1. Abre `js/supabase-config.js`
2. Reemplaza:
   - `TU_PROJECT_URL_AQUI` → Tu Project URL
   - `TU_ANON_KEY_AQUI` → Tu anon public key

Ejemplo:
```javascript
const SUPABASE_URL = 'https://abcdefghijk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Paso 5: Crear Usuario Administrador

### 5.1 Registrar Admin en Supabase
1. Ve a **Authentication** → **Users**
2. Click en "Add user"
3. Completa:
   - **Email**: tu email de admin
   - **Password**: tu contraseña
   - **Auto Confirm User**: ✅ Marcado
4. Click en "Create user"

### 5.2 Actualizar Rol a Admin
1. Ve a **Table Editor** → **users**
2. Busca tu usuario recién creado
3. Edita el registro:
   - **name**: Tu nombre
   - **phone**: Tu teléfono
   - **neighborhood**: "Administrador"
   - **unique_number**: 1
   - **role**: "admin"
4. Guarda los cambios

---

## Paso 6: Probar la Conexión

### 6.1 Abrir la Aplicación
1. Abre `index.html` en tu navegador
2. Abre la Consola del navegador (F12)
3. Deberías ver:
   - ✅ Supabase configurado
   - ✅ Módulos cargados

### 6.2 Iniciar Sesión
1. Usa el email y contraseña del admin que creaste
2. Si todo está bien, deberías entrar al dashboard

---

## Paso 7: Migrar Datos Existentes (Opcional)

Si tienes datos en localStorage que quieres conservar:

### 7.1 Exportar desde localStorage
1. En la consola del navegador, ejecuta:
```javascript
// Exportar productos
console.log(JSON.stringify(localStorage.getItem('vecinosVirtuales_products')));

// Exportar servicios
console.log(JSON.stringify(localStorage.getItem('vecinosVirtuales_services')));

// etc...
```

### 7.2 Importar a Supabase
1. Ve a **Table Editor** en Supabase
2. Selecciona la tabla correspondiente
3. Click en "Insert" → "Insert row"
4. Pega los datos y ajusta según sea necesario

---

## ⚠️ Notas Importantes

### Seguridad
- ✅ Las credenciales `anon key` son seguras para usar en el frontend
- ✅ Row Level Security (RLS) está habilitado en todas las tablas
- ✅ Los usuarios solo pueden modificar sus propios datos
- ✅ Solo los admins pueden gestionar ciertas tablas

### Límites del Plan Gratuito
- 500 MB de base de datos
- 1 GB de almacenamiento de archivos
- 2 GB de ancho de banda
- 50,000 usuarios activos mensuales
- Suficiente para empezar y crecer

### Próximos Pasos
Una vez que todo funcione:
1. Migraremos cada módulo de localStorage a Supabase
2. Implementaremos tiempo real
3. Agregaremos Storage para imágenes
4. Optimizaremos las consultas

---

## 🆘 Solución de Problemas

### Error: "Invalid API key"
- Verifica que copiaste correctamente el `anon key`
- Asegúrate de no tener espacios extra

### Error: "relation does not exist"
- El script SQL no se ejecutó correctamente
- Vuelve a ejecutar `schema.sql` completo

### No puedo iniciar sesión
- Verifica que el usuario existe en Authentication → Users
- Verifica que tiene datos en la tabla `users`
- Verifica que el rol sea "admin"

---

## 📞 Contacto

Si tienes problemas, revisa:
1. La consola del navegador (F12)
2. Los logs de Supabase (Logs en el menú lateral)
3. La documentación: https://supabase.com/docs

---

**¡Listo! Una vez completados estos pasos, estarás listo para la migración completa del código.**
