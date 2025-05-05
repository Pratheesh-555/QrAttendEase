import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Camera, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const QRScanner = ({ onScanSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader");
        const cameras = await Html5Qrcode.getCameras();
        
        if (cameras && cameras.length) {
          setScanning(true);
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              setScannedData(decodedText);
              html5QrCode.stop();
              setScanning(false);
            },
            (error) => {
              console.error("QR Code scan error:", error);
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

    startScanner();
    return () => stopScanner();
  }, []);

  const handleSubmit = () => {
    if (scannedData) {
      onScanSuccess(scannedData);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-4">
      <div id="qr-reader" className="w-full max-w-[300px] mx-auto mb-4" />
      
      {scanning ? (
        <div className="text-center text-gray-300">
          <Camera className="w-6 h-6 mx-auto animate-pulse mb-2" />
          <p>Scanning for QR Code...</p>
        </div>
      ) : scannedData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-green-400 mb-4">QR Code detected!</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Submit Attendance
          </motion.button>
        </motion.div>
      ) : (
        <div className="text-center text-gray-400">
          <p>No QR code detected</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;