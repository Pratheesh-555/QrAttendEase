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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Class</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Class Name</label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => onChange({ ...newClass, name: e.target.value })}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter class name"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1 font-medium">Class Time</label>
                <input
                  type="time"
                  value={newClass.time}
                  onChange={(e) => onChange({ ...newClass, time: e.target.value })}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmit}
                  disabled={!newClass.name}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                    newClass.name 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-300 cursor-not-allowed text-gray-500'
                  }`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddClassModal;