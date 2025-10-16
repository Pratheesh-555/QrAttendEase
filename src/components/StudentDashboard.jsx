import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Camera, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { toast } from 'react-hot-toast';
import { classApi } from '../api/classApi';

const StudentDashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [presentees, setPresentees] = useState([]);
  const [isLate, setIsLate] = useState(false);
  const navigate = useNavigate();
  const qrReaderRef = useRef(null);
  const html5QrCode = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('googleToken');
    if (!token) {
      navigate('/');
      return;
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
        setLoading(false);
      } catch (error) {
        localStorage.removeItem('googleToken');
        navigate('/');
      }
    };

    getUserInfo();
  }, [navigate]);

  useEffect(() => {
    let timeoutId;

    const startScanner = async () => {
      if (!qrReaderRef.current || html5QrCode.current) return;
      try {
        html5QrCode.current = new Html5Qrcode("qr-reader");
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length) {
          setScanning(true);
          await html5QrCode.current.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: window.innerWidth < 500 ? 200 : 300, height: window.innerWidth < 500 ? 200 : 300 },
            },
            async (decodedText) => {
              try {
                const decrypted = CryptoJS.AES.decrypt(
                  decodedText,
                  'attendance-qr-secret-key'
                ).toString(CryptoJS.enc.Utf8);
                const data = JSON.parse(decrypted);
                const now = new Date().getTime();
                if (now - data.timestamp > 30000) {
                  toast.error('QR code has expired');
                  return;
                }
                setQrData(decrypted);
                setScanSuccess(true);
                setScanning(false);
                toast.success('QR code scanned! Now submit to mark attendance.');
              } catch (error) {
                toast.error('Invalid QR code');
              }
            },
            (error) => {
              // Silently ignore "QR code not found" errors
            }
          );
        } else {
          toast.error("No cameras found");
        }
      } catch (err) {
        toast.error("Failed to access camera");
      }
    };

    const stopScanner = async () => {
      if (html5QrCode.current?.isScanning) {
        await html5QrCode.current.stop();
        html5QrCode.current = null;
      }
    };

    if (cameraStarted) {
      timeoutId = setTimeout(() => {
        startScanner();
      }, 500);
    }

    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, [userInfo, cameraStarted]);
  const handleOpenCamera = () => {
    setCameraStarted(true);
  };

  const handleMarkPresent = async () => {
    if (!qrData) {
      toast.error('No QR data available');
      return;
    }
   
    try {
      const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      
      if (!data.classId) {
        toast.error('Invalid QR code - missing class ID');
        return;
      }
      
      const response = await classApi.markAttendance(
        data.classId,
        userInfo.email,
        userInfo.name
      );
      
      if (response.success) {
        toast.success('Attendance marked successfully!');
        
        // Check if marked as late
        setIsLate(response.isLate || false);
        
        // Store in localStorage for offline access
        const attendanceHistory = JSON.parse(
          localStorage.getItem('attendanceHistory') || '[]'
        );
        attendanceHistory.push({
          classId: data.classId,
          timestamp: new Date().getTime(),
          isLate: response.isLate || false
        });
        localStorage.setItem('attendanceHistory', JSON.stringify(attendanceHistory));
        
        // Update presentee list
        setPresentees((prev) => [...prev, userInfo.name]);
        setScanSuccess(false);
        setQrData(null);
        
        // Stop camera after successful submission
        if (html5QrCode.current?.isScanning) {
          await html5QrCode.current.stop();
          html5QrCode.current = null;
        }
        setCameraStarted(false);
      } else {
        toast.error(response.message || 'Failed to mark attendance');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to mark attendance');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('googleToken');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-4 sm:py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* User Info Section */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 bg-gray-800 rounded-lg p-3 sm:p-4">
          {userInfo?.picture && (
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src={userInfo.picture} 
                alt="Profile" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-500"
              />
              <div className="text-white">
                <h2 className="font-semibold text-sm sm:text-base">{userInfo?.name}</h2>
                <p className="text-xs sm:text-sm text-gray-300 truncate max-w-[150px] sm:max-w-[200px]">{userInfo?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs sm:text-sm transition-colors"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        <motion.div 
          className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg sm:text-xl font-semibold text-purple-300 mb-4 text-center">Scan QR Code</h2>
          
          <div className="relative flex flex-col items-center">
            <div 
              id="qr-reader"
              ref={qrReaderRef}
              className="w-full max-w-[280px] sm:max-w-xs h-[280px] sm:h-[60vw] sm:max-h-[350px] mx-auto rounded-lg overflow-hidden bg-gray-700"
            />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenCamera}
              className={`w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg mt-4 ${cameraStarted ? 'opacity-50 pointer-events-none' : ''} text-sm sm:text-base font-medium transition-all`}
              disabled={cameraStarted}
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" />
              {cameraStarted ? 'Camera Active' : 'Open Camera'}
            </motion.button>
            
            {scanning && !scanSuccess && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="relative w-full max-w-[280px] sm:max-w-xs h-[280px] sm:h-[60vw] sm:max-h-[350px] border-2 border-purple-500 rounded-lg">
                  <motion.div 
                    className="absolute left-0 right-0 h-0.5 bg-purple-500"
                    initial={{ top: 0 }}
                    animate={{ top: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear"
                    }}
                  />
                </div>
              </motion.div>
            )}
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
              className={`w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base font-medium ${!scanSuccess ? 'opacity-50 pointer-events-none' : ''}`}
              disabled={!scanSuccess}
            >
              Mark Present
            </motion.button>
          </div>
        </motion.div>

        {presentees.length > 0 && (
          <motion.div 
            className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Present Today
            </h3>
            <ul className="space-y-2">
              {presentees.map((name, idx) => (
                <li 
                  key={idx} 
                  className="text-green-300 bg-gray-700 px-3 sm:px-4 py-2 rounded-lg flex items-center text-sm sm:text-base"
                >
                  <span className="text-green-500 mr-2">✓</span>
                  {name}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;