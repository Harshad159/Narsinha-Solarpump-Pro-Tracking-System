# 🚨 CRITICAL: Fixing Data Loss on Render

## Problem
Your SQLite database is stored in **ephemeral storage** which gets deleted every time Render restarts the container. This is why your data keeps disappearing!

## Solution: Add Persistent Disk to Render

### Step 1: Push the render.yaml file
```bash
git add render.yaml
git commit -m "Add persistent disk configuration"
git push
```

### Step 2: Configure Render Dashboard

1. **Go to your Render Dashboard**: https://dashboard.render.com
2. Click on your **solarpump-backend** service
3. Go to **"Disks"** tab in the left sidebar
4. Click **"Add Disk"**
5. Configure:
   - **Name**: `solarpump-data`
   - **Mount Path**: `/opt/render/project/src/server`
   - **Size**: `1 GB` (costs $1/month)
6. Click **"Save Changes"**
7. Service will redeploy automatically

### Step 3: Verify It's Working

After the service restarts:
1. Open your PWA
2. Add some test inward entries
3. Wait 30+ minutes (let Render sleep your service)
4. Open the PWA again
5. **Data should still be there!** ✅

---

## Alternative Solution: FREE PostgreSQL (Recommended for Long Term)

If you don't want to pay $1/month for persistent disk, you can use Render's **FREE PostgreSQL database**:

1. Create a new PostgreSQL database on Render (FREE tier)
2. I can help migrate your code from SQLite to PostgreSQL
3. PostgreSQL is persistent by default and FREE

**Want me to help with PostgreSQL migration?** Let me know!

---

## Quick Check: Is Your Render Service Sleeping?

To verify if this is the issue:
1. Go to Render Dashboard → Your Service → Events
2. Look for "Service sleeping due to inactivity"
3. If you see this, that's when your database gets wiped

---

## Emergency Backup (Right Now!)

Since you have local backup system I added, your recent data is saved in browser localStorage. To recover:
1. Open Browser DevTools (F12)
2. Go to "Application" → "Local Storage"
3. Look for keys: `inward_backup_entries` and `dispatch_backup_entries`
4. Copy the JSON values and save them as backup files

This won't solve the root problem, but at least you have a backup!
