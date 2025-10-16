# 🏘️ Vecinos Virtuales V2

**Red social hiperlocal para conectar vecinos y fortalecer comunidades**

---

## ✅ PROYECTO COMPLETO Y FUNCIONAL

Este proyecto ha sido creado desde cero con arquitectura modular. **Todas las funcionalidades están implementadas y probadas.**

---

## 🚀 Cómo usar

### **Para Usuarios Normales:**
1. **Abre `index.html`** en tu navegador (Chrome, Firefox, Edge)
2. **Permite geolocalización** o ingresa tu ubicación manualmente
3. **Selecciona tu barrio** (o crea uno nuevo)
4. **Regístrate** con tus datos
5. **¡Listo!** Ya puedes usar todas las funcionalidades

### **Para Administrador:**
1. **Abre `index.html`** en tu navegador
2. En la selección de barrios, elige **"⚙️ Administrador"** (aparece destacado en morado)
3. **Regístrate** (solo puede haber UN administrador en todo el sistema)
4. **Accede al panel de control global** con todas las funciones administrativas

### **Limpiar Datos:**
- Abre `LIMPIAR_DATOS.html` para eliminar todos los datos y empezar de cero

---

## 📦 Funcionalidades Implementadas

### ✅ Sistema de Autenticación
- Geolocalización automática con detección de barrio real
- Selección de barrios con indicador de vecinos registrados
- Crear barrios personalizados escribiendo el nombre
- Registro de usuarios con validación de email único global
- Login con email y teléfono
- **Administrador único global** (barrio especial "Administrador")
- Mensaje de bienvenida personalizado por rol

### ✅ Marketplace
- **Vender:** Publicar productos con categorías, precios, calidad
- **Comprar:** Ver todos los productos del barrio
- **Mi Agenda:** Carrito de compras funcional con cantidades decimales
- **Comparador de Precios:** Tabla comparativa de productos similares
- Filtros por categoría y búsqueda
- Editar y eliminar productos propios
- Nombre de comercio único por usuario (no modificable)
- Cálculo automático de subtotales por cantidad

### ✅ Mejoras del Barrio
- Proponer mejoras con categorías y prioridades
- Sistema de votación
- Estados: Pendiente, En Progreso, Completado

### ✅ Muro Cultural
- Compartir arte, eventos, fotografía, música
- **Upload de imágenes y videos** (almacenamiento local base64)
- Publicar texto, poesía o descripciones
- Sistema de likes
- Categorías culturales expandidas
- Visualización de multimedia integrada

### ✅ Servicios
- Ofrecer servicios profesionales
- Categorías: Plomería, Electricidad, Limpieza, etc.
- Sistema de calificación con estrellas
- Contacto directo

### ✅ Panel de Administración (Solo visible para Admin Global)
- **Vista de todos los usuarios de todos los barrios** (agrupados)
- Eliminar usuarios de cualquier barrio
- Gestión completa de anunciantes
- Solicitudes de anunciantes pendientes
- Estadísticas de banners (vistas y clics)
- Activar/pausar/eliminar anunciantes
- **Configurar imagen de portada del dashboard**
- **Subir imágenes para banners de anunciantes**
- Precios de niveles ocultos (determinados por admin)
- **Panel de control global independiente de barrios**

### ✅ Sistema de Anunciantes
- 3 niveles: Premium, Gold, Silver (sin precios visibles)
- Banner fijo al pie con 3 cuadros
- **Soporte de imágenes personalizadas** o emojis
- Tracking de vistas y clics
- Usuarios pueden solicitar ser anunciantes

### ✅ Dashboard Mejorado
- **5 módulos centrales destacados:**
  - Voy a Vender
  - Voy a Comprar
  - Mejoras
  - Cultura
  - Servicios
- Imagen de portada personalizable (solo admin)
- Diseño moderno con gradientes

---

## 📁 Estructura del Proyecto

```
Vecinos-Virtuales-V2/
├── index.html              # Página principal
├── css/
│   ├── main.css           # Estilos principales
│   ├── components.css     # Componentes reutilizables
│   └── admin.css          # Estilos de administración
├── js/
│   ├── core.js            # Sistema base y utilidades
│   ├── auth.js            # Autenticación y barrios
│   ├── marketplace.js     # Vender/Comprar
│   ├── improvements.js    # Mejoras del barrio
│   ├── cultural.js        # Muro cultural
│   ├── services.js        # Servicios
│   ├── admin.js           # Panel de administración
│   ├── banner.js          # Sistema de banners
│   └── app.js             # Inicialización
└── README.md              # Este archivo
```

---

## 🎯 Características Técnicas

### ✅ Arquitectura Modular
- Cada funcionalidad es un módulo independiente
- Si un módulo falla, no afecta a los demás
- Fácil de mantener y extender

### ✅ Almacenamiento Local
- Datos guardados en `localStorage`
- Persistencia entre sesiones
- No requiere servidor

### ✅ Responsive
- Diseño adaptable a móviles y tablets
- Menú lateral colapsable
- Touch-friendly

### ✅ UX Optimizada
- Scroll automático al cambiar secciones
- Mensajes de éxito
- Formularios modales
- Animaciones suaves

---

## 👤 Roles de Usuario

### Usuario Común (Por Barrio)
- Vender productos en su barrio
- Comprar productos de su barrio
- Proponer mejoras para su barrio
- Compartir cultura en su barrio
- Ofrecer servicios en su barrio
- Solicitar ser anunciante
- Ver solo contenido de su barrio

### Administrador Global (Único en el Sistema)
- **NO pertenece a ningún barrio específico**
- Gestionar usuarios de TODOS los barrios
- Aprobar/rechazar solicitudes de anunciantes
- Crear/editar/eliminar anunciantes
- Ver estadísticas globales de banners
- Configurar imagen de portada
- Subir imágenes para banners
- Activar/pausar/eliminar anunciantes
- **Panel de control independiente**

---

## 🔧 Personalización

### Cambiar colores
Edita las variables CSS en `css/main.css`:
```css
:root {
    --primary-blue: #2563eb;
    --primary-purple: #7c3aed;
    /* ... más colores */
}
```

### Agregar categorías
Edita los `<select>` en cada módulo JS (marketplace.js, improvements.js, etc.)

### Modificar banner
El banner siempre muestra 3 cuadros fijos. Edita `js/banner.js` para cambiar comportamiento.

---

## 🐛 Solución de Problemas

### La geolocalización no funciona
- Permite el acceso en tu navegador
- O usa "Ingresar manualmente"

### Los datos no se guardan
- Verifica que localStorage esté habilitado
- No uses modo incógnito

### El banner no aparece
- Debe haber al menos 1 anunciante activo
- O aparecerán placeholders

---

## 🎯 Mejoras Implementadas en V2.1

✅ **Geolocalización mejorada** - Detección precisa de barrio real  
✅ **Validación de emails única** - No permite duplicados entre barrios  
✅ **Nombre de comercio único** - Un solo nombre por vendedor  
✅ **Cantidades decimales** - Compra por kg, litros, etc.  
✅ **Comparador de precios** - Tabla comparativa estilo Excel  
✅ **Upload de multimedia** - Imágenes y videos en cultura  
✅ **Imágenes en banners** - Personalización completa  
✅ **Imagen de portada** - Dashboard personalizable  
✅ **Precios ocultos** - Admin determina costos  
✅ **Responsividad total** - Optimizado para móviles  

## 📱 Funcionalidades PWA (Progressive Web App)

✅ **Instalable en celular** - Como una app nativa  
✅ **Funciona offline** - Cache inteligente  
✅ **Notificaciones push** - Alertas en tiempo real  
✅ **Geolocalización** - Mapa interactivo  
✅ **Acceso rápido** - Atajos desde home screen  

## 🚀 Lanzamiento

### **Opción 1: Netlify (Recomendado)**
1. Crea cuenta en https://www.netlify.com
2. Arrastra la carpeta del proyecto
3. ¡Listo! URL: `https://tu-app.netlify.app`

### **Opción 2: Vercel**
```bash
npm install -g vercel
cd Vecinos-Virtuales-V2
vercel
```

### **Documentación Completa:**
- 📖 `docs/GUIA_LANZAMIENTO.md` - Estrategia completa
- 📱 `docs/PRUEBAS_MOVIL.md` - Testing en dispositivos
- 🗺️ `docs/MAPA_CONFIGURACION.md` - Configurar mapa

## 🎯 Próximas Mejoras Sugeridas

1. **Chat entre vecinos**
2. **Sistema de reputación**
3. **Exportar agenda de compras** (PDF)
4. **Integración con pagos**
5. **Analytics avanzado**

---

## 🎨 Créditos

**Desarrollado por:** O'skar  
**Versión:** 2.1  
**Fecha:** Octubre 2025  
**Última actualización:** 04/10/2025

---

## 📄 Licencia

Proyecto personal. Todos los derechos reservados.

---

## ✨ ¡Gracias por usar Vecinos Virtuales!

**Conecta con tu barrio. Fortalece tu comunidad.** 🏘️
