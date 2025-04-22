// import React, { useState, useEffect, useRef } from 'react';
// import Webcam from 'react-webcam';
// import { CheckCircle, XCircle, Camera } from 'lucide-react';
// import { BrowserMultiFormatReader } from '@zxing/library';
// import CryptoJS from 'crypto-js';
// import { getDeviceId } from '../lib/deviceId';
// import { useAuthStore } from '../lib/store';

// const StudentDashboard: React.FC = () => {
//   const [scanned, setScanned] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [scanResult, setScanResult] = useState<any>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const webcamRef = useRef<Webcam>(null);
//   const codeReader = useRef<BrowserMultiFormatReader | null>(null);
//   const { user } = useAuthStore();

//   useEffect(() => {
//     codeReader.current = new BrowserMultiFormatReader();
//     return () => {
//       if (codeReader.current) {
//         codeReader.current.reset();
//       }
//     };
//   }, []);

//   const decryptQRData = (encryptedData: string) => {
//     try {
//       const decrypted = CryptoJS.AES.decrypt(
//         encryptedData,
//         'your-secret-key'
//       ).toString(CryptoJS.enc.Utf8);
      
//       return JSON.parse(decrypted);
//     } catch (error) {
//       throw new Error('Invalid QR code');
//     }
//   };

//   const validateTimestamp = (timestamp: number) => {
//     const now = new Date().getTime();
//     const diff = now - timestamp;
//     return diff <= 35000;
//   };

//   const markAttendance = async (classId: string) => {
//     if (!user) return;

//     try {
//       setIsSubmitting(true);
//       const deviceId = getDeviceId();
      
//       // Check if attendance already marked for today
//       const today = new Date().toISOString().split('T')[0];
//       const { data: existingAttendance, error: checkError } = await supabase
//         .from('attendance_records')
//         .select('id')
//         .eq('class_id', classId)
//         .eq('student_id', user.id)
//         .gte('created_at', today)
//         .lt('created_at', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString());

//       if (checkError) throw checkError;

//       if (existingAttendance && existingAttendance.length > 0) {
//         throw new Error('Attendance already marked for today');
//       }

//       // Insert attendance record
//       const { error: insertError } = await supabase
//         .from('attendance_records')
//         .insert({
//           class_id: classId,
//           student_id: user.id,
//           device_id: deviceId
//         });

//       if (insertError) {
//         if (insertError.code === '23505') { // Unique violation
//           throw new Error('Attendance already marked for today');
//         }
//         throw insertError;
//       }

//       setScanResult(prevResult => ({
//         ...prevResult,
//         attendanceMarked: true
//       }));
//     } catch (error: any) {
//       setError(error.message);
//       setScanned(false);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const startScanning = async () => {
//     if (!webcamRef.current?.video || !codeReader.current) return;

//     try {
//       const result = await codeReader.current.decodeFromVideoElement(webcamRef.current.video);
//       if (result) {
//         try {
//           const decryptedData = decryptQRData(result.getText());
          
//           if (!validateTimestamp(decryptedData.timestamp)) {
//             throw new Error('QR code has expired');
//           }

//           setScanResult(decryptedData);
//           setScanned(true);
//           setError(null);
//           await markAttendance(decryptedData.classId);
//         } catch (e: any) {
//           setError(e.message);
//         }
//       }
//     } catch (error: any) {
//       if (!error.message.includes('No MultiFormat Readers were able to detect')) {
//         setError('Error scanning QR code: ' + error.message);
//       }
//     }
//   };

//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (!scanned && !isSubmitting) {
//         startScanning();
//       }
//     }, 500);

//     return () => {
//       clearInterval(interval);
//     };
//   }, [scanned, isSubmitting]);

//   const resetScan = () => {
//     setScanned(false);
//     setScanResult(null);
//     setError(null);
//   };

//   return (
//     <div className="container mx-auto px-4">
//       <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Attendance</h1>

//       <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
//         {!scanned && !error && (
//           <>
//             <div className="mb-4 text-center">
//               <h2 className="text-xl font-semibold mb-2">Scan Attendance QR Code</h2>
//               <p className="text-gray-600">Position the QR code within the frame</p>
//             </div>
//             <div className="relative overflow-hidden rounded-lg">
//               <Webcam
//                 ref={webcamRef}
//                 className="w-full"
//                 screenshotFormat="image/jpeg"
//                 videoConstraints={{
//                   facingMode: 'environment',
//                 }}
//               />
//               <div className="absolute inset-0 border-2 border-indigo-500 opacity-50"></div>
//               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
//                 <Camera className="w-8 h-8 text-indigo-500 animate-pulse" />
//               </div>
//             </div>
//           </>
//         )}

//         {error && (
//           <div className="text-center py-8">
//             <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-red-600 mb-2">Scan Error</h3>
//             <p className="text-gray-600 mb-4">{error}</p>
//             <button
//               onClick={resetScan}
//               className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
//             >
//               Try Again
//             </button>
//           </div>
//         )}

//         {scanned && scanResult && (
//           <div className="text-center py-8">
//             <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-green-600 mb-2">
//               {isSubmitting ? 'Marking Attendance...' : 'Attendance Marked!'}
//             </h3>
//             <div className="text-gray-600">
//               <p className="font-medium">{scanResult.className}</p>
//               <p>Date: {scanResult.date}</p>
//             </div>
//             <button
//               onClick={resetScan}
//               disabled={isSubmitting}
//               className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
//             >
//               Scan Another Code
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default StudentDashboard;