# PWA Setup Guide

This project is now configured as a Progressive Web App (PWA). Here's what has been set up:

## What's Included

### 1. **Web App Manifest** (`public/manifest.json`)
- App metadata (name, description, theme colors)
- App icons for different sizes (192x192, 512x512, and SVG)
- Display mode set to `standalone` (looks like a native app)
- Shortcuts for quick access to Dashboard and Dispatch pages
- Support for maskable icons (modern Android devices)

### 2. **Service Worker** (`public/service-worker.js`)
- Caches essential files on first load
- Enables offline functionality
- Network-first strategy for navigation requests
- Cache-first strategy for static assets
- Auto-updates service worker in the background
- Handles message passing for update notifications

### 3. **Service Worker Registration** (`utils/serviceWorkerRegister.ts`)
- Registers the service worker automatically
- Checks for updates every minute
- Notifies users when new versions are available
- Provides utility functions for online/offline status
- Shows update notification banner

### 4. **HTML Meta Tags** (`index.html`)
- `manifest.json` link
- Apple mobile web app capabilities
- Theme colors and app title
- Icons for iOS/Android

### 5. **Vite PWA Configuration** (`vite.config.ts`)
- Automatic service worker generation with Workbox
- Smart caching strategies
- Runtime caching for API calls and CDN resources
- Automatic cleanup of old caches

## Features

✅ **Install as App**
- Users can install the app on their home screen
- Works on iOS, Android, Windows, and Mac

✅ **Offline Support**
- Essential pages load offline
- API calls cache for repeated access
- Network-first strategy for fresh data when online

✅ **Fast Loading**
- Static assets cached for instant loads
- Service worker speeds up subsequent visits

✅ **Native App Experience**
- Standalone mode (no browser UI)
- Full-screen support
- App icon on home screen
- Custom splash screens

✅ **Auto Updates**
- Service worker checks for updates every minute
- User gets notified when new version is available
- One-click refresh to update

## How to Install

### On Chrome/Edge (Desktop & Android)
1. Visit the app URL
2. Click the "Install" button in the address bar
3. Choose where to install
4. App opens in standalone window

### On Safari (iOS)
1. Open in Safari browser
2. Tap Share button
3. Select "Add to Home Screen"
4. Enter app name and add
5. App appears on home screen

### On Firefox
1. Visit the app URL
2. Click the menu (three dots)
3. Select "Install" option
4. App installs as a standalone app

## Building for Production

```bash
npm run build
```

The build process will:
- Generate optimized service worker
- Create manifest.json
- Bundle all assets
- Prepare PWA files

## Testing PWA Features

### Local Testing
```bash
npm run build
npm run preview
```

Open DevTools (F12) → Application → Service Workers to see:
- Service worker registration
- Cache storage
- Manifest details

### Test Offline
1. Open DevTools → Application
2. Check "Offline" checkbox
3. Navigate around the app
4. It should still work!

## Update Strategy

The app uses an **autoUpdate** strategy:
- Service worker updates check every 60 seconds
- When new version is available, user sees a notification
- User can click "Refresh" to update immediately
- Alternatively, close and reopen the app

## Performance Checklist

- ✅ Manifest.json properly configured
- ✅ Service worker caches essential assets
- ✅ Icons in multiple sizes
- ✅ HTTPS ready (PWA requires HTTPS in production)
- ✅ Responsive design
- ✅ Fast initial load
- ✅ Offline support

## Lighthouse PWA Audit

To run Google Lighthouse audit:
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "PWA" category
4. Run audit

Target scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
- PWA: All checks passing

## Deployment Notes

### HTTPS Requirement
PWAs require HTTPS in production. Ensure your deployment:
- ✅ Uses HTTPS
- ✅ Has valid SSL certificate
- ✅ Redirects HTTP to HTTPS

### Server Configuration
Ensure your server:
- ✅ Serves manifest.json with `application/manifest+json` MIME type
- ✅ Serves service-worker.js with `application/javascript` MIME type
- ✅ Has proper CORS headers if needed
- ✅ Sets cache headers appropriately

## Troubleshooting

### Service Worker not updating
1. Clear browser cache
2. Go to DevTools → Application → Clear storage
3. Uninstall app from home screen
4. Refresh and reinstall

### App not installing
1. Check HTTPS is enabled
2. Verify manifest.json is valid (use https://manifest-validator.appspot.com/)
3. Ensure app name and description are present
4. Check that icon files exist and paths are correct

### Offline features not working
1. Check service worker is registered (DevTools → Application → Service Workers)
2. Clear cache in Application tab
3. Verify cache storage has data (Application → Cache Storage)

## Further Reading

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
