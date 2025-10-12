import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import classRoutes from './routes/class.js';
// import attendanceRoutes from './routes/attendance.js'; // Not currently used

// Get directory path for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
const allowedOrigins = [
  'https://attendeaze.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/classes', classRoutes);
// In-memory attendance store for demo/testing
const attendanceStore = {};

// Start attendance for a class
app.post('/api/attendance/start', (req, res) => {
  const { classId } = req.body;
  if (!classId) return res.status(400).json({ success: false, message: 'Missing classId' });
  attendanceStore[classId] = { presentStudents: [] };
  res.json({ success: true });
});

// Mark student attendance
app.post('/api/attendance/mark', (req, res) => {
  const { classId, studentEmail, studentName } = req.body;
  if (!classId || !studentEmail || !studentName) {
    return res.status(400).json({ success: false, message: 'Missing data' });
  }
  
  if (!attendanceStore[classId]) {
    attendanceStore[classId] = { presentStudents: [] };
  }
  
  // Check for duplicate
  const isDuplicate = attendanceStore[classId].presentStudents.some(
    s => s.studentEmail === studentEmail
  );
  
  if (isDuplicate) {
    return res.json({ 
      success: false, 
      message: 'Attendance already marked for this student',
      presentStudents: attendanceStore[classId].presentStudents 
    });
  }
  
  // Add student to present list
  attendanceStore[classId].presentStudents.push({ studentEmail, studentName });
  
  console.log(`Attendance marked for ${studentName} (${studentEmail}) in class ${classId}`);
  
  res.json({ 
    success: true, 
    message: 'Attendance marked successfully',
    presentStudents: attendanceStore[classId].presentStudents 
  });
});

// Get attendance status
app.get('/api/attendance/:classId', (req, res) => {
  const { classId } = req.params;
  const presentStudents = attendanceStore[classId]?.presentStudents || [];
  res.json({ presentStudents });
});

// MongoDB Atlas connection with options
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
      console.log('MongoDB Atlas connected successfully');
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
} else {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
    console.log('MongoDB URI not set, running without database.');
  });
}