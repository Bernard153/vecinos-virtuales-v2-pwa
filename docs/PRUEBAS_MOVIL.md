# 📱 Guía para Pruebas en Dispositivos Móviles

## 🚀 Método 1: Servidor Local (Recomendado)

### **Opción A: Live Server (VS Code)**

1. **Instalar extensión Live Server en VS Code**
   - Abre VS Code
   - Ve a Extensions (Ctrl + Shift + X)
   - Busca "Live Server"
   - Instala la extensión de Ritwick Dey

2. **Iniciar servidor**
   - Click derecho en `index.html`
   - Selecciona "Open with Live Server"
   - Se abrirá en `http://127.0.0.1:5500`

3. **Obtener IP de tu PC**
   - Abre PowerShell
   - Ejecuta: `ipconfig`
   - Busca "IPv4 Address" (ej: `192.168.1.100`)

4. **Conectar desde el celular**
   - Asegúrate que PC y celular estén en la misma WiFi
   - En el celular, abre el navegador
   - Ve a: `http://TU_IP:5500`
   - Ejemplo: `http://192.168.1.100:5500`

---

### **Opción B: Python HTTP Server**

1. **Abrir PowerShell en la carpeta del proyecto**
   ```powershell
   cd C:\Users\O'skar\CascadeProjects\Vecinos-Virtuales-V2
   ```

2. **Iniciar servidor Python**
   ```powershell
   python -m http.server 8000
   ```
   O si tienes Python 2:
   ```powershell
   python -m SimpleHTTPServer 8000
   ```

3. **Obtener IP de tu PC**
   ```powershell
   ipconfig
   ```
   Busca "IPv4 Address"

4. **Conectar desde el celular**
   - Mismo WiFi que la PC
   - Abre navegador en el celular
   - Ve a: `http://TU_IP:8000`

---

### **Opción C: Node.js HTTP Server**

1. **Instalar http-server globalmente**
   ```powershell
   npm install -g http-server
   ```

2. **Iniciar servidor**
   ```powershell
   cd C:\Users\O'skar\CascadeProjects\Vecinos-Virtuales-V2
   http-server -p 8080
   ```

3. **Conectar desde el celular**
   - Mismo WiFi
   - Ve a: `http://TU_IP:8080`

---

## 🌐 Método 2: Hosting Temporal (Para pruebas externas)

### **Netlify Drop (Gratis, sin cuenta)**

1. **Ir a:** https://app.netlify.com/drop
2. **Arrastrar la carpeta** del proyecto
3. **Copiar la URL** generada (ej: `https://random-name-123.netlify.app`)
4. **Abrir en el celular**

**Nota:** La URL expira después de 24 horas.

---

### **Vercel (Gratis, requiere cuenta)**

1. **Instalar Vercel CLI**
   ```powershell
   npm install -g vercel
   ```

2. **Deployar**
   ```powershell
   cd C:\Users\O'skar\CascadeProjects\Vecinos-Virtuales-V2
   vercel
   ```

3. **Seguir instrucciones** (login, configuración)
4. **Copiar URL** generada
5. **Abrir en el celular**

---

## 📋 Checklist de Pruebas en Móvil

### **✅ Funcionalidades Básicas**
- [ ] Registro de usuario
- [ ] Login
- [ ] Navegación entre secciones
- [ ] Menú hamburguesa (móvil)
- [ ] Scroll suave

### **✅ Geolocalización**
- [ ] Solicitar permisos de ubicación
- [ ] Activar geolocalización
- [ ] Detectar barrio automáticamente
- [ ] Cambiar de barrio manualmente
- [ ] Volver al barrio principal

### **✅ Mapa Interactivo**
- [ ] Cargar mapa correctamente
- [ ] Zoom con pellizco (pinch)
- [ ] Arrastrar mapa con dedo
- [ ] Click en marcadores
- [ ] Ver popups de información
- [ ] Activar/desactivar capas
- [ ] Reportar inseguridad
- [ ] Reportar corte
- [ ] Publicar evento

### **✅ Marketplace**
- [ ] Ver productos
- [ ] Filtrar por categoría
- [ ] Buscar productos
- [ ] Ver detalles de producto
- [ ] Agregar al carrito
- [ ] Ver carrito lateral
- [ ] Publicar producto
- [ ] Subir foto de producto

### **✅ Mejoras del Barrio**
- [ ] Ver mejoras
- [ ] Votar mejoras
- [ ] Proponer mejora
- [ ] Subir foto de mejora
- [ ] Ver galería de fotos

### **✅ Cultura y Deportes**
- [ ] Ver publicaciones
- [ ] Crear publicación
- [ ] Subir imagen/video
- [ ] Comentar

### **✅ Servicios**
- [ ] Ver servicios
- [ ] Publicar servicio
- [ ] Contactar proveedor

### **✅ Sorteos**
- [ ] Ver sorteos activos
- [ ] Participar en sorteo
- [ ] Ver mis participaciones

### **✅ Anunciantes**
- [ ] Ver banners
- [ ] Rotación automática
- [ ] Click en banner
- [ ] Solicitar ser anunciante

---

## 🐛 Problemas Comunes y Soluciones

### **1. No puedo acceder desde el celular**

**Problema:** `http://TU_IP:PUERTO` no carga

**Soluciones:**
- Verifica que PC y celular estén en la misma WiFi
- Desactiva el Firewall temporalmente
- Usa la IP correcta (no 127.0.0.1)
- Verifica que el servidor esté corriendo

**Permitir en Firewall de Windows:**
```powershell
# Ejecutar como Administrador
New-NetFirewallRule -DisplayName "HTTP Server" -Direction Inbound -LocalPort 5500,8000,8080 -Protocol TCP -Action Allow
```

---

### **2. Geolocalización no funciona**

**Problema:** No solicita permisos de ubicación

**Soluciones:**
- Usa HTTPS (Netlify/Vercel) o localhost
- HTTP no permite geolocalización en producción
- En Chrome móvil: Settings → Site Settings → Location → Permitir

---

### **3. El mapa no carga**

**Problema:** Mapa en blanco

**Soluciones:**
- Verifica conexión a internet
- Abre consola del navegador (Chrome móvil: chrome://inspect)
- Verifica que Leaflet.js se cargue correctamente

---

### **4. Las imágenes no cargan**

**Problema:** Imágenes de Supabase no se ven

**Soluciones:**
- Verifica que el bucket sea público
- Verifica las políticas RLS de Storage
- Revisa la URL de la imagen en consola

---

### **5. Botones muy pequeños**

**Problema:** Difícil hacer click en móvil

**Soluciones:**
- Los botones ya tienen `min-height: 44px` (estándar móvil)
- Usa el dedo pulgar para mejor precisión
- Haz zoom si es necesario

---

## 📊 Herramientas de Debug en Móvil

### **Chrome DevTools (Android)**

1. **En la PC:**
   - Abre Chrome
   - Ve a: `chrome://inspect`
   - Conecta el celular por USB
   - Activa "Depuración USB" en el celular

2. **En el celular:**
   - Abre la app en Chrome
   - Aparecerá en la PC para inspeccionar

### **Safari DevTools (iOS)**

1. **En el iPhone:**
   - Settings → Safari → Advanced → Web Inspector (ON)

2. **En la Mac:**
   - Safari → Develop → [Tu iPhone] → [La página]

### **Eruda (Console en el navegador móvil)**

Agrega esto temporalmente en `index.html` (antes de `</body>`):

```html
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

Aparecerá un botón flotante para ver la consola en el móvil.

---

## 🎯 Escenarios de Prueba Recomendados

### **Escenario 1: Usuario Nuevo**
1. Abrir app en celular
2. Registrarse con datos reales
3. Seleccionar barrio
4. Activar geolocalización
5. Explorar el mapa
6. Ver productos cercanos

### **Escenario 2: Vendedor Móvil**
1. Login como usuario existente
2. Activar geolocalización
3. Publicar producto con foto
4. Marcar como "geolocated"
5. Ver producto en el mapa
6. Moverse a otro barrio
7. Verificar que el producto se mueva

### **Escenario 3: Reporte Comunitario**
1. Login
2. Ir al mapa
3. Activar geolocalización
4. Reportar inseguridad
5. Ver el reporte en el mapa
6. Verificar que otros usuarios lo vean

### **Escenario 4: Participación Comunitaria**
1. Login
2. Ver mejoras del barrio
3. Votar por una mejora
4. Proponer nueva mejora con foto
5. Ver en la galería

---

## 📱 Navegadores Recomendados

### **Android:**
- ✅ Chrome (Recomendado)
- ✅ Firefox
- ⚠️ Samsung Internet (puede tener problemas con geolocalización)

### **iOS:**
- ✅ Safari (Recomendado)
- ✅ Chrome
- ⚠️ Firefox (limitaciones de iOS)

---

## 🔒 Consideraciones de Seguridad

### **Para Pruebas Locales:**
- ✅ Seguro en red local
- ❌ No expongas tu IP pública
- ❌ No uses en redes WiFi públicas

### **Para Producción:**
- ✅ Usa HTTPS siempre
- ✅ Configura CORS correctamente
- ✅ Valida datos del lado del servidor

---

## 📞 Comandos Rápidos

### **Obtener IP de la PC:**
```powershell
ipconfig | findstr IPv4
```

### **Verificar puerto en uso:**
```powershell
netstat -ano | findstr :5500
```

### **Matar proceso en puerto:**
```powershell
# Obtener PID del comando anterior
taskkill /PID [PID] /F
```

---

## ✅ Checklist Final

Antes de pruebas con usuarios reales:

- [ ] Todos los módulos funcionan en móvil
- [ ] Geolocalización solicita permisos correctamente
- [ ] Mapa se ve y funciona bien
- [ ] Imágenes cargan correctamente
- [ ] Formularios son fáciles de usar
- [ ] Botones tienen buen tamaño táctil
- [ ] No hay errores en consola
- [ ] Rendimiento es aceptable
- [ ] Funciona offline (PWA - futuro)

---

## 🎉 ¡Listo para Probar!

**Método más rápido:**
1. Instala Live Server en VS Code
2. Click derecho en `index.html` → "Open with Live Server"
3. Obtén tu IP: `ipconfig`
4. En el celular: `http://TU_IP:5500`

**¿Problemas?** Revisa la sección de "Problemas Comunes" arriba.
