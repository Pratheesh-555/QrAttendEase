import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Camera, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { toast } from 'react-hot-toast';

const StudentDashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
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
        console.error('Error fetching user info:', error);
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
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText) => {
              try {
                const decrypted = CryptoJS.AES.decrypt(
                  decodedText,
                  'attendance-qr-secret-key'
                ).toString(CryptoJS.enc.Utf8);
                
                const data = JSON.parse(decrypted);
                const now = new Date().getTime();
                
                if (now - data.timestamp > 35000) {
                  toast.error('QR code has expired');
                  return;
                }

                await handleQRScan(decrypted);

              } catch (error) {
                console.error('QR Processing error:', error);
                toast.error('Invalid QR code');
              }
            },
            (error) => {
              if (!error.includes("QR code not found")) {
                console.error("QR Code scan error:", error);
              }
            }
          );
        } else {
          toast.error("No cameras found");
        }
      } catch (err) {
        console.error("Camera initialization error:", err);
        toast.error("Failed to access camera");
      }
    };

    const stopScanner = async () => {
      if (html5QrCode.current?.isScanning) {
        await html5QrCode.current.stop();
        html5QrCode.current = null;
      }
    };

    // Add delay to ensure DOM is ready
    timeoutId = setTimeout(() => {
      startScanner();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, [userInfo]);

  const handleQRScan = async (decodedText) => {
    try {
      const data = JSON.parse(decodedText);
      
      const response = await classApi.markAttendance(
        data.classId,
        userInfo.email,
        userInfo.name
      );

      if (response.success) {
        setScanSuccess(true);
        setScanning(false);
        toast.success('Attendance marked successfully!');
        
        // Store in localStorage for offline access
        const attendanceHistory = JSON.parse(
          localStorage.getItem('attendanceHistory') || '[]'
        );
        attendanceHistory.push({
          classId: data.classId,
          timestamp: new Date().getTime()
        });
        localStorage.setItem('attendanceHistory', JSON.stringify(attendanceHistory));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-6 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          {userInfo?.picture && (
            <div className="flex items-center gap-3">
              <img 
                src={userInfo.picture} 
                alt="Profile" 
                className="w-10 h-10 rounded-full"
              />
              <div className="text-white">
                <h2 className="font-semibold">{userInfo?.name}</h2>
                <p className="text-sm text-gray-300">{userInfo?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        <motion.div 
        className="bg-gray-800 rounded-lg shadow-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative">
          <div 
            id="qr-reader"
            ref={qrReaderRef}
            className="w-[300px] h-[300px] mx-auto rounded-lg overflow-hidden"
          />
          
          {scanning && !scanSuccess && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative w-[250px] h-[250px] border-2 border-purple-500">
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

        {scanSuccess && (
          <motion.div 
            className="mt-4 text-center text-green-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-8 h-8 mx-auto mb-2 text-green-500">✓</div>
            <p className="text-lg mb-4">QR Code Scanned!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Handle attendance submission here
                toast.success('Attendance marked successfully!');
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Mark Present
            </motion.button>
          </motion.div>
        )}
      </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;