# Mobile Testing Guide 📱

## ⚡ Simple Method - Test on Your Phone NOW

Your dev server is running at:
- **Local:** http://localhost:5173/
- **Network:** http://10.79.246.133:5173/

---

## 📱 **Steps to Access on Your Phone:**

### **1. Make sure phone and laptop are on SAME WiFi**

### **2. On your phone's browser, open:**
```
http://10.79.246.133:5173/
```

### **3. If connection fails, check Windows Firewall:**

Open PowerShell **as Administrator** and run:
```powershell
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173
```

Or manually:
1. Windows Search → "Windows Defender Firewall"
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Port → TCP → Specific local ports: **5173**
5. Allow the connection → Name it "Vite Dev Server"

### **4. That's it! Live updates work automatically 🚀**

---

## ⚠️ **Camera Testing Note**

The HTTP connection works for most features, but mobile browsers may restrict camera access to HTTPS only.

**If camera doesn't work on mobile:**
- Test other features (UI, navigation, login persistence)
- Deploy to Netlify for full HTTPS camera testing (already configured)
- Or use USB debugging with Chrome DevTools

---

## 🎯 **What You Can Test via HTTP:**
✅ User interface and layouts  
✅ Navigation and routing  
✅ Persistent login  
✅ QR code display (faculty side)  
✅ Attendance marking (if camera works)  
✅ All other app features  
❓ Camera (may work on some Android devices, unlikely on iOS)


## � **How to Debug on Mobile**

### **Chrome DevTools on Android (via USB):**
1. Enable Developer Options on Android
2. Enable USB Debugging  
3. Connect phone to laptop via USB
4. Open Chrome on laptop
5. Go to `chrome://inspect`
6. Select your device → Inspect
7. Full DevTools available!

### **Safari DevTools on iOS (via USB):**
1. iPhone: Settings → Safari → Advanced → Web Inspector (ON)
2. Mac: Safari → Preferences → Advanced → Show Develop menu
3. Connect iPhone via USB
4. Safari → Develop → [Your iPhone] → [Your Page]
5. Full DevTools available!

---

## ⚡ **Live Reload (Hot Module Replacement)**

Vite automatically refreshes your phone when you save code changes:

1. ✅ Open app on phone via `http://10.79.246.133:5173/`
2. ✅ Edit code on laptop
3. ✅ Save file
4. ✅ **Phone automatically reloads!** 🚀

No need to refresh manually - just code and watch!

---

## 🚀 **Current Network Address**

Your current network IP is: **http://10.79.246.133:5173/**

**Note:** This IP can change when you reconnect to WiFi. Always check the dev server output for the current Network address.

To see current address, restart dev server:
```powershell
npm run dev
```

Look for the "Network:" line in the output.

---

## 🆘 **Troubleshooting**

### "Can't connect to http://10.79.246.133:5173/"
1. ✅ Check both devices on **same WiFi network**
2. ✅ Check Windows Firewall (see above)
3. ✅ Restart dev server: `npm run dev`
4. ✅ Try your phone's IP in the URL bar to test connectivity
5. ✅ Disable VPN if running on laptop

### "Camera doesn't work on phone"
- This is expected with HTTP on most mobile browsers
- Test other features (UI, login, navigation)
- For camera testing, deploy to Netlify (HTTPS enabled)
- Or use USB debugging to test camera code with console

### "Page loads but doesn't update when I change code"
- ✅ Check browser console for WebSocket errors
- ✅ Refresh the page manually once
- ✅ Restart dev server

### Network IP changed
- ✅ Run `npm run dev` to see current IP
- ✅ Look for "Network: http://..." in output
- ✅ Update URL on phone with new IP

---

## 📦 **For Full Camera Testing - Deploy to Netlify**

Your app is already configured for Netlify deployment:

```powershell
# Build the app
npm run build

# Deploy (if netlify-cli installed)
netlify deploy --prod
```

Or use Netlify's GitHub integration for automatic deploys.

---

*Your dev server is currently running at:*  
**http://10.79.246.133:5173/**

*Just open this on your phone (same WiFi) and start testing!* 🎉
