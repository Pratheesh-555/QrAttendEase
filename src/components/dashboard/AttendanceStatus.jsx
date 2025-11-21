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
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 p-4 sm:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Attendance Status</h2>
        <button
          onClick={onToggleView}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
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
        </button>
      </div>

      {showAttendance && (
        <div>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              {/* Present Students Section */}
              <div>
                <h3 className="font-medium text-green-700 flex items-center mb-2 text-sm sm:text-base">
                  <UserCheck className="w-4 h-4 mr-1" />
                  Present ({presentStudents.length})
                </h3>
                <div className="bg-white border border-green-200 rounded-lg p-3 sm:p-4 h-40 sm:h-48 overflow-auto">
                  {presentStudents.length > 0 ? (
                    <ul className="space-y-1">
                      {presentStudents.map((student, index) => (
                        <li
                          key={index}
                          className="text-gray-700 text-sm sm:text-base flex items-center gap-2"
                        >
                          <span className="text-green-600">✓</span>
                          <span className="font-medium">
                            {typeof student === 'object' ? student.studentName : student}
                          </span>
                          {typeof student === 'object' && student.studentEmail && (
                            <span className="text-xs text-gray-500 truncate">
                              ({student.studentEmail})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No students present yet</p>
                  )}
                </div>
              </div>

              {/* Absent Students Section */}
              <div>
                <h3 className="font-medium text-red-700 flex items-center mb-2 text-sm sm:text-base">
                  <UserX className="w-4 h-4 mr-1" />
                  Absent ({absentStudents.length})
                </h3>
                <div className="bg-white border border-red-200 rounded-lg p-3 sm:p-4 h-40 sm:h-48 overflow-auto">
                  {absentStudents.length > 0 ? (
                    <ul className="space-y-1">
                      {absentStudents.map((student, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between group"
                        >
                          <span className="text-gray-700 text-sm sm:text-base">{student}</span>
                          <button
                            onClick={() => handleMarkPresent(student)}
                            className="p-1 rounded-full bg-gray-200 text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-green-600 hover:text-white transition-all"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No absent students</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {!showAttendance && !studentListUploaded && getRootProps && getInputProps && (
        <div>
          <div 
            {...getRootProps()} 
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-blue-400 transition-colors bg-white"
          >
            <input {...getInputProps()} />
            <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 text-xs sm:text-sm">Drop Excel file here or click to upload student list</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceStatus;