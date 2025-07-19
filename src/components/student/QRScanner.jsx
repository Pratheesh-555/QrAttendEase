import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Camera, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const QRScanner = ({ onScanSuccess, userEmail, userName }) => {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader");
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length) {
          setScanning(true);
          setCameraStarted(true);
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: window.innerWidth < 500 ? 200 : 300, height: window.innerWidth < 500 ? 200 : 300 },
            },
            (decodedText) => {
              setScannedData(decodedText);
              html5QrCode.stop();
              setScanning(false);
              // Play success sound
              try {
                new Audio('/success.mp3').play();
              } catch (err) {
                console.log('Audio not supported');
              }
            },
            (error) => {
              if (!error.includes("QR code not found")) {
                console.error("QR Code scan error:", error);
              }
            }
          );
        }
      } catch (err) {
        console.error("Camera access error:", err);
        toast.error("Failed to access camera");
      }
    };

    const stopScanner = () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };

    if (cameraStarted) startScanner();
    return () => stopScanner();
  }, [cameraStarted]);

  const handleOpenCamera = () => {
    setCameraStarted(true);
  };

  const handleMarkAttendance = () => {
    if (scannedData) {
      onScanSuccess({
        qrData: scannedData,
        studentName: userName,
        studentEmail: userEmail
      });
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-4">
      <div className="relative flex flex-col items-center">
        <div 
          id="qr-reader" 
          className="w-full max-w-xs h-[60vw] max-h-[350px] mx-auto rounded-lg overflow-hidden"
        />
        {!cameraStarted && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenCamera}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg mt-4"
          >
            <Camera className="w-5 h-5 inline-block mr-2" />
            Open Camera
          </motion.button>
        )}
        {scanning && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative w-full max-w-xs h-[60vw] max-h-[350px] border-2 border-purple-500">
              {/* Animated scanning line */}
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
        {scannedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-green-400 mb-4">QR Code Scanned Successfully!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMarkAttendance}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Submit Attendance
            </motion.button>
          </motion.div>
        )}
        {/* Always show fallback submit button for manual testing */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMarkAttendance}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg mt-2"
        >
          Submit (Manual)
        </motion.button>
      </div>
    </div>
  );
};

export default QRScanner;