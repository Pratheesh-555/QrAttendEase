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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const allowedOrigins = ['https://attendeaze.netlify.app', 'http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ 
  origin: (origin, callback) => {
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
app.use('/api/', apiLimiter);
app.use('/api/attendance/mark', attendanceLimiter);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);

const PORT = process.env.PORT || 5000;

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
  })
  .catch(err => {
    console.warn('⚠️  MongoDB connection failed:', err.message);
    console.log('📝 Running in demo mode without database');
    console.log('💡 To enable database: Install MongoDB or add MongoDB Atlas URI to server/.env');
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
  });
} else {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (Demo Mode - No Database)`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log('💡 To enable database: Add MONGODB_URI to server/.env file');
  });
}