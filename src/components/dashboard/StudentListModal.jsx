import { motion } from 'framer-motion';
import { X, Upload } from 'lucide-react';

const StudentListModal = ({ isOpen, onClose, students, className, getRootProps, getInputProps, isDragActive }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 min-h-screen h-screen w-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-md rounded-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-300"
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Student List - {className}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {students && students.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900">{student}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8">
              {getRootProps && getInputProps ? (
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                  <p className="text-gray-900 font-medium mb-1">
                    {isDragActive ? 'Drop the file here' : 'Upload Student List'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Drag and drop an Excel file here, or click to select
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No students uploaded yet</p>
                  <p className="text-gray-400 text-sm mt-2">Close this modal and upload a student list from the main panel</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StudentListModal;