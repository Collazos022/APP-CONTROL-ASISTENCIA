// Service Worker for ASSAM PWA eligibility
const CACHE_NAME = 'assam-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler (required for PWA installation criteria)
  event.respondWith(fetch(event.request));
});
