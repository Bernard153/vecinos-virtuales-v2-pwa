# 🗺️ Guía de Configuración del Mapa Interactivo

## 📋 Índice
1. [Agregar Puntos de Emergencia](#agregar-puntos-de-emergencia)
2. [Agregar Puntos de Transporte](#agregar-puntos-de-transporte)
3. [Configurar Barrios](#configurar-barrios)
4. [Cambiar Estilo del Mapa](#cambiar-estilo-del-mapa)
5. [Personalizar Colores](#personalizar-colores)

---

## 🚨 Agregar Puntos de Emergencia

**Archivo:** `js/map.js` - Línea 139

### Estructura:
```javascript
const emergencyPoints = {
    "Nombre del Barrio": [
        {
            lat: -26.8241,              // Latitud
            lng: -65.2226,              // Longitud
            name: "Comisaría Lomas",    // Nombre del lugar
            type: "police",             // Tipo: police, hospital, fire
            phone: "911",               // Teléfono
            description: "Descripción"  // Descripción breve
        }
    ]
};
```

### Tipos disponibles:
- `police` 🚔 - Comisarías
- `hospital` 🏥 - Hospitales/Centros de salud
- `fire` 🚒 - Bomberos

### Ejemplo completo:
```javascript
"Lomas de Tafí": [
    { 
        lat: -26.8241, 
        lng: -65.2226, 
        name: "Comisaría Lomas", 
        type: "police", 
        phone: "911", 
        description: "Comisaría del barrio" 
    },
    { 
        lat: -26.8250, 
        lng: -65.2200, 
        name: "Hospital Lomas", 
        type: "hospital", 
        phone: "107", 
        description: "Centro de salud" 
    },
    { 
        lat: -26.8260, 
        lng: -65.2210, 
        name: "Bomberos Lomas", 
        type: "fire", 
        phone: "100", 
        description: "Cuartel de bomberos" 
    }
]
```

---

## 🚌 Agregar Puntos de Transporte

**Archivo:** `js/map.js` - Línea 326

### Estructura:
```javascript
const transportPoints = {
    "Nombre del Barrio": [
        {
            lat: -26.8241,                      // Latitud
            lng: -65.2226,                      // Longitud
            name: "Parada Principal",           // Nombre
            type: "bus",                        // Tipo: bus, train, taxi
            description: "Av. Principal y Ruta 9",  // Ubicación
            lines: ["101", "102"],              // Líneas (opcional)
            phone: "381-4567890"                // Teléfono (opcional)
        }
    ]
};
```

### Tipos disponibles:
- `bus` 🚌 - Paradas de colectivo
- `train` 🚆 - Estaciones de tren
- `taxi` 🚕 - Remiserías/Radio taxis

### Ejemplo completo:
```javascript
"Lomas de Tafí": [
    { 
        lat: -26.8241, 
        lng: -65.2226, 
        name: "Parada Principal", 
        type: "bus", 
        description: "Av. Principal y Ruta 9", 
        lines: ["101", "102", "103"] 
    },
    { 
        lat: -26.8250, 
        lng: -65.2200, 
        name: "Estación Lomas", 
        type: "train", 
        description: "Línea Belgrano", 
        lines: ["Belgrano Norte"] 
    },
    { 
        lat: -26.8260, 
        lng: -65.2210, 
        name: "Remisería Lomas", 
        type: "taxi", 
        description: "Servicio 24hs", 
        phone: "381-4567890" 
    }
]
```

---

## 🏘️ Configurar Barrios

**Archivo:** `js/geo.js` - Línea 7

### Estructura:
```javascript
neighborhoods: {
    "Nombre del Barrio": {
        center: { lat: -26.8241, lng: -65.2226 },  // Centro del barrio
        bounds: [                                   // Límites (polígono)
            { lat: -26.8200, lng: -65.2300 },      // Punto 1 (noroeste)
            { lat: -26.8200, lng: -65.2150 },      // Punto 2 (noreste)
            { lat: -26.8280, lng: -65.2150 },      // Punto 3 (sureste)
            { lat: -26.8280, lng: -65.2300 }       // Punto 4 (suroeste)
        ]
    }
}
```

### Cómo obtener coordenadas:
1. Abre Google Maps
2. Click derecho en el punto deseado
3. Selecciona las coordenadas (se copian automáticamente)
4. Formato: `-26.8241, -65.2226`

### Ejemplo:
```javascript
"Lomas de Tafí": {
    center: { lat: -26.8241, lng: -65.2226 },
    bounds: [
        { lat: -26.8200, lng: -65.2300 },
        { lat: -26.8200, lng: -65.2150 },
        { lat: -26.8280, lng: -65.2150 },
        { lat: -26.8280, lng: -65.2300 }
    ]
}
```

---

## 🎨 Cambiar Estilo del Mapa

**Archivo:** `js/map.js` - Línea 33

### Estilos disponibles (gratuitos):

#### OpenStreetMap (Actual):
```javascript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(VV.map.mapInstance);
```

#### Estilo Oscuro:
```javascript
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CartoDB',
    maxZoom: 19
}).addTo(VV.map.mapInstance);
```

#### Estilo Claro/Minimalista:
```javascript
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CartoDB',
    maxZoom: 19
}).addTo(VV.map.mapInstance);
```

#### Estilo Voyager (Colorido):
```javascript
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CartoDB',
    maxZoom: 19
}).addTo(VV.map.mapInstance);
```

---

## 🎨 Personalizar Colores de Marcadores

### Capa 1: Comercios (Verde)
**Archivo:** `js/map.js` - Línea 97
```javascript
html: '<div style="background: #10b981; ...">'  // Verde
```

### Capa 2: Emergencias (Rojo)
**Archivo:** `js/map.js` - Línea 166
```javascript
html: '<div style="background: #ef4444; ...">'  // Rojo
```

### Capa 3: Inseguridad (Naranja)
**Archivo:** `js/map.js` - Línea 243
```javascript
html: '<div style="background: #f59e0b; ...">'  // Naranja
```

### Capa 4: Eventos (Morado/Amarillo)
**Archivo:** `js/map.js` - Línea 291
```javascript
const color = isEvent ? '#8b5cf6' : '#f59e0b';  // Morado o Amarillo
```

### Capa 5: Transporte (Celeste)
**Archivo:** `js/map.js` - Línea 356
```javascript
html: '<div style="background: #06b6d4; ...">'  // Celeste
```

### Colores recomendados:
- 🔴 Rojo: `#ef4444`
- 🟠 Naranja: `#f59e0b`
- 🟡 Amarillo: `#fbbf24`
- 🟢 Verde: `#10b981`
- 🔵 Azul: `#3b82f6`
- 🟣 Morado: `#8b5cf6`
- 🔷 Celeste: `#06b6d4`

---

## 📍 Cómo Agregar un Nuevo Barrio Completo

### Paso 1: Agregar barrio en `geo.js`
```javascript
"Mi Nuevo Barrio": {
    center: { lat: -26.8300, lng: -65.2400 },
    bounds: [
        { lat: -26.8250, lng: -65.2450 },
        { lat: -26.8250, lng: -65.2350 },
        { lat: -26.8350, lng: -65.2350 },
        { lat: -26.8350, lng: -65.2450 }
    ]
}
```

### Paso 2: Agregar puntos de emergencia en `map.js`
```javascript
"Mi Nuevo Barrio": [
    { lat: -26.8300, lng: -65.2400, name: "Comisaría", type: "police", phone: "911", description: "..." },
    { lat: -26.8310, lng: -65.2390, name: "Hospital", type: "hospital", phone: "107", description: "..." }
]
```

### Paso 3: Agregar puntos de transporte en `map.js`
```javascript
"Mi Nuevo Barrio": [
    { lat: -26.8300, lng: -65.2400, name: "Parada Central", type: "bus", description: "...", lines: ["101"] }
]
```

### Paso 4: Agregar en selector de barrios
**Archivo:** `js/geo.js` - Línea 450
```javascript
<option value="Mi Nuevo Barrio">Mi Nuevo Barrio</option>
```

---

## 🔧 Consejos Útiles

### 1. Obtener coordenadas precisas:
- Usa Google Maps
- Click derecho → Copiar coordenadas
- Formato: `lat, lng`

### 2. Definir límites del barrio:
- Dibuja un polígono con 4+ puntos
- Orden: Noroeste → Noreste → Sureste → Suroeste

### 3. Probar cambios:
- Recarga la página (Ctrl + Shift + R)
- Abre consola (F12) para ver errores
- Verifica que las coordenadas sean correctas

### 4. Zoom inicial:
**Archivo:** `js/map.js` - Línea 30
```javascript
VV.map.mapInstance = L.map('map-container').setView([lat, lng], 15);
                                                                    ^^
                                                                    Zoom (13-18 recomendado)
```

---

## 📞 Teléfonos de Emergencia (Argentina)

- 🚔 Policía: **911**
- 🚒 Bomberos: **100**
- 🏥 Emergencias médicas: **107**
- 🚨 Defensa Civil: **103**
- 👮 Policía Federal: **101**
- 🚗 Accidentes de tránsito: **911**

---

## ✅ Checklist para Agregar un Barrio

- [ ] Definir centro y límites en `geo.js`
- [ ] Agregar puntos de emergencia en `map.js`
- [ ] Agregar puntos de transporte en `map.js`
- [ ] Agregar en selector de barrios
- [ ] Probar geolocalización
- [ ] Verificar que aparezcan los marcadores
- [ ] Confirmar que los popups funcionen

---

**¿Necesitas ayuda?** Revisa la consola del navegador (F12) para ver errores.
