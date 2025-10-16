import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';

export const startAttendance = async (req, res) => {
  try {
    const { classId } = req.body;
    if (!classId) return res.status(400).json({ message: 'Class ID is required' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingSession = await Attendance.findOne({
      classId,
      date: { $gte: today },
      isActive: true
    });

    if (existingSession) {
      return res.status(200).json({ 
        message: 'Attendance session already active',
        attendance: existingSession 
      });
    }

    const classData = await Class.findById(classId);
    if (!classData) return res.status(404).json({ message: 'Class not found' });

    const newAttendance = new Attendance({
      classId,
      className: classData.className,
      absentStudents: classData.studentList || [],
      presentStudents: [],
      totalStudents: classData.studentCount || classData.studentList?.length || 0,
      sessionStartTime: new Date(),
      isActive: true
    });

    await newAttendance.save();
    res.status(201).json({ 
      success: true,
      message: 'Attendance session started',
      attendance: newAttendance 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { classId, studentEmail, studentName } = req.body;
    if (!classId || !studentEmail || !studentName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({ 
      classId,
      date: { $gte: today },
      isActive: true
    }).sort({ createdAt: -1 });

    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'No active attendance session found. Please ask faculty to start attendance.' 
      });
    }

    const alreadyPresent = attendance.presentStudents.some(
      s => s.email === studentEmail || s.name === studentName
    );

    if (alreadyPresent) {
      return res.status(200).json({ success: false, message: 'Attendance already marked for this student' });
    }

    const now = new Date();
    const sessionStart = new Date(attendance.sessionStartTime);
    const minutesLate = Math.floor((now - sessionStart) / (1000 * 60));
    const isLate = minutesLate > 10;
    
    attendance.presentStudents.push({
      name: studentName,
      email: studentEmail,
      timestamp: now,
      status: isLate ? 'late' : 'present',
      isLate: isLate
    });

    attendance.absentStudents = attendance.absentStudents.filter(s => s.name !== studentName);
    await attendance.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Attendance marked successfully',
      isLate: isLate,
      minutesLate: minutesLate,
      attendance 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceStatus = async (req, res) => {
  try {
    const { classId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      classId,
      date: { $gte: today },
      isActive: true
    }).sort({ createdAt: -1 });

    if (!attendance) {
      return res.status(404).json({ 
        message: 'No active attendance session',
        presentStudents: [],
        absentStudents: [],
        lateStudents: []
      });
    }

    const lateStudents = attendance.presentStudents.filter(s => s.isLate);

    res.status(200).json({
      success: true,
      presentStudents: attendance.presentStudents.map(s => s.name),
      absentStudents: attendance.absentStudents.map(s => s.name),
      lateStudents: lateStudents.map(s => ({ name: s.name, timestamp: s.timestamp })),
      totalPresent: attendance.presentStudents.length,
      totalAbsent: attendance.absentStudents.length,
      attendanceRate: attendance.attendanceRate,
      sessionStartTime: attendance.sessionStartTime
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};