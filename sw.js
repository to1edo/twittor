const STATIC_CACHE_NAME    = 'static-V1';
const DYNAMIC_CACHE_NAME   = 'dynamic-V1';
const INMUTABLE_CACHE_NAME = 'inmutable-V1';
const CACHE_FILES_LIMIT    = 50;

const STATIC_FILES_TO_CACHE = [
  '/',
  'index.html',
  'css/style.css',
  'js/app.js',
  'img/favicon.ico',
  'img/avatars/hulk.jpg',
  'img/avatars/ironman.jpg',
  'img/avatars/spiderman.jpg',
  'img/avatars/thor.jpg',
  'img/avatars/wolverine.jpg',
]

const INMUTABLE_FILES_TO_CACHE = [
  'js/libs/jquery.js',
  'css/animate.css',
  'https://fonts.googleapis.com/css?family=Lato:400,300',
  'https://fonts.googleapis.com/css?family=Quicksand:300,400',
  'https://use.fontawesome.com/releases/v5.3.1/css/all.css'
]

const cleanCache = (cacheName, limitOfFiles = 0)=>{
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length >= limitOfFiles) {
        cache.delete(keys[0])
        cleanCache(cacheName, limitOfFiles)
      }
    })
  })
}

self.addEventListener('install', e => {
  
  const staticCache = caches.open(STATIC_CACHE_NAME).then(cache => {
    return cache.addAll(STATIC_FILES_TO_CACHE);
  })

  const inmutableCache = caches.open(INMUTABLE_CACHE_NAME).then(cache => {
    return cache.addAll(INMUTABLE_FILES_TO_CACHE);
  })

  e.waitUntil( Promise.all([staticCache, inmutableCache]) )
})


self.addEventListener('activate', e => {
  const cacheWhitelist = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, INMUTABLE_CACHE_NAME];
  e.waitUntil(
    caches.keys().then( async cacheNames => {
      const res =  cacheNames.filter(cacheName => !cacheWhitelist.includes(cacheName)).map(cacheName => caches.delete(cacheName))
      return Promise.all(res)
    })
  )
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {

      if (response) return response
      
      return fetch(e.request).then(networkResponse => {
        
        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          cache.put(e.request, networkResponse)
          cleanCache(DYNAMIC_CACHE_NAME, CACHE_FILES_LIMIT)
        })
        
        return networkResponse.clone()
      })
      .catch(() => {
        return new Response('Network error')
      })
    })
  )
})