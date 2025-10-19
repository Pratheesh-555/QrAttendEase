# Google OAuth - Add Network IP for Mobile Testing 📱

## Problem
When accessing the app from your phone via `http://10.79.246.133:5173/`, Google OAuth shows:
- ❌ "Invalid request"
- ❌ "Error 400: redirect_uri_mismatch"

This happens because Google OAuth only allows requests from **authorized origins**.

---

## ✅ **Quick Fix - Add Your Network IP to Google OAuth**

### **Step 1: Go to Google Cloud Console**
Open in your browser:
```
https://console.cloud.google.com/apis/credentials
```

### **Step 2: Select Your Project**
- Look for your OAuth project (likely "QR Attendance" or similar)
- If prompted, select the correct project from the dropdown

### **Step 3: Find Your OAuth Client ID**
- Click on the OAuth 2.0 Client ID that starts with: `965499567163-...`
- Or look for the client ID name you created

### **Step 4: Add Network IP to Authorized JavaScript Origins**

Scroll down to **"Authorized JavaScript origins"** and click **"+ ADD URI"**

Add these URIs:
```
http://10.79.246.133:5173
http://localhost:5173
http://127.0.0.1:5173
```

**Important:** Include the port number `:5173` - don't forget it!

### **Step 5: Add to Authorized Redirect URIs**

Scroll to **"Authorized redirect URIs"** and click **"+ ADD URI"**

Add these URIs:
```
http://10.79.246.133:5173/
http://localhost:5173/
http://127.0.0.1:5173/
```

**Note:** Redirect URIs need the trailing `/` slash!

### **Step 6: Save**
- Click **"SAVE"** at the bottom
- Changes take effect immediately (no wait time)

### **Step 7: Test on Your Phone**
- Clear browser cache/cookies on your phone (optional but recommended)
- Open: `http://10.79.246.133:5173/`
- Click "Sign in with Google"
- ✅ Should work now!

---

## 📋 **Complete List of URIs to Add**

### **Authorized JavaScript origins:**
```
http://localhost:5173
http://127.0.0.1:5173
http://10.79.246.133:5173
https://attendease-yu7r.onrender.com
https://qrattendease.netlify.app
```

### **Authorized redirect URIs:**
```
http://localhost:5173/
http://127.0.0.1:5173/
http://10.79.246.133:5173/
https://attendease-yu7r.onrender.com/
https://qrattendease.netlify.app/
```

---

## ⚠️ **Important Notes**

### **Network IP Can Change**
Your network IP (`10.79.246.133`) might change when:
- You reconnect to WiFi
- Your router restarts
- You connect to different WiFi

**Solution:** 
1. Check current IP by running `npm run dev` (look for "Network:" line)
2. If changed, add the new IP to Google OAuth console
3. Or use `localhost` alternatives (see below)

### **Alternative: Use Localhost with USB**
Instead of network IP, you can:
1. Connect phone via USB
2. Enable USB tethering
3. Phone can access `http://localhost:5173` directly
4. No need to update Google OAuth for IP changes

### **For Production**
The production URLs are already configured:
- ✅ `https://attendease-yu7r.onrender.com` (Backend)
- ✅ `https://qrattendease.netlify.app` (Frontend - if deployed)

---

## 🚀 **After Adding URIs**

### **Test the Flow:**
1. ✅ Open `http://10.79.246.133:5173/` on your phone
2. ✅ Click role selection (Faculty or Student)
3. ✅ Click "Sign in with Google"
4. ✅ Should see Google sign-in popup
5. ✅ Select your account
6. ✅ Should redirect back to dashboard
7. ✅ You're logged in! 🎉

### **Test Persistent Login:**
1. ✅ Close the browser on your phone
2. ✅ Reopen and go to `http://10.79.246.133:5173/`
3. ✅ Should automatically log you back in
4. ✅ Should return to your last page (faculty/student)

---

## 🆘 **Troubleshooting**

### Still getting "Invalid request"?
1. ✅ Double-check the URI exactly matches (including port `:5173`)
2. ✅ Make sure you clicked "SAVE" in Google Console
3. ✅ Clear browser cache on phone
4. ✅ Try incognito/private mode on phone
5. ✅ Wait 1-2 minutes for changes to propagate

### Error: "redirect_uri_mismatch"?
- ✅ Check you added the URI with trailing `/` in redirect URIs section
- ✅ Example: `http://10.79.246.133:5173/` (with slash)

### Can't find OAuth Client in Google Console?
1. Go to: https://console.cloud.google.com/apis/credentials
2. Make sure you're in the correct project (top dropdown)
3. Look for "OAuth 2.0 Client IDs" section
4. Your client ID: `965499567163-tl8fjm4qndet268p7fqvb27ikckhqk8a`

### Network IP keeps changing?
**Option 1:** Set static IP on your router for your laptop
**Option 2:** Use USB tethering (phone accesses via localhost)
**Option 3:** Deploy to Netlify for stable HTTPS URL

---

## 📱 **Screenshot Guide**

When you open Google Cloud Console, you'll see:

```
APIs & Services > Credentials

OAuth 2.0 Client IDs
┌─────────────────────────────────────────────┐
│ Name: Web client 1                          │
│ Client ID: 965499567163-tl8fjm4qnde...      │
│ [Edit] [Delete]                             │
└─────────────────────────────────────────────┘
```

Click **Edit** (or click on the client ID name)

Then you'll see:
```
Authorized JavaScript origins
┌─────────────────────────────────────────────┐
│ http://localhost:5173                       │
│ + ADD URI                                   │
└─────────────────────────────────────────────┘

Authorized redirect URIs  
┌─────────────────────────────────────────────┐
│ http://localhost:5173/                      │
│ + ADD URI                                   │
└─────────────────────────────────────────────┘
```

Click **"+ ADD URI"** under each section to add your network IP.

---

## ✅ **Current Setup**

Your Google OAuth Client ID:
```
965499567163-tl8fjm4qndet268p7fqvb27ikckhqk8a.apps.googleusercontent.com
```

Your current network IP:
```
http://10.79.246.133:5173
```

**Action Required:** Add the network IP to Google OAuth authorized origins and redirect URIs.

---

*After adding the URIs, mobile testing will work perfectly!* 🎉
