# 🌟 **QrAttendEase** - Smart Attendance Management System 🌟

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Pratheesh-555/QrAttendEase)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/Pratheesh-555/QrAttendEase)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-enabled-purple)](https://web.dev/progressive-web-apps/)

A modern, feature-rich QR code-based attendance management system built with React, MongoDB, and Express. Perfect for educational institutions, corporate training, and events.

---

## 🚀 **Features**

### ✅ Core Features
- 📱 **QR Code Scanning**: Fast and accurate attendance marking
- 🔄 **Real-Time Updates**: Live attendance tracking with 2-second polling
- 📊 **Analytics Dashboard**: Interactive charts and statistics
- 🎨 **Modern UI**: Dark/Light theme with smooth animations
- 🔒 **Secure**: Rate limiting, encryption, and duplicate prevention
- 📱 **PWA**: Installable on mobile and desktop
- 🌐 **Offline Support**: Works without internet connection
- 📧 **Notifications**: Email alerts for absent students

### 🎯 Advanced Features
- ⏰ **Late Arrival Tracking**: Automatic detection with configurable grace period
- 📈 **Historical Reports**: View attendance trends over time
- 📥 **Export Data**: Download reports as PDF or CSV
- 👥 **Role-Based Access**: Separate dashboards for faculty and students
- 💾 **MongoDB Integration**: Persistent data storage
- 🎨 **Responsive Design**: Optimized for all screen sizes

---

## 🛠️ **Tech Stack**

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **html5-qrcode** - QR scanning
- **Google OAuth** - Authentication

### Backend
- **Node.js & Express** - Server
- **MongoDB Atlas** - Database
- **Mongoose** - ODM
- **Express Rate Limit** - Security
- **CORS** - Cross-origin handling

### Tools
- **jsPDF** - PDF generation
- **EmailJS** - Email notifications
- **CryptoJS** - Encryption
- **Service Worker** - PWA support

---

## � **Installation**

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Google OAuth credentials

### 1. Clone Repository
```bash
git clone https://github.com/Pratheesh-555/QrAttendEase.git
cd QrAttendEase
```

### 2. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 3. Configure Environment

**Root `.env`:**
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Server `.env`:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qrattendease
PORT=5000
NODE_ENV=production
```

### 4. Start Development

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server
npm start
```

Visit: `http://localhost:5173`

---

## 🌐 **Deployment**

### Frontend (Netlify)

1. **Build:**
```bash
npm run build
```

2. **Deploy:**
   - Connect GitHub repository
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment: `VITE_GOOGLE_CLIENT_ID`

### Backend (Render/Railway)

1. **Deploy:**
   - Connect GitHub repository
   - Start command: `npm start`
   - Add environment variables

2. **MongoDB Atlas:**
   - Whitelist IP: `0.0.0.0/0`
   - Create database user
   - Copy connection string

---

## 📋 **Usage**

### For Faculty

1. **Login** with Google account
2. **Add Class** - Click "Add Class" button
3. **Start Session** - Select class, click "Start Attendance"
4. **Display QR Code** - Share with students
5. **Monitor** - Watch real-time attendance
6. **Analytics** - View charts and statistics
7. **Export** - Download reports (PDF/CSV)

### For Students

1. **Login** with Google account
2. **Open Camera** - Click "Open Camera"
3. **Scan QR Code** - Point at faculty's screen
4. **Submit** - Click "Mark Present"
5. **Confirmation** - See success message

---

## 🎨 **Screenshots**

### Faculty Dashboard
![Faculty Dashboard](screenshots/faculty-dashboard.png)

### Analytics
![Analytics](screenshots/analytics.png)

### Student Scanner
![Student Scanner](screenshots/student-scanner.png)

---

## � **Features in Detail**

### 1. Attendance History & Analytics
- Interactive line and bar charts
- Date range filtering
- Class-wise comparison
- Export to PDF/CSV
- Best/worst class identification

### 2. Late Arrival Tracking
- Configurable grace period (default: 10 min)
- Automatic late detection
- Visual indicators (on-time vs late)
- Time difference display
- Real-time updates

### 3. Security Features
- Rate limiting (5 types)
- QR code encryption (AES)
- 30-second QR expiry
- Duplicate prevention
- CORS protection
- MongoDB injection protection

### 4. Progressive Web App
- Installable on devices
- Offline functionality
- Background sync
- Push notifications
- App-like experience

### 5. UI/UX Enhancements
- Dark/Light theme toggle
- Loading skeletons
- Smooth animations
- Mobile-optimized
- Touch-friendly buttons

---

## 🔐 **Security**

### Rate Limits:
- General API: 100 requests/15 min
- Attendance marking: 5 requests/min
- QR generation: 30 requests/min
- Authentication: 20 attempts/15 min
- Exports: 10 requests/5 min

### Encryption:
- QR codes encrypted with AES
- 30-second expiry validation
- Secure Google OAuth

---

## 📱 **Mobile Support**

- ✅ Fully responsive design
- ✅ Touch-optimized interface
- ✅ Camera access for QR scanning
- ✅ PWA installable
- ✅ Offline mode
- ✅ Push notifications

---

## 🧪 **Testing**

```bash
# Lint check
npm run lint

# Build test
npm run build

# Preview production
npm run preview
```

---

## 📈 **Performance**

- **Build size:** 1.31 MB (416 KB gzipped)
- **Build time:** ~18-23 seconds
- **Lighthouse score:** 90+
- **Real-time polling:** 2 seconds
- **QR generation:** <50ms

---

## 🤝 **Contributing**

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 **Author**

**Pratheesh**
- GitHub: [@Pratheesh-555](https://github.com/Pratheesh-555)
- Email: kingpk810@gmail.com

---

## 🙏 **Acknowledgments**

- React Team for the amazing framework
- MongoDB for cloud database
- Google for OAuth services
- All open-source contributors

---

## 📞 **Support**

For issues and questions:
- Open an [Issue](https://github.com/Pratheesh-555/QrAttendEase/issues)
- Email: kingpk810@gmail.com

---

## 🗺️ **Roadmap**

- [ ] Multi-language support
- [ ] Biometric authentication
- [ ] Parent portal
- [ ] SMS notifications
- [ ] Calendar integration
- [ ] Advanced ML analytics

---

## 📚 **Documentation**

For detailed documentation, see:
- [Implementation Progress](IMPLEMENTATION_PROGRESS.md)
- [Final Summary](FINAL_SUMMARY.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

---

## ⭐ **Show your support**

Give a ⭐️ if this project helped you!

---

**Built with ❤️ by Pratheesh**

**Version:** 2.0.0 | **Status:** Production Ready ✅
