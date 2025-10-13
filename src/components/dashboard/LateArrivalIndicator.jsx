import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const LateArrivalIndicator = ({ students, sessionStartTime, gracePeriodMinutes = 10 }) => {
  const onTimeStudents = students.filter(s => !s.isLate);
  const lateStudents = students.filter(s => s.isLate);
  
  const getTimeDifference = (timestamp) => {
    const diff = new Date(timestamp) - new Date(sessionStartTime);
    const minutes = Math.floor(diff / 60000);
    return minutes;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-6 h-6" />
            <span className="text-2xl font-bold">{onTimeStudents.length}</span>
          </div>
          <p className="text-sm text-green-100">On Time</p>
        </div>
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-6 h-6" />
            <span className="text-2xl font-bold">{lateStudents.length}</span>
          </div>
          <p className="text-sm text-orange-100">Late Arrivals</p>
        </div>
      </div>

      {/* Grace Period Info */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-blue-200 text-sm flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span>Grace Period: {gracePeriodMinutes} minutes</span>
      </div>

      {/* Student Lists */}
      <div className="space-y-3">
        {/* On Time Students */}
        {onTimeStudents.length > 0 && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              On Time ({onTimeStudents.length})
            </h4>
            <div className="space-y-2">
              {onTimeStudents.map((student, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-gray-600 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium text-sm">{student.name || student}</p>
                    {student.timestamp && (
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(student.timestamp), 'hh:mm:ss a')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {student.timestamp && (
                      <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded">
                        +{getTimeDifference(student.timestamp)} min
                      </span>
                    )}
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Late Students */}
        {lateStudents.length > 0 && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Late Arrivals ({lateStudents.length})
            </h4>
            <div className="space-y-2">
              {lateStudents.map((student, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-orange-900/20 border border-orange-700 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium text-sm">{student.name || student}</p>
                    {student.timestamp && (
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(student.timestamp), 'hh:mm:ss a')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {student.timestamp && (
                      <span className="text-xs bg-orange-900 text-orange-300 px-2 py-1 rounded font-medium">
                        +{getTimeDifference(student.timestamp)} min
                      </span>
                    )}
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LateArrivalIndicator;
