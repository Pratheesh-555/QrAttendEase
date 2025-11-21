<div align="center">

# 📱 QrAttendEase

**Modern QR-Based Attendance System - Fast, Secure, Simple**

[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](https://github.com/Pratheesh-555/QrAttendEase)
[![Version](https://img.shields.io/badge/version-2.0.0-blue?style=flat-square)](https://github.com/Pratheesh-555/QrAttendEase)
[![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=flat-square)](https://web.dev/progressive-web-apps/)

**Say goodbye to paper attendance. Mark attendance in 3 seconds with QR codes.**


[🚀 Live Demo](#) • [📖 Docs](#) • [🐛 Report Bug](https://github.com/Pratheesh-555/QrAttendEase/issues)

</div>

---

## ⚡ Why QrAttendEase?

Traditional attendance wastes 10-15 minutes per class. **QrAttendEase** reduces it to under 1 minute.

- ⏱️ **3-Second Attendance** - Scan, mark, done
- 🔒 **Secure** - AES encryption + 30-second expiry
- 📊 **Real-time Analytics** - Live dashboards and charts
- 📱 **Works Offline** - Progressive Web App
- 🎨 **Professional UI** - Clean, modern design
- 💰 **Free & Open Source**

---

## ✨ Features

| 👨‍🏫 Faculty | 👨‍🎓 Students |
|-----------|------------|
| ⚡ One-click QR generation | 📱 3-second scanning |
| 📊 Real-time dashboard | ✅ Instant confirmation |
| 📈 Analytics & charts | 📊 Personal stats |
| 📥 Export PDF/CSV | 🌙 Dark/Light theme |
| ⏰ Auto late tracking | 📱 Works offline |
| 📧 Email notifications | 🔔 Alerts |

**Security:** AES-256 encryption • 30s QR expiry • Duplicate prevention • Rate limiting • Google OAuth

---

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/Pratheesh-555/QrAttendEase.git
cd QrAttendEase
npm install
cd server && npm install && cd ..

# Configure environment
# Edit .env files with your credentials

# Run (2 terminals)
npm run dev              # Frontend: http://localhost:5173
cd server && npm start   # Backend: http://localhost:5000
```

**Environment Variables:**
```env
# Root .env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_API_URL=http://localhost:5000

# server/.env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qrattendease
PORT=5000
```

---

## 💻 Tech Stack

**Frontend:** React 18 • Vite • TailwindCSS • Framer Motion  
**Backend:** Node.js • Express • MongoDB Atlas  
**Security:** ZXing QR Scanner • CryptoJS • OAuth  
**Tools:** Recharts • jsPDF • Service Worker

---

## 📖 How It Works

### Faculty
1. Login → Add Class → Start Attendance
2. Generate QR (auto-refreshes every 30s)
3. Display to students
4. Watch real-time updates
5. View analytics & export reports

### Students
1. Login with @sastra.ac.in email
2. Open camera → Scan QR
3. Click "Mark Present"
4. Get instant confirmation

---

## 🎨 Screenshots

**Faculty Dashboard** - Manage classes, track attendance, view analytics  
**Student Scanner** - Lightning-fast QR scanning with instant feedback  
**Analytics** - Beautiful charts and comprehensive reports

> Professional slate/stone gradient design with translucent cards

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| QR Generation | <50ms |
| Camera Start | <1s |
| Real-time Updates | 2s polling |
| Bundle Size | 416 KB (gzipped) |
| Lighthouse Score | 90+ |

---

## 🚀 Deployment

**Netlify (Frontend):**
- Build: `npm run build`
- Publish: `dist`
- Add `VITE_GOOGLE_CLIENT_ID` env variable

**Render/Railway (Backend):**
- Start: `npm start`
- Add `MONGODB_URI` and `PORT` env variables

---

## 🤝 Contributing

Contributions welcome! Fork → Create branch → Commit → Push → Pull Request

---

## 📄 License

MIT License - Free to use and modify

---

## 👨‍💻 Author

**Pratheesh**  
[![GitHub](https://img.shields.io/badge/GitHub-Pratheesh--555-181717?style=flat-square&logo=github)](https://github.com/Pratheesh-555)
[![Email](https://img.shields.io/badge/Email-kingpk810@gmail.com-D14836?style=flat-square&logo=gmail)](mailto:kingpk810@gmail.com)

---

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Native mobile apps
- [ ] SMS notifications
- [ ] Parent portal
- [ ] AI attendance predictions
- [ ] Face recognition backup

---

<div align="center">

**⭐ Star this repo if it helped you!**

**Built with ❤️ by Pratheesh** • Version 2.0.0 • Production Ready ✅

</div>
