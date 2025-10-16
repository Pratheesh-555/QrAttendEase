import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { motion } from 'framer-motion';
import { Camera, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const QRScanner = ({ onScanSuccess, userEmail, userName }) => {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const html5QrCodeRef = useRef(null);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    const startScanner = async () => {
      const container = document.getElementById('qr-reader');
      if (!container) return;
      container.innerHTML = '';
      const videoEl = document.createElement('video');
      videoEl.setAttribute('playsinline', 'true');
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      container.appendChild(videoEl);
      videoRef.current = videoEl;

      try {
        codeReaderRef.current = new BrowserQRCodeReader(null, { timeBetweenDecodingAttempts: 150 });
        const devices = await codeReaderRef.current.getVideoInputDevices();
        if (!devices || !devices.length) {
          setErrorMsg('No cameras found');
          toast.error('No cameras found');
          return;
        }

        const envDevice = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];
        setScanning(true);

        codeReaderRef.current.decodeFromVideoDevice(envDevice.deviceId, videoEl, (result, err) => {
          if (result) {
              setScannedData(result.getText());
              setCanSubmit(true);
              try { codeReaderRef.current.reset(); } catch (e) { void e; }
              setScanning(false);
              setErrorMsg('');
              try { new Audio('/success.mp3').play(); } catch (e) { void e; }
            } else if (err) {
              void err; // intentionally ignore frequent not-found errors
            }
        });
      } catch (err) {
        setErrorMsg('Camera access error');
        toast.error('Failed to access camera');
      }
    };

    const stopScanner = () => {
      try { codeReaderRef.current?.reset(); } catch (e) { void e; }
      codeReaderRef.current = null;
      if (videoRef.current) {
        try {
          const stream = videoRef.current.srcObject;
          if (stream && stream.getTracks) stream.getTracks().forEach(t => t.stop());
        } catch (e) { void e; }
        videoRef.current.remove();
        videoRef.current = null;
      }
      setScanning(false);
    };

    if (cameraStarted) startScanner();
    return () => stopScanner();
  }, [cameraStarted]);

  const handleOpenCamera = () => {
    setCameraStarted(true);
    setCanSubmit(false);
    setErrorMsg("");
    setScannedData(null);
  };

  const handleMarkAttendance = () => {
    if (canSubmit && scannedData) {
      alert("Sending this data:\n" + JSON.stringify({
  qrData: scannedData,
  studentName: userName,
  studentEmail: userEmail
}));
      onScanSuccess({
        qrData: scannedData,
        studentName: userName,
        studentEmail: userEmail
      });
      setCanSubmit(false);
      setScannedData(null);
      setCameraStarted(false);
      setErrorMsg("");
      try { codeReaderRef.current?.reset(); } catch (e) { void e; }
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-4">
      <div className="relative flex flex-col items-center">
        <div 
          id="qr-reader" 
          className="w-full max-w-xs h-[60vw] max-h-[350px] mx-auto rounded-lg overflow-hidden"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenCamera}
          className={`bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg mt-4 ${cameraStarted ? 'opacity-50 pointer-events-none' : ''}`}
          disabled={cameraStarted}
        >
          <Camera className="w-5 h-5 inline-block mr-2" />
          Open Camera
        </motion.button>
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMarkAttendance}
          className={`bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors ${!canSubmit ? 'opacity-50 pointer-events-none' : ''}`}
          disabled={!canSubmit}
        >
          Submit Attendance
        </motion.button>
        {errorMsg && (
          <div className="mt-2 text-red-400">{errorMsg}</div>
        )}
        {scannedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-green-400 mb-4">QR Code Scanned Successfully!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;