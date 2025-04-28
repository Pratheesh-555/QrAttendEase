import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const AddClassModal = ({ 
  isOpen, 
  newClass, 
  onClose, 
  onChange,
  onSubmit 
}) => {
  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-semibold text-purple-300 mb-4">Add New Class</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">Class Name</label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => onChange({ ...newClass, name: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter class name"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Class Time</label>
                <input
                  type="time"
                  value={newClass.time}
                  onChange={(e) => onChange({ ...newClass, time: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={newClass.name ? { scale: 1.05 } : {}}
                  whileTap={newClass.name ? { scale: 0.95 } : {}}
                  onClick={onSubmit}
                  disabled={!newClass.name}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                    newClass.name 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default AddClassModal;