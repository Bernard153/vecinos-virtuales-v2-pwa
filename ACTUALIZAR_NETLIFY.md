# 🔄 ACTUALIZAR VECINOS-VIRTUALES.NETLIFY.APP

## ✅ OPCIÓN 1: Actualizar Sitio Existente (RECOMENDADO)

### Pasos:

1. **Inicia sesión en Netlify**
   - Ve a: https://app.netlify.com
   - Inicia sesión con tu cuenta

2. **Encuentra tu sitio**
   - Busca: `vecinos-virtuales`
   - Click en el sitio

3. **Ve a la pestaña "Deploys"**
   - Click en "Deploys" en el menú superior

4. **Arrastra el nuevo ZIP**
   - Arrastra `Vecinos-Virtuales-V2_DEPLOY.zip`
   - A la zona que dice "Need to update your site? Drag and drop your site output folder here"
   - O click en "Deploy manually"

5. **Espera el deploy**
   - Tarda ~30 segundos
   - Verás "Site is live" cuando termine

6. **Verifica**
   - Abre: https://vecinos-virtuales.netlify.app
   - ¡Debería mostrar la nueva versión!

---

## ⚠️ IMPORTANTE ANTES DE ACTUALIZAR

### Los datos actuales se perderán porque:
- localStorage es del navegador, no del servidor
- Al actualizar el código, el localStorage de los usuarios sigue intacto
- PERO si alguien limpia cache, pierde todo

### Recomendación:
1. Avisa a usuarios actuales (si los hay)
2. O simplemente actualiza (es versión de testing)

---

## 🆕 OPCIÓN 2: Crear Nuevo Sitio (Para Comparar)

Si quieres mantener la versión anterior y crear una nueva:

1. **Ve a Netlify Dashboard**
   - https://app.netlify.com

2. **Click "Add new site"**
   - → "Deploy manually"

3. **Arrastra el ZIP**
   - `Vecinos-Virtuales-V2_DEPLOY.zip`

4. **Obtén nueva URL**
   - Ejemplo: `vecinos-virtuales-v2.netlify.app`

5. **Cambia el nombre (opcional)**
   - Site settings → Change site name
   - Ejemplo: `vecinos-virtuales-v2`

---

## 🔧 CONFIGURACIÓN RECOMENDADA EN NETLIFY

### Después de actualizar:

1. **Site settings → General**
   - Site name: `vecinos-virtuales`
   - Custom domain (si tienes): tu-dominio.com

2. **Build & deploy → Deploy settings**
   - Build command: (dejar vacío)
   - Publish directory: `/`

3. **Domain management → HTTPS**
   - Verificar que esté activado ✅

4. **Asset optimization** (Opcional)
   - Pretty URLs: ON
   - Bundle CSS: ON
   - Minify CSS: ON
   - Minify JS: ON
   - Compress images: ON

---

## 📊 DIFERENCIAS ENTRE V1 Y V2

### Nueva Versión (V2) incluye:

✅ Sistema de moderadores de barrio
✅ Panel de administrador global mejorado
✅ Logs de actividad de moderadores
✅ Banners desplegables (modo folleto)
✅ Búsqueda de productos (no muestra todos por defecto)
✅ Subtotal en tiempo real
✅ Total visible en carrito (arriba en verde)
✅ Búsqueda de servicios
✅ Moderador puede marcar mejoras como realizadas
✅ Términos y condiciones obligatorios
✅ Protección legal completa
✅ Anunciantes por barrio específico
✅ Vista de productos/mejoras/servicios por barrio (admin)

---

## 🧪 TESTING POST-ACTUALIZACIÓN

### Checklist:

```
✅ Abre https://vecinos-virtuales.netlify.app
✅ Acepta términos y condiciones (nueva pantalla)
✅ Crea cuenta de administrador
✅ Verifica que todas las secciones cargan
✅ Prueba crear producto
✅ Prueba agregar al carrito
✅ Verifica que el total se ve (arriba en verde)
✅ Prueba banners (botón flotante morado)
✅ Prueba modo desplegado de banners
```

---

## 🔄 ROLLBACK (Si algo sale mal)

Si necesitas volver a la versión anterior:

1. **Ve a Deploys**
2. **Encuentra el deploy anterior**
   - Verás lista de todos los deploys
3. **Click en el deploy anterior**
4. **Click "Publish deploy"**
5. ¡Vuelve a la versión anterior!

Netlify guarda TODOS los deploys históricos.

---

## 📱 COMPARTIR LA NUEVA VERSIÓN

### Mensaje para testers:

```
¡Hola!

He actualizado Vecinos Virtuales con muchas mejoras:

🔗 https://vecinos-virtuales.netlify.app

NOVEDADES:
✅ Sistema de moderadores
✅ Banners desplegables
✅ Búsqueda mejorada
✅ Carrito optimizado
✅ Panel de admin mejorado

Por favor:
1. Crea una cuenta nueva
2. Prueba las funciones
3. Reporta cualquier bug

¡Gracias!
```

---

## 💡 TIPS

### 1. Deploy Automático (Futuro)
Si quieres deploys automáticos:
- Conecta con GitHub
- Cada push = deploy automático

### 2. Preview Deploys
Netlify crea previews automáticos de cada cambio

### 3. Forms (Si necesitas)
Netlify tiene forms gratuitos integrados

### 4. Functions (Futuro)
Puedes agregar serverless functions

---

## ⚠️ RECORDATORIO

### localStorage:
- Cada usuario mantiene sus datos en SU navegador
- NO se sincronizan entre dispositivos
- NO se sincronizan entre navegadores
- Para producción real → Backend necesario

---

## ✅ SIGUIENTE PASO

**AHORA:**

1. Ve a: https://app.netlify.com
2. Encuentra: vecinos-virtuales
3. Click: Deploys
4. Arrastra: Vecinos-Virtuales-V2_DEPLOY.zip
5. Espera: 30 segundos
6. ¡Listo!

URL: https://vecinos-virtuales.netlify.app

---

**¡ACTUALIZACIÓN LISTA EN 2 MINUTOS!** 🚀
