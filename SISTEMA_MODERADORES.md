# 🛡️ Sistema de Moderadores - Vecinos Virtuales

## 📋 Resumen del Sistema de Roles

### 👑 Administrador Global (1 único)
- **Barrio:** "Administrador" (especial)
- **Acceso:** Panel global de todo el sistema
- **Funciones:**
  - ✅ Ver usuarios de TODOS los barrios
  - ✅ Eliminar usuarios de cualquier barrio
  - ✅ **Promover/degradar moderadores**
  - ✅ Gestionar anunciantes globales
  - ✅ Configurar imagen de portada
  - ✅ Ver estadísticas globales

### 🛡️ Moderador de Barrio (varios, uno por barrio)
- **Barrio:** Pertenece a un barrio específico
- **Acceso:** Panel de moderación de SU barrio
- **Funciones:**
  - ✅ Ver usuarios de SU barrio (sin datos sensibles)
  - ✅ Eliminar usuarios problemáticos de SU barrio
  - ✅ Eliminar productos inapropiados
  - ✅ Eliminar publicaciones culturales inapropiadas
  - ✅ Ver mejoras pendientes y realizadas
  - ✅ Ver estadísticas de SU barrio
  - ❌ NO puede promover otros moderadores
  - ❌ NO puede gestionar anunciantes
  - ❌ NO puede ver otros barrios

### 👤 Usuario Normal
- **Barrio:** Pertenece a un barrio específico
- **Funciones:** Todas las funciones básicas del barrio

---

## 🔐 Protección de Datos Personales

### Datos que el Moderador NO VE:
- ❌ Email completo
- ❌ Teléfono completo
- ❌ Dirección exacta

### Datos que el Moderador SÍ VE:
- ✅ Nombre del usuario
- ✅ Número de usuario (#123456)
- ✅ Fecha de registro
- ✅ Contenido publicado (productos, cultura)

---

## 🎯 Panel de Moderación

### Tab 1: Usuarios
- Lista de usuarios del barrio
- Botón "Eliminar" para usuarios problemáticos
- Mensaje: "Los datos personales sensibles están protegidos"

### Tab 2: Contenido
**Productos:**
- Ver todos los productos del barrio
- Eliminar productos inapropiados

**Publicaciones Culturales:**
- Ver todas las publicaciones del barrio
- Eliminar contenido inapropiado

### Tab 3: Mejoras
**Pendientes:**
- Lista de mejoras no completadas
- Estado y prioridad
- Número de votos

**Realizadas:**
- Lista de mejoras completadas
- Historial del barrio

### Tab 4: Estadísticas
- 📊 Total de vecinos
- 📊 Total de productos
- 📊 Total de publicaciones culturales
- 📊 Total de mejoras propuestas

---

## 👑 Cómo Promover un Moderador (Solo Admin)

1. **Inicia sesión como Administrador**
2. Ve a **"Gestión Usuarios"**
3. Busca el usuario del barrio que quieres promover
4. Haz clic en **"Hacer Moderador"** 🛡️
5. El usuario ahora verá el menú **"Moderación"**

---

## 🛡️ Cómo Funciona el Moderador

### Al Iniciar Sesión:
1. El moderador ve su barrio normal
2. En el menú lateral aparece: **"🛡️ Moderación"**
3. Al hacer clic, accede al panel de moderación

### Funciones Principales:

#### 1. Eliminar Usuarios Problemáticos
```
Escenario: Usuario spam o comportamiento inapropiado
Acción: Moderador → Usuarios → Eliminar
Resultado: Usuario eliminado del barrio
```

#### 2. Eliminar Contenido Inapropiado
```
Escenario: Producto con contenido ofensivo
Acción: Moderador → Contenido → Productos → Eliminar
Resultado: Producto eliminado
```

#### 3. Monitorear Mejoras
```
Escenario: Ver qué mejoras están pendientes
Acción: Moderador → Mejoras → Ver pendientes
Resultado: Lista de mejoras por completar
```

#### 4. Ver Estadísticas
```
Escenario: Conocer actividad del barrio
Acción: Moderador → Estadísticas
Resultado: Números de vecinos, productos, etc.
```

---

## 🚫 Restricciones del Moderador

### NO puede:
- ❌ Ver datos personales completos (email, teléfono, dirección)
- ❌ Promover otros moderadores
- ❌ Gestionar anunciantes
- ❌ Ver contenido de otros barrios
- ❌ Configurar imagen de portada
- ❌ Acceder al panel de administración global

### SÍ puede:
- ✅ Mantener su barrio limpio y seguro
- ✅ Eliminar contenido inapropiado
- ✅ Eliminar usuarios problemáticos
- ✅ Monitorear actividad del barrio
- ✅ Ver estadísticas locales

---

## 📊 Ejemplo de Uso

### Caso 1: Usuario Spam
```
1. Usuario "Spammer123" publica 50 productos falsos
2. Vecinos reportan al moderador
3. Moderador entra a "Moderación" → "Usuarios"
4. Encuentra a "Spammer123"
5. Click en "Eliminar"
6. Usuario y todos sus productos eliminados
```

### Caso 2: Contenido Inapropiado
```
1. Usuario publica imagen ofensiva en Cultura
2. Moderador entra a "Moderación" → "Contenido"
3. Ve la publicación en "Publicaciones Culturales"
4. Click en "Eliminar Publicación"
5. Contenido removido
```

### Caso 3: Monitoreo de Mejoras
```
1. Moderador quiere ver progreso del barrio
2. Entra a "Moderación" → "Mejoras"
3. Ve:
   - 5 mejoras pendientes
   - 12 mejoras completadas
4. Puede informar a los vecinos del progreso
```

---

## 🔄 Flujo de Trabajo

### Admin:
```
1. Crea barrio "Administrador"
2. Registra como admin
3. Espera que usuarios se registren en barrios
4. Promueve 1 usuario por barrio a moderador
5. Los moderadores gestionan sus barrios
6. Admin supervisa todo desde panel global
```

### Moderador:
```
1. Usuario normal en su barrio
2. Admin lo promueve a moderador
3. Aparece menú "Moderación"
4. Gestiona contenido y usuarios de SU barrio
5. Mantiene el barrio limpio y seguro
```

---

## ⚙️ Configuración Técnica

### Archivos Modificados:
- ✅ `js/core.js` - Funciones de verificación de rol
- ✅ `js/auth.js` - Menús según rol
- ✅ `js/admin.js` - Promover/degradar moderadores
- ✅ `js/moderator.js` - Nuevo módulo completo
- ✅ `index.html` - Sección de moderación

### Roles en localStorage:
```javascript
user.role = 'admin'      // Administrador global
user.role = 'moderator'  // Moderador de barrio
user.role = 'user'       // Usuario normal
```

---

## 🎉 Beneficios del Sistema

### Para el Administrador:
- ✅ Delega responsabilidades
- ✅ Cada barrio se auto-gestiona
- ✅ Mantiene control total
- ✅ Escala a muchos barrios

### Para el Moderador:
- ✅ Cuida su comunidad
- ✅ Responde rápido a problemas
- ✅ Conoce mejor su barrio
- ✅ Rol de confianza

### Para los Usuarios:
- ✅ Barrio más seguro
- ✅ Contenido de calidad
- ✅ Respuesta rápida a problemas
- ✅ Comunidad saludable

---

## 📝 Notas Importantes

1. **Un moderador por barrio es suficiente** (puedes tener más si es necesario)
2. **Los moderadores NO ven datos sensibles** (privacidad protegida)
3. **Solo el admin puede promover moderadores** (control centralizado)
4. **Los moderadores solo ven su barrio** (aislamiento de datos)
5. **El admin ve TODO** (supervisión global)

---

## 🆘 Preguntas Frecuentes

### ¿Puede haber múltiples moderadores en un barrio?
**Sí**, el admin puede promover a varios usuarios del mismo barrio.

### ¿El moderador puede ver emails de usuarios?
**No**, solo ve nombre y número de usuario para proteger privacidad.

### ¿El moderador puede eliminar al admin?
**No**, solo puede eliminar usuarios normales de su barrio.

### ¿El moderador puede crear anunciantes?
**No**, solo el admin global puede gestionar anunciantes.

### ¿Cómo degradar a un moderador?
Admin → Gestión Usuarios → Click en "Quitar Moderador"

---

## ✅ Sistema Completo e Implementado

**Todas las funciones están operativas y listas para usar!** 🎉
