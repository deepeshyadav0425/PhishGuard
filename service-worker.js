'use strict';

const CACHE_NAME = 'phishguard-shell-v1';
const APP_URL = new URL('./PhishGuard_API_Free.html', self.location.href).href;
const APP_ASSETS = [
    APP_URL,
    new URL('./vendor/tailwind.cdn.js', self.location.href).href,
    new URL('./vendor/jsQR.min.js', self.location.href).href
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key.startsWith('phishguard-shell-') && key !== CACHE_NAME)
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

    event.respondWith(
        caches.match(request)
            .then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    if (response.ok) {
                        return caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, response.clone()))
                            .then(() => response);
                    }
                    return response;
                });
            })
            .catch(error => {
                if (request.mode === 'navigate') {
                    return caches.match(APP_URL).then(cached => cached || Promise.reject(error));
                }
                return Promise.reject(error);
            })
    );
});
