// Service Worker para Vecinos Virtuales
const CACHE_NAME = 'vecinos-virtuales-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/config.js',
  '/js/core.js',
  '/js/auth.js',
  '/js/marketplace.js',
  '/js/improvements.js',
  '/js/cultural.js',
  '/js/services.js',
  '/js/raffle.js',
  '/js/sponsors.js',
  '/js/admin.js',
  '/js/moderator.js',
  '/js/geo.js',
  '/js/map.js',
  '/js/banner.js',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('❌ Error cacheando:', err))
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
// Interceptar peticiones
self.addEventListener('fetch', event => {
  // Ignorar peticiones a Supabase (siempre ir a la red)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  // 🚀 LIBERTAD MULTIMEDIA: Ignorar peticiones a Google y YouTube (ir directo a la red sin alterar la URL)
  if (event.request.url.includes('googleapis.com') || event.request.url.includes('youtube.com') || event.request.url.includes('youtu.be')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - devolver respuesta del cache
        if (response) {
          return response;
        }

        // Clonar la petición
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Verificar si es una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar la respuesta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(err => {
        console.error('❌ Error en fetch:', err);
        // Aquí podrías devolver una página offline personalizada
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  console.log('🔄 Service Worker: Sincronización en segundo plano');
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Aquí podrías sincronizar datos pendientes cuando vuelva la conexión
  console.log('📡 Sincronizando datos...');
}

// Notificaciones Push
self.addEventListener('push', event => {
  console.log('🔔 Service Worker: Notificación push recibida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Vecinos Virtuales',
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/images/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Vecinos Virtuales', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', event => {
  console.log('👆 Click en notificación:', event.action);
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
