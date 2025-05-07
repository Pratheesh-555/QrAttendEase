# 🌟 **QrAttendEase** 🌟

QrAttendEase is your modern solution for attendance management, powered by QR code technology and MongoDB Atlas.

---

## 🚀 **Features**

- ✅ **QR Code-based Attendance**: Seamlessly scan QR codes to track attendance
- 🔄 **Real-Time Updates**: Instant synchronization with MongoDB Atlas
- 📊 **Excel Integration**: Easy student list management via Excel uploads
- 🎨 **User-Friendly Interface**: Modern UI with Tailwind CSS
- 🔐 **Google Authentication**: Secure login for faculty and students

---

## 🛠️ **Installation**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Pratheesh-555/QrAttendEase.git
   cd QrAttendEase
   ```

2. **Install dependencies for frontend**:
   ```bash
   npm install
   ```

3. **Setup server**:
   ```bash
   cd server
   npm install
   ```

4. **Configure Environment Variables**:
   Create `.env` in root directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   MONGODB_URI=your_mongodb_atlas_uri
   ```

5. **Start the application**:
   ```bash
   # Terminal 1 - Start frontend
   npm run dev

   # Terminal 2 - Start backend
   cd server
   npm run dev
   ```

---

## 💾 **Database Setup**

1. Create MongoDB Atlas account
2. Create new cluster
3. Add connection string to `.env`
4. Database collections:
   - `classes`: Stores class information and student lists
   - `attendance`: Stores attendance records

---

## 📋 **Usage**

### Faculty
1. Login with Google
2. Create new class
3. Upload student list (Excel file with names)
4. Start attendance session
5. Share QR code with students

### Students
1. Login with Google
2. Scan QR code
3. Get attendance confirmation

---

## 🔧 **Tech Stack**

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas
- Authentication: Google OAuth
- Styling: Tailwind CSS
- QR Code: html5-qrcode

---

## 📬 **Contact**

- **Author**: [Pratheesh-555](https://github.com/Pratheesh-555)
- **Email**: kingpk810@gmail.com

---

### 🌟 **Thank you for choosing QrAttendEase!** 🌟
