# 🚀 DEPLOYMENT GUIDE - QR AttendEase

## 📋 Quick Deploy (5 Minutes)

### Prerequisites:
- ✅ Code is ready (build tested successfully)
- ✅ GitHub account
- ✅ Netlify account (free tier is fine)

---

## 🎯 Option 1: Deploy via Netlify UI (EASIEST)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Production ready - Full attendance system"
git push origin main
```

### Step 2: Connect Netlify
1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub**
4. Select repository: `QrAttendEase`

### Step 3: Configure Build Settings
**Build command:**
```
npm run build
```

**Publish directory:**
```
dist
```

**Base directory:** (leave empty)

### Step 4: Add Environment Variables
Click **"Add environment variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_GOOGLE_CLIENT_ID` | `965499567163-tl8fjm4qndet268p7fqvb27ikckhqk8a.apps.googleusercontent.com` |

### Step 5: Deploy!
1. Click **"Deploy site"**
2. Wait 2-3 minutes for build
3. You'll get a URL like: `https://random-name-123.netlify.app`

### Step 6: Custom Domain (Optional)
1. Click **"Domain settings"**
2. Edit site name to: `attendeaze` or your preferred name
3. Your URL becomes: `https://attendeaze.netlify.app`

---

## 🎯 Option 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login
```bash
netlify login
```

### Step 3: Initialize
```bash
cd d:/Projects/QrAttendEase
netlify init
```

**Follow prompts:**
- Create new site? **Yes**
- Team: **Your team name**
- Site name: **attendeaze** (or your choice)
- Build command: **npm run build**
- Directory: **dist**

### Step 4: Set Environment Variables
```bash
netlify env:set VITE_GOOGLE_CLIENT_ID "965499567163-tl8fjm4qndet268p7fqvb27ikckhqk8a.apps.googleusercontent.com"
```

### Step 5: Deploy
```bash
netlify deploy --prod
```

---

## 🔐 Google OAuth Configuration

### IMPORTANT: After getting your Netlify URL

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Add **Authorized JavaScript origins:**
   ```
   https://your-site-name.netlify.app
   http://localhost:5173
   ```
6. Add **Authorized redirect URIs:**
   ```
   https://your-site-name.netlify.app
   https://your-site-name.netlify.app/faculty
   https://your-site-name.netlify.app/student
   http://localhost:5173
   http://localhost:5173/faculty
   http://localhost:5173/student
   ```
7. Click **Save**

---

## 🧪 Post-Deployment Testing

### 1. Basic Functionality
- [ ] Visit your Netlify URL
- [ ] See login page with Faculty/Student options
- [ ] Click "Faculty" → Google login works
- [ ] Redirected to faculty dashboard
- [ ] Can add a class
- [ ] Can click "Start" to generate QR code

### 2. QR Code Testing
- [ ] QR code appears on faculty screen
- [ ] Open student page on mobile (same URL + /student)
- [ ] Login as student
- [ ] Can open camera
- [ ] Can scan QR code
- [ ] "Mark Present" button appears
- [ ] Click "Mark Present"
- [ ] Success message shows

### 3. Real-Time Updates
- [ ] Go back to faculty dashboard
- [ ] Click "Show" under Attendance Status
- [ ] See student name appear (within 2 seconds)
- [ ] Email is visible next to name

### 4. Cross-Device Testing
- [ ] Test on desktop Chrome
- [ ] Test on desktop Firefox
- [ ] Test on mobile Safari (iOS)
- [ ] Test on mobile Chrome (Android)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot read property of undefined" Error
**Cause:** Environment variables not loaded  
**Solution:**
1. Go to Netlify dashboard
2. Site settings → Environment variables
3. Add `VITE_GOOGLE_CLIENT_ID`
4. Trigger new deploy

### Issue 2: Google OAuth Redirect Error
**Cause:** Domain not whitelisted  
**Solution:**
1. Copy your Netlify URL exactly
2. Add to Google Cloud Console (see OAuth section above)
3. Wait 5 minutes for changes to propagate

### Issue 3: 404 Error on Refresh
**Cause:** SPA routing not configured  
**Solution:** ✅ Already fixed with `_redirects` file and `netlify.toml`

### Issue 4: Camera Won't Open on Mobile
**Cause:** HTTPS required for camera access  
**Solution:** ✅ Netlify provides HTTPS by default

### Issue 5: Real-Time Updates Not Working
**Cause:** Backend server down  
**Check:**
1. Visit: https://attendease-yu7r.onrender.com/api/attendance/123
2. Should return: `{"presentStudents":[]}`
3. If error, contact backend admin

---

## 📊 Monitor Your Deployment

### Netlify Dashboard
- **Deploy logs:** See build output
- **Function logs:** Not used in this app
- **Analytics:** Track page views (pro feature)

### Check Points:
1. **Build time:** Should be ~1-2 minutes
2. **Deploy status:** Should show "Published"
3. **Environment vars:** Should show `VITE_GOOGLE_CLIENT_ID`

---

## 🎨 Custom Domain Setup (Optional)

### Using Your Own Domain:

1. **In Netlify:**
   - Go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter your domain: `attendeaze.com`
   
2. **In Your Domain Registrar:**
   - Add DNS records:
     ```
     Type: A
     Name: @
     Value: 75.2.60.5
     
     Type: CNAME
     Name: www
     Value: your-site-name.netlify.app
     ```

3. **Enable HTTPS:**
   - Netlify will automatically provision SSL certificate
   - Wait 24 hours for DNS propagation

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push:
✅ Already configured! Every push to `main` branch will:
1. Trigger new build on Netlify
2. Run `npm run build`
3. Deploy to production
4. Usually takes 2-3 minutes

### Manual Deploy:
```bash
# Method 1: Push to GitHub
git push origin main

# Method 2: Netlify CLI
netlify deploy --prod

# Method 3: Drag & Drop
# Just drag the /dist folder to Netlify dashboard
```

---

## 📈 Performance Optimization

### Already Implemented:
- ✅ Code splitting (vendor, UI, QR libs separated)
- ✅ Minification (Terser)
- ✅ Console logs removed in production
- ✅ Asset optimization
- ✅ Gzip compression (Netlify automatic)

### Bundle Sizes:
```
index.html      0.89 kB (gzip: 0.43 kB)
index.css      23.22 kB (gzip: 4.73 kB)
qr-libs chunk     ~600 kB
vendor chunk      ~400 kB
ui chunk          ~300 kB
main chunk        ~280 kB
```

**Total:** ~1.6 MB (acceptable for this feature set)

---

## 🎯 Production URLs

### Your App:
```
https://attendeaze.netlify.app (or your custom domain)
├── /               → Login page
├── /faculty        → Faculty dashboard
└── /student        → Student dashboard
```

### Backend API:
```
https://attendease-yu7r.onrender.com/api
├── /attendance/start
├── /attendance/mark
└── /attendance/:classId
```

---

## ✅ Final Checklist

Before announcing to users:

- [ ] Deployed successfully
- [ ] Google OAuth working
- [ ] Can login as faculty
- [ ] Can login as student
- [ ] Can generate QR code
- [ ] Can scan QR code from mobile
- [ ] Real-time updates working
- [ ] Tested on mobile Safari
- [ ] Tested on mobile Chrome
- [ ] No console errors on production
- [ ] Backend server responding
- [ ] Custom domain configured (if using)

---

## 📞 Support & Maintenance

### Health Check URLs:
```bash
# Frontend health
curl https://attendeaze.netlify.app

# Backend health
curl https://attendease-yu7r.onrender.com/api/attendance/test123
```

### Logs:
- **Frontend:** Netlify dashboard → Deploys → View logs
- **Backend:** Render dashboard → Logs tab

### Monitoring:
- Set up [UptimeRobot](https://uptimerobot.com) for uptime monitoring
- Check weekly for any issues

---

## 🎉 You're Live!

### Share with users:
```
🎓 AttendEase is now live!

Faculty: https://attendeaze.netlify.app/faculty
Student: https://attendeaze.netlify.app/student

Features:
✅ Scan QR codes for attendance
✅ Real-time updates
✅ Mobile-friendly
✅ Secure Google login
```

---

## 📱 QR Code for Easy Access

Generate a QR code pointing to your Netlify URL and print it for classrooms!

**Tools:**
- https://qr-code-generator.com
- Point to: `https://attendeaze.netlify.app/student`
- Print and put in classrooms for easy student access

---

**Need help?** Check the console logs or contact support.

**Last Updated:** October 12, 2025  
**Deployment Status:** ✅ READY  
**Estimated Deploy Time:** 3-5 minutes
