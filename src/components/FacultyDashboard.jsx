import { useCallback, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { toast } from 'react-hot-toast';
import { Plus, List, BarChart3, LogOut, Users, Calendar, Award, Activity } from 'lucide-react';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
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
import AuditTrailModal from './dashboard/AuditTrailModal';

const FacultyDashboard = () => {
  const navigate = useNavigate();

  // Classes are now loaded from MongoDB, not localStorage
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [presentStudents, setPresentStudents] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [lateStudents, setLateStudents] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  const [newClass, setNewClass] = useState({
    name: '',
    time: format(new Date(), 'HH:mm'),
  });

  // Load user info and fetch classes from MongoDB
  useEffect(() => {
    const cachedUser = localStorage.getItem('userData');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        setUserInfo(parsed);
        // Fetch classes from MongoDB
        fetchClasses(parsed.email);
      } catch (e) {
        console.error('Failed to parse user data');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchClasses = async (email) => {
    try {
      setLoading(true);
      const data = await classApi.getClasses(email);
      // Map MongoDB response to a consistent shape
      const mapped = data.map(c => ({
        id: c._id,
        name: c.className,
        time: c.time || '09:00',
        studentCount: c.studentCount || c.studentList?.length || 0,
        studentList: c.studentList || [],
      }));
      setClasses(mapped);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      toast.error('Failed to load classes from server');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = useCallback(async (classId) => {
    if (deleteConfirm === classId) {
      try {
        await classApi.deleteClass(classId);
        setClasses(prev => prev.filter(c => c.id !== classId));
        if (selectedClass?.id === classId) {
          setSelectedClass(null);
          setShowQR(false);
        }
        setDeleteConfirm(null);
        toast.success('Class deleted successfully');
      } catch (error) {
        toast.error('Failed to delete class');
      }
    } else {
      setDeleteConfirm(classId);
      toast('Click again to confirm deletion', { icon: '⚠️' });
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }, [deleteConfirm, selectedClass]);

  const handleAddClass = useCallback(async () => {
    if (!newClass.name.trim()) {
      toast.error('Please enter a class name');
      return;
    }
    if (!userInfo?.email) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const savedClass = await classApi.addClass(userInfo.email, newClass.name, newClass.time);
      const mapped = {
        id: savedClass._id,
        name: savedClass.className,
        time: savedClass.time || '09:00',
        studentCount: 0,
        studentList: [],
      };
      setClasses(prev => [mapped, ...prev]);
      toast.success('Class added successfully');
      setNewClass({ name: '', time: format(new Date(), 'HH:mm') });
      setShowAddModal(false);
    } catch (error) {
      toast.error('Failed to add class');
    }
  }, [newClass, userInfo]);

  const handleViewStudents = useCallback(async (cls) => {
    try {
      const response = await classApi.getStudentList(cls.id);

      if (response.studentList && response.studentList.length > 0) {
        setSelectedClass({
          ...cls,
          studentList: response.studentList.map(s => typeof s === 'string' ? { name: s } : s)
        });
        setShowStudentList(true);
      } else {
        setSelectedClass(cls);
        setShowStudentList(true);
        toast('No students found. Please upload a student list.', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Failed to fetch student list:', error);
      setSelectedClass(cls);
      setShowStudentList(true);
      toast.error('Failed to fetch student list. You can upload a new one.');
    }
  }, []);

  const generateQRCode = useCallback((qrToken, containerId = 'qr-code', showToast = false) => {
    if (!qrToken) {
      toast.error('No QR token available');
      return null;
    }

    setIsGeneratingQR(true);

    try {
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

        const svg = codeWriter.write(qrToken, qrSize, qrSize);
        element.appendChild(svg);

        setQrValue(qrToken);
        if (showToast) {
          toast.success('QR Code generated successfully');
        }
        setIsGeneratingQR(false);
        return qrToken;
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
    classApi.startAttendance(selectedClass.id)
      .then((response) => {
        const qrToken = response.attendance?.qrToken || response.qrToken;
        if (qrToken) {
          generateQRCode(qrToken, 'qr-code', true);
        }
      })
      .catch(() => {
        toast.error('Failed to refresh QR token');
      });
  }, [selectedClass, generateQRCode]);

  useEffect(() => {
    if (!showQR || !selectedClass) return;

    const refreshInterval = setInterval(() => {
      handleManualRefresh();
    }, 25000);

    return () => clearInterval(refreshInterval);
  }, [showQR, selectedClass, handleManualRefresh]);

  const handleClassSelection = useCallback(async (cls) => {
    setSelectedClass(cls);
    setShowQR(false);
    setPresentStudents([]);
    setAbsentStudents([]);

    // Fetch fresh student list for this class
    try {
      const response = await classApi.getStudentList(cls.id);
      if (response.studentList && response.studentList.length > 0) {
        const list = response.studentList.map(s => typeof s === 'string' ? { name: s } : s);
        setSelectedClass(prev => ({ ...prev, studentList: list, studentCount: list.length }));
      }
    } catch (e) {
      // Silent - student list might not exist yet
    }

    toast.success(`${cls.name} selected`);
  }, []);

  const readExcelFile = useCallback(async (file) => {
    if (!selectedClass) {
      toast.error('No class selected');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const studentNames = jsonData
            .flat()
            .filter(name => name && typeof name === 'string' && name.trim());

          // Update local state
          setSelectedClass(prev => ({
            ...prev,
            studentList: studentNames.map(name => ({ name })),
            studentCount: studentNames.length
          }));
          setAbsentStudents(studentNames);

          // Save to MongoDB
          try {
            await classApi.updateStudentList(selectedClass.id, studentNames);
            toast.success(`Uploaded and saved ${studentNames.length} students`);

            // Update classes list too
            setClasses(prev => prev.map(c =>
              c.id === selectedClass.id
                ? { ...c, studentCount: studentNames.length, studentList: studentNames.map(name => ({ name })) }
                : c
            ));
          } catch (dbError) {
            console.error('Failed to save to database:', dbError);
            toast.error('Failed to save student list to server');
          }
        } catch (error) {
          console.error('Failed to process file:', error);
          toast.error('Failed to process file');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Failed to upload student list:', error);
      toast.error('Failed to upload student list');
    }
  }, [selectedClass]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedClass || !acceptedFiles.length) return;
    await readExcelFile(acceptedFiles[0]);
  }, [selectedClass, readExcelFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    onDropRejected: () => {
      toast.error('Please upload a valid Excel file');
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
      // Start attendance session on backend
      const response = await classApi.startAttendance(selectedClass.id);
      const qrToken = response.attendance?.qrToken || response.qrToken;

      if (!qrToken) {
        throw new Error('Server did not return a QR token');
      }

      setShowQR(true);
      setPresentStudents([]);
      setLateStudents([]);
      setSessionStartTime(new Date());
      setAbsentStudents(selectedClass.studentList.map(s => s.name || s));

      // Wait for DOM to render QR container
      setTimeout(() => {
        const qrGenerated = generateQRCode(qrToken);
        if (!qrGenerated) {
          setTimeout(() => {
            generateQRCode(qrToken);
          }, 100);
        }
      }, 350);

      toast.success('Attendance session started');
    } catch (error) {
      console.error('Failed to start attendance:', error);
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
    requestAnimationFrame(() => {
      generateQRCode(qrValue, 'qr-code-modal', false);
    });
  }, [qrValue, generateQRCode]);

  const handleMarkPresent = useCallback((student) => {
    setPresentStudents(prev => [...prev, student]);
    setAbsentStudents(prev => prev.filter(s => s !== student));
  }, []);

  // Poll for attendance updates while QR is active
  useEffect(() => {
    let pollInterval;
    if (selectedClass && showQR) {
      const fetchAttendance = async () => {
        try {
          const response = await classApi.getAttendanceStatus(selectedClass.id);
          if (response.presentStudents && Array.isArray(response.presentStudents)) {
            setPresentStudents(response.presentStudents);

            // Update absent list: remove present students from full list
            if (selectedClass.studentList) {
              const presentNames = new Set(response.presentStudents.map(s => typeof s === 'string' ? s : s.name));
              const absent = selectedClass.studentList
                .map(s => s.name || s)
                .filter(name => !presentNames.has(name));
              setAbsentStudents(absent);
            }
          }
          if (response.lateStudents && Array.isArray(response.lateStudents)) {
            setLateStudents(response.lateStudents);
          }
        } catch (error) {
          // Silently handle polling errors
        }
      };

      fetchAttendance();
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
    localStorage.removeItem('userRole');
    navigate('/');
    toast.success('Signed out successfully');
  };

  // Calculate dashboard stats
  const totalClasses = classes.length;
  const activeSession = showQR ? 1 : 0;
  const totalPresent = presentStudents.length;
  const totalAbsent = absentStudents.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" color="blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1f2937',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        }}
      />

      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {userInfo?.picture ? (
                <img
                  src={userInfo.picture}
                  alt="Profile"
                  className="w-9 h-9 rounded-full border border-gray-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {userInfo?.name?.charAt(0) || 'F'}
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Faculty Dashboard</h1>
                <p className="text-xs text-gray-500">{userInfo?.name || 'Professor'} • {userInfo?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg flex items-center space-x-2 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{totalClasses}</span>
            </div>
            <p className="text-gray-500 text-xs font-medium">Total Classes</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{activeSession}</span>
            </div>
            <p className="text-gray-500 text-xs font-medium">Active Sessions</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{totalPresent}</span>
            </div>
            <p className="text-gray-500 text-xs font-medium">Present Today</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <Award className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold text-gray-900">{totalAbsent}</span>
            </div>
            <p className="text-gray-500 text-xs font-medium">Absent Today</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setShowHistory(true)}
            className="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg border border-gray-200 flex items-center justify-center flex-1 min-w-[200px] text-sm font-medium transition-colors shadow-sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics & Reports
          </button>
          <button
            onClick={() => setShowAuditTrail(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg flex items-center justify-center flex-1 min-w-[200px] text-sm font-medium transition-colors shadow-sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            Audit Trail
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center flex-1 min-w-[200px] text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Class
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ClassList
            classes={classes}
            selectedClass={selectedClass}
            onClassSelect={handleClassSelection}
            onDeleteClass={handleDeleteClass}
            deleteConfirm={deleteConfirm}
            onViewStudents={handleViewStudents}
          />

          <div className="space-y-4">
            {selectedClass ? (
              <div className="space-y-4">
                <QRCodeSection
                  showQR={showQR}
                  isGeneratingQR={isGeneratingQR}
                  onStartAttendance={startAttendance}
                  onStopAttendance={stopAttendance}
                  onRefresh={handleManualRefresh}
                  onQRClick={handleQRClick}
                />

                <AttendanceStatus
                  showAttendance={showAttendance}
                  presentStudents={presentStudents}
                  absentStudents={absentStudents}
                  onToggleView={() => setShowAttendance(!showAttendance)}
                  getRootProps={getRootProps}
                  getInputProps={getInputProps}
                  onMarkPresent={handleMarkPresent}
                  studentListUploaded={selectedClass?.studentList?.length > 0}
                />
              </div>
            ) : (
              <EmptyState
                icon={List}
                title="No Class Selected"
                message="Select a class to view attendance options"
              />
            )}
          </div>
        </div>
      </main>

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
        students={selectedClass?.studentList?.map(s => s.name || s) || []}
        className={selectedClass?.name}
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
      />

      {showHistory && (
        <AttendanceHistory
          classes={classes}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showAuditTrail && (
        <AuditTrailModal
          isOpen={showAuditTrail}
          onClose={() => setShowAuditTrail(false)}
          classes={classes}
          initialClassId={selectedClass?.id || 'all'}
        />
      )}
    </div>
  );
};

export default FacultyDashboard;