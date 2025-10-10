# Quick Start Guide - QR AttendEase

## ⚡ Start Application (2 Steps)

### Step 1: Start Backend
```powershell
cd server
npm install
npm start
```
**Wait for:** `Server running on port 5000`

### Step 2: Start Frontend (New Terminal)
```powershell
npm install
npm run dev
```
**Wait for:** `Local: http://localhost:5173/`

---

## 🎯 Demo Flow (5 Minutes)

### 1️⃣ Faculty Setup (2 minutes)
1. Go to `http://localhost:5173`
2. Click **"Faculty"**
3. Login with Google
4. Click **"Add New Class"**
5. Enter class name (e.g., "Computer Science 101")
6. Click **"Create"**
7. Click on the created class
8. Upload student list (Excel/CSV) or skip for now
9. Click **"Start Attendance"**
10. QR code appears ✅

### 2️⃣ Student Scan (2 minutes)
1. Open `http://localhost:5173` on **mobile** (or new browser tab)
2. Click **"Student"**
3. Login with Google
4. Click **"Open Camera"**
5. Point camera at faculty's QR code
6. Green checkmark appears ✅
7. Click **"Mark Present"**
8. Success message shows ✅
9. Your name appears in presentees list ✅

### 3️⃣ Verify (1 minute)
1. Go back to faculty dashboard
2. See attendance updating in real-time
3. Check presentee list has student name ✅

---

## 🐛 Quick Fixes

### Backend won't start?
```powershell
cd server
rm -rf node_modules
npm install
npm start
```

### Frontend won't start?
```powershell
rm -rf node_modules
npm install
npm run dev
```

### Camera won't work?
- Use Chrome browser
- Allow camera permissions
- Use HTTPS or localhost only

### QR scan does nothing?
- Check browser console (F12)
- Verify backend is running
- Ensure QR code is not expired (refreshes every 30s)

---

## 📱 Production URLs

**Frontend (Deployed):** https://attendeaze.netlify.app
**Backend (Deployed):** https://attendease-yu7r.onrender.com

---

## ✅ What's Fixed & Working

1. ✅ QR code generation with encryption
2. ✅ QR scanning on mobile
3. ✅ Attendance marking with API
4. ✅ Duplicate prevention
5. ✅ Real-time presentee list
6. ✅ Error handling & notifications
7. ✅ Camera cleanup
8. ✅ CORS for localhost

---

## 🎬 Presentation Tips

1. **Start with problem statement:** Manual attendance is slow & error-prone
2. **Show the solution:** QR-based instant marking
3. **Demo live:** Faculty generates → Student scans → Instant update
4. **Highlight security:** Encrypted QR codes that expire
5. **Mention scalability:** Works for 100+ students simultaneously

---

**Good luck with your presentation! 🚀**
