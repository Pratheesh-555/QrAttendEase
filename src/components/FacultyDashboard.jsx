import { useCallback, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { toast } from 'react-hot-toast'; 
import { Plus, List, BarChart3, LogOut, Users, Calendar, TrendingUp, Award, Zap, Shield, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import CryptoJS from 'crypto-js';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import emailjs from '@emailjs/browser';
import axios from 'axios';
import { emailConfig } from '../config/email';
import { classApi } from '../api/classApi';

import ClassList from './dashboard/ClassList';
import QRCodeSection from './dashboard/QRCodeSection';
import AttendanceStatus from './dashboard/AttendanceStatus';
import AddClassModal from './dashboard/AddClassModal';
import QRModal from './dashboard/QRModal';
import LoadingSpinner from './common/LoadingSpinner';
import EmptyState from './common/EmptyState';
import StudentListModal from './dashboard/StudentListModal';
import AttendanceHistory from './dashboard/AttendanceHistory';
import LateArrivalIndicator from './dashboard/LateArrivalIndicator';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('facultyClasses');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedClass, setSelectedClass] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [presentStudents, setPresentStudents] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [studentListUploaded, setStudentListUploaded] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [lateStudents, setLateStudents] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  const [newClass, setNewClass] = useState({
    name: '',
    time: format(new Date(), 'HH:mm'),
    studentCount: 0
  });

  useEffect(() => {
    // Load user info
    const cachedUser = localStorage.getItem('userData');
    if (cachedUser) {
      try {
        setUserInfo(JSON.parse(cachedUser));
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
    
    // Remove default classes if present in localStorage
    const saved = localStorage.getItem('facultyClasses');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.some(c => c.name === 'Web Development' || c.name === 'Database Systems')) {
        localStorage.setItem('facultyClasses', JSON.stringify([]));
        setClasses([]);
      }
    }
    localStorage.setItem('facultyClasses', JSON.stringify(classes));
  }, [classes]);

  const handleDeleteClass = useCallback((classId) => {
    if (deleteConfirm === classId) {
      const updatedClasses = classes.filter(c => c.id !== classId);
      setClasses(updatedClasses);
      localStorage.setItem('facultyClasses', JSON.stringify(updatedClasses));
      
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
        setShowQR(false);
      }
      setDeleteConfirm(null);
      toast.success('Class deleted successfully');
    } else {
      setDeleteConfirm(classId);
      toast('Click again to confirm deletion', { icon: '⚠️' });
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }, [deleteConfirm, selectedClass, classes]);

  const handleAddClass = useCallback(() => {
    if (!newClass.name.trim()) {
      toast.error('Please enter a class name');
      return;
    }

    const newId = Date.now();
    const updatedClasses = [...classes, { id: newId, ...newClass }];
    setClasses(updatedClasses);
    localStorage.setItem('facultyClasses', JSON.stringify(updatedClasses));
    toast.success('Class added successfully');
    setNewClass({ name: '', time: format(new Date(), 'HH:mm'), studentCount: 0 });
    setShowAddModal(false);
  }, [newClass, classes]);

  const handleViewStudents = useCallback(async (cls) => {
    try {
      const response = await axios.get(`https://attendease-yu7r.onrender.com/api/classes/${cls.id}`);
      if (response.data.studentList?.length) {
        setShowStudentList(true);
        setSelectedClass(prev => ({
          ...prev,
          studentList: response.data.studentList
        }));
      } else {
        toast.error('No student list available. Please upload an Excel file first.');
      }
    } catch (error) {
      toast.error('Failed to fetch student list');
    }
  }, []);
  

  const generateQRCode = useCallback((classInfo, containerId = 'qr-code', showToast = false) => {
    if (!classInfo) {
      toast.error('No class selected');
      return null;
    }
    
    setIsGeneratingQR(true);
    
    try {
      const payload = {
        classId: classInfo.id,
        className: classInfo.name,
        date: format(new Date(), 'yyyy-MM-dd'),
        timestamp: new Date().getTime(),
        nonce: Math.random().toString(36).substring(7)
      };
  
      const secretKey = 'attendance-qr-secret-key';
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), secretKey).toString();
  
      const element = document.getElementById(containerId);
      if (!element) {
        setIsGeneratingQR(false);
        toast.error('QR container not found. Please try again.');
        return null;
      }
      
      try {
        element.innerHTML = '';
        const codeWriter = new BrowserQRCodeSvgWriter();
        const qrSize = containerId === 'qr-code' ? 300 : 500;
        
        // Generate QR code with better error correction
        const svg = codeWriter.write(encrypted, qrSize, qrSize);
        element.appendChild(svg);
        
        setQrValue(encrypted);
        if (showToast) {
          toast.success('QR Code generated successfully');
        }
        setIsGeneratingQR(false);
        return encrypted;
      } catch (err) {
        setIsGeneratingQR(false);
        toast.error('Failed to write QR code');
        return null;
      }
    } catch (error) {
      setIsGeneratingQR(false);
      toast.error('Failed to generate QR code');
      return null;
    }
  }, []);

  const handleManualRefresh = useCallback(() => {
    if (!selectedClass) return;
    generateQRCode(selectedClass, 'qr-code', true);
  }, [selectedClass, generateQRCode]);

  const handleClassSelection = useCallback((cls) => {
    setLoading(true);
    setSelectedClass(cls);
    
    setTimeout(() => {
      setShowQR(false);
      setPresentStudents([]);
      setAbsentStudents([]);
      setLoading(false);
      toast.success(`${cls.name} selected`);
    }, 300);
  }, []);

  const readExcelFile = useCallback(async (file) => {
    if (!selectedClass) {
      toast.error('No class selected');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', selectedClass.id);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          // Extract names from first column, filter empty values
          const studentNames = jsonData
            .flat()
            .filter(name => name && typeof name === 'string' && name.trim());

          setSelectedClass(prev => ({
            ...prev,
            studentList: studentNames.map(name => ({ name }))
          }));
          setAbsentStudents(studentNames);
          toast.success(`Uploaded ${studentNames.length} students`);
        } catch (error) {
          toast.error('Failed to process file');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast.error('Failed to upload student list');
    }
  }, [selectedClass]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedClass || !acceptedFiles.length) return;
    setLoading(true);
    try {
      await readExcelFile(acceptedFiles[0]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, readExcelFile]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm']
    },
    multiple: false,
    onDropRejected: () => {
      toast.error('Please upload a valid file');
    }
  });

  const startAttendance = useCallback(async () => {
    if (!selectedClass) {
      toast.error('No class selected');
      return;
    }
    
    if (!selectedClass.studentList || selectedClass.studentList.length === 0) {
      toast.error('Please upload student list first');
      return;
    }
    
    try {
      // Try to initialize attendance session on backend (optional)
      try {
        await classApi.startAttendance(selectedClass.id);
      } catch (backendError) {
        // Backend may be unavailable, continue with local mode
      }
      
      setShowQR(true);
      setPresentStudents([]); // Clear previous attendance
      setLateStudents([]); // Clear late students
      setSessionStartTime(new Date()); // Track session start time
      setAbsentStudents(selectedClass.studentList.map(s => s.name || s));
      
      // Generate QR code after DOM update
      setTimeout(() => {
        const qrGenerated = generateQRCode(selectedClass);
        if (!qrGenerated) {
          toast.error('Failed to generate QR code. Please try clicking "Refresh QR Code".');
        }
      }, 50);
      
      toast.success('Attendance session started');
    } catch (error) {
      toast.error('Failed to start attendance session');
      setShowQR(false);
    }
  }, [selectedClass, generateQRCode]);

  const stopAttendance = useCallback(() => {
    setShowQR(false);
    toast('Attendance session stopped', { icon: '🛑' });
  }, []);

  const handleQRClick = useCallback(() => {
    setShowQRModal(true);
    // Use requestAnimationFrame for immediate but smooth rendering
    requestAnimationFrame(() => {
      generateQRCode(selectedClass, 'qr-code-modal',false);
    });
  }, [selectedClass, generateQRCode]);

  const handleMarkPresent = useCallback((student) => {
    setPresentStudents(prev => [...prev, student]);
    setAbsentStudents(prev => prev.filter(s => s !== student));
  }, []);

  const handleCloseAttendance = useCallback(async () => {
    if (!selectedClass || !absentStudents.length) {
      toast.error('No absent students to report');
      return;
    }

    setIsSendingEmail(true);
    try {
      const templateParams = {
        to_email: 'faculty@example.com', // Replace with actual faculty email
        class_name: selectedClass.name,
        date: format(new Date(), 'PPP'),
        absent_count: absentStudents.length,
        absent_list: absentStudents.join(', '),
        total_students: selectedClass.studentCount
      };

      await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        templateParams,
        emailConfig.publicKey
      );

      toast.success('Attendance report sent successfully');
      setShowQR(false);
      setPresentStudents([]);
      setAbsentStudents([]);
    } catch (error) {
      toast.error('Failed to send attendance report');
    } finally {
      setIsSendingEmail(false);
    }
  }, [selectedClass, absentStudents]);

  useEffect(() => {
    let pollInterval;
    if (selectedClass && showQR) {
      const fetchAttendance = async () => {
        try {
          const response = await classApi.getAttendanceStatus(selectedClass.id);
          if (response.presentStudents && Array.isArray(response.presentStudents)) {
            setPresentStudents(response.presentStudents);
          }
          if (response.lateStudents && Array.isArray(response.lateStudents)) {
            setLateStudents(response.lateStudents);
          }
        } catch (error) {
          // Silently handle polling errors
        }
      };
      
      // Fetch immediately when starting
      fetchAttendance();
      
      // Then poll every 2 seconds for real-time updates
      pollInterval = setInterval(fetchAttendance, 2000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [selectedClass, showQR]);

  const handleSignOut = () => {
    localStorage.removeItem('googleToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('lastRoute');
    navigate('/');
    toast.success('👋 Signed out successfully');
  };

  // Calculate dashboard stats
  const totalClasses = classes.length;
  const activeSession = showQR ? 1 : 0;
  const totalPresent = presentStudents.length;
  const totalAbsent = absentStudents.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-gray-100 py-6 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px 24px',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          },
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {userInfo?.picture ? (
                <motion.img 
                  src={userInfo.picture} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full border-4 border-white shadow-xl"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-xl">
                  {userInfo?.name?.charAt(0) || 'F'}
                </div>
              )}
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center">
                  <Shield className="w-8 h-8 mr-3 text-purple-300" />
                  Faculty Dashboard
                </h1>
                <p className="text-purple-200 text-sm sm:text-base mt-1">
                  {userInfo?.name || 'Welcome, Professor'} • {userInfo?.email || ''}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2 border border-white/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-blue-300" />
                <span className="text-3xl font-bold text-white">{totalClasses}</span>
              </div>
              <p className="text-purple-200 text-sm font-medium">Total Classes</p>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-green-300" />
                <span className="text-3xl font-bold text-white">{activeSession}</span>
              </div>
              <p className="text-purple-200 text-sm font-medium">Active Sessions</p>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-300" />
                <span className="text-3xl font-bold text-white">{totalPresent}</span>
              </div>
              <p className="text-purple-200 text-sm font-medium">Present Today</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-4 shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-white" />
                <span className="text-3xl font-bold text-white">{totalAbsent}</span>
              </div>
              <p className="text-white text-sm font-medium">Absent Today</p>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHistory(true)}
              className="bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-all flex items-center justify-center flex-1 border border-white/20 font-semibold"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Analytics & Reports
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all flex items-center justify-center flex-1 shadow-xl font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Class
            </motion.button>
          </div>
        </motion.div>
        
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <ClassList 
            classes={classes}
            selectedClass={selectedClass}
            onClassSelect={handleClassSelection}
            onDeleteClass={handleDeleteClass}
            deleteConfirm={deleteConfirm}
            onViewStudents={handleViewStudents}
          />
          
          <div className="space-y-4 sm:space-y-6">
            <AnimatePresence mode="wait">
              {loading ? (
                <LoadingSpinner size="lg" color="purple" />
              ) : selectedClass ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <QRCodeSection 
                    showQR={showQR}
                    isGeneratingQR={isGeneratingQR}
                    onStartAttendance={startAttendance}
                    onStopAttendance={stopAttendance}
                    onRefresh={handleManualRefresh}
                    onQRClick={handleQRClick}
                    onCloseAttendance={handleCloseAttendance}
                    isSendingEmail={isSendingEmail}
                  />
                  
                  <AttendanceStatus 
                    showAttendance={showAttendance}
                    presentStudents={presentStudents}
                    absentStudents={absentStudents}
                    onToggleView={() => setShowAttendance(!showAttendance)}
                    getRootProps={studentListUploaded ? undefined : getRootProps}
                    getInputProps={studentListUploaded ? undefined : getInputProps}
                    onMarkPresent={handleMarkPresent}
                    studentListUploaded={studentListUploaded}
                  />
                  
                  {/* Late Arrival Tracking */}
                  {showQR && presentStudents.length > 0 && sessionStartTime && (
                    <div className="bg-gray-800 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Attendance Breakdown</h3>
                      <LateArrivalIndicator 
                        students={presentStudents}
                        sessionStartTime={sessionStartTime}
                        gracePeriodMinutes={selectedClass?.gracePeriodMinutes || 10}
                      />
                    </div>
                  )}
                </motion.div>
              ) : (
                <EmptyState 
                  icon={List}
                  title="No Class Selected"
                  message="Select a class to view attendance options"
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AddClassModal 
        isOpen={showAddModal}
        newClass={newClass}
        onClose={() => setShowAddModal(false)}
        onChange={setNewClass}
        onSubmit={handleAddClass}
      />

      <QRModal 
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        onRefresh={handleManualRefresh}
        isGeneratingQR={isGeneratingQR}
      />

      <StudentListModal 
        isOpen={showStudentList}
        onClose={() => setShowStudentList(false)}
        students={selectedClass?.student_list || []}
        className={selectedClass?.name}
      />

      {showHistory && (
        <AttendanceHistory 
          classes={classes}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default FacultyDashboard;