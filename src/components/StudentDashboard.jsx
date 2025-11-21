import { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
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
      if (!qrReaderRef.current) return;

      const container = qrReaderRef.current;
      
      try {
        toast.loading('📷 Starting camera...', { id: 'camera-toast' });
        
        // Clean up any existing elements
        if (videoRef.current) {
          if (videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
          }
          if (videoRef.current.parentNode) {
            videoRef.current.parentNode.removeChild(videoRef.current);
          }
          videoRef.current = null;
        }
        
        if (codeReaderRef.current) {
          codeReaderRef.current.reset();
          codeReaderRef.current = null;
        }
        
        container.innerHTML = '';
        
        // Create video element
        const video = document.createElement('video');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
        
        container.appendChild(video);
        videoRef.current = video;
        
        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        
        video.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            video.play()
              .then(resolve)
              .catch(reject);
          };
          video.onerror = reject;
          setTimeout(() => reject(new Error('Video load timeout')), 10000);
        });
        
        setScanning(true);
        toast.success('📷 Camera ready - Scan QR code', { id: 'camera-toast' });
        
        // Initialize QR reader
        const reader = new BrowserQRCodeReader();
        codeReaderRef.current = reader;
        
        // Start decoding
        reader.decodeFromVideoElement(video, (result, error) => {
          if (result && !scanSuccess && !hasScannedRef.current) {
            handleDecoded(result.getText());
          }
        });
        
      } catch (err) {
        console.error('Camera error:', err);
        toast.dismiss('camera-toast');
        setScanning(false);
        setCameraStarted(false);
        
        // Cleanup on error
        if (videoRef.current) {
          if (videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
          }
          if (videoRef.current.parentNode) {
            videoRef.current.parentNode.removeChild(videoRef.current);
          }
          videoRef.current = null;
        }
        
        if (codeReaderRef.current) {
          codeReaderRef.current.reset();
          codeReaderRef.current = null;
        }
        
        // User-friendly error messages
        if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
          toast.error('📷 Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          toast.error('📷 No camera found. Please ensure your device has a camera.');
        } else if (err.name === 'NotReadableError') {
          toast.error('📷 Camera is in use by another application. Please close other apps using the camera.');
        } else if (err.message?.includes('timeout')) {
          toast.error('📷 Camera took too long to start. Please refresh and try again.');
        } else {
          toast.error('📷 Camera failed to start. Please refresh the page and try again.');
        }
      }
    };

    const stopScanner = () => {
      setScanning(false);
      setCameraStarted(false);
      
      // Stop QR reader
      if (codeReaderRef.current) {
        try {
          codeReaderRef.current.reset();
        } catch (e) {
          console.error('Error resetting reader:', e);
        }
        codeReaderRef.current = null;
      }
      
      // Stop video stream
      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach(track => {
            try {
              track.stop();
            } catch (e) {
              console.error('Error stopping track:', e);
            }
          });
          videoRef.current.srcObject = null;
        }
        
        // Remove video element
        if (videoRef.current.parentNode) {
          try {
            videoRef.current.parentNode.removeChild(videoRef.current);
          } catch (e) {
            console.error('Error removing video:', e);
          }
        }
        videoRef.current = null;
      }
    };

    if (cameraStarted) {
      startScanner();
    }

    return () => {
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-600"></div>
          <Camera className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-600" />
        </div>
        <p className="text-gray-700 text-lg mt-6 font-medium">
          Loading your dashboard...
        </p>
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
            background: '#fff',
            color: '#1e293b',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
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
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-100 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with user info and sign out */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-300 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {userInfo.picture ? (
                  <img 
                    src={userInfo.picture} 
                    alt="Profile" 
                    className="w-14 h-14 rounded-full border-2 border-blue-300 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xl shadow-md">
                    {userInfo.name?.charAt(0) || 'S'}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Award className="w-6 h-6 mr-2 text-blue-600" />
                    {userInfo.name?.split(' ')[0] || 'Student'} Portal
                  </h1>
                  <p className="text-gray-600 text-sm">{userInfo.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow hover:shadow-md hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
              </div>
              <p className="text-gray-600 text-sm font-medium">Total Classes</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow hover:shadow-md hover:border-green-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-green-50 p-2 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.present}</span>
              </div>
              <p className="text-gray-600 text-sm font-medium">On Time</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow hover:shadow-md hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-amber-50 p-2 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.late}</span>
              </div>
              <p className="text-gray-600 text-sm font-medium">Late Arrivals</p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 shadow-md border-2 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-blue-500/30 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.percentage}%</span>
              </div>
              <p className="text-blue-50 text-sm font-medium">Attendance Rate</p>
            </div>
          </div>

          {/* Main QR Scanner Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-6 sm:p-8 mb-6 border border-slate-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-2">
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                QR Scanner
              </h2>
              {scanSuccess && (
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              )}
            </div>
          
          <div className="relative flex flex-col items-center">
            <div 
              id="qr-reader"
              ref={qrReaderRef}
              className="relative w-full aspect-square max-w-[350px] sm:max-w-[450px] mx-auto rounded-2xl overflow-hidden bg-gray-900 border-4 border-blue-200 shadow-2xl"
              style={{ position: 'relative' }}
            >
              {cameraStarted && !scanning && !videoRef.current?.srcObject && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-center z-10 bg-gradient-to-br from-blue-900/90 to-indigo-900/90 backdrop-blur-sm">
                  <div>
                    <div className="mx-auto mb-4">
                      <Camera className="w-16 h-16 text-blue-400" />
                    </div>
                    <p className="text-lg font-medium">Initializing camera...</p>
                  </div>
                </div>
              )}
              {!cameraStarted && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6 z-10">
                  <div>
                    <div>
                      <Camera className="w-20 h-20 mx-auto mb-4 text-blue-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">Ready to Scan</p>
                    <p className="text-sm text-gray-300">Click the button below to activate camera</p>
                  </div>
                </div>
              )}
              
              {/* Scanning overlay with corner brackets */}
              {scanning && !scanSuccess && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Corner brackets */}
                  <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl" />
                  <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl" />
                  <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl" />
                  <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-2xl" />
                  
                  {/* Scanning text badge */}
                  <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                    <div className="bg-blue-600 px-6 py-3 rounded-full shadow-lg border border-blue-500">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-white" />
                        <span className="text-white font-medium text-sm sm:text-base">
                          Scanning for QR code...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success overlay */}
              {scanSuccess && (
                <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center z-30">
                  <div className="text-center">
                    <div>
                      <CheckCircle className="w-24 h-24 mx-auto mb-4 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      QR Code Detected!
                    </h3>
                    <p className="text-white">
                      Click "Mark Present" below
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Camera control button */}
            <button
              onClick={handleOpenCamera}
              className={`w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 ${cameraStarted ? 'opacity-50 cursor-not-allowed' : ''} transition-colors`}
              disabled={cameraStarted}
            >
              <Camera className="w-5 h-5" />
              <span>{cameraStarted ? 'Camera Active' : 'Open Camera'}</span>
            </button>
          </div>
          
          {/* Success message and action button */}
          {scanSuccess && (
            <div className="mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Ready to Submit!</h3>
                </div>
                {isLate && (
                  <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
                    <p className="text-amber-900 text-sm">
                      You are late! Please arrive on time next session.
                    </p>
                  </div>
                )}
                <button
                  onClick={handleMarkPresent}
                  disabled={submitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Mark Present</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          </div>

          {/* Attendance History Section */}
          {attendanceHistory.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-6 sm:p-8 border border-slate-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-2">
                    <History className="w-5 h-5 text-blue-600" />
                  </div>
                  Recent Attendance
                </h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {showHistory ? 'Hide' : 'Show'} All
                </button>
              </div>
              
              {showHistory && (
                <div className="space-y-3">
                  {attendanceHistory.map((record, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {record.isLate ? (
                            <div className="bg-yellow-100 p-2 rounded-lg">
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            </div>
                          ) : (
                            <div className="bg-green-100 p-2 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                          )}
                          <div>
                            <p className="text-gray-900 font-semibold">{record.className}</p>
                            <p className="text-gray-500 text-sm">
                              {new Date(record.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${record.isLate ? 'text-yellow-600' : 'text-green-600'}`}>
                            {record.isLate ? 'Late' : 'On Time'}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {new Date(record.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
