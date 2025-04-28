import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, Eye, EyeOff, Upload } from 'lucide-react';

const AttendanceStatus = ({ 
  showAttendance,
  presentStudents,
  absentStudents,
  onToggleView,
  getRootProps,
  getInputProps
}) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-300">Attendance Status</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleView}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          {showAttendance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {showAttendance && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid md:grid-cols-2 gap-4"
          >
            <div>
              <h3 className="font-medium text-green-400 flex items-center mb-2">
                <UserCheck className="w-4 h-4 mr-1" />
                Present ({presentStudents.length})
              </h3>
              <div className="bg-gray-700 rounded-lg p-4 h-48 overflow-auto">
                {presentStudents.length > 0 ? (
                  <ul className="space-y-1">
                    {presentStudents.map((student, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-green-300"
                      >
                        {student}
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No students present yet</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-red-400 flex items-center mb-2">
                <UserX className="w-4 h-4 mr-1" />
                Absent ({absentStudents.length})
              </h3>
              <div className="bg-gray-700 rounded-lg p-4 h-48 overflow-auto">
                {absentStudents.length > 0 ? (
                  <ul className="space-y-1">
                    {absentStudents.map((student, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-red-300"
                      >
                        {student}
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No absent students</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="mt-6"
        whileHover={{ scale: 1.02 }}
      >
        <div 
          {...getRootProps()} 
          className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-400">Drop Excel file here or click to upload student list</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AttendanceStatus;