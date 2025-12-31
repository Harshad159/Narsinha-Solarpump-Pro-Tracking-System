/// <reference types="vite/client" />

// Service Worker Registration and Update Logic
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Listen for updates - silently update without notifying user
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available - update silently in background
                  console.log('New version available and cached silently.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          console.log('Updating to new version...');
          window.location.reload();
        }
      });
    });
  } else {
    console.log('Service Worker not supported in this browser');
  }
}

function notifyUserOfUpdate() {
  // Notification disabled - updates now happen silently in background
}

// Export function to check if app is online
export function isOnline() {
  return navigator.onLine;
}

// Listen to online/offline events
export function setupOnlineStatusListener(callback: (isOnline: boolean) => void) {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
}
