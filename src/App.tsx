// import React, { useEffect, useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { GraduationCap } from 'lucide-react';
// import { GoogleOAuthProvider } from '@react-oauth/google';
// import axios from 'axios';
// import FacultyDashboard from './components/FacultyDashboard';
// import StudentDashboard from './components/StudentDashboard';
// import RoleSelection from './components/RoleSelection';

// interface GoogleUser {
//   email: string;
//   name: string;
//   picture: string;
//   token: string;
// }

// function App() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const verifyToken = async () => {
//       const token = localStorage.getItem('googleToken');
//       if (!token) {
//         setLoading(false);
//         return;
//       }

//       try {
//         const response = await axios.get(
//           'https://www.googleapis.com/oauth2/v3/userinfo',
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//         setUser({ ...response.data, token });
//       } catch (error) {
//         console.error('Token verification failed:', error);
//         localStorage.removeItem('googleToken');
//       } finally {
//         setLoading(false);
//       }
//     };

//     verifyToken();
//   }, []);

//   const handleSignOut = () => {
//     localStorage.removeItem('googleToken');
//     setUser(null);
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
//       </div>
//     );
//   }

//   return (
//     <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
//       <Router>
//         <div className="min-h-screen bg-gray-50">
//           {user && (
//             <nav className="bg-indigo-600 text-white shadow-lg">
//               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                 <div className="flex items-center justify-between h-16">
//                   <div className="flex items-center">
//                     <GraduationCap className="h-8 w-8" />
//                     <span className="ml-2 text-xl font-bold">QR Attendance</span>
//                   </div>
//                   <div className="flex items-center space-x-4">
//                     <span>{user.email}</span>
//                     <button
//                       onClick={handleSignOut}
//                       className="bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded-md"
//                     >
//                       Sign Out
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </nav>
//           )}

//           <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//             <Routes>
//               {!user ? (
//                 <>
//                   <Route path="/" element={<RoleSelection />} />
//                   <Route path="*" element={<Navigate to="/" replace />} />
//                 </>
//               ) : (
//                 <>
//                   <Route 
//                     path="/faculty" 
//                     element={
//                       user.email?.endsWith('@sastra.edu') ? 
//                         <FacultyDashboard /> : 
//                         <Navigate to="/" replace />
//                     } 
//                   />
//                   <Route 
//                     path="/student" 
//                     element={
//                       user.email?.endsWith('@sastra.ac.in') ? 
//                         <StudentDashboard /> : 
//                         <Navigate to="/" replace />
//                     } 
//                   />
//                   <Route path="/" element={
//                     user.email?.endsWith('@sastra.ac.in') ? 
//                       <Navigate to="/student" replace /> :
//                       <Navigate to="/faculty" replace />
//                   } />
//                   <Route path="*" element={<Navigate to="/" replace />} />
//                 </>
//               )}
//             </Routes>
//           </main>
//         </div>
//       </Router>
//     </GoogleOAuthProvider>
//   );
// }

// export default App;