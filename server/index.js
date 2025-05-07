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
app.use(cors({ origin: 'http://localhost:5173' }));  // Allows frontend requests
app.use(express.json());

// Routes
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);

// MongoDB Atlas connection with options
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