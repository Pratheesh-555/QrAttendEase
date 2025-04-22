import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { CheckCircle, XCircle, Camera, LogOut } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import CryptoJS from 'crypto-js';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentDashboard = () => {
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const webcamRef = useRef(null);
  const codeReader = useRef(null);
  const navigate = useNavigate();

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
    codeReader.current = new BrowserMultiFormatReader();
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  const decryptQRData = (encryptedData) => {
    try {
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData,
        'your-secret-key'
      ).toString(CryptoJS.enc.Utf8);
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Invalid QR code');
    }
  };

  const validateTimestamp = (timestamp) => {
    const now = new Date().getTime();
    const diff = now - timestamp;
    return diff <= 35000;
  };

  const markAttendance = async (classId) => {
    if (!userInfo) return;

    try {
      setIsSubmitting(true);
      // Here you would typically make an API call to your backend
      // to record the attendance
      
      // Simulating an API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setScanResult(prevResult => ({
        ...prevResult,
        attendanceMarked: true
      }));
    } catch (error) {
      setError(error.message);
      setScanned(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startScanning = async () => {
    if (!webcamRef.current?.video || !codeReader.current) return;

    try {
      const result = await codeReader.current.decodeFromVideoElement(webcamRef.current.video);
      if (result) {
        try {
          const decryptedData = decryptQRData(result.getText());
          
          if (!validateTimestamp(decryptedData.timestamp)) {
            throw new Error('QR code has expired');
          }

          setScanResult(decryptedData);
          setScanned(true);
          setError(null);
          await markAttendance(decryptedData.classId);
        } catch (e) {
          setError(e.message);
        }
      }
    } catch (error) {
      if (!error.message.includes('No MultiFormat Readers were able to detect')) {
        setError('Error scanning QR code: ' + error.message);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!scanned && !isSubmitting) {
        startScanning();
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [scanned, isSubmitting]);

  const resetScan = () => {
    setScanned(false);
    setScanResult(null);
    setError(null);
  };

  const handleSignOut = () => {
    localStorage.removeItem('googleToken');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {/* <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          {userInfo?.picture && (
            <img 
              src={userInfo.picture} 
              alt="Profile" 
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold">{userInfo?.name}</h2>
            <p className="text-gray-600">{userInfo?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div> */}

      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        {!scanned && !error && (
          <>
            <div className="mb-4 text-center">
              <h2 className="text-xl font-semibold mb-2">Scan Attendance QR Code</h2>
              <p className="text-gray-600">Position the QR code within the frame</p>
            </div>
            <div className="relative overflow-hidden rounded-lg">
              <Webcam
                ref={webcamRef}
                className="w-full"
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: 'environment',
                }}
              />
              <div className="absolute inset-0 border-2 border-indigo-500 opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Camera className="w-8 h-8 text-indigo-500 animate-pulse" />
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="text-center py-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-600 mb-2">Scan Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={resetScan}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {scanned && scanResult && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-600 mb-2">
              {isSubmitting ? 'Marking Attendance...' : 'Attendance Marked!'}
            </h3>
            <div className="text-gray-600">
              <p className="font-medium">{scanResult.className}</p>
              <p>Date: {scanResult.date}</p>
            </div>
            <button
              onClick={resetScan}
              disabled={isSubmitting}
              className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Scan Another Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;