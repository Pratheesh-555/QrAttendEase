# Camera Debugging Guide

## Quick Test Steps

1. **Open dev server:** http://localhost:5173/
2. **Sign in** with Google
3. **Go to Student Dashboard**
4. **Click "Open Camera"**
5. **Watch for:**
   - Toast message "Starting camera..."
   - Browser permission popup
   - Video feed appearing in the black box

## Common Issues & Fixes

### Issue 1: "No cameras found"
**Cause:** Browser can't detect camera  
**Fix:**
- Check if camera is physically connected
- Try different browser (Chrome works best)
- Restart browser

### Issue 2: "Camera permission denied"
**Cause:** User clicked "Block" on permission popup  
**Fix:**
1. Click the 🔒 padlock icon in address bar
2. Find "Camera" permission
3. Change to "Allow"
4. Refresh page (F5)

### Issue 3: "Camera is in use"
**Cause:** Another app is using the camera  
**Fix:**
- Close Zoom, Teams, Skype, etc.
- Close other browser tabs with camera access
- Restart browser

### Issue 4: Black screen (no video)
**Cause:** Video element not rendering properly  
**Debug steps:**
1. Open Console (F12)
2. Look for errors in red
3. Check if video element has a stream:
   ```javascript
   // In console, run:
   document.querySelector('#qr-reader video')?.srcObject
   // Should show MediaStream, not null
   ```

### Issue 5: Camera works but won't scan QR
**Cause:** QR code might be too small/blurry/far  
**Fix:**
- Move camera closer to QR
- Ensure good lighting
- Hold steady for 1-2 seconds
- QR should be centered in frame

## Browser Compatibility

✅ **Works Best:**
- Chrome 90+ (Desktop & Mobile)
- Edge 90+
- Safari 14+ (iOS)

⚠️ **May Have Issues:**
- Firefox (sometimes needs extra permissions)
- Opera
- Samsung Internet

❌ **Won't Work:**
- Internet Explorer
- Very old browsers
- Browsers without camera API support

## Testing Checklist

- [ ] Camera permission popup appears
- [ ] Video feed shows in black container
- [ ] Video fills the container (not stretched)
- [ ] "Scanning..." text appears when camera active
- [ ] Scanning line animates over video
- [ ] QR code gets detected (within 2 seconds)
- [ ] "QR Code Scanned!" success message appears
- [ ] "Mark Present" button becomes enabled

## Console Debugging

**Open DevTools (F12) → Console tab**

Look for these logs:
```
✅ Good: "Starting camera..." toast
✅ Good: No red errors
❌ Bad: "NotAllowedError" = Permission denied
❌ Bad: "NotFoundError" = No camera
❌ Bad: "NotReadableError" = Camera in use
```

## Manual Camera Test

Test if your camera works in general:

**Chrome:**
1. Go to: chrome://settings/content/camera
2. Check if camera is listed
3. Try: https://webrtc.github.io/samples/src/content/getusermedia/gum/
4. If camera works there but not in app → code issue
5. If camera doesn't work there → system/browser issue

**Edge:**
1. Go to: edge://settings/content/camera
2. Same steps as Chrome

## Code-Level Debug

If camera still won't work, check:

1. **Is getUserMedia supported?**
   ```javascript
   // Run in console:
   navigator.mediaDevices?.getUserMedia ? "Supported ✅" : "NOT supported ❌"
   ```

2. **Can we list devices?**
   ```javascript
   // Run in console:
   navigator.mediaDevices.enumerateDevices()
     .then(devices => {
       const cameras = devices.filter(d => d.kind === 'videoinput');
       console.log(`Found ${cameras.length} cameras:`, cameras);
     });
   ```

3. **Can we get stream?**
   ```javascript
   // Run in console:
   navigator.mediaDevices.getUserMedia({ video: true })
     .then(stream => {
       console.log("✅ Camera stream obtained:", stream);
       stream.getTracks().forEach(t => t.stop()); // cleanup
     })
     .catch(err => console.error("❌ Camera error:", err.name, err.message));
   ```

## Mobile-Specific Issues

### iOS Safari:
- ✅ Must be HTTPS or localhost
- ✅ Must have `playsinline` attribute (we have it)
- ✅ User must interact before camera starts (button click - we have it)
- ⚠️ Won't work in embedded browsers (Facebook, Instagram apps)

### Android Chrome:
- ✅ Usually works perfectly
- ⚠️ Some older Android versions need Chrome 90+
- ⚠️ Check Settings → Apps → Chrome → Permissions → Camera

## Getting More Help

**Share these details:**
1. Browser name & version (e.g., Chrome 120)
2. Operating system (Windows 11, Mac, Android, iOS)
3. Exact error message from toast notification
4. Console errors (copy from F12 Console)
5. Screenshot of the issue

**Check console and share:**
```javascript
// Run this and share the output:
console.log('Browser:', navigator.userAgent);
console.log('MediaDevices:', !!navigator.mediaDevices);
console.log('getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
```

## Still Not Working?

1. Try **incognito/private mode** (rules out extensions)
2. Try **different device** (rules out hardware issue)
3. Try **mobile phone** (if on desktop) or vice versa
4. Check if **camera works in other apps** (Zoom, Skype)
5. **Restart computer** (clears stuck camera processes)

## Success Criteria

When everything works correctly, you should see:

1. Click "Open Camera"
2. Toast: "Starting camera..."
3. Browser asks: "Allow [site] to use your camera?" → Click "Allow"
4. Black box fills with live video feed
5. Scanning line animates up and down
6. Point at QR code
7. Within 1-2 seconds: Toast "QR code scanned! Now submit to mark attendance."
8. Video stops, "Mark Present" button turns green and clickable
