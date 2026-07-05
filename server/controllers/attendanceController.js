import Attendance from '../models/Attendance.js';
import AttendanceAudit from '../models/AttendanceAudit.js';
import Class from '../models/Class.js';
import mongoose from 'mongoose';
import { appendAudit, generateId, readStore, writeStore } from '../config/localStore.js';
import { createAttendanceQrSession, hashAttendanceQrToken, isValidAttendanceQrToken } from '../utils/attendanceQr.js';

const useLocalStore = () => mongoose.connection.readyState !== 1;

const getDayStartIso = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.toISOString();
};

const getNowIso = () => new Date().toISOString();

const isSameDayOrLater = (value, dayStartIso) => {
  const dateValue = new Date(value).getTime();
  const dayStart = new Date(dayStartIso).getTime();
  return dateValue >= dayStart;
};

const mapLocalAttendance = (session) => ({
  _id: session._id,
  classId: session.classId,
  className: session.className,
  date: session.date,
  sessionStartTime: session.sessionStartTime,
  sessionEndTime: session.sessionEndTime || null,
  presentStudents: session.presentStudents || [],
  absentStudents: session.absentStudents || [],
  totalStudents: session.totalStudents || 0,
  attendanceRate: session.attendanceRate || 0,
  isActive: session.isActive !== false,
  createdAt: session.createdAt || session.sessionStartTime,
  updatedAt: session.updatedAt || session.sessionStartTime
});

const attachLocalQrSession = (session) => {
  const qrSession = createAttendanceQrSession();
  session.qrTokenHash = qrSession.tokenHash;
  session.qrIssuedAt = qrSession.issuedAt.toISOString();
  session.qrTokenExpiresAt = qrSession.expiresAt.toISOString();
  session.updatedAt = qrSession.issuedAt.toISOString();
  return { session, qrToken: qrSession.token };
};

const buildMongoAttendanceResponse = (attendanceDoc, qrToken) => ({
  ...(() => {
    const response = attendanceDoc.toObject();
    delete response.qrTokenHash;
    return response;
  })(),
  qrToken
});

const buildLocalAttendanceResponse = (attendance, qrToken) => ({
  ...mapLocalAttendance(attendance),
  qrToken
});

const findLocalAttendanceByQrToken = (store, qrToken) => {
  const tokenHash = hashAttendanceQrToken(qrToken);
  const now = new Date();
  return store.attendance.find((session) => {
    if (!session.isActive || session.qrTokenHash !== tokenHash) return false;
    if (!session.qrTokenExpiresAt) return false;
    return new Date(session.qrTokenExpiresAt).getTime() >= now.getTime();
  });
};

const findMongoAttendanceByQrToken = async (qrToken) => {
  const tokenHash = hashAttendanceQrToken(qrToken);
  const now = new Date();
  return Attendance.findOne({
    qrTokenHash: tokenHash,
    qrTokenExpiresAt: { $gte: now },
    isActive: true
  }).sort({ createdAt: -1 });
};

const normalizeStudentName = (studentEmail, studentName) => {
  if (studentName && studentName.trim()) return studentName.trim();
  if (studentEmail && studentEmail.includes('@')) return studentEmail.split('@')[0];
  return studentEmail || 'Student';
};

const logAudit = async ({ classId, className, eventType, actorEmail, actorName, detail, qrToken, req }) => {
  const payload = {
    classId: classId ? String(classId) : undefined,
    className,
    eventType,
    actorEmail,
    actorName,
    detail,
    qrTokenHashPrefix: qrToken ? hashAttendanceQrToken(qrToken).slice(0, 12) : undefined,
    ipAddress: req?.ip,
    userAgent: req?.headers?.['user-agent']
  };

  if (useLocalStore()) {
    await appendAudit(payload);
    return;
  }

  await AttendanceAudit.create(payload);
};

export const startAttendance = async (req, res) => {
  try {
    const { classId } = req.body;
    if (!classId) return res.status(400).json({ message: 'Class ID is required' });

    if (useLocalStore()) {
      const store = await readStore();
      const todayStart = getDayStartIso();

      const existingSession = store.attendance.find(
        (session) => session.classId === classId && isSameDayOrLater(session.date, todayStart) && session.isActive
      );

      if (existingSession) {
        const qrSession = attachLocalQrSession(existingSession);
        await writeStore(store);
        await logAudit({
          classId,
          className: existingSession.className,
          eventType: 'session_refreshed',
          detail: 'Active session QR token refreshed',
          qrToken: qrSession.qrToken,
          req
        });
        return res.status(200).json({
          message: 'Attendance session already active',
          attendance: buildLocalAttendanceResponse(qrSession.session, qrSession.qrToken)
        });
      }

      const classData = store.classes.find((item) => item._id === classId);
      if (!classData) return res.status(404).json({ message: 'Class not found' });

      const nowIso = getNowIso();
      const newAttendance = mapLocalAttendance({
        _id: generateId(),
        classId,
        className: classData.className,
        date: todayStart,
        sessionStartTime: nowIso,
        sessionEndTime: null,
        presentStudents: [],
        absentStudents: classData.studentList || [],
        totalStudents: classData.studentCount || classData.studentList?.length || 0,
        attendanceRate: 0,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      });

      const qrSession = attachLocalQrSession(newAttendance);

      store.attendance.unshift(qrSession.session);
      await writeStore(store);
      await logAudit({
        classId,
        className: classData.className,
        eventType: 'session_started',
        detail: 'Attendance session created',
        qrToken: qrSession.qrToken,
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Attendance session started',
        attendance: buildLocalAttendanceResponse(qrSession.session, qrSession.qrToken)
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingSession = await Attendance.findOne({
      classId,
      date: { $gte: today },
      isActive: true
    });

    if (existingSession) {
      const qrSession = createAttendanceQrSession();
      existingSession.qrTokenHash = qrSession.tokenHash;
      existingSession.qrIssuedAt = qrSession.issuedAt;
      existingSession.qrTokenExpiresAt = qrSession.expiresAt;
      await existingSession.save();
      await logAudit({
        classId,
        className: existingSession.className,
        eventType: 'session_refreshed',
        detail: 'Active session QR token refreshed',
        qrToken: qrSession.token,
        req
      });
      return res.status(200).json({ 
        message: 'Attendance session already active',
        attendance: buildMongoAttendanceResponse(existingSession, qrSession.token)
      });
    }

    const classData = await Class.findById(classId);
    if (!classData) return res.status(404).json({ message: 'Class not found' });

    const qrSession = createAttendanceQrSession();

    const newAttendance = new Attendance({
      classId,
      className: classData.className,
      absentStudents: classData.studentList || [],
      presentStudents: [],
      totalStudents: classData.studentCount || classData.studentList?.length || 0,
      sessionStartTime: new Date(),
      qrTokenHash: qrSession.tokenHash,
      qrIssuedAt: qrSession.issuedAt,
      qrTokenExpiresAt: qrSession.expiresAt,
      isActive: true
    });

    await newAttendance.save();
    await logAudit({
      classId,
      className: classData.className,
      eventType: 'session_started',
      detail: 'Attendance session created',
      qrToken: qrSession.token,
      req
    });
    res.status(201).json({ 
      success: true,
      message: 'Attendance session started',
      attendance: buildMongoAttendanceResponse(newAttendance, qrSession.token) 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { classId, qrToken, studentEmail, studentName } = req.body;
    if ((!classId && !qrToken) || !studentEmail) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (qrToken && !isValidAttendanceQrToken(qrToken)) {
      await logAudit({
        classId,
        eventType: 'mark_invalid',
        actorEmail: studentEmail,
        actorName: studentName,
        detail: 'Malformed QR token submitted',
        qrToken,
        req
      });
      return res.status(400).json({ success: false, message: 'Invalid QR token format' });
    }

    const resolvedStudentName = normalizeStudentName(studentEmail, studentName);

    if (useLocalStore()) {
      const store = await readStore();
      const todayStart = getDayStartIso();
      const attendance = qrToken
        ? findLocalAttendanceByQrToken(store, qrToken)
        : store.attendance.find(
            (session) => session.classId === classId && isSameDayOrLater(session.date, todayStart) && session.isActive
          );

      if (!attendance) {
        await logAudit({
          classId,
          eventType: 'mark_rejected',
          actorEmail: studentEmail,
          actorName: resolvedStudentName,
          detail: qrToken ? 'Expired or unknown QR token' : 'No active attendance session',
          qrToken,
          req
        });
        return res.status(404).json({
          success: false,
          message: 'No active attendance session found or QR token expired. Please ask faculty to refresh attendance.'
        });
      }

      const alreadyPresent = (attendance.presentStudents || []).some(
        (student) => student.email === studentEmail || student.name === resolvedStudentName
      );

      if (alreadyPresent) {
        await logAudit({
          classId: attendance.classId,
          className: attendance.className,
          eventType: 'mark_duplicate',
          actorEmail: studentEmail,
          actorName: resolvedStudentName,
          detail: 'Duplicate attendance attempt rejected',
          qrToken,
          req
        });
        return res.status(200).json({ success: false, message: 'Attendance already marked for this student' });
      }

      const sessionStart = new Date(attendance.sessionStartTime);
      const minutesLate = Math.floor((Date.now() - sessionStart.getTime()) / (1000 * 60));
      const isLate = minutesLate > 10;
      const nowIso = getNowIso();

      attendance.presentStudents = attendance.presentStudents || [];
      attendance.presentStudents.push({
        name: resolvedStudentName,
        email: studentEmail,
        timestamp: nowIso,
        status: isLate ? 'late' : 'present',
        isLate
      });

      attendance.absentStudents = (attendance.absentStudents || []).filter((student) => student.name !== resolvedStudentName);
      attendance.totalStudents = attendance.totalStudents || attendance.presentStudents.length + attendance.absentStudents.length;
      attendance.attendanceRate = attendance.totalStudents > 0
        ? Number(((attendance.presentStudents.length / attendance.totalStudents) * 100).toFixed(2))
        : 0;
      attendance.updatedAt = nowIso;

      await writeStore(store);
      await logAudit({
        classId: attendance.classId,
        className: attendance.className,
        eventType: 'mark_success',
        actorEmail: studentEmail,
        actorName: resolvedStudentName,
        detail: isLate ? 'Attendance marked late' : 'Attendance marked on time',
        qrToken,
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Attendance marked successfully',
        isLate,
        minutesLate,
        attendance: mapLocalAttendance(attendance)
      });
    }

    const attendance = qrToken
      ? await findMongoAttendanceByQrToken(qrToken)
      : await Attendance.findOne({ 
          classId,
          date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          isActive: true
        }).sort({ createdAt: -1 });

    if (!attendance) {
      await logAudit({
        classId,
        eventType: 'mark_rejected',
        actorEmail: studentEmail,
        actorName: resolvedStudentName,
        detail: qrToken ? 'Expired or unknown QR token' : 'No active attendance session',
        qrToken,
        req
      });
      return res.status(404).json({ 
        success: false,
        message: 'No active attendance session found or QR token expired. Please ask faculty to refresh attendance.' 
      });
    }

    const alreadyPresent = attendance.presentStudents.some(
      s => s.email === studentEmail || s.name === resolvedStudentName
    );

    if (alreadyPresent) {
      await logAudit({
        classId: attendance.classId,
        className: attendance.className,
        eventType: 'mark_duplicate',
        actorEmail: studentEmail,
        actorName: resolvedStudentName,
        detail: 'Duplicate attendance attempt rejected',
        qrToken,
        req
      });
      return res.status(200).json({ success: false, message: 'Attendance already marked for this student' });
    }

    const now = new Date();
    const sessionStart = new Date(attendance.sessionStartTime);
    const minutesLate = Math.floor((now - sessionStart) / (1000 * 60));
    const isLate = minutesLate > 10;
    
    attendance.presentStudents.push({
      name: resolvedStudentName,
      email: studentEmail,
      timestamp: now,
      status: isLate ? 'late' : 'present',
      isLate: isLate
    });

    attendance.absentStudents = attendance.absentStudents.filter(s => s.name !== resolvedStudentName);
    await attendance.save();
    await logAudit({
      classId: attendance.classId,
      className: attendance.className,
      eventType: 'mark_success',
      actorEmail: studentEmail,
      actorName: resolvedStudentName,
      detail: isLate ? 'Attendance marked late' : 'Attendance marked on time',
      qrToken,
      req
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Attendance marked successfully',
      isLate: isLate,
      minutesLate: minutesLate,
      attendance: (() => {
        const response = attendance.toObject();
        delete response.qrTokenHash;
        return response;
      })()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceStatus = async (req, res) => {
  try {
    const { classId } = req.params;

    if (useLocalStore()) {
      const store = await readStore();
      const todayStart = getDayStartIso();
      const attendance = store.attendance.find(
        (session) => session.classId === classId && isSameDayOrLater(session.date, todayStart) && session.isActive
      );

      if (!attendance) {
        return res.status(404).json({
          message: 'No active attendance session',
          presentStudents: [],
          absentStudents: [],
          lateStudents: []
        });
      }

      const lateStudents = (attendance.presentStudents || []).filter((student) => student.isLate);

      return res.status(200).json({
        success: true,
        presentStudents: (attendance.presentStudents || []).map((student) => student.name),
        absentStudents: (attendance.absentStudents || []).map((student) => student.name),
        lateStudents: lateStudents.map((student) => ({ name: student.name, timestamp: student.timestamp })),
        totalPresent: attendance.presentStudents?.length || 0,
        totalAbsent: attendance.absentStudents?.length || 0,
        attendanceRate: attendance.attendanceRate || 0,
        sessionStartTime: attendance.sessionStartTime
      });
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

export const getAttendanceHistory = async (req, res) => {
  try {
    const { classId } = req.params;

    if (useLocalStore()) {
      const store = await readStore();
      const sessions = store.attendance
        .filter((session) => (!classId || session.classId === classId))
        .sort((a, b) => new Date(b.createdAt || b.sessionStartTime) - new Date(a.createdAt || a.sessionStartTime));

      const history = sessions.map((session) => ({
        id: session._id,
        classId: session.classId,
        className: session.className,
        date: session.date,
        sessionStartTime: session.sessionStartTime,
        sessionEndTime: session.sessionEndTime || null,
        present: session.presentStudents?.length || 0,
        absent: session.absentStudents?.length || 0,
        total: session.totalStudents || (session.presentStudents?.length || 0) + (session.absentStudents?.length || 0),
        percentage: session.attendanceRate || 0,
        late: session.presentStudents?.filter((student) => student.isLate).length || 0,
        isActive: session.isActive
      }));

      return res.status(200).json({ success: true, history });
    }

    const query = classId ? { classId } : {};

    const sessions = await Attendance.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const history = sessions.map((session) => ({
      id: session._id,
      classId: session.classId?.toString?.() || session.classId,
      className: session.className,
      date: session.date,
      sessionStartTime: session.sessionStartTime,
      sessionEndTime: session.sessionEndTime || null,
      present: session.presentStudents?.length || 0,
      absent: session.absentStudents?.length || 0,
      total: session.totalStudents || (session.presentStudents?.length || 0) + (session.absentStudents?.length || 0),
      percentage: session.attendanceRate || 0,
      late: session.presentStudents?.filter((student) => student.isLate).length || 0,
      isActive: session.isActive
    }));

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceAudit = async (req, res) => {
  try {
    const { classId } = req.params;

    if (useLocalStore()) {
      const store = await readStore();
      const audits = store.audits
        .filter((entry) => (!classId || entry.classId === String(classId)))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100);

      return res.status(200).json({ success: true, audits });
    }

    const query = classId ? { classId: String(classId) } : {};
    const audits = await AttendanceAudit.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({ success: true, audits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};