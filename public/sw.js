self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { clients.claim(); });
// No offline cache in MVP; push notifications for token refresh failures could go here later
