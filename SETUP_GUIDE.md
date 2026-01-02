# Setup Guide for Narsinha Solar Pump Tracking System

## Current Configuration: **Cloud Storage (Render.com)**

Your app is now configured to store data on **Render.com cloud servers**. This means:
- ✅ Data is accessible from any device with internet
- ✅ Multiple users can access simultaneously
- ✅ Data persists even if you close your computer
- ✅ Production-ready setup

---

## How to Run the App

### Quick Start (Recommended):
1. Double-click **START.bat** to start the frontend
2. Open your browser to: http://localhost:3000/Narsinha-Solarpump-Pro-Tracking-System/
3. Your data is automatically saved to Render.com cloud

### Manual Start:
```bash
npm run dev
```
Then open: http://localhost:3000/Narsinha-Solarpump-Pro-Tracking-System/

---

## Important Notes

### 1. **Backend on Render.com**
- Backend API: `https://solarpump-backend.onrender.com`
- Database: Hosted on Render.com (cloud SQLite)
- No need to run local backend server
- **Note**: Render free tier sleeps after 15 minutes of inactivity
  - First request after sleep may take 30-60 seconds to wake up
  - Subsequent requests will be fast

### 2. **Default Login Credentials**
- **Admin**: PIN = `1111`
- **Store Keeper**: PIN = `2222`

### 3. **Data Storage**
- All data stored in Render.com cloud database
- Accessible from anywhere with internet connection
- Shared across all users of the system

---

## Switching Between Local and Cloud Storage

### To Use Cloud Storage (Current - Render.com):
In `services/api.ts`:
```typescript
const BASE_URL = 'https://solarpump-backend.onrender.com';
```

### To Use Local Storage (Development):
In `services/api.ts`:
```typescript
const BASE_URL = 'http://localhost:4000';
```
Then start local backend: `cd server && npm start`

---

## Troubleshooting

### "Data not saving" or "Connection Error"
✅ **Check Internet Connection**: Render.com requires internet access
✅ **Wait for Wake-Up**: If first request is slow, wait 30-60 seconds (Render free tier wakes from sleep)
✅ **Check Browser Console**: Open DevTools (F12) to see any error messages

### "401 Unauthorized" Error
✅ **Clear localStorage**: Open browser console and run: `localStorage.clear()` then refresh
✅ **Re-login**: Log out and log back in with correct PIN

### Very Slow Response
✅ **Render Free Tier**: Backend sleeps after 15 minutes inactivity
✅ **Solution**: Upgrade to paid Render plan OR switch to local development

### Switch to Local Development
If you want faster response times during development:
1. Edit `services/api.ts` and change BASE_URL to `http://localhost:4000`
2. Start local backend: `cd server && npm start`
3. Start frontend: `npm run dev`

---

## Production Deployment Status

- ✅ Backend: Deployed on Render.com
- ✅ API URL: https://solarpump-backend.onrender.com
- ✅ Database: SQLite on Render.com
- ⚠️ Free Tier: May sleep after 15 minutes (wakes on first request)

---

## Summary

**Current Setup**: 
- ✅ Frontend runs locally (npm run dev)
- ✅ Backend runs on Render.com (cloud)
- ✅ Data saved in cloud database
- ✅ Accessible from anywhere with internet

**To Run**: Just start the frontend with `npm run dev` or double-click START.bat

No need to manage backend server - it's already running on Render.com! 🎉

