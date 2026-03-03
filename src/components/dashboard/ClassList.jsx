import { Eye, Trash2, BookOpen } from 'lucide-react';

const ClassList = ({ classes, selectedClass, onClassSelect, onDeleteClass, onViewStudents }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Your Classes</h2>

      {classes.length === 0 ? (
        <div className="text-center py-10">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm font-medium">No classes yet</p>
          <p className="text-gray-400 text-xs mt-1">Click "Add New Class" to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className={`rounded-lg p-3.5 border transition-all cursor-pointer ${selectedClass?.id === cls.id
                  ? 'border-blue-400 bg-blue-50/50 shadow-sm'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              onClick={() => onClassSelect(cls)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 truncate">{cls.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cls.studentCount > 0 ? `${cls.studentCount} students` : 'No students uploaded'}
                    {cls.time ? ` • ${cls.time}` : ''}
                  </p>
                </div>
                <div className="flex gap-1.5 ml-3 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewStudents(cls); }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Students"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteClass(cls.id); }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassList;