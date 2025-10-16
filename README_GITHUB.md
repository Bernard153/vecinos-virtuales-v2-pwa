# 🏘️ Vecinos Virtuales

**Red Social para Comunidades Barriales**

[![Version](https://img.shields.io/badge/version-2.1-blue.svg)](https://github.com/tuusuario/vecinos-virtuales)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE.txt)
[![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)](https://web.dev/progressive-web-apps/)

---

## 📋 Descripción

Vecinos Virtuales es una Progressive Web App (PWA) diseñada para fortalecer la comunicación y el comercio dentro de comunidades barriales. Permite a los vecinos conectarse, comprar/vender productos locales, proponer mejoras comunitarias y mantenerse informados sobre eventos y alertas del barrio.

## ✨ Características Principales

### 🛒 Marketplace
- Compra y venta entre vecinos
- Comparador de precios automático
- Autocompletado de productos
- Agenda de compras

### 🏘️ Mejoras Comunitarias
- Proponer mejoras para el barrio
- Sistema de votación
- Seguimiento de estado
- Comentarios y discusión

### 🗺️ Mapa Interactivo
- 5 capas de información
- Alertas de seguridad
- Eventos y cortes
- Comercios locales
- Servicios de emergencia

### 🎨 Muro Cultural
- Publicaciones de eventos
- Actividades culturales
- Galería de fotos
- Interacción comunitaria

### 💼 Servicios Profesionales
- Directorio de profesionales locales
- Calificaciones y reseñas
- Contacto directo

### 📢 Sistema de Anunciantes
- Banners para comercios locales
- 3 niveles (Premium, Gold, Silver)
- Segmentación por barrio

### 🎁 Sorteos
- Sistema de sorteos comunitarios
- Selección aleatoria de ganadores
- Historial de sorteos

## 🚀 Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Mapas:** Leaflet.js
- **Hosting:** Netlify
- **PWA:** Service Worker, Web Manifest

## 📱 Progressive Web App

Vecinos Virtuales es una PWA completamente funcional:

- ✅ Instalable en dispositivos móviles
- ✅ Funciona offline
- ✅ Notificaciones push (próximamente)
- ✅ Experiencia nativa
- ✅ Actualizaciones automáticas

## 🛡️ Seguridad

- Encriptación HTTPS
- Autenticación segura (JWT)
- Row Level Security (RLS)
- Sanitización de inputs
- Protección contra XSS
- Protección contra SQL Injection

## 📄 Documentación

- [Guía de Lanzamiento](LANZAMIENTO_FINAL.md)
- [Aspectos Legales](docs/ASPECTOS_LEGALES.md)
- [Seguridad](docs/SEGURIDAD.md)
- [Licencia](LICENSE.txt)
- [Copyright](COPYRIGHT.txt)

## 🏗️ Estructura del Proyecto

```
Vecinos-Virtuales-V2/
├── index.html              # Página principal
├── css/
│   └── styles.css         # Estilos globales
├── js/
│   ├── core.js           # Módulo principal
│   ├── auth-supabase.js  # Autenticación
│   ├── marketplace.js    # Marketplace
│   ├── improvements.js   # Mejoras
│   ├── cultural.js       # Muro cultural
│   ├── services.js       # Servicios
│   ├── map.js           # Mapa interactivo
│   ├── admin.js         # Panel admin
│   ├── moderator.js     # Moderación
│   └── raffle.js        # Sorteos
├── images/              # Recursos gráficos
├── docs/               # Documentación
├── manifest.json       # PWA Manifest
├── service-worker.js   # Service Worker
├── LICENSE.txt         # Licencia
└── COPYRIGHT.txt       # Derechos de autor
```

## 🚀 Instalación y Uso

### Requisitos Previos

1. Cuenta en [Supabase](https://supabase.com)
2. Cuenta en [Netlify](https://netlify.com) (opcional)

### Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tuusuario/vecinos-virtuales.git
   cd vecinos-virtuales
   ```

2. **Configurar Supabase:**
   - Crear proyecto en Supabase
   - Ejecutar scripts SQL (ver `docs/`)
   - Copiar URL y API Key
   - Actualizar en `js/supabase-config.js`

3. **Deploy:**
   - Subir a Netlify (drag & drop)
   - O usar cualquier hosting estático

## 🔧 Configuración de Supabase

### Tablas Necesarias:

- `users` - Usuarios registrados
- `products` - Productos del marketplace
- `services` - Servicios profesionales
- `improvements` - Mejoras propuestas
- `cultural_posts` - Publicaciones culturales
- `sponsors` - Anunciantes
- `community_alerts` - Alertas del mapa
- `raffles` - Sorteos

### Row Level Security (RLS):

Todas las tablas tienen RLS activo para proteger los datos de los usuarios.

## 👥 Roles de Usuario

- **Usuario:** Acceso básico a todas las funcionalidades
- **Moderador:** Puede eliminar contenido inapropiado
- **Admin:** Acceso completo al panel de administración

## 📊 Estado del Proyecto

- **Versión:** 2.1 PWA
- **Estado:** Producción
- **Última actualización:** Octubre 2025
- **Mantenimiento:** Activo

## 🤝 Contribuciones

Este es un proyecto propietario. No se aceptan contribuciones externas sin autorización previa.

Para consultas sobre licenciamiento o colaboración:
- Email: [tu_email]

## 📜 Licencia

Copyright © 2025 Oscar [Apellido]. Todos los derechos reservados.

Este software es propietario y está protegido por las leyes de propiedad intelectual de Argentina y tratados internacionales. Ver [LICENSE.txt](LICENSE.txt) para más detalles.

## 🙏 Agradecimientos

- Comunidad de [Tu Barrio]
- [Leaflet.js](https://leafletjs.com/) - Mapas interactivos
- [Font Awesome](https://fontawesome.com/) - Iconos
- [Supabase](https://supabase.com/) - Backend as a Service
- [Netlify](https://netlify.com/) - Hosting

## 📞 Contacto

- **Email:** [tu_email]
- **Web:** [tu_url_netlify]
- **Ubicación:** [Tu Ciudad], Argentina

---

**Creado con ❤️ para fortalecer la comunidad**

© 2025 Vecinos Virtuales. Todos los derechos reservados.
