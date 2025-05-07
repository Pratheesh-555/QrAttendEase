import express from 'express';
import Attendance from '../models/Attendance.js';

const router = express.Router();

// Start attendance for a class
router.post('/start', async (req, res) => {
  try {
    const newAttendance = new Attendance({
      classId: req.body.classId,
      absentStudents: req.body.students,
      presentStudents: []
    });
    const savedAttendance = await newAttendance.save();
    res.status(201).json(savedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark student attendance
router.post('/mark', async (req, res) => {
  try {
    const attendance = await Attendance.findOne({ 
      classId: req.body.classId,
      createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No active attendance session' });
    }

    // Move student from absent to present
    const studentIndex = attendance.absentStudents.findIndex(
      s => s.name === req.body.studentName
    );

    if (studentIndex > -1) {
      const student = attendance.absentStudents.splice(studentIndex, 1)[0];
      attendance.presentStudents.push({
        name: student.name,
        email: req.body.studentEmail,
        timestamp: new Date()
      });
      await attendance.save();
      res.json({ success: true, message: 'Attendance marked successfully' });
    } else {
      res.status(400).json({ message: 'Student already marked present' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;