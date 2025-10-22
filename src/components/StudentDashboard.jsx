import { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle, XCircle, AlertCircle, History, Clock } from 'lucide-react';
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
  const navigate = useNavigate();
  const qrReaderRef = useRef(null);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
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

      // create video element
      const container = qrReaderRef.current;
      container.innerHTML = '';
      const videoEl = document.createElement('video');
      videoEl.setAttribute('playsinline', '');
      videoEl.setAttribute('autoplay', '');
      videoEl.setAttribute('muted', '');
      videoEl.style.position = 'absolute';
      videoEl.style.top = '0';
      videoEl.style.left = '0';
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      videoEl.style.objectFit = 'cover';
      videoEl.style.display = 'block';
      videoEl.style.backgroundColor = '#000';
      container.appendChild(videoEl);
      videoRef.current = videoEl;

      try {
        toast.success('Starting camera...');
        
        // Initialize ZXing reader
        codeReaderRef.current = new BrowserQRCodeReader(null, { 
          timeBetweenDecodingAttempts: 300,
          delayBetweenScanAttempts: 300
        });
        
        // Get available cameras
        const devices = await codeReaderRef.current.listVideoInputDevices();
        
        if (!devices || devices.length === 0) {
          toast.error('📷 No cameras found on this device');
          setCameraStarted(false);
          return;
        }

        // Select rear camera if available (better for mobile)
        let selectedDeviceId = devices[0].deviceId;
        for (const device of devices) {
          if (/back|rear|environment/i.test(device.label)) {
            selectedDeviceId = device.deviceId;
            break;
          }
        }

        // Start decoding - this will automatically set scanning to true via callback

        // Use decodeFromVideoDevice instead of decodeFromConstraints for better compatibility
        await codeReaderRef.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoEl, 
          (result, error) => {
            if (result) {
              if (!scanSuccess) {
                setScanning(true);
                handleDecoded(result.getText());
              }
            }
            // Update scanning state once stream is active
            if (error && error.name === 'NotFoundException') {
              setScanning(true); // Camera is working, just no QR code found yet
            }
          }
        );

        setScanning(true);
        toast.success('📷 Camera is ready - point at QR code');
        
      } catch (err) {
        console.error('❌ Camera error:', err);
        setScanning(false);
        setCameraStarted(false);
        
        // Provide user-friendly error messages
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast.error('📷 Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          toast.error('📷 No camera found on this device.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          toast.error('📷 Camera is in use by another app. Please close other apps and try again.');
        } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          toast.error('📷 Cannot access rear camera. Trying front camera...');
          // Retry with fallback - use first available camera
          setCameraStarted(false);
          codeReaderRef.current = null;
          setTimeout(async () => {
            try {
              const container = qrReaderRef.current;
              if (!container) return;
              container.innerHTML = '';
              const videoEl2 = document.createElement('video');
              videoEl2.setAttribute('playsinline', '');
              videoEl2.setAttribute('autoplay', '');
              videoEl2.setAttribute('muted', '');
              videoEl2.style.position = 'absolute';
              videoEl2.style.top = '0';
              videoEl2.style.left = '0';
              videoEl2.style.width = '100%';
              videoEl2.style.height = '100%';
              videoEl2.style.objectFit = 'cover';
              videoEl2.style.display = 'block';
              videoEl2.style.backgroundColor = '#000';
              container.appendChild(videoEl2);
              videoRef.current = videoEl2;
              
              codeReaderRef.current = new BrowserQRCodeReader();
              
              const devices = await codeReaderRef.current.listVideoInputDevices();
              const firstDevice = devices[0]?.deviceId;
              
              if (firstDevice) {
                await codeReaderRef.current.decodeFromVideoDevice(
                  firstDevice,
                  videoEl2,
                  (result) => {
                    if (result && !scanSuccess) {
                      setScanning(true);
                      handleDecoded(result.getText());
                    }
                  }
                );
                setScanning(true);
                toast.success('📷 Camera started (front camera)');
              }
            } catch (e) {
              toast.error('📷 Failed to start camera: ' + (e.message || 'Unknown error'));
              setCameraStarted(false);
            }
          }, 1000);
          return;
        } else {
          toast.error(`📷 Camera error: ${err.message || 'Unknown error'}`);
        }
        
        // cleanup
        try { 
          if (codeReaderRef.current) {
            codeReaderRef.current.reset(); 
          }
        } catch (e) { void e; }
        codeReaderRef.current = null;
      }
    };

    const stopScanner = async () => {
      try {
        codeReaderRef.current?.reset();
      } catch (e) {
        void e;
      }
      codeReaderRef.current = null;
      if (videoRef.current) {
        try {
          // stop video tracks
          const stream = videoRef.current.srcObject;
          if (stream && stream.getTracks) stream.getTracks().forEach(t => t.stop());
        } catch (e) { void e; }
        videoRef.current.remove();
        videoRef.current = null;
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
        <p className="text-purple-300 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '0.5rem',
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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-4 sm:py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* User Info Card */}
          <motion.div
            className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-xl p-4 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-3">
              {userInfo.picture ? (
                <img src={userInfo.picture} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold">
                  {userInfo.name?.charAt(0) || 'S'}
                </div>
              )}
              <div>
                <h3 className="text-white font-semibold text-lg">{userInfo.name || 'Student'}</h3>
                <p className="text-purple-100 text-sm">{userInfo.email}</p>
              </div>
            </div>
          </motion.div>

          {/* QR Scanner Card */}
          <motion.div 
            className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-purple-300 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                QR Code Scanner
              </h2>
              {scanSuccess && (
                <CheckCircle className="w-6 h-6 text-green-500 animate-bounce" />
              )}
            </div>
          
          <div className="relative flex flex-col items-center">
            <div 
              id="qr-reader"
              ref={qrReaderRef}
              className="relative w-full aspect-square max-w-[320px] sm:max-w-[400px] mx-auto rounded-lg overflow-hidden bg-black border-2 border-gray-700 flex items-center justify-center"
            >
              {cameraStarted && !scanning && (
                <div className="text-white text-center z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-3"></div>
                  <p className="text-sm">Initializing camera...</p>
                </div>
              )}
              {!cameraStarted && (
                <div className="text-gray-500 text-center p-4 z-10">
                  <Camera className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Click "Open Camera" to start scanning</p>
                </div>
              )}
              
              {/* Scanning overlay with corner brackets */}
              {scanning && !scanSuccess && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Corner brackets */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-lg"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-lg"></div>
                  
                  {/* Scanning line */}
                  <motion.div 
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                      repeatDelay: 0
                    }}
                  />
                  
                  {/* Scanning text */}
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                    <div className="text-white text-xs sm:text-sm bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm">
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        Scanning for QR code...
                      </motion.span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenCamera}
              className={`w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg mt-4 ${cameraStarted ? 'opacity-50 pointer-events-none' : ''} text-sm sm:text-base font-medium transition-all shadow-lg`}
              disabled={cameraStarted}
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" />
              {cameraStarted ? 'Camera Active' : 'Open Camera'}
            </motion.button>
          </div>
          
          <div className="text-center mt-4">
            {scanSuccess && (
              <motion.div 
                className="mb-4 text-center text-green-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl sm:text-3xl">✓</span>
                </div>
                <p className="text-base sm:text-lg font-medium mb-1">QR Code Scanned!</p>
                <p className="text-xs sm:text-sm text-gray-400">Click submit to mark your attendance</p>
                {isLate && (
                  <div className="mt-3 bg-orange-900/30 border border-orange-700 rounded-lg p-2">
                    <p className="text-xs text-orange-300">⚠️ You may be marked as late</p>
                  </div>
                )}
              </motion.div>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMarkPresent}
              className={`w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-all text-sm sm:text-base font-medium shadow-lg ${!scanSuccess || submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!scanSuccess || submitting}
            >
              {submitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 inline-block mr-2" />
                  Mark Present
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Attendance History */}
        {attendanceHistory.length > 0 && (
          <motion.div 
            className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-4 flex items-center">
              <History className="w-5 h-5 mr-2" />
              Recent Attendance
            </h3>
            <div className="space-y-2">
              {attendanceHistory.map((record, idx) => (
                <motion.div
                  key={idx}
                  className="bg-gray-700/50 rounded-lg p-3 flex items-center justify-between"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex items-center space-x-3">
                    {record.isLate ? (
                      <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        {record.className || 'Class'}
                      </p>
                      <p className="text-gray-400 text-xs flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(record.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {record.isLate && (
                    <span className="text-orange-300 text-xs font-medium bg-orange-900/30 px-2 py-1 rounded">
                      Late
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
};

export default StudentDashboard;