import express from 'express';
import { startAttendance, markAttendance, getAttendanceStatus, getAttendanceHistory, getAttendanceAudit } from '../controllers/attendanceController.js';
import { qrLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Start attendance for a class
router.post('/start', qrLimiter, startAttendance);

// Mark student attendance
router.post('/mark', markAttendance);

// Get attendance history
router.get('/history/:classId?', getAttendanceHistory);

// Get attendance audit trail
router.get('/audit/:classId?', getAttendanceAudit);

// Get attendance status for a class
router.get('/:classId', getAttendanceStatus);

export default router;