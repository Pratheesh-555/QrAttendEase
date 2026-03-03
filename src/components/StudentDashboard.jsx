import { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, CheckCircle, XCircle, AlertCircle, History, Clock, LogOut, Award, TrendingUp, Calendar, QrCode } from 'lucide-react';
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
  const [submitSuccess, setSubmitSuccess] = useState(false);
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
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUserInfo(response.data);
        localStorage.setItem('userData', JSON.stringify(response.data));
        setLoading(false);
      } catch (error) {
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
    setAttendanceHistory(history.slice(-10));

    const total = history.length;
    const late = history.filter(r => r.isLate).length;
    const present = total - late;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    setStats({ total, present, late, percentage });
  }, [navigate]);

  useEffect(() => {
    const handleDecoded = async (text) => {
      if (hasScannedRef.current) return;
      hasScannedRef.current = true;

      try {
        const decrypted = CryptoJS.AES.decrypt(text, 'attendance-qr-secret-key').toString(CryptoJS.enc.Utf8);

        if (!decrypted) {
          toast.error('Invalid QR code format');
          hasScannedRef.current = false;
          return;
        }

        const data = JSON.parse(decrypted);
        const now = new Date().getTime();

        if (now - data.timestamp > 30000) {
          toast.error('QR code has expired. Please ask faculty to refresh.');
          hasScannedRef.current = false;
          return;
        }

        setQrData(decrypted);
        setScanSuccess(true);
        setScanning(false);
        toast.success('QR code scanned! Confirm your attendance below.');

        try { codeReaderRef.current?.reset(); } catch (e) { void e; }
      } catch (error) {
        console.error('QR decode error:', error);
        toast.error('Invalid or corrupted QR code');
        hasScannedRef.current = false;
      }
    };

    const startScanner = async () => {
      if (!qrReaderRef.current) return;
      const container = qrReaderRef.current;

      try {
        toast.loading('Starting camera...', { id: 'camera-toast' });

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

        const video = document.createElement('video');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';

        container.appendChild(video);
        videoRef.current = video;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        video.srcObject = stream;

        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            video.play().then(resolve).catch(reject);
          };
          video.onerror = reject;
          setTimeout(() => reject(new Error('Video load timeout')), 10000);
        });

        setScanning(true);
        toast.success('Camera ready — Point at QR code', { id: 'camera-toast' });

        const reader = new BrowserQRCodeReader();
        codeReaderRef.current = reader;

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

        if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
          toast.error('Camera permission denied. Please allow camera access.');
        } else if (err.name === 'NotFoundError') {
          toast.error('No camera found on this device.');
        } else if (err.name === 'NotReadableError') {
          toast.error('Camera is in use by another application.');
        } else {
          toast.error('Camera failed to start. Please refresh and try again.');
        }
      }
    };

    const stopScanner = () => {
      setScanning(false);
      setCameraStarted(false);

      if (codeReaderRef.current) {
        try { codeReaderRef.current.reset(); } catch (e) { }
        codeReaderRef.current = null;
      }

      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => {
            try { track.stop(); } catch (e) { }
          });
          videoRef.current.srcObject = null;
        }
        if (videoRef.current.parentNode) {
          try { videoRef.current.parentNode.removeChild(videoRef.current); } catch (e) { }
        }
        videoRef.current = null;
      }
    };

    if (cameraStarted) {
      startScanner();
    }

    return () => { stopScanner(); };
  }, [userInfo, cameraStarted, scanSuccess]);

  const handleOpenCamera = () => {
    if (!cameraStarted) {
      setCameraStarted(true);
      hasScannedRef.current = false;
      setSubmitSuccess(false);
    }
  };

  const handleMarkPresent = async () => {
    if (!qrData || submitting) return;

    setSubmitting(true);
    const loadingToast = toast.loading('Submitting attendance...');

    try {
      const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;

      if (!data.classId) {
        toast.error('Invalid QR code — missing class ID', { id: loadingToast });
        setSubmitting(false);
        return;
      }

      const response = await classApi.markAttendance(
        data.classId,
        userInfo.email,
        userInfo.name
      );

      if (response.success) {
        toast.success('Attendance marked successfully!', { id: loadingToast });

        setIsLate(response.isLate || false);
        setSubmitSuccess(true);

        // Store in localStorage
        const history = JSON.parse(localStorage.getItem('attendanceHistory') || '[]');
        const newRecord = {
          classId: data.classId,
          className: data.className || 'Unknown Class',
          timestamp: new Date().getTime(),
          isLate: response.isLate || false,
          email: userInfo.email
        };
        history.push(newRecord);
        localStorage.setItem('attendanceHistory', JSON.stringify(history));
        setAttendanceHistory(history.slice(-10));

        // Update stats
        const total = history.length;
        const late = history.filter(r => r.isLate).length;
        const present = total - late;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        setStats({ total, present, late, percentage });

        // Reset scanner states
        setScanSuccess(false);
        setQrData(null);
        hasScannedRef.current = false;

        // Stop camera
        try { codeReaderRef.current?.reset(); } catch (e) { void e; }
        try {
          if (videoRef.current) {
            const stream = videoRef.current.srcObject;
            if (stream && stream.getTracks) stream.getTracks().forEach(t => t.stop());
            videoRef.current.remove();
            videoRef.current = null;
          }
        } catch (e) { void e; }
        setCameraStarted(false);

        // Auto-hide success after 5 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
          setIsLate(false);
        }, 5000);
      } else {
        toast.error(response.message || 'Failed to mark attendance', { id: loadingToast });
      }
    } catch (error) {
      console.error('Attendance submission error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Network error. Please try again.';
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('googleToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('lastRoute');
    localStorage.removeItem('userRole');
    navigate('/');
    toast.success('Signed out successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-500 text-sm mt-4">Loading your dashboard...</p>
        </div>
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
            background: '#fff',
            color: '#1e293b',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
          },
        }}
      />

      <div className="min-h-screen bg-slate-50">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                {userInfo.picture ? (
                  <img
                    src={userInfo.picture}
                    alt="Profile"
                    className="w-9 h-9 rounded-full border border-gray-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {userInfo.name?.charAt(0) || 'S'}
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Student Portal</h1>
                  <p className="text-xs text-gray-500">{userInfo.email}</p>
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
              </div>
              <p className="text-gray-500 text-xs font-medium">Total Classes</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.present}</span>
              </div>
              <p className="text-gray-500 text-xs font-medium">On Time</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.late}</span>
              </div>
              <p className="text-gray-500 text-xs font-medium">Late Arrivals</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.percentage}%</span>
              </div>
              <p className="text-gray-500 text-xs font-medium">Attendance Rate</p>
            </div>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <div className={`mb-6 rounded-lg p-5 border ${isLate ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center">
                {isLate ? (
                  <AlertCircle className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                )}
                <div>
                  <h3 className={`font-semibold ${isLate ? 'text-amber-900' : 'text-green-900'}`}>
                    {isLate ? 'Attendance Marked (Late)' : 'Attendance Marked Successfully!'}
                  </h3>
                  <p className={`text-sm mt-1 ${isLate ? 'text-amber-700' : 'text-green-700'}`}>
                    {isLate ? 'You arrived late. Please be on time next session.' : 'Your attendance has been recorded.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main QR Scanner Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900 flex items-center">
                <QrCode className="w-5 h-5 text-blue-500 mr-2" />
                QR Scanner
              </h2>
              {scanSuccess && (
                <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  QR Detected
                </span>
              )}
            </div>

            <div className="relative flex flex-col items-center">
              <div
                id="qr-reader"
                ref={qrReaderRef}
                className="relative w-full aspect-square max-w-[320px] sm:max-w-[380px] mx-auto rounded-xl overflow-hidden bg-gray-900 border-2 border-gray-200"
                style={{ position: 'relative' }}
              >
                {cameraStarted && !scanning && !videoRef.current?.srcObject && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-center z-10 bg-gray-900">
                    <div>
                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-400 border-t-transparent mx-auto mb-3"></div>
                      <p className="text-sm text-gray-300">Starting camera...</p>
                    </div>
                  </div>
                )}
                {!cameraStarted && (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-6 z-10 bg-gray-50">
                    <div>
                      <Camera className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-gray-600 mb-1">Ready to Scan</p>
                      <p className="text-xs text-gray-400">Click the button below to activate camera</p>
                    </div>
                  </div>
                )}

                {/* Scanning overlay */}
                {scanning && !scanSuccess && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="absolute top-4 left-4 w-10 h-10 border-t-3 border-l-3 border-blue-400 rounded-tl-xl" />
                    <div className="absolute top-4 right-4 w-10 h-10 border-t-3 border-r-3 border-blue-400 rounded-tr-xl" />
                    <div className="absolute bottom-4 left-4 w-10 h-10 border-b-3 border-l-3 border-blue-400 rounded-bl-xl" />
                    <div className="absolute bottom-4 right-4 w-10 h-10 border-b-3 border-r-3 border-blue-400 rounded-br-xl" />

                    <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                      <div className="bg-blue-600/90 px-4 py-2 rounded-full">
                        <span className="text-white font-medium text-xs">Scanning for QR code...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success overlay */}
                {scanSuccess && (
                  <div className="absolute inset-0 bg-green-600/90 flex items-center justify-center z-30">
                    <div className="text-center">
                      <CheckCircle className="w-16 h-16 mx-auto mb-3 text-white" />
                      <h3 className="text-lg font-bold text-white mb-1">QR Code Detected!</h3>
                      <p className="text-green-100 text-sm">Confirm your attendance below</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera button */}
              <button
                onClick={handleOpenCamera}
                className={`w-full max-w-[320px] sm:max-w-[380px] mt-4 px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 text-sm transition-colors ${cameraStarted
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                disabled={cameraStarted}
              >
                <Camera className="w-4 h-4" />
                <span>{cameraStarted ? 'Camera Active' : 'Open Camera'}</span>
              </button>
            </div>

            {/* Confirm & Submit */}
            {scanSuccess && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">Ready to Submit Attendance</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Click the button below to confirm and submit your attendance for this class.
                  </p>
                  <button
                    onClick={handleMarkPresent}
                    disabled={submitting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirm & Mark Present</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Attendance History */}
          {attendanceHistory.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <History className="w-5 h-5 text-blue-500 mr-2" />
                  Recent Attendance
                </h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {showHistory ? 'Hide' : 'Show All'}
                </button>
              </div>

              {showHistory && (
                <div className="space-y-2">
                  {attendanceHistory.map((record, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        {record.isLate ? (
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.className}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(record.timestamp).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-semibold ${record.isLate ? 'text-amber-600' : 'text-green-600'}`}>
                          {record.isLate ? 'Late' : 'On Time'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(record.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default StudentDashboard;
