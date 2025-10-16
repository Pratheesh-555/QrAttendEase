# 🔑 Google OAuth Setup Guide

## 🚨 IMPORTANT: Your app shows blank screen because Google OAuth is not configured!

Follow these steps to fix it:

---

## ⚡ Quick Fix (5 minutes)

### Step 1: Go to Google Cloud Console
**URL**: https://console.cloud.google.com/

### Step 2: Create/Select a Project
1. Click the project dropdown (top left)
2. Click **"New Project"**
3. Name it: **"QrAttendEase"**
4. Click **"Create"**

### Step 3: Enable Google+ API
1. Go to: **APIs & Services** → **Library**
2. Search for: **"Google+ API"**
3. Click on it
4. Click **"Enable"**

### Step 4: Create OAuth Credentials
1. Go to: **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: **QrAttendEase**
   - User support email: **your email**
   - Developer email: **your email**
   - Click **"Save and Continue"** through all steps

### Step 5: Configure OAuth Client
1. Application type: **Web application**
2. Name: **QrAttendEase Web**
3. Authorized JavaScript origins:
   ```
   http://localhost:5173
   https://attendeaze.netlify.app
   ```
4. Authorized redirect URIs:
   ```
   http://localhost:5173
   https://attendeaze.netlify.app
   ```
5. Click **"Create"**

### Step 6: Copy Your Client ID
You'll see something like:
```
1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

### Step 7: Update Your .env File
Open `d:\Projects\QrAttendEase\.env` and replace:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

With:
```env
VITE_GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
```

### Step 8: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 9: Update Netlify Environment Variable
1. Go to: https://app.netlify.com/sites/attendeaze/settings/env
2. Add/Update: `VITE_GOOGLE_CLIENT_ID` with your new Client ID
3. Redeploy: Go to Deploys → Trigger deploy → Clear cache and deploy

---

## ✅ Verify It's Working

### Local Test:
1. Open: http://localhost:5173
2. You should see the login page (not blank!)
3. Click "Login as Faculty" or "Login as Student"
4. Google login popup should appear

### Production Test:
1. Open: https://attendeaze.netlify.app
2. Same test as above

---

## 🐛 Still Getting Blank Screen?

### Check Browser Console:
1. Press **F12** (open DevTools)
2. Go to **Console** tab
3. Look for errors (red text)
4. Common issues:
   - ❌ "Invalid Client ID" → Client ID is wrong
   - ❌ "redirect_uri_mismatch" → Add your URLs to authorized origins
   - ❌ Network error → Backend not running

### Quick Fixes:
```bash
# Clear browser cache
Ctrl + Shift + Delete

# Restart dev server
npm run dev

# Check backend is running
cd server
npm start
```

---

## 📸 Screenshots Reference

### Where to find Client ID:
```
Google Cloud Console
→ APIs & Services
→ Credentials
→ OAuth 2.0 Client IDs
→ Click your client name
→ Copy "Client ID"
```

### What it looks like:
```
Format: [NUMBER]-[RANDOM_STRING].apps.googleusercontent.com
Example: 123456789012-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com
```

---

## 🔒 Security Notes

- ✅ Client ID is PUBLIC (safe to commit to git)
- ❌ Client SECRET is PRIVATE (never commit!)
- ✅ Use authorized origins to restrict domains
- ✅ Add test users in OAuth consent screen for testing

---

## 🆘 Need Help?

Common error messages and solutions:

### "idpiframe_initialization_failed"
**Solution**: Check if Third-Party Cookies are enabled in your browser

### "popup_closed_by_user"
**Solution**: Normal - user closed the popup. Try again.

### "access_denied"
**Solution**: 
1. Check OAuth consent screen is published (or add test users)
2. Verify authorized origins include your domain

---

## 📝 Environment Variables Checklist

### Local (.env):
```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_API_URL=https://attendease-yu7r.onrender.com/api
```

### Netlify:
```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_API_URL=https://attendease-yu7r.onrender.com/api
```

### Render (backend):
```env
MONGODB_URI=mongodb+srv://...
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://attendeaze.netlify.app,http://localhost:5173
```

---

**After setting up Google OAuth, your app will work perfectly!** 🎉

**Estimated time**: 5-10 minutes
**Difficulty**: Easy
**Cost**: FREE (Google Cloud free tier)
