import axios from 'axios';

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const classApi = {
  // Upload class list
  uploadClass: async (teacherEmail, className, students) => {
    const response = await axios.post(`${API_URL}/classes`, {
      teacherEmail,
      className,
      students
    });
    return response.data;
  },

  // Get teacher's classes
  getClasses: async (teacherEmail) => {
    const response = await axios.get(`${API_URL}/classes/${teacherEmail}`);
    return response.data;
  },

  // Start attendance for a class
  startAttendance: async (classId) => {
    try {
      const response = await axios.post(`${API_URL}/attendance/start`, { classId });
      return response.data;
    } catch (error) {
      console.error('Error starting attendance:', error);
      throw error;
    }
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
      console.error('Error marking attendance:', error);
      return { success: false, message: 'Failed to mark attendance.' };
    }
  },

  // Get attendance status
  getAttendanceStatus: async (classId) => {
    try {
      const response = await axios.get(`${API_URL}/attendance/${classId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting attendance status:', error);
      throw error;
    }
  },

  // Upload student list
  uploadStudentList: async (teacherEmail, className, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('teacherEmail', teacherEmail);
    formData.append('className', className);

    const response = await axios.post(
      `${API_URL}/classes/upload-students`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  // Get student list
  getStudentList: async (classId) => {
    const response = await axios.get(`${API_URL}/classes/${classId}/students`);
    return response.data;
  }
};