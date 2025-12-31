# Employee Setup Guide

## First-Time Setup (Do This Once)

1. Extract the app folder to your PC (e.g., `C:\SolarTracker`)
2. Open **PowerShell** as Administrator
3. Navigate to the app folder:
   ```powershell
   cd C:\SolarTracker
   ```
4. Install dependencies (one-time):
   ```powershell
   npm install
   cd server
   npm install
   cd ..
   ```
5. Build the frontend (one-time):
   ```powershell
   npm run build
   ```

## Running the App (Every Day)

**Option A: Simple (Double-click)**
- Double-click `START.bat` in the app folder
- Wait for the message "Local API running..."
- Open browser → `http://localhost:4000`

**Option B: Manual (PowerShell)**
```powershell
cd C:\SolarTracker\server
npm start
```
Then open browser → `http://localhost:4000`

## Login Credentials

- **Administrator** → PIN: `1111`
- **Store Keeper** → PIN: `2222`
- **Field Installer** → ID: `INST-0001`, PIN: `3333`

## Data Backup

All data is saved in: `server/database.sqlite`

**To backup:**
- Copy `server/database.sqlite` to a USB drive or cloud storage

**To restore:**
- Replace the `server/database.sqlite` file with your backup

## Troubleshooting

**Port already in use?**
```powershell
netstat -ano | findstr :4000
```
Kill the process or use a different port:
```powershell
$env:PORT=5000; npm start
```

**Dependencies missing?**
```powershell
cd server
npm install
```

**Need to rebuild frontend?**
```powershell
npm run build
```

## Network Access (Multiple Devices)

If you want to access from another computer on the same network:
1. Find your IP: Open PowerShell and type `ipconfig`
2. Look for "IPv4 Address" (e.g., `192.168.1.100`)
3. Other devices visit: `http://192.168.1.100:4000`

---

**Questions?** Contact your IT support.
