
const PreCacheFiles = [
  "/",
  "/index.html",
  "/index.js",
  "db.js",
  "styles.css",
  "/manifest.webmanifest",
];


const CACHE_NAME = "static-cache-v14";
const DATA_CACHE_NAME = "data-cache-v13";

// install
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your file have be pre-cached ");
      return cache.addAll(PreCacheFiles);
    })
  );

  self.skipWaiting();
});

// activate
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing cached data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch
self.addEventListener("fetch", function (event) {
  const { url } = event.request;
  if (url.includes("/all") || url.includes("/find")) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(event.request)
          .then(response => {
            // If it works then it will clone and store the data in the cache.
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }

            return response;
          })
          .catch(err => {
            // if network request fails try to pull from cache.
            return cache.match(event.request);
          });
      }).catch(err => console.log(err))
    );
  } else {
    // respond from static cache
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request);
        });
      })
    );
  }
});