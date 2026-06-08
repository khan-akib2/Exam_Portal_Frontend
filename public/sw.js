// Empty service worker to prevent 404 errors in development
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  // Clear any old caches or clients if needed
});
