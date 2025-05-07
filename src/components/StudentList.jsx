import { useState, useEffect } from 'react';
import { classApi } from '../api/classApi';

const StudentList = ({ classId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await classApi.getStudentList(classId);
        setStudents(data);
      } catch (error) {
        toast.error('Failed to load student list');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [classId]);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-bold text-white mb-4">Student List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-white">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Registration No</th>
              <th className="px-4 py-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={index} className="border-b border-gray-700">
                <td className="px-4 py-2">{student.name}</td>
                <td className="px-4 py-2">{student.regNo}</td>
                <td className="px-4 py-2">{student.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentList;