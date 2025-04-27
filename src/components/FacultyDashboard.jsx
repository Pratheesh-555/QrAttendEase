import React, { useState, useEffect, useCallback, memo } from 'react';
import { format } from 'date-fns';
import { Clock, Users, RefreshCw, List, Upload, Plus, Trash2, Eye, EyeOff, UserCheck, UserX, X } from 'lucide-react';
import { BrowserQRCodeSvgWriter } from '@zxing/library';
import CryptoJS from 'crypto-js';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

// Memoized Class Card Component for better performance
const ClassCard = memo(({ cls, isSelected, onSelect, onDelete, deleteConfirm }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
    className={`bg-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-600 ${
      isSelected ? 'ring-2 ring-purple-500 bg-gray-600' : ''
    }`}
  >
    <div className="flex justify-between items-center">
      <div 
        className="flex-1 cursor-pointer" 
        onClick={() => onSelect(cls)}
      >
        <h3 className="font-medium text-lg text-purple-300">{cls.name}</h3>
        <div className="flex items-center text-gray-400 text-sm mt-1">
          <Clock className="w-4 h-4 mr-1" />
          {format(new Date(`2000-01-01T${cls.time}`), 'hh:mm a')}
          <Users className="w-4 h-4 ml-3 mr-1" />
          {cls.studentCount} students
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onDelete(cls.id)}
        className={`p-2 rounded-lg transition-all duration-200 ${
          deleteConfirm === cls.id 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-gray-600 hover:bg-gray-500'
        }`}
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </div>
  </motion.div>
));

// Add this component after the ClassCard component and before FacultyDashboard
const QRModal = memo(({ isOpen, onClose, onRefresh, encrypted, timeLeft, isGeneratingQR }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg p-8 relative max-w-2xl w-full mx-4"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center">
            <div className="bg-white p-8 rounded-lg relative mb-4">
              <div 
                id="qr-code-modal" 
                className="mx-auto flex items-center justify-center min-h-[400px] min-w-[400px]"
              />
              <motion.div 
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg"
              >
                {timeLeft}
              </motion.div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center text-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh QR Code
            </motion.button>
          </div>

          {isGeneratingQR && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
));

const FacultyDashboard = () => {
  // Enhanced states with localStorage persistence
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('facultyClasses');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "Web Development", time: "09:00", studentCount: 0 },
      { id: 2, name: "Database Systems", time: "11:00", studentCount: 0 }
    ];
  });
  const [selectedClass, setSelectedClass] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [presentStudents, setPresentStudents] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
const [showQRModal, setShowQRModal] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    time: format(new Date(), 'HH:mm'),
    studentCount: 0
  });

  // Save classes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('facultyClasses', JSON.stringify(classes));
  }, [classes]);

  // Enhanced delete handler with better UX
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
    toast.success('Class deleted successfully', {
      position: 'top-center',
      style: {
        background: '#1F2937',
        color: '#fff',
        borderLeft: '4px solid #10B981'
      }
    });
  } else {
    setDeleteConfirm(classId);
    toast('Click again to confirm deletion', {
      position: 'top-center',
      icon: '⚠️',
      style: {
        background: '#1F2937',
        color: '#fff',
        borderLeft: '4px solid #F59E0B'
      }
    });
    setTimeout(() => setDeleteConfirm(null), 3000);
  }
}, [deleteConfirm, selectedClass, classes]);

// Enhanced class addition with validation
const handleAddClass = useCallback(() => {
  if (!newClass.name.trim()) {
    toast.error('Please enter a class name', {
      position: 'top-center',
      style: {
        background: '#1F2937',
        color: '#fff',
        borderLeft: '4px solid #EF4444'
      }
    });
    return;
  }

  const newId = Date.now();
  const updatedClasses = [...classes, {
    id: newId,
    ...newClass
  }];
  
  setClasses(updatedClasses);
  localStorage.setItem('facultyClasses', JSON.stringify(updatedClasses));
  
  toast.success('Class added successfully', {
    position: 'top-center',
    style: {
      background: '#1F2937',
      color: '#fff',
      borderLeft: '4px solid #10B981'
    }
  });

  setNewClass({ 
    name: '', 
    time: format(new Date(), 'HH:mm'), 
    studentCount: 0 
  });
  setShowAddModal(false);
}, [newClass, classes]);
 // Modify the generateQRCode function
// Update the generateQRCode function
const generateQRCode = useCallback((classInfo, containerId = 'qr-code') => {
  if (!classInfo) {
    toast.error('No class selected', {
      position: 'top-center',
      style: {
        background: '#1F2937',
        color: '#fff',
        borderLeft: '4px solid #EF4444'
      },
      id: 'qr-error' // Add unique ID
    });
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
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      secretKey
    ).toString();

    const element = document.getElementById(containerId);
    if (element) {
      try {
        element.innerHTML = '';
        const codeWriter = new BrowserQRCodeSvgWriter();
        const qrSize = containerId === 'qr-code' ? 300 : 400;
        
        const qr = codeWriter.write(encrypted, qrSize, qrSize);
        element.appendChild(qr);
        
        setQrValue(encrypted);
        // Remove success toast from here
      } catch (err) {
        console.error('QR Write Error:', err);
        toast.error('Failed to write QR code', {
          position: 'top-center',
          style: {
            background: '#1F2937',
            color: '#fff',
            borderLeft: '4px solid #EF4444'
          },
          id: 'qr-write-error' // Add unique ID
        });
      }
    }
    setIsGeneratingQR(false);
    return encrypted;
  } catch (error) {
    console.error('QR Generation Error:', error);
    setIsGeneratingQR(false);
    return null;
  }
}, []);

// Update the handleManualRefresh function
const handleManualRefresh = useCallback(() => {
  if (!selectedClass) return;
  
  const newQRValue = generateQRCode(selectedClass);
  if (newQRValue) {
    setQrValue(newQRValue);
    setTimeLeft(10);
    // Add single toast here
    toast.success('QR Code refreshed', {
      position: 'top-center',
      style: {
        background: '#1F2937',
        color: '#fff',
        borderLeft: '4px solid #10B981'
      },
      id: 'qr-refresh' // Add unique ID
    });
  }
}, [selectedClass, generateQRCode]);

  // Enhanced class selection with smooth transition
  const handleClassSelection = useCallback((cls) => {
    setLoading(true);
    setSelectedClass(cls);
    
    setTimeout(() => {
      setShowQR(false);
      setTimeLeft(10);
      setPresentStudents([]);
      setAbsentStudents([]);
      setLoading(false);
      toast.success(`${cls.name} selected`);
    }, 300);
  }, []);

  // Enhanced file handling with progress feedback
  const readExcelFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const studentNames = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
            .flat()
            .filter(name => typeof name === 'string' && name.trim() !== '');
          
          if (studentNames.length === 0) {
            reject(new Error('No valid student names found in file'));
          } else {
            resolve(studentNames);
          }
        } catch (error) {
          reject(new Error('Failed to read Excel file'));
        }
      };
      
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Enhanced file drop handler with loading states and feedback
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedClass || !acceptedFiles.length) return;
    
    setLoading(true);
    try {
      const file = acceptedFiles[0];
      const data = await readExcelFile(file);
      
      setSelectedClass(prev => ({ ...prev, student_list: data }));
      setAbsentStudents(data);
      setPresentStudents([]);
      
      // Update class student count
      setClasses(prev => prev.map(c => 
        c.id === selectedClass.id 
          ? { ...c, studentCount: data.length }
          : c
      ));
      
      toast.success(`Loaded ${data.length} students`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, readExcelFile]);

  // Enhanced dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    onDropRejected: () => {
      toast.error('Please upload only Excel files (.xlsx or .xls)');
    }
  });

  // Enhanced attendance session handlers with feedback
  const startAttendance = useCallback(() => {
    setShowQR(true);
    handleManualRefresh();
    toast.success('Attendance session started');
  }, [handleManualRefresh]);

  const stopAttendance = useCallback(() => {
    setShowQR(false);
    setTimeLeft(10);
    toast('Attendance session stopped', {
      icon: '🛑',
    });
  }, []);

  // Enhanced QR code auto refresh effect
  useEffect(() => {
    let timer;
    if (showQR && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleManualRefresh();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQR, handleManualRefresh]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 py-8 px-4">


// Replace the existing Toaster configuration
<Toaster
  position="top-center"
  containerStyle={{
    top: '1.5rem',  // Changed from 50% to 1.5rem
    transform: 'none',  // Removed the translate transform
  }}
  toastOptions={{
    duration: 2000,
    style: {
      background: '#1F2937',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      maxWidth: '400px',
      margin: '0 auto',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    success: {
      style: {
        borderLeft: '4px solid #10B981',
      },
      icon: '✅',
    },
    error: {
      style: {
        borderLeft: '4px solid #EF4444',
      },
      icon: '❌',
    },
  }}
  gutter={12}
  limit={2}
  reverseOrder={false}
/>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-3xl font-bold text-purple-400"
          >
            Faculty Dashboard
          </motion.h1>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Class
          </motion.button>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Classes Panel */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gray-800 rounded-lg shadow-xl p-6"
          >
            <h2 className="text-xl font-semibold text-purple-300 mb-4">Your Classes</h2>
            <AnimatePresence>
              <div className="space-y-4">
                {classes.map((cls) => (
                  <motion.div
                    key={cls.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`bg-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-600 ${
                      selectedClass?.id === cls.id ? 'ring-2 ring-purple-500 bg-gray-600' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div 
                        className="flex-1 cursor-pointer" 
                        onClick={() => handleClassSelection(cls)}
                      >
                        <h3 className="font-medium text-lg text-purple-300">{cls.name}</h3>
                        <div className="flex items-center text-gray-400 text-sm mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {format(new Date(`2000-01-01T${cls.time}`), 'hh:mm a')}
                          <Users className="w-4 h-4 ml-3 mr-1" />
                          {cls.studentCount} students
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteClass(cls.id)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          deleteConfirm === cls.id 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                        title={deleteConfirm === cls.id ? "Click again to confirm deletion" : "Delete class"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </motion.div>
  
          {/* Right Panel */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-800 rounded-lg shadow-xl p-12 text-center"
                >
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading class data...</p>
                </motion.div>
              ) : selectedClass ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* QR Code Section */}
                  <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-purple-300">Attendance QR Code</h2>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => showQR ? stopAttendance() : startAttendance()}
                        className={`${
                          showQR 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white px-4 py-2 rounded-lg transition-colors flex items-center`}
                      >
                        {showQR ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Stop Attendance
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Start Attendance
                          </>
                        )}
                      </motion.button>
                    </div>
  
                    <AnimatePresence>
                      {showQR && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="text-center"
                        >
                         
      
<div 
  className="bg-white p-6 rounded-lg inline-block mb-4 relative cursor-pointer hover:shadow-lg transition-shadow"
  onClick={() => setShowQRModal(true)}
>
  <div 
    id="qr-code" 
    className="mx-auto flex items-center justify-center min-h-[300px] min-w-[300px]"
  />
  <motion.div 
    initial={{ scale: 0.5 }}
    animate={{ scale: 1 }}
    className="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
  >
    {timeLeft}
  </motion.div>
  {isGeneratingQR && (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  )}
</div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleManualRefresh}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center mx-auto"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh QR Code
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
  
                  {/* Attendance Status */}
                  <div className="bg-gray-800 rounded-lg shadow-xl p-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-purple-300">Attendance Status</h2>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAttendance(!showAttendance)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                      >
                        {showAttendance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </motion.button>
                    </div>
  
                    <AnimatePresence>
                      {showAttendance && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="grid md:grid-cols-2 gap-4"
                        >
                          <div>
                            <h3 className="font-medium text-green-400 flex items-center mb-2">
                              <UserCheck className="w-4 h-4 mr-1" />
                              Present ({presentStudents.length})
                            </h3>
                            <div className="bg-gray-700 rounded-lg p-4 h-48 overflow-auto">
                              {presentStudents.length > 0 ? (
                                <ul className="space-y-1">
                                  {presentStudents.map((student, index) => (
                                    <motion.li
                                      key={index}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="text-green-300"
                                    >
                                      {student}
                                    </motion.li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-400">No students present yet</p>
                              )}
                            </div>
                          </div>
  
                          <div>
                            <h3 className="font-medium text-red-400 flex items-center mb-2">
                              <UserX className="w-4 h-4 mr-1" />
                              Absent ({absentStudents.length})
                            </h3>
                            <div className="bg-gray-700 rounded-lg p-4 h-48 overflow-auto">
                              {absentStudents.length > 0 ? (
                                <ul className="space-y-1">
                                  {absentStudents.map((student, index) => (
                                    <motion.li
                                      key={index}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="text-red-300"
                                    >
                                      {student}
                                    </motion.li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-400">No absent students</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
  
                    <motion.div 
                      className="mt-6"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div 
                        {...getRootProps()} 
                        className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
                      >
                        <input {...getInputProps()} />
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-400">Drop Excel file here or click to upload student list</p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-800 rounded-lg shadow-xl p-12 text-center"
                >
                  <List className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">Select a class to view attendance options</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
  
      {/* Add Class Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full"
            >
              <h2 className="text-xl font-semibold text-purple-300 mb-4">Add New Class</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-1">Class Name</label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter class name"
                  />
                </div>
  
                <div>
                  <label className="block text-gray-400 mb-1">Class Time</label>
                  <input
                    type="time"
                    value={newClass.time}
                    onChange={(e) => setNewClass(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
  
                <div className="flex justify-end space-x-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={newClass.name ? { scale: 1.05 } : {}}
                    whileTap={newClass.name ? { scale: 0.95 } : {}}
                    onClick={handleAddClass}
                    disabled={!newClass.name}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                      newClass.name 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Class
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* QR Modal */}
<QRModal 
  isOpen={showQRModal}
  onClose={() => setShowQRModal(false)}
  onRefresh={() => {
    generateQRCode(selectedClass, 'qr-code-modal');
    setTimeLeft(10);
  }}
  timeLeft={timeLeft}
  isGeneratingQR={isGeneratingQR}
/>
    </div>
    
  );
};

export default FacultyDashboard;