// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { GraduationCap, Users, UserCog } from 'lucide-react';

// const RoleSelection: React.FC = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-indigo-100 to-white flex items-center justify-center px-4">
//       <div className="max-w-4xl w-full">
//         <div className="text-center mb-12">
//           <GraduationCap className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
//           <h1 className="text-4xl font-bold text-gray-900 mb-4">QR Attendance System</h1>
//           <p className="text-xl text-gray-600">Select your role to continue</p>
//         </div>

//         <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
//           <button
//             onClick={() => navigate('/auth?role=faculty')}
//             className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-indigo-500"
//           >
//             <UserCog className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
//             <h2 className="text-2xl font-semibold text-gray-900 mb-2">Faculty</h2>
//             <p className="text-gray-600">Sign in with your @sastra.edu email</p>
//           </button>

//           <button
//             onClick={() => navigate('/auth?role=student')}
//             className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-green-500"
//           >
//             <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
//             <h2 className="text-2xl font-semibold text-gray-900 mb-2">Student</h2>
//             <p className="text-gray-600">Sign in with your @sastra.ac.in email</p>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RoleSelection;