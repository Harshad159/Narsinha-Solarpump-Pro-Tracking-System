# Setup Guide for Narsinha Solar Pump Tracking System

## Problem You Faced
**Issue**: Data added in the arrival/inward form disappears after refresh, and stock shows as zero.

**Root Cause**: The backend API server was not running. The app needs both the frontend AND backend servers to save and retrieve data.

---

## Solution: How to Run the App Properly

### Option 1: Use START.bat (Easiest Way)
Simply double-click the **START.bat** file in the project folder. This will automatically:
1. Start the backend API server on `http://localhost:4000`
2. Start the frontend dev server on `http://localhost:5173`

### Option 2: Manual Start (Two Terminals)

#### Terminal 1 - Start Backend Server:
```bash
cd server
npm start
```
You should see:
```
✅ App running on:
   Local: http://localhost:4000
   Database: [path to database.sqlite]
```

#### Terminal 2 - Start Frontend:
```bash
npm run dev
```
You should see:
```
VITE ready
Local: http://localhost:5173/
```

---

## Important Notes

### 1. **Always Keep Backend Running**
- The backend server MUST be running for data to persist
- If you close the backend terminal, your data won't save
- The database file is located at: `server/database.sqlite`

### 2. **Default Login Credentials**
After starting both servers, open `http://localhost:5173` and log in with:
- **Admin**: PIN = `1111`
- **Store Keeper**: PIN = `2222`

### 3. **Data Storage**
- All data is stored in `server/database.sqlite`
- This file is automatically created when you first start the backend
- Your data persists across app restarts as long as this file exists

### 4. **First Time Setup**
If this is your first time running the app:
1. Install dependencies for frontend: `npm install`
2. Install dependencies for backend: `cd server && npm install`
3. Run START.bat or follow Option 2 above

---

## Troubleshooting

### "Data still not saving"
✅ **Check**: Is the backend server running? Look for the terminal window with `http://localhost:4000`

### "Connection refused" or "Network error"
✅ **Check**: Make sure the backend server started successfully on port 4000

### "Port already in use"
✅ **Solution**: Close any other apps using port 4000 or 5173

### "Cannot find module" errors
✅ **Solution**: Run `npm install` in both the root folder and `server` folder

---

## Production Deployment
When deploying to production (Render, etc.):
1. Update `services/api.ts` to use your production backend URL
2. Build the frontend: `npm run build`
3. Deploy both frontend and backend separately

---

## Summary
**Always remember**: This app needs BOTH servers running:
- ✅ Backend (port 4000) - for data storage
- ✅ Frontend (port 5173) - for the user interface

Use **START.bat** for the easiest experience!
