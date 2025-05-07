import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Trash2, Upload } from 'lucide-react';

const ClassList = ({ classes, selectedClass, onClassSelect, onDeleteClass, onViewStudents }) => {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gray-800 rounded-lg shadow-xl p-6"
    >
      <h2 className="text-xl font-semibold text-purple-300 mb-4">Your Classes</h2>
      <AnimatePresence>
        <div className="space-y-4">
          {classes.map((cls) => (
            <motion.div
              key={cls.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`bg-gray-700 rounded-lg p-4 ${
                selectedClass?.id === cls.id ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="font-medium text-lg text-purple-300">{cls.name}</h3>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onViewStudents(cls)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1"
                    title="View Student List"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onClassSelect(cls)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg"
                  >
                    Select
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDeleteClass(cls.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg"
                    title="Delete Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </motion.div>
  );
};

export default ClassList;