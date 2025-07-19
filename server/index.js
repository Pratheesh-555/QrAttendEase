import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import classRoutes from './routes/class.js';
import attendanceRoutes from './routes/attendance.js';

// Get directory path for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors({ origin: 'https://attendeaze.netlify.app' }));  // Allows frontend requests
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
  if (!attendanceStore[classId]) attendanceStore[classId] = { presentStudents: [] };
  // Prevent duplicates
  if (!attendanceStore[classId].presentStudents.some(s => s.studentEmail === studentEmail)) {
    attendanceStore[classId].presentStudents.push({ studentEmail, studentName });
  }
  res.json({ success: true });
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