import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const ClassList = ({ classes, selectedClass, onClassSelect, onDeleteClass, deleteConfirm }) => {
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
              className={`bg-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-600 ${
                selectedClass?.id === cls.id ? 'ring-2 ring-purple-500 bg-gray-600' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => onClassSelect(cls)}
                >
                  <h3 className="font-medium text-lg text-purple-300">{cls.name}</h3>
                  <div className="flex items-center text-gray-400 text-sm mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    {format(new Date(`2000-01-01T${cls.time}`), 'hh:mm a')}
                    <Users className="w-4 h-4 ml-3 mr-1" />
                    {cls.studentCount} students
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDeleteClass(cls.id)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    deleteConfirm === cls.id 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  title={deleteConfirm === cls.id ? "Click again to confirm deletion" : "Delete class"}
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </motion.div>
  );
};

export default ClassList;