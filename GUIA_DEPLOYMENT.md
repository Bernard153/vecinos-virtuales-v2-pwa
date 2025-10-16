# 🚀 GUÍA DE DEPLOYMENT - VECINOS VIRTUALES V2

**Versión:** 2.2  
**Fecha:** 05 de Octubre de 2025

---

## 📋 REQUISITOS DEL SERVIDOR

### Mínimos:
- ✅ Servidor web (Apache, Nginx, o hosting compartido)
- ✅ Soporte para HTML5, CSS3, JavaScript
- ✅ HTTPS (recomendado)
- ✅ Espacio: 5 MB mínimo

### Recomendados:
- ✅ PHP 7.4+ (para futuras mejoras)
- ✅ MySQL/PostgreSQL (para backend futuro)
- ✅ SSL Certificate (Let's Encrypt gratuito)
- ✅ CDN (Cloudflare gratuito)

---

## 📦 ARCHIVOS A SUBIR

### ✅ Archivos Esenciales (OBLIGATORIOS):

```
Vecinos-Virtuales-V2/
├── index.html                    ← OBLIGATORIO
├── terminos.html                 ← OBLIGATORIO
├── LIMPIAR_DATOS.html           ← OPCIONAL (útil para testing)
├── .htaccess                     ← OBLIGATORIO (Apache)
├── css/
│   ├── main.css                  ← OBLIGATORIO
│   ├── admin.css                 ← OBLIGATORIO
│   └── components.css            ← OBLIGATORIO
└── js/
    ├── app.js                    ← OBLIGATORIO
    ├── core.js                   ← OBLIGATORIO
    ├── auth.js                   ← OBLIGATORIO
    ├── admin.js                  ← OBLIGATORIO
    ├── moderator.js              ← OBLIGATORIO
    ├── marketplace.js            ← OBLIGATORIO
    ├── improvements.js           ← OBLIGATORIO
    ├── cultural.js               ← OBLIGATORIO
    ├── services.js               ← OBLIGATORIO
    └── banner.js                 ← OBLIGATORIO
```

### ❌ Archivos a NO Subir:

```
❌ *.bat                    (Scripts de Windows)
❌ backup_exclude.txt       (Configuración local)
❌ CREAR_BACKUP.bat        (Script local)
❌ *.md (excepto README)   (Documentación interna)
❌ .git/                   (Control de versiones)
❌ node_modules/           (Si existen)
```

---

## 🌐 OPCIONES DE HOSTING

### 1. **Hosting Gratuito** (Para Testing)

#### **Netlify** ⭐ RECOMENDADO
- 🆓 Gratis
- ✅ HTTPS automático
- ✅ Deploy con drag & drop
- ✅ URL personalizada
- 📍 https://www.netlify.com

**Pasos:**
```
1. Crea cuenta en Netlify
2. Click "Add new site" → "Deploy manually"
3. Arrastra la carpeta del proyecto
4. ¡Listo! URL: https://tu-proyecto.netlify.app
```

#### **Vercel**
- 🆓 Gratis
- ✅ HTTPS automático
- ✅ Deploy rápido
- 📍 https://vercel.com

#### **GitHub Pages**
- 🆓 Gratis
- ✅ HTTPS automático
- ⚠️ Requiere repositorio público
- 📍 https://pages.github.com

#### **Render**
- 🆓 Gratis
- ✅ HTTPS automático
- ✅ Fácil configuración
- 📍 https://render.com

### 2. **Hosting Pago** (Para Producción)

#### **Hostinger**
- 💰 ~$2-5/mes
- ✅ cPanel
- ✅ SSL gratis
- ✅ Dominio incluido
- 📍 https://www.hostinger.com

#### **SiteGround**
- 💰 ~$3-7/mes
- ✅ Excelente soporte
- ✅ SSL gratis
- ✅ Backups automáticos
- 📍 https://www.siteground.com

#### **DigitalOcean**
- 💰 ~$5/mes
- ✅ VPS completo
- ✅ Control total
- ⚠️ Requiere conocimientos técnicos
- 📍 https://www.digitalocean.com

---

## 📤 MÉTODOS DE SUBIDA

### Método 1: FTP/SFTP (Hosting Tradicional)

**Herramientas:**
- FileZilla (Gratis): https://filezilla-project.org
- WinSCP (Gratis): https://winscp.net

**Pasos:**
```
1. Abre FileZilla
2. Conecta con credenciales del hosting:
   - Host: ftp.tudominio.com
   - Usuario: tu_usuario
   - Contraseña: tu_contraseña
   - Puerto: 21 (FTP) o 22 (SFTP)
3. Navega a public_html/ o www/
4. Sube todos los archivos esenciales
5. Verifica permisos (755 para carpetas, 644 para archivos)
```

### Método 2: Drag & Drop (Netlify/Vercel)

**Pasos:**
```
1. Comprime la carpeta en ZIP (solo archivos esenciales)
2. Ve a Netlify.com
3. Arrastra el ZIP a la zona de deploy
4. Espera 30 segundos
5. ¡Listo!
```

### Método 3: Git Deploy (GitHub Pages/Vercel)

**Pasos:**
```bash
# 1. Inicializar repositorio
git init
git add .
git commit -m "Initial commit"

# 2. Crear repo en GitHub
# (Desde GitHub.com → New Repository)

# 3. Subir código
git remote add origin https://github.com/tu-usuario/vecinos-virtuales.git
git push -u origin main

# 4. Activar GitHub Pages
# Settings → Pages → Source: main branch
```

---

## ⚙️ CONFIGURACIÓN POST-DEPLOYMENT

### 1. Verificar Funcionamiento

**Checklist:**
```
✅ index.html carga correctamente
✅ Términos y condiciones funcionan
✅ CSS se aplica (colores, diseño)
✅ JavaScript funciona (consola sin errores)
✅ localStorage funciona
✅ Geolocalización funciona (HTTPS requerido)
✅ Registro de usuarios funciona
✅ Login funciona
✅ Todas las secciones cargan
```

### 2. Probar en Dispositivos

```
✅ Desktop (Chrome, Firefox, Edge)
✅ Móvil (Chrome Android, Safari iOS)
✅ Tablet
✅ Diferentes resoluciones
```

### 3. Optimizaciones

#### **Minificar CSS/JS** (Opcional)
```bash
# Usar herramientas online:
# - https://www.minifier.org
# - https://cssminifier.com
# - https://javascript-minifier.com
```

#### **Optimizar Imágenes** (Si agregas)
```bash
# Usar herramientas online:
# - https://tinypng.com
# - https://squoosh.app
```

#### **Habilitar Cloudflare** (Gratis)
```
1. Registra dominio en Cloudflare
2. Cambia DNS del dominio
3. Activa:
   - SSL/TLS (Full)
   - Auto Minify (CSS, JS, HTML)
   - Brotli compression
   - Cache Level: Standard
```

---

## 🔒 SEGURIDAD

### Configuración Recomendada:

#### **1. HTTPS Obligatorio**
```apache
# En .htaccess (ya incluido)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

#### **2. Headers de Seguridad**
```apache
# Ya incluido en .htaccess
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

#### **3. Proteger Archivos**
```apache
# Ya incluido en .htaccess
# Bloquea acceso a .md, .bat, .txt
```

---

## 🧪 TESTING EN PRODUCCIÓN

### 1. Crear Usuarios de Prueba

```
Admin:
- Barrio: Administrador
- Email: admin@test.com
- Teléfono: 1111111111

Moderador:
- Barrio: Palermo
- Email: mod@test.com
- Teléfono: 2222222222

Usuario:
- Barrio: Palermo
- Email: user@test.com
- Teléfono: 3333333333
```

### 2. Probar Flujos Completos

```
✅ Registro → Login → Publicar producto → Comprar
✅ Proponer mejora → Votar → Moderador marca realizada
✅ Publicar cultura → Dar like
✅ Ofrecer servicio → Buscar servicio
✅ Admin → Promover moderador → Ver logs
✅ Banners → Modo desplegado
```

---

## 📊 MONITOREO

### Google Analytics (Opcional)

```html
<!-- Agregar antes de </head> en index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Herramientas de Monitoreo:

- **UptimeRobot** (Gratis): Monitorea si el sitio está online
- **Google Search Console**: SEO y errores
- **Hotjar** (Gratis): Heatmaps y grabaciones

---

## 🌍 COMPARTIR PARA TESTING

### Opción 1: URL Pública (Netlify)

```
1. Sube a Netlify
2. Obtén URL: https://vecinos-virtuales.netlify.app
3. Comparte la URL con testers
4. Pídeles que:
   - Creen cuentas en diferentes barrios
   - Prueben todas las funciones
   - Reporten bugs
```

### Opción 2: Dominio Personalizado

```
1. Compra dominio (ej: vecinosvirtuales.com)
2. Configura DNS en Netlify/Vercel
3. Espera propagación (24-48h)
4. Comparte: https://vecinosvirtuales.com
```

### Opción 3: Subdominio

```
Si tienes dominio existente:
1. Crea subdominio: app.tudominio.com
2. Apunta a servidor/Netlify
3. Comparte: https://app.tudominio.com
```

---

## ⚠️ LIMITACIONES ACTUALES

### localStorage:
- ❌ No sincroniza entre dispositivos
- ❌ No sincroniza entre navegadores
- ❌ Se borra si usuario limpia cache
- ❌ Límite de 5-10 MB

### Solución:
```
Para testing: Está bien
Para producción: Implementar backend
```

---

## 🚀 DEPLOY RÁPIDO (5 MINUTOS)

### Netlify Drop (MÁS RÁPIDO):

```
1. Ve a: https://app.netlify.com/drop
2. Arrastra carpeta del proyecto
3. Espera 30 segundos
4. Copia URL
5. ¡Comparte!
```

### Vercel CLI:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd Vecinos-Virtuales-V2
vercel

# Seguir instrucciones
# URL lista en 1 minuto
```

---

## 📝 CHECKLIST PRE-DEPLOYMENT

```
✅ Backup creado
✅ Todos los archivos esenciales listos
✅ .htaccess configurado
✅ Console.logs eliminados (opcional)
✅ Términos y condiciones actualizados
✅ README.md actualizado
✅ Probado localmente
✅ Hosting seleccionado
✅ Dominio listo (opcional)
✅ Plan de testing definido
```

---

## 🆘 TROUBLESHOOTING

### Problema: CSS no carga
```
Solución: Verificar rutas en index.html
<link rel="stylesheet" href="css/main.css">
(no /css/main.css si está en raíz)
```

### Problema: JavaScript no funciona
```
Solución: Abrir consola (F12)
Ver errores
Verificar rutas de archivos .js
```

### Problema: localStorage no funciona
```
Solución: Verificar HTTPS
localStorage requiere origen seguro
```

### Problema: Geolocalización no funciona
```
Solución: HTTPS obligatorio
Navegadores bloquean geolocation en HTTP
```

---

## 📞 SOPORTE

### Recursos:
- **Netlify Docs**: https://docs.netlify.com
- **Vercel Docs**: https://vercel.com/docs
- **MDN Web Docs**: https://developer.mozilla.org

---

## ✅ SIGUIENTE PASO

**RECOMENDACIÓN:**

```
1. Sube a Netlify (5 minutos)
2. Obtén URL pública
3. Comparte con 3-5 testers
4. Recopila feedback
5. Corrige bugs
6. Decide si implementar backend
```

---

**¡LISTO PARA DEPLOYMENT!** 🚀

El proyecto está optimizado y preparado para subir a producción.
