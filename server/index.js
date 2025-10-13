import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import classRoutes from './routes/class.js';
import attendanceRoutes from './routes/attendance.js';
import { apiLimiter, attendanceLimiter } from './middleware/rateLimiter.js';

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

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/attendance/mark', attendanceLimiter);

// Routes
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);

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