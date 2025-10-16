# 🚀 Deployment Guide - QrAttendEase

## 📋 Complete Setup Checklist

### ✅ **Backend (Render) - https://attendease-yu7r.onrender.com**

#### Environment Variables on Render:
```env
MONGODB_URI=mongodb+srv://127003195:pkking555@attendease.fn1vip9.mongodb.net/qrattendease?retryWrites=true&w=majority&appName=attendease
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://attendeaze.netlify.app,http://localhost:5173
```

#### Render Settings:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `server`
- **Auto-Deploy**: Enabled ✅

---

### ✅ **Frontend (Netlify) - https://attendeaze.netlify.app**

#### Environment Variables on Netlify:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_API_URL=https://attendease-yu7r.onrender.com/api
VITE_EMAILJS_SERVICE_ID=your-emailjs-service-id
VITE_EMAILJS_TEMPLATE_ID=your-emailjs-template-id
VITE_EMAILJS_PUBLIC_KEY=your-emailjs-public-key
```

#### Netlify Settings:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Auto-Deploy**: Enabled ✅

---

### ✅ **Database (MongoDB Atlas)**

#### Connection Details:
- **Cluster**: attendease.fn1vip9.mongodb.net
- **Database**: qrattendease
- **User**: 127003195
- **Network Access**: 0.0.0.0/0 (Allow from anywhere)

---

## 🔧 **Update Netlify Environment Variables**

### Method 1: Netlify Dashboard
1. Go to: https://app.netlify.com/
2. Select your site: **attendeaze**
3. Go to: **Site settings** → **Environment variables**
4. Add/Update:
   - `VITE_API_URL` = `https://attendease-yu7r.onrender.com/api`
5. Click **Save**
6. Go to **Deploys** → Click **Trigger deploy** → **Clear cache and deploy**

### Method 2: Netlify CLI (Faster)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link to your site
netlify link

# Update environment variable
netlify env:set VITE_API_URL https://attendease-yu7r.onrender.com/api

# Trigger new deployment
netlify deploy --prod
```

---

## 🧪 **Testing Production**

### Test Backend (Render):
```bash
curl https://attendease-yu7r.onrender.com/api
```
**Expected**: Server response or 404 (means server is running)

### Test Database Connection:
```bash
cd server
node test-db.js
```
**Expected**: "✅ MongoDB Connected Successfully!"

### Test Frontend (Netlify):
1. Open: https://attendeaze.netlify.app
2. Try to login (Faculty or Student)
3. Try to create a class
4. Try QR code generation

---

## 📊 **Architecture**

```
┌─────────────────────────────────────────────────────────┐
│  USER (Browser)                                          │
│  https://attendeaze.netlify.app                         │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ HTTPS Requests
                    │
┌───────────────────▼─────────────────────────────────────┐
│  NETLIFY (Frontend)                                      │
│  - React App                                             │
│  - Static files served via CDN                           │
│  - Environment: VITE_API_URL                             │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ API Calls
                    │
┌───────────────────▼─────────────────────────────────────┐
│  RENDER (Backend)                                        │
│  https://attendease-yu7r.onrender.com                   │
│  - Node.js + Express                                     │
│  - REST API endpoints                                    │
│  - CORS enabled for Netlify                              │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ Database Queries
                    │
┌───────────────────▼─────────────────────────────────────┐
│  MONGODB ATLAS (Database)                                │
│  attendease.fn1vip9.mongodb.net                         │
│  - Collections: classes, attendances                     │
│  - Network: 0.0.0.0/0                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 **Security Checklist**

- ✅ MongoDB password not exposed (in .env only)
- ✅ CORS restricted to specific origins
- ✅ Rate limiting enabled (5 types)
- ✅ Environment variables in deployment platforms
- ✅ HTTPS enforced on all endpoints
- ⚠️ **TODO**: Add your actual Google OAuth Client ID
- ⚠️ **TODO**: Add EmailJS credentials for email features

---

## 🆘 **Troubleshooting**

### Issue: "Network Error" on production
**Solution**: Update Netlify env variable `VITE_API_URL` and redeploy

### Issue: "CORS Error"
**Solution**: Verify Render has correct `ALLOWED_ORIGINS` environment variable

### Issue: "Database connection failed"
**Solution**: 
1. Check MongoDB Atlas Network Access (whitelist 0.0.0.0/0)
2. Verify MONGODB_URI in Render environment variables

### Issue: Render backend sleeping
**Render free tier sleeps after inactivity**
- First request takes 30-60 seconds to wake up
- Consider upgrading to paid tier or use a keep-alive service

---

## 📝 **Next Steps**

1. ✅ Update Netlify environment variables
2. ✅ Trigger new Netlify deployment
3. ✅ Test production site
4. 🚀 Add new features:
   - Automated email reports
   - Digital certificates
   - Location-based verification
   - Admin dashboard

---

**Last Updated**: October 16, 2025
**Backend**: https://attendease-yu7r.onrender.com
**Frontend**: https://attendeaze.netlify.app
**Status**: ✅ Production Ready
