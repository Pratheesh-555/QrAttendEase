import { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle, XCircle, AlertCircle, History, Clock, LogOut, Award, TrendingUp, Calendar, QrCode, Zap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { toast, Toaster } from 'react-hot-toast';
import { classApi } from '../api/classApi';

const StudentDashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [isLate, setIsLate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, percentage: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  const qrReaderRef = useRef(null);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('googleToken');
    const cachedUser = localStorage.getItem('userData');
    
    if (!token) {
      navigate('/');
      return;
    }

    // Load cached user data immediately
    if (cachedUser) {
      try {
        setUserInfo(JSON.parse(cachedUser));
        setLoading(false);
      } catch (e) {
        console.error('Failed to parse cached user');
      }
    }

    const getUserInfo = async () => {
      try {
        const response = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserInfo(response.data);
        localStorage.setItem('userData', JSON.stringify(response.data));
        setLoading(false);
      } catch (error) {
        // Only remove token if no cached data
        if (!cachedUser) {
          localStorage.removeItem('googleToken');
          navigate('/');
        }
      }
    };

    if (!cachedUser) {
      getUserInfo();
    }
    
    // Load attendance history
    const history = JSON.parse(localStorage.getItem('attendanceHistory') || '[]');
    setAttendanceHistory(history.slice(-5)); // Show last 5 records
    
    // Calculate stats
    const total = history.length;
    const late = history.filter(r => r.isLate).length;
    const present = total - late;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    setStats({ total, present, late, percentage });
  }, [navigate]);

  useEffect(() => {
    let timeoutId;

    const handleDecoded = async (text) => {
      // Prevent duplicate scans
      if (hasScannedRef.current) return;
      hasScannedRef.current = true;
      
      try {
        const decrypted = CryptoJS.AES.decrypt(
          text,
          'attendance-qr-secret-key'
        ).toString(CryptoJS.enc.Utf8);
        
        if (!decrypted) {
          toast.error('❌ Invalid QR code format');
          hasScannedRef.current = false;
          return;
        }
        
        const data = JSON.parse(decrypted);
        const now = new Date().getTime();
        
        if (now - data.timestamp > 30000) {
          toast.error('⏰ QR code has expired. Please ask faculty to refresh.');
          hasScannedRef.current = false;
          return;
        }
        
        setQrData(decrypted);
        setScanSuccess(true);
        setScanning(false);
        toast.success('✅ QR code scanned! Click "Mark Present" to submit.');

        // stop camera after successful decode
        try {
          codeReaderRef.current?.reset();
        } catch (e) {
          void e;
        }
      } catch (error) {
        console.error('QR decode error:', error);
        toast.error('❌ Invalid or corrupted QR code');
        hasScannedRef.current = false;
      }
    };

    const startScanner = async () => {
      if (!qrReaderRef.current || codeReaderRef.current) return;

      const container = qrReaderRef.current;
      container.innerHTML = '';
      
      // Create video element with all necessary attributes
      const videoEl = document.createElement('video');
      videoEl.id = 'qr-video';
      videoEl.setAttribute('playsinline', '');
      videoEl.setAttribute('autoplay', '');
      videoEl.setAttribute('muted', '');
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      videoEl.style.objectFit = 'cover';
      videoEl.style.display = 'block';
      
      container.appendChild(videoEl);
      videoRef.current = videoEl;

      try {
        toast.success('📷 Requesting camera access...');
        
        // Get camera stream with native getUserMedia
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' }, // Prefer rear camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Attach stream to video element
        videoEl.srcObject = stream;
        
        // Force video to play and be visible
        videoEl.onloadedmetadata = async () => {
          try {
            await videoEl.play();
            // Hide loading and show scanning
            setScanning(true);
            setCameraStarted(true);
          } catch (e) {
            console.error('Play error:', e);
          }
        };

        // Create canvas fallback to render frames on devices where <video> won't display
        try {
          const canvasEl = document.createElement('canvas');
          canvasEl.id = 'qr-canvas';
          canvasEl.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            z-index: 1;
            background: transparent;
          `;
          // ensure video sits below canvas
          videoEl.style.zIndex = 0;
          canvasRef.current = canvasEl;
          container.appendChild(canvasEl);

          const ctx = canvasEl.getContext('2d');
          const drawFrame = () => {
            try {
              if (videoEl.readyState >= 2) {
                const vw = videoEl.videoWidth || container.clientWidth;
                const vh = videoEl.videoHeight || container.clientHeight;
                // size canvas to video aspect
                if (canvasEl.width !== vw || canvasEl.height !== vh) {
                  canvasEl.width = vw;
                  canvasEl.height = vh;
                }
                ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
              }
            } catch (e) {
              // ignore draw errors
            }
            rafRef.current = requestAnimationFrame(drawFrame);
          };
          rafRef.current = requestAnimationFrame(drawFrame);
        } catch (e) {
          // canvas fallback failed - continue without it
          console.warn('Canvas fallback not available', e);
        }
        
        // Initialize ZXing reader
        codeReaderRef.current = new BrowserQRCodeReader();
        
        // Start decoding from the video element
        codeReaderRef.current.decodeFromVideoElement(
          videoEl,
          (result, error) => {
            if (result) {
              if (!scanSuccess && !hasScannedRef.current) {
                handleDecoded(result.getText());
              }
            }
            // Update scanning state once stream is active
            if (error && error.name === 'NotFoundException') {
              setScanning(true); // Camera is working, just no QR code found yet
            }
          }
        );
        
        toast.success('📷 Camera is ready - point at QR code');
        
      } catch (err) {
        console.error('❌ Camera error:', err);
        setScanning(false);
        setCameraStarted(false);
        
        // Stop any streams
        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        
        // Provide user-friendly error messages
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast.error('📷 Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          toast.error('📷 No camera found on this device.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          toast.error('📷 Camera is in use by another app. Please close other apps and try again.');
        } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          // Try with front camera
          toast.error('📷 Trying front camera...');
          setTimeout(async () => {
            try {
              const container = qrReaderRef.current;
              if (!container) return;
              
              container.innerHTML = '';
              const videoEl2 = document.createElement('video');
              videoEl2.id = 'qr-video-fallback';
              videoEl2.playsInline = true;
              videoEl2.autoplay = true;
              videoEl2.muted = true;
              videoEl2.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                background-color: #000;
                z-index: 1;
              `;
              container.appendChild(videoEl2);
              videoRef.current = videoEl2;
              
              // Try front camera
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
              });
              
              videoEl2.srcObject = stream;
              await new Promise((resolve) => {
                videoEl2.onloadedmetadata = () => {
                  videoEl2.play().then(resolve).catch(resolve);
                };
              });
              
              codeReaderRef.current = new BrowserQRCodeReader();
              codeReaderRef.current.decodeFromVideoElement(
                videoEl2,
                (result, error) => {
                  if (result && !scanSuccess && !hasScannedRef.current) {
                    handleDecoded(result.getText());
                  }
                  if (error && error.name === 'NotFoundException') {
                    setScanning(true);
                  }
                }
              );
              
              setCameraStarted(true);
              setScanning(true);
              toast.success('📷 Front camera is ready');
            } catch (e) {
              console.error('Fallback camera error:', e);
              toast.error('📷 Failed to start camera: ' + (e.message || 'Unknown error'));
              setCameraStarted(false);
            }
          }, 500);
          return;
        } else {
          toast.error(`📷 Camera error: ${err.message || 'Unknown error'}`);
        }
        
        // cleanup
        codeReaderRef.current = null;
      }
    };

    const stopScanner = async () => {
      // Stop ZXing reader
      try {
        codeReaderRef.current?.reset();
      } catch (e) {
        void e;
      }
      codeReaderRef.current = null;
      
      // Stop video stream
      if (videoRef.current) {
        try {
          if (videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
          }
          // stop video tracks
          const stream = videoRef.current.srcObject;
          if (stream && stream.getTracks) stream.getTracks().forEach(t => t.stop());
        } catch (e) { void e; }
        try {
          videoRef.current.remove();
        } catch (e) { void e; }
        videoRef.current = null;
      }
      // Stop canvas draw loop and remove canvas
      if (rafRef.current) {
        try { cancelAnimationFrame(rafRef.current); } catch (e) { void e; }
        rafRef.current = null;
      }
      if (canvasRef.current) {
        try { canvasRef.current.remove(); } catch (e) { void e; }
        canvasRef.current = null;
      }
      setScanning(false);
    };

    if (cameraStarted) {
      timeoutId = setTimeout(() => {
        startScanner();
      }, 300);
    }

    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, [userInfo, cameraStarted, scanSuccess]);
  const handleOpenCamera = () => {
    if (!cameraStarted) {
      setCameraStarted(true);
      hasScannedRef.current = false; // Reset scan flag
    }
  };

  const handleMarkPresent = async () => {
    if (!qrData || submitting) {
      return;
    }
   
    setSubmitting(true);
    const loadingToast = toast.loading('⏳ Submitting attendance...');
    
    try {
      const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      
      if (!data.classId) {
        toast.error('❌ Invalid QR code - missing class ID', { id: loadingToast });
        setSubmitting(false);
        return;
      }
      
      const response = await classApi.markAttendance(
        data.classId,
        userInfo.email,
        userInfo.name
      );
      
      if (response.success) {
        toast.success('🎉 Attendance marked successfully!', { id: loadingToast });
        
        // Check if marked as late
        setIsLate(response.isLate || false);
        
        // Store in localStorage with more details
        const history = JSON.parse(
          localStorage.getItem('attendanceHistory') || '[]'
        );
        const newRecord = {
          classId: data.classId,
          className: data.className || 'Unknown Class',
          timestamp: new Date().getTime(),
          isLate: response.isLate || false,
          email: userInfo.email
        };
        history.push(newRecord);
        localStorage.setItem('attendanceHistory', JSON.stringify(history));
        setAttendanceHistory(history.slice(-5)); // Update state with last 5
        
        // Reset states
        setScanSuccess(false);
        setQrData(null);
        hasScannedRef.current = false;
        
        // Stop camera after successful submission
        try {
          codeReaderRef.current?.reset();
        } catch (e) {
          void e;
        }
        try {
          if (videoRef.current) {
            const stream = videoRef.current.srcObject;
            if (stream && stream.getTracks) stream.getTracks().forEach(t => t.stop());
            videoRef.current.remove();
            videoRef.current = null;
          }
        } catch (e) {
          void e;
        }
        setCameraStarted(false);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setIsLate(false);
        }, 3000);
      } else {
        toast.error(response.message || '❌ Failed to mark attendance', { id: loadingToast });
      }
    } catch (error) {
      console.error('Attendance submission error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Network error. Please try again.';
      toast.error(`❌ ${errorMsg}`, { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('googleToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('lastRoute');
    navigate('/');
    toast.success('👋 Signed out successfully');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-400"></div>
            <Camera className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-purple-400" />
          </div>
        </motion.div>
        <motion.p 
          className="text-purple-200 text-lg mt-6 font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Loading your dashboard...
        </motion.p>
      </div>
    );
  }

  return (
    <>
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
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-6 px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header with user info and sign out */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {userInfo.picture ? (
                  <motion.img 
                    src={userInfo.picture} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full border-4 border-white shadow-xl"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-xl">
                    {userInfo.name?.charAt(0) || 'S'}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Hello, {userInfo.name?.split(' ')[0] || 'Student'}! 👋
                  </h1>
                  <p className="text-purple-200 text-sm sm:text-base">{userInfo.email}</p>
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
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-blue-300" />
                <span className="text-3xl font-bold text-white">{stats.total}</span>
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
                <CheckCircle className="w-8 h-8 text-green-300" />
                <span className="text-3xl font-bold text-white">{stats.present}</span>
              </div>
              <p className="text-purple-200 text-sm font-medium">On Time</p>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-yellow-300" />
                <span className="text-3xl font-bold text-white">{stats.late}</span>
              </div>
              <p className="text-purple-200 text-sm font-medium">Late Arrivals</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-4 shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-white" />
                <span className="text-3xl font-bold text-white">{stats.percentage}%</span>
              </div>
              <p className="text-white text-sm font-medium">Attendance Rate</p>
            </motion.div>
          </div>

          {/* Main QR Scanner Card */}
          <motion.div 
            className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 mb-6 border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <motion.div
                  animate={{ rotate: scanning ? 360 : 0 }}
                  transition={{ duration: 2, repeat: scanning ? Infinity : 0, ease: "linear" }}
                >
                  <QrCode className="w-8 h-8 mr-3 text-purple-300" />
                </motion.div>
                QR Scanner
              </h2>
              {scanSuccess && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <CheckCircle className="w-10 h-10 text-green-400 drop-shadow-lg" />
                </motion.div>
              )}
            </div>
          
          <div className="relative flex flex-col items-center">
            <div 
              id="qr-reader"
              ref={qrReaderRef}
              className="relative w-full aspect-square max-w-[350px] sm:max-w-[450px] mx-auto rounded-2xl overflow-hidden bg-black border-4 border-white/30 shadow-2xl"
              style={{ position: 'relative' }}
            >
              {cameraStarted && !scanning && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-center z-10 bg-black/50">
                  <div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mx-auto mb-4"
                    >
                      <Camera className="w-16 h-16 text-purple-400" />
                    </motion.div>
                    <p className="text-lg font-medium">Initializing camera...</p>
                  </div>
                </div>
              )}
              {!cameraStarted && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6 z-10">
                  <div>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Camera className="w-20 h-20 mx-auto mb-4 text-purple-400" />
                    </motion.div>
                    <p className="text-lg font-medium mb-2">Ready to Scan</p>
                    <p className="text-sm text-purple-200">Click the button below to activate camera</p>
                  </div>
                </div>
              )}
              
              {/* Enhanced Scanning overlay with corner brackets */}
              {scanning && !scanSuccess && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Animated corner brackets */}
                  <motion.div 
                    className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-purple-400 rounded-tl-2xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div 
                    className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-purple-400 rounded-tr-2xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  />
                  <motion.div 
                    className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-purple-400 rounded-bl-2xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  />
                  <motion.div 
                    className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-purple-400 rounded-br-2xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  />
                  
                  {/* Scanning line with glow effect */}
                  <motion.div 
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_20px_rgba(168,85,247,0.9)]"
                    animate={{ top: ["10%", "90%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                  />
                  
                  {/* Pulsing center indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                      className="w-16 h-16 border-4 border-purple-400 rounded-full"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.5, 1]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                  
                  {/* Scanning text with badge */}
                  <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                    <motion.div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full backdrop-blur-sm shadow-lg border-2 border-white/30"
                      animate={{ 
                        boxShadow: [
                          "0 0 20px rgba(168,85,247,0.5)",
                          "0 0 40px rgba(168,85,247,0.8)",
                          "0 0 20px rgba(168,85,247,0.5)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-white" />
                        <span className="text-white font-bold text-sm sm:text-base">
                          Scanning for QR code...
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Success overlay */}
              {scanSuccess && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-green-500/90 to-emerald-600/90 flex items-center justify-center z-30"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    >
                      <CheckCircle className="w-24 h-24 mx-auto mb-4 text-white drop-shadow-2xl" />
                    </motion.div>
                    <motion.h3
                      className="text-2xl font-bold text-white mb-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      QR Code Detected!
                    </motion.h3>
                    <motion.p
                      className="text-white/90"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      Click "Mark Present" below
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Camera control button */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenCamera}
              className={`w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center space-x-3 ${cameraStarted ? 'opacity-50 cursor-not-allowed' : ''} transition-all`}
              disabled={cameraStarted}
            >
              <Camera className="w-6 h-6" />
              <span>{cameraStarted ? 'Camera Active' : 'Open Camera'}</span>
              {cameraStarted && <Shield className="w-5 h-5 animate-pulse" />}
            </motion.button>
          </div>
          
          {/* Success message and action button */}
          <AnimatePresence>
            {scanSuccess && (
              <motion.div 
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-4 shadow-xl"
                  animate={{
                    boxShadow: [
                      "0 10px 40px rgba(16, 185, 129, 0.3)",
                      "0 10px 60px rgba(16, 185, 129, 0.5)",
                      "0 10px 40px rgba(16, 185, 129, 0.3)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-6 h-6 text-white mr-2" />
                    <h3 className="text-xl font-bold text-white">Ready to Submit!</h3>
                  </div>
                  {isLate && (
                    <div className="flex items-center bg-yellow-500/20 rounded-lg p-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-yellow-300 mr-2" />
                      <p className="text-white text-sm">
                        You are late! Please arrive on time next session.
                      </p>
                    </div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleMarkPresent}
                    disabled={submitting}
                    className="w-full bg-white text-green-600 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        <span>Mark Present</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>

          {/* Attendance History Section */}
          {attendanceHistory.length > 0 && (
            <motion.div
              className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <History className="w-7 h-7 mr-3 text-purple-300" />
                  Recent Attendance
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowHistory(!showHistory)}
                  className="bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium"
                >
                  {showHistory ? 'Hide' : 'Show'} All
                </motion.button>
              </div>
              
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3"
                  >
                    {attendanceHistory.map((record, idx) => (
                      <motion.div
                        key={idx}
                        className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {record.isLate ? (
                              <div className="bg-yellow-500/20 p-2 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-yellow-300" />
                              </div>
                            ) : (
                              <div className="bg-green-500/20 p-2 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-300" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-semibold">{record.className}</p>
                              <p className="text-purple-200 text-sm">
                                {new Date(record.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${record.isLate ? 'text-yellow-300' : 'text-green-300'}`}>
                              {record.isLate ? 'Late' : 'On Time'}
                            </p>
                            <p className="text-purple-200 text-sm">
                              {new Date(record.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
