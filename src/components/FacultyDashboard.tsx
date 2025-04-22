import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Users, CheckCircle, RefreshCw, List, Upload, Download } from 'lucide-react';
import { BrowserQRCodeSvgWriter } from '@zxing/library';
import CryptoJS from 'crypto-js';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import type { Database } from '../lib/database.types';

type Class = Database['public']['Tables']['classes']['Row'];
type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];

const FacultyDashboard: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [qrValue, setQrValue] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [absentees, setAbsentees] = useState<string[]>([]);
  const { user } = useAuthStore();

  const onDrop = async (acceptedFiles: File[]) => {
    if (!selectedClass) return;

    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const studentNames: string[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        .flat()
        .filter((name): name is string => typeof name === 'string' && name.trim() !== '');

      try {
        const { error } = await supabase
          .from('classes')
          .update({ student_list: studentNames })
          .eq('id', selectedClass.id);

        if (error) throw error;

        setSelectedClass({ ...selectedClass, student_list: studentNames });
      } catch (error) {
        console.error('Error updating student list:', error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('faculty_id', user.id)
          .order('time');

        if (error) throw error;
        setClasses(data || []);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedClass) return;

      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('class_id', selectedClass.id)
          .gte('created_at', new Date().toISOString().split('T')[0]);

        if (error) throw error;

        setAttendanceRecords(data || []);

        // Calculate absentees
        if (selectedClass.student_list) {
          const presentStudents = new Set(data?.map(record => record.student_name) || []);
          const absentStudents = selectedClass.student_list.filter(
            student => !presentStudents.has(student)
          );
          setAbsentees(absentStudents);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }
    };

    fetchAttendance();
  }, [selectedClass]);

  const generateSecureQRValue = (classInfo: Class) => {
    const timestamp = new Date().getTime();
    const date = format(new Date(), 'yyyy-MM-dd');
    
    const payload = {
      classId: classInfo.id,
      className: classInfo.name,
      date,
      timestamp,
      salt: CryptoJS.lib.WordArray.random(16).toString()
    };

    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      'your-secret-key'
    ).toString();

    return encryptedData;
  };

  const handleManualRefresh = () => {
    if (selectedClass) {
      const newQRValue = generateSecureQRValue(selectedClass);
      setQrValue(newQRValue);
      setTimeLeft(30);

      const codeWriter = new BrowserQRCodeSvgWriter();
      const canvas = document.getElementById('qr-code');
      if (canvas) {
        canvas.innerHTML = '';
        codeWriter.writeToDom('#qr-code', newQRValue, 256, 256);
      }
    }
  };

  useEffect(() => {
    if (selectedClass) {
      handleManualRefresh();
    }
  }, [selectedClass]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Faculty Dashboard</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Classes</h2>
          {classes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No classes found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`border rounded-lg p-4 hover:border-indigo-500 cursor-pointer transition-colors ${
                    selectedClass?.id === cls.id ? 'border-indigo-500 bg-indigo-50' : ''
                  }`}
                  onClick={() => setSelectedClass(cls)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-lg">{cls.name}</h3>
                    <span className="text-gray-500 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {format(new Date(`2000-01-01T${cls.time}`), 'hh:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Attendance QR Code</h2>
            {selectedClass ? (
              <div className="text-center">
                <div className="bg-gray-50 p-4 rounded-lg inline-block mb-4 relative">
                  <div id="qr-code" className="mx-auto"></div>
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
                    {timeLeft}
                  </div>
                </div>
                <div className="text-gray-600">
                  <p className="font-medium">{selectedClass.name}</p>
                  <button
                    onClick={handleManualRefresh}
                    className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center mx-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh QR Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p>Select a class to generate QR code</p>
              </div>
            )}
          </div>

          {selectedClass && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Student List</h2>
              <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Drop Excel file here or click to upload student list</p>
              </div>

              {selectedClass.student_list && selectedClass.student_list.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Absentees ({absentees.length})</h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    {absentees.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {absentees.map((student, index) => (
                          <li key={index} className="text-red-700">{student}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-green-700">All students are present!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;