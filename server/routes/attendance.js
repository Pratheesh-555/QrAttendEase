import express from 'express';
import { startAttendance, markAttendance, getAttendanceStatus } from '../controllers/attendanceController.js';

const router = express.Router();

// Start attendance for a class
router.post('/start', startAttendance);

// Mark student attendance
router.post('/mark', markAttendance);

// Get attendance status for a class
router.get('/:classId', getAttendanceStatus);

export default router;