// Service Worker para Vecinos Virtuales
const CACHE_NAME = 'vecinos-virtuales-v13';
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
  '/manifest.webmanifest'
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

  // Para navegación (HTML): network-first para siempre tener la versión nueva
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Para otros archivos: cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

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
  console.log('📡 Sincronizando datos...');
}

// Notificaciones Push
self.addEventListener('push', event => {
  console.log('🔔 Service Worker: Notificación push recibida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Vecinos Virtuales',
    icon: '/images/Vecinos_x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver'
      },
      {
        action: 'close',
        title: 'Cerrar'
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
