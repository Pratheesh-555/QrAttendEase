import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';

export const startAttendance = async (req, res) => {
  try {
    const { classId } = req.body;
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const newAttendance = new Attendance({
      classId,
      absentStudents: classData.students,
      presentStudents: []
    });

    await newAttendance.save();
    res.status(201).json(newAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { classId, studentEmail, studentName } = req.body;
    const attendance = await Attendance.findOne({ classId });

    if (!attendance) {
      return res.status(404).json({ message: 'No active attendance session' });
    }

    // Remove from absent list and add to present list
    const studentIndex = attendance.absentStudents.findIndex(s => s.name === studentName);
    if (studentIndex > -1) {
      const student = attendance.absentStudents.splice(studentIndex, 1)[0];
      attendance.presentStudents.push({
        name: student.name,
        email: studentEmail,
        timestamp: new Date()
      });
    }

    await attendance.save();
    res.status(200).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};