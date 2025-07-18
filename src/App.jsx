import   React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import FacultyDashboard from './components/FacultyDashboard';
import StudentDashboard from './components/StudentDashboard';
import RoleSelection from './components/RoleSelection';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('googleToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser({ ...response.data, token });
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('googleToken');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('googleToken');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <div className="w-full h-screen min-h-screen bg-gradient-to-b from-indigo-600 to-white flex flex-col">
          {user && (
            <nav className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white shadow-lg">
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-8 w-8 text-indigo-200" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                      AttendEase
                    </span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      {user.picture ? (
                        <img 
                          src={user.picture} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full border-2 border-indigo-300"
                        />
                      ) : (
                        <User className="w-8 h-8 p-1 rounded-full border-2 border-indigo-300" />
                      )}
                      <span className="text-sm font-medium text-indigo-100">
                        {user.name || user.email}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 bg-indigo-800/50 hover:bg-indigo-800 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </nav>
          )}

          <main className="w-full h-screen min-h-screen bg-gradient-to-b from-indigo-600 to-white flex flex-col">
          <Routes>
              {!user ? (
                <>
                  <Route path="/" element={<RoleSelection />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              ) : (
                <>
                  {/* Temporarily removed email validation for testing */}
                  <Route path="/faculty" element={<FacultyDashboard />} />
                  <Route path="/student" element={<StudentDashboard />} />
                  {/* Default route - redirect to dashboard based on user role if needed */}
                  <Route path="/" element={<Navigate to="/faculty" replace />} />
                  <Route path="*" element={<Navigate to="/faculty" replace />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;