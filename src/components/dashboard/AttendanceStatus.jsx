import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, Eye, EyeOff, Upload, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AttendanceStatus = ({ 
  showAttendance,
  presentStudents,
  absentStudents,
  onToggleView,
  getRootProps,
  getInputProps,
  onMarkPresent,
  studentListUploaded
}) => {
  const handleMarkPresent = (student) => {
    if (window.confirm(`Mark ${student} as present?`)) {
      onMarkPresent(student);
      toast.success(`${student} marked as present`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-purple-300">Attendance Status</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleView}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          {showAttendance ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Show
            </>
          )}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {showAttendance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              {/* Present Students Section */}
              <div>
                <h3 className="font-medium text-green-400 flex items-center mb-2 text-sm sm:text-base">
                  <UserCheck className="w-4 h-4 mr-1" />
                  Present ({presentStudents.length})
                </h3>
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4 h-40 sm:h-48 overflow-auto">
                  {presentStudents.length > 0 ? (
                    <ul className="space-y-1">
                      {presentStudents.map((student, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="text-green-300 text-sm sm:text-base flex items-center gap-2"
                        >
                          <span className="text-green-500">✓</span>
                          <span className="font-medium">
                            {typeof student === 'object' ? student.studentName : student}
                          </span>
                          {typeof student === 'object' && student.studentEmail && (
                            <span className="text-xs text-gray-400 truncate">
                              ({student.studentEmail})
                            </span>
                          )}
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No students present yet</p>
                  )}
                </div>
              </div>

              {/* Absent Students Section */}
              <div>
                <h3 className="font-medium text-red-400 flex items-center mb-2 text-sm sm:text-base">
                  <UserX className="w-4 h-4 mr-1" />
                  Absent ({absentStudents.length})
                </h3>
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4 h-40 sm:h-48 overflow-auto">
                  {absentStudents.length > 0 ? (
                    <ul className="space-y-1">
                      {absentStudents.map((student, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between group"
                        >
                          <span className="text-red-300 text-sm sm:text-base">{student}</span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleMarkPresent(student)}
                            className="p-1 rounded-full bg-gray-600 text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-green-600 hover:text-white transition-all"
                          >
                            <Check className="w-4 h-4" />
                          </motion.button>
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No absent students</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!showAttendance && !studentListUploaded && getRootProps && getInputProps && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div>
              <div 
                {...getRootProps()} 
                className="border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
              >
                <input {...getInputProps()} />
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-400 text-xs sm:text-sm">Drop Excel file here or click to upload student list</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceStatus;