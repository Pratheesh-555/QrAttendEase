import { useCallback, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { toast } from 'react-hot-toast'; 
import { Plus, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import CryptoJS from 'crypto-js';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import emailjs from '@emailjs/browser';
import axios from 'axios';
import { emailConfig } from '../config/email';

import ClassList from './dashboard/ClassList';
import QRCodeSection from './dashboard/QRCodeSection';
import AttendanceStatus from './dashboard/AttendanceStatus';
import AddClassModal from './dashboard/AddClassModal';
import QRModal from './dashboard/QRModal';
import LoadingSpinner from './common/LoadingSpinner';
import EmptyState from './common/EmptyState';
import StudentListModal from './dashboard/StudentListModal';

const FacultyDashboard = () => {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('facultyClasses');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "Web Development", time: "09:00", studentCount: 0 },
      { id: 2, name: "Database Systems", time: "11:00", studentCount: 0 }
    ];
  });
  const [selectedClass, setSelectedClass] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [presentStudents, setPresentStudents] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);

  const [newClass, setNewClass] = useState({
    name: '',
    time: format(new Date(), 'HH:mm'),
    studentCount: 0
  });

  useEffect(() => {
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
      const response = await axios.get(`http://localhost:5000/api/classes/${cls.id}`);
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
      if (element) {
        try {
          element.innerHTML = '';
          const codeWriter = new BrowserQRCodeSvgWriter();
          const qrSize = containerId === 'qr-code' ? 300 : 400;
          
          const qr = codeWriter.writeToDom(`#${containerId}`, encrypted, qrSize, qrSize);
          setQrValue(encrypted);
          if (showToast) {
            toast.success('QR Code generated successfully');
          }
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
          
          toast.success(`Uploaded ${studentNames.length} students`);
        } catch (error) {
          console.error('File processing error:', error);
          toast.error('Failed to process file');
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload student list');
    }
  }, [selectedClass]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedClass || !acceptedFiles.length) return;
    
    setLoading(true);
    try {
      await readExcelFile(acceptedFiles[0]);
    } catch (error) {
      console.error('Upload error:', error);
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

  const startAttendance = useCallback(() => {
    setShowQR(true);
    handleManualRefresh();
    setTimeout(() => {
      generateQRCode(selectedClass);
    }, 100);
    toast.success('Attendance session started');
  }, [handleManualRefresh]);

  const stopAttendance = useCallback(() => {
    setShowQR(false);
    toast('Attendance session stopped', { icon: '🛑' });
  }, []);

  const handleQRClick = useCallback(() => {
    setShowQRModal(true);
    setTimeout(() => {
      generateQRCode(selectedClass, 'qr-code-modal',false);
    }, 100);
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
      console.error('Email Error:', error);
      toast.error('Failed to send attendance report');
    } finally {
      setIsSendingEmail(false);
    }
  }, [selectedClass, absentStudents]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 py-8 px-4">
      <Toaster position="top-center" />

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
            onViewStudents={handleViewStudents}
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
                    getRootProps={getRootProps}
                    getInputProps={getInputProps}
                    onMarkPresent={handleMarkPresent}
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
        isGeneratingQR={isGeneratingQR}
      />

<StudentListModal 
  isOpen={showStudentList}
  onClose={() => setShowStudentList(false)}
  students={selectedClass?.student_list || []}
  className={selectedClass?.name}
/>
    </div>
  );
};

export default FacultyDashboard;