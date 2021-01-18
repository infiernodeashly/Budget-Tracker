// precaching layouts and data for offline work. 
const PreCacheFiles = [
  "/",
  "/index.html",
  "/index.js",
  "db.js",
  "styles.css",
  "/manifest.webmanifest",
];

// defining caches for layout and data
const CACHE_NAME = "static-cache-v14";
const DATA_CACHE_NAME = "data-cache-v13";

//---
// install
self.addEventListener("install", function (evt) {
  //waiting on the install until the files are successfully precached. 
  evt.waitUntil(
    //Open layout cache and send message to console that it was precached successfully. 
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your files were precached successfully! Whoohoo!");
      //Returned all precached files from above. 
      return cache.addAll(PreCacheFiles);
    })
  );
    //installed service worker skips waiting and moves directly to activating status so it doesn't get stuck waiting forever to become active. 
  self.skipWaiting();
});
//---

// activate
self.addEventListener("activate", function (evt) {
  //wait to activate until all old unused caches are cleaned up. If there is cached data still available that is no longer available in the system
  //the cached data will be removed via it's key. 
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        //if the cached data and layout do not equal what is still isted in the keyList, then it will be removed from the cached lists.
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch data from API and store in cache if it is an item the user finds or if user pulls all data. 
self.addEventListener("fetch", function (evt) {
  const { url } = evt.request;
  if (url.includes("/all") || url.includes("/find")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );

    //
  } else {
    // respond from static cache, request is not for /api/* This sets up your personal response for the promise
    evt.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(evt.request).then(response => {
          return response || fetch(evt.request);
        });
      })
    );
  }
});