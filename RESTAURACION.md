# 🛡️ BACKUP Y RESTAURACIÓN DE SUPABASE
# Vecinos Virtuales v2 PWA

---

## 📦 CÓMO HACER EL BACKUP

### Paso 1: Backup de la estructura (schema)

1. Entrá al **SQL Editor** de Supabase
2. Abrí el archivo `backup-supabase.sql`
3. Ejecutá la **SECCIÓN 1** (estructura) y copiá el resultado
4. Guardalo en un archivo llamado `backup-schema.sql`

### Paso 2: Backup de las políticas RLS

1. En el mismo SQL Editor, ejecutá la **SECCIÓN 2** (políticas RLS)
2. Copiá el resultado
3. Guardalo en `backup-rls.sql`

### Paso 3: Backup de las funciones

1. Ejecutá la **SECCIÓN 3** (funciones)
2. Copiá el resultado
3. Guardalo en `backup-functions.sql`

### Paso 4: Backup de los datos

1. Ejecutá cada bloque de la **SECCIÓN 4** uno por uno
2. Cada bloque devuelve un JSON con todos los datos de una tabla
3. Copiá todos los resultados
4. Guardalos en `backup-datos.json`

### Paso 5: Backup de Storage

1. Ejecutá la **SECCIÓN 5** (storage buckets)
2. Copiá el resultado
3. Guardalo en `backup-storage.json`

### Paso 6: Guardar todo junto

Meté todos los archivos en una carpeta:

```
backup-vecinos-virtuales/
├── backup-schema.sql
├── backup-rls.sql
├── backup-functions.sql
├── backup-datos.json
├── backup-storage.json
└── FECHA: 2026-09-30
```

**Guardá esta carpeta en:**
- Google Drive / Dropbox / OneDrive
- Un repositorio privado en GitHub
- Tu computadora

---

## 🔄 CÓMO RESTAURAR DESDE EL BACKUP

### Escenario A: Se borraron datos de una tabla

Si se borraron datos de una tabla específica (ej: `sponsors`):

1. Abrí el `backup-datos.json`
2. Buscá la tabla que se borró
3. En el SQL Editor de Supabase, ejecutá INSERTs manuales

### Escenario B: Se borró toda la base de datos

#### Paso 1: Recrear la estructura
1. Abrí `backup-schema.sql` en el SQL Editor
2. Ejecutá todo el script para crear todas las tablas

#### Paso 2: Recrear las funciones
1. Abrí `backup-functions.sql` en el SQL Editor
2. Ejecutá todo el script

#### Paso 3: Recrear las políticas RLS
1. Abrí `backup-rls.sql` en el SQL Editor
2. Ejecutá todo el script

#### Paso 4: Restaurar los datos
1. Abrí `backup-datos.json`
2. Por cada tabla, generá y ejecutá INSERTs

#### Paso 5: Recrear los buckets de Storage
1. Andá a Storage en Supabase
2. Creá los buckets manualmente:
   - avatars (público)
   - barrio-media (público)
   - cultural (público)
   - cultural-media (público)
   - featured-images (público)
   - folleto (público)
   - folleto-images (público)
   - improvements (público)
   - improvements-photos (público)
   - karaoke-videos (público)
   - product-photos (público)
   - sponsor-images (público)

#### Paso 6: Restaurar imágenes de Storage

⚠️ Las imágenes NO se pueden restaurar desde un backup SQL.

```bash
# Instalar Supabase CLI (una sola vez)
npm install -g supabase

# Hacer login
supabase login

# Exportar archivos de Storage
supabase storage download --project-ref riuxhhipxagnreruxadv --bucket avatars ./backup-storage/avatars
supabase storage download --project-ref riuxhhipxagnreruxadv --bucket product-photos ./backup-storage/product-photos
supabase storage download --project-ref riuxhhipxagnreruxadv --bucket folleto ./backup-storage/folleto
supabase storage download --project-ref riuxhhipxagnreruxadv --bucket cultural-media ./backup-storage/cultural-media
supabase storage download --project-ref riuxhhipxagnreruxadv --bucket sponsor-images ./backup-storage/sponsor-images
supabase storage download --project-ref riuxhhipxagnreruxadv --bucket featured-images ./backup-storage/featured-images
supabase storage download --project-ref riuxhhipxagnreruxadv --bucket improvements-photos ./backup-storage/improvements-photos
supabase storage download --project-ref riuxhhipxagnreruxadv --bucket karaoke-videos ./backup-storage/karaoke-videos
```

---

## ⏰ FRECUENCIA RECOMENDADA

| Tipo | Frecuencia | Motivo |
|------|------------|--------|
| **Datos SQL** | Cada semana | Usuarios, productos, sponsors, etc. |
| **Storage** | Cada mes | Imágenes subidas |
| **Antes de cambios grandes** | Siempre | Antes de modificar RLS o estructura |
| **Supabase Pro** | Automático | Backups diarios + 7 días retención |

---

## 🚨 PLAN DE EMERGENCIA

Si Supabase se cae o se pierde todo:

1. **No entres en pánico**
2. **Verificá el estado de Supabase** en https://status.supabase.com
3. **Si es un incidente de Supabase:** esperar a que se recupere
4. **Si se borró tu proyecto:**
   a. Crear un nuevo proyecto en Supabase
   b. Ejecutar `backup-schema.sql`
   c. Ejecutar `backup-functions.sql`
   d. Ejecutar `backup-rls.sql`
   e. Restaurar datos desde `backup-datos.json`
   f. Recrear buckets de Storage
   g. Subir imágenes desde el backup de Storage
   h. Actualizar las claves de Supabase en `js/supabase-config.js`
   i. Hacer commit y push a GitHub
   j. Cloudflare Pages se actualiza automáticamente

5. **Si se rompe el código:**
   ```bash
   git log --oneline -10
   git checkout <commit-hash>
   git push origin main --force
   ```

---

## 💡 RECOMENDACIÓN FINAL

Si la app empieza a tener muchos usuarios, considerá **Supabase Pro** ($25/mes):
- ✅ Backups automáticos diarios
- ✅ 7 días de retención
- ✅ Point-in-time recovery (PITR)
- ✅ Soporte prioritario
- ✅ Sin límites de API
