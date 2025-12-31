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

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available, notify user
                  console.log('New version available! Please refresh.');
                  // Optionally: Show a notification to the user
                  notifyUserOfUpdate();
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
  // Show notification or banner to user
  const notification = document.createElement('div');
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #10b981;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span>New version available!</span>
      <button onclick="window.location.reload()" style="
        background-color: white;
        color: #10b981;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
      ">Refresh</button>
    </div>
  `;
  document.body.appendChild(notification);

  // Auto-remove after 30 seconds
  setTimeout(() => {
    notification.remove();
  }, 30000);
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
