# 📤 Cómo Subir Vecinos Virtuales a GitHub

## 🎯 Objetivo
Proteger tu código fuente subiéndolo a un repositorio privado en GitHub.

---

## 📋 PASO 1: Crear Cuenta en GitHub (5 min)

1. **Ve a:** https://github.com
2. **Click en "Sign up"**
3. **Completa:**
   - Email
   - Contraseña
   - Username (ej: `oscar-vecinosvirtuales`)
4. **Verifica tu email**
5. **¡Listo!** Cuenta creada

---

## 📋 PASO 2: Instalar Git (5 min)

### **Opción A: Descargar Git**
1. Ve a: https://git-scm.com/download/win
2. Descarga e instala (siguiente, siguiente, siguiente)
3. Abre PowerShell y verifica:
   ```powershell
   git --version
   ```

### **Opción B: Usar GitHub Desktop (Más fácil)**
1. Ve a: https://desktop.github.com
2. Descarga e instala
3. Inicia sesión con tu cuenta de GitHub
4. **Salta al PASO 4** (GitHub Desktop hace todo automático)

---

## 📋 PASO 3: Configurar Git (2 min)

Abre PowerShell y ejecuta:

```powershell
# Configurar tu nombre
git config --global user.name "Tu Nombre"

# Configurar tu email (el mismo de GitHub)
git config --global user.email "tu@email.com"
```

---

## 📋 PASO 4: Crear Repositorio en GitHub (3 min)

1. **Ve a:** https://github.com/new
2. **Completa:**
   - Repository name: `vecinos-virtuales`
   - Description: `Red Social para Comunidades Barriales - PWA`
   - **IMPORTANTE:** Selecciona **Private** (repositorio privado)
   - NO marques "Add a README" (ya lo tienes)
3. **Click "Create repository"**
4. **Copia la URL** que aparece (algo como: `https://github.com/tuusuario/vecinos-virtuales.git`)

---

## 📋 PASO 5: Subir tu Código (5 min)

### **Método A: Con Git (PowerShell)**

```powershell
# 1. Ir a la carpeta del proyecto
cd C:\Users\O'skar\CascadeProjects\Vecinos-Virtuales-V2

# 2. Inicializar Git
git init

# 3. Agregar todos los archivos
git add .

# 4. Hacer el primer commit
git commit -m "Versión 2.1 PWA - Lista para lanzamiento"

# 5. Conectar con GitHub (reemplaza con TU URL)
git remote add origin https://github.com/TUUSUARIO/vecinos-virtuales.git

# 6. Subir el código
git push -u origin main
```

**Si te pide usuario/contraseña:**
- Usuario: tu username de GitHub
- Contraseña: usa un **Personal Access Token** (no tu contraseña)

**Crear Personal Access Token:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Selecciona: `repo` (full control)
4. Copia el token y úsalo como contraseña

---

### **Método B: Con GitHub Desktop (Más fácil)**

1. **Abre GitHub Desktop**
2. **File → Add Local Repository**
3. **Selecciona:** `C:\Users\O'skar\CascadeProjects\Vecinos-Virtuales-V2`
4. **Click "Create a repository"** si no está inicializado
5. **Escribe un commit message:** "Versión 2.1 PWA - Lista para lanzamiento"
6. **Click "Commit to main"**
7. **Click "Publish repository"**
8. **Selecciona "Private"**
9. **Click "Publish repository"**
10. **¡Listo!**

---

## ✅ PASO 6: Verificar que Subió Correctamente

1. **Ve a:** https://github.com/TUUSUARIO/vecinos-virtuales
2. **Deberías ver:**
   - Todos tus archivos
   - LICENSE.txt
   - COPYRIGHT.txt
   - README_GITHUB.md
   - Fecha y hora del commit

---

## 🔄 PASO 7: Actualizar en el Futuro

Cada vez que hagas cambios:

### **Con Git:**
```powershell
cd C:\Users\O'skar\CascadeProjects\Vecinos-Virtuales-V2

git add .
git commit -m "Descripción de los cambios"
git push
```

### **Con GitHub Desktop:**
1. Abre GitHub Desktop
2. Verás los cambios automáticamente
3. Escribe descripción
4. Click "Commit to main"
5. Click "Push origin"

---

## 🛡️ BENEFICIOS DE TENER TU CÓDIGO EN GITHUB

✅ **Backup seguro:** Nunca perderás tu código  
✅ **Historial completo:** Puedes volver a versiones anteriores  
✅ **Prueba de autoría:** Fecha y hora registradas  
✅ **Colaboración futura:** Fácil compartir con desarrolladores  
✅ **Control de versiones:** Sabes qué cambió y cuándo  
✅ **Protección legal:** Evidencia de propiedad intelectual  

---

## ❓ PROBLEMAS COMUNES

### **"Git no es reconocido como comando"**
- Reinicia PowerShell después de instalar Git
- O usa GitHub Desktop (más fácil)

### **"Permission denied"**
- Usa Personal Access Token en vez de contraseña
- O usa GitHub Desktop (maneja autenticación automáticamente)

### **"Repository not found"**
- Verifica que la URL sea correcta
- Asegúrate de que el repo exista en GitHub

### **"Failed to push"**
- Verifica tu conexión a internet
- Intenta: `git pull origin main` primero

---

## 🎯 RECOMENDACIÓN

**USA GITHUB DESKTOP** si no estás familiarizado con Git.  
Es mucho más fácil y visual.

---

## 📞 AYUDA

Si tienes problemas, puedes:
1. Ver tutoriales en YouTube: "GitHub Desktop tutorial español"
2. Documentación oficial: https://docs.github.com
3. Pedirme ayuda específica

---

## ✅ CHECKLIST FINAL

- [ ] Cuenta de GitHub creada
- [ ] Git o GitHub Desktop instalado
- [ ] Repositorio privado creado
- [ ] Código subido correctamente
- [ ] Verificado en github.com
- [ ] URL del repo guardada

---

**¡Tu código está protegido! 🎉**

Ahora tienes:
- ✅ Backup en la nube
- ✅ Historial de cambios
- ✅ Prueba de autoría
- ✅ Control de versiones

---

Última actualización: 16/10/2025  
Versión: 2.1 PWA
