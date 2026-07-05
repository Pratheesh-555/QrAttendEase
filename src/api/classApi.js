import axios from 'axios';

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const classApi = {
  // Get teacher's classes
  getClasses: async (teacherEmail) => {
    const response = await axios.get(`${API_URL}/classes/${teacherEmail}`);
    return response.data;
  },

  // Add a new class
  addClass: async (teacherEmail, className, time) => {
    const response = await axios.post(`${API_URL}/classes`, {
      teacherEmail,
      className,
      time
    });
    return response.data;
  },

  // Delete a class
  deleteClass: async (classId) => {
    const response = await axios.delete(`${API_URL}/classes/${classId}`);
    return response.data;
  },

  // Start attendance for a class
  startAttendance: async (classId) => {
    const response = await axios.post(`${API_URL}/attendance/start`, { classId });
    return response.data;
  },

  // Mark student attendance
  markAttendance: async (classId, studentEmail, studentName) => {
    try {
      const response = await axios.post(`${API_URL}/attendance/mark`, {
        classId,
        studentEmail,
        studentName
      });
      if (response.data && response.data.error === 'Already marked') {
        return { success: false, message: 'Attendance already marked for this student.' };
      }
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        return { success: false, message: error.response.data.message };
      }
      return { success: false, message: 'Failed to mark attendance.' };
    }
  },

  // Mark student attendance using a scanned QR token
  markAttendanceByToken: async (qrToken, studentEmail, studentName) => {
    try {
      const response = await axios.post(`${API_URL}/attendance/mark`, {
        qrToken,
        studentEmail,
        studentName
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        return { success: false, message: error.response.data.message };
      }
      return { success: false, message: 'Failed to mark attendance.' };
    }
  },

  // Get attendance status
  getAttendanceStatus: async (classId) => {
    const response = await axios.get(`${API_URL}/attendance/${classId}`);
    return response.data;
  },

  // Get student list
  getStudentList: async (classId) => {
    const response = await axios.get(`${API_URL}/classes/${classId}/students`);
    return response.data;
  },

  // Update student list for a class
  updateStudentList: async (classId, studentList) => {
    const response = await axios.put(`${API_URL}/classes/${classId}/students`, {
      studentList
    });
    return response.data;
  },

  // Get attendance history for analytics
  getAttendanceHistory: async (classId = null) => {
    const endpoint = classId ? `${API_URL}/attendance/history/${classId}` : `${API_URL}/attendance/history`;
    const response = await axios.get(endpoint);
    return response.data;
  },

  // Get attendance audit trail
  getAttendanceAudit: async (classId = null) => {
    const endpoint = classId ? `${API_URL}/attendance/audit/${classId}` : `${API_URL}/attendance/audit`;
    const response = await axios.get(endpoint);
    return response.data;
  }
};