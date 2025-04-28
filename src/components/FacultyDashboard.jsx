import { useCallback, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { toast } from 'react-hot-toast'; 
import { Plus, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Add AnimatePresence here
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import CryptoJS from 'crypto-js';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
// Import components
import ClassList from './dashboard/ClassList';
import QRCodeSection from './dashboard/QRCodeSection';
import AttendanceStatus from './dashboard/AttendanceStatus';
import AddClassModal from './dashboard/AddClassModal';
import QRModal from './dashboard/QRModal';
import LoadingSpinner from './common/LoadingSpinner';
import EmptyState from './common/EmptyState';

const FacultyDashboard = () => {
  // ...existing state declarations...
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
        
        // Modified QR code generation with correct hints format
        const qr = codeWriter.writeToDom(
          `#${containerId}`,
          encrypted,
          qrSize,
          qrSize
        );
        
        setQrValue(encrypted);
        toast.success('QR Code generated successfully');
      } catch (err) {
        console.error('QR Write Error:', err);
        toast.error('Failed to write QR code');
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
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#1F2937',
            color: '#fff',
            maxWidth: '400px',
          }
        }}
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
          <ClassList 
            classes={classes}
            selectedClass={selectedClass}
            onClassSelect={handleClassSelection}
            onDeleteClass={handleDeleteClass}
            deleteConfirm={deleteConfirm}
          />
          
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {loading ? (
                <LoadingSpinner size="lg" color="purple" />
              ) : selectedClass ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <QRCodeSection 
                    showQR={showQR}
                    timeLeft={timeLeft}
                    isGeneratingQR={isGeneratingQR}
                    onStartAttendance={startAttendance}
                    onStopAttendance={stopAttendance}
                    onRefresh={handleManualRefresh}
                    onQRClick={() => setShowQRModal(true)}
                  />
                  
                  <AttendanceStatus 
                    showAttendance={showAttendance}
                    presentStudents={presentStudents}
                    absentStudents={absentStudents}
                    onToggleView={() => setShowAttendance(!showAttendance)}
                    getRootProps={getRootProps}
                    getInputProps={getInputProps}
                  />
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
        timeLeft={timeLeft}
        isGeneratingQR={isGeneratingQR}
      />
    </div>
  );
};

export default FacultyDashboard;