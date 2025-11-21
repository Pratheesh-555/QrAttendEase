import { Eye, Trash2 } from 'lucide-react';

const ClassList = ({ classes, selectedClass, onClassSelect, onDeleteClass, onViewStudents }) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Classes</h2>
      <div className="space-y-3">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className={`bg-white rounded-lg p-4 border transition-all ${
              selectedClass?.id === cls.id 
                ? 'border-blue-400 shadow-md' 
                : 'border-slate-200 hover:border-blue-300 hover:shadow'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-medium text-lg text-gray-900">{cls.name}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onViewStudents(cls)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 transition-colors"
                  title="View Student List"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => onClassSelect(cls)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Select
                </button>
                <button
                  onClick={() => onDeleteClass(cls.id)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  title="Delete Class"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassList;