import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';

// Lazy load components for better performance
const FacultyDashboard = lazy(() => import(/* webpackChunkName: "faculty" */ './components/FacultyDashboard'));
const StudentDashboard = lazy(() => import(/* webpackChunkName: "student" */ './components/StudentDashboard'));
const RoleSelection = lazy(() => import(/* webpackChunkName: "auth" */ './components/RoleSelection'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
  </div>
);

// Component to track and save current route
function RouteTracker({ children }) {
  const location = useLocation();
  
  useEffect(() => {
    // Save current route to localStorage (except root path)
    if (location.pathname !== '/' && location.pathname !== '') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location]);
  
  return children;
}

// Protected route component to enforce role-based access
function ProtectedRoute({ children, allowedRole, userRole, userEmail }) {
  // Students must have @sastra.ac.in email
  if (allowedRole === 'student') {
    if (!userEmail || !userEmail.endsWith('@sastra.ac.in')) {
      return <Navigate to="/" replace />;
    }
  }
  
  // Faculty cannot have @sastra.ac.in email
  if (allowedRole === 'faculty') {
    if (userEmail && userEmail.endsWith('@sastra.ac.in')) {
      return <Navigate to="/student" replace />;
    }
  }
  
  // Check if user's saved role matches the route
  if (userRole && userRole !== allowedRole) {
    return <Navigate to={`/${userRole}`} replace />;
  }
  
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('googleToken');
      const savedUser = localStorage.getItem('userData');
      const savedRole = localStorage.getItem('userRole');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Load cached role
      if (savedRole) {
        setUserRole(savedRole);
      }
      
      // Load cached user data immediately - keep user logged in
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser({ ...userData, token });
          setLoading(false); // User is logged in from cache
        } catch (e) {
          console.error('Failed to parse cached user data');
        }
      }
      
      try {
        // Verify token in background (don't block user experience)
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = { ...response.data, token };
        setUser(userData);
        // Update cache with fresh data
        localStorage.setItem('userData', JSON.stringify(response.data));
        localStorage.removeItem('tokenExpired'); // Token is valid
      } catch (error) {
        // Token verification failed, but keep user logged in with cached data
        // Only sign out if there's no cached data at all
        if (!savedUser) {
          setUser(null);
          localStorage.removeItem('googleToken');
          localStorage.removeItem('userRole');
        }
        // Mark token as potentially expired for background refresh
        localStorage.setItem('tokenExpired', 'true');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const handleSignOut = () => {
    // Only remove token and user data on explicit sign out
    localStorage.removeItem('googleToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('lastRoute');
    localStorage.removeItem('userRole');
    localStorage.removeItem('tokenExpired');
    setUser(null);
    setUserRole(null);
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
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="w-full h-screen min-h-screen bg-gradient-to-b from-indigo-600 to-white flex flex-col">
          {user && (
            <nav className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white shadow-lg">
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-8 w-8 text-indigo-200" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">AttendEase</span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      {user.picture ? (
                        <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border-2 border-indigo-300" />
                      ) : (
                        <User className="w-8 h-8 p-1 rounded-full border-2 border-indigo-300" />
                      )}
                      <span className="text-sm font-medium text-indigo-100">{user.name || user.email}</span>
                    </div>
                    <button onClick={handleSignOut} className="flex items-center space-x-2 bg-indigo-800/50 hover:bg-indigo-800 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </nav>
          )}
          <main className="w-full h-screen min-h-screen bg-gradient-to-b from-indigo-600 to-white flex flex-col">
            <Suspense fallback={<LoadingSpinner />}>
              <RouteTracker>
                <Routes>
                  {!user ? (
                    <>
                      <Route path="/" element={<RoleSelection />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                  ) : (
                    <>
                      <Route 
                        path="/faculty" 
                        element={
                          <ProtectedRoute allowedRole="faculty" userRole={userRole} userEmail={user?.email}>
                            <FacultyDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/student" 
                        element={
                          <ProtectedRoute allowedRole="student" userRole={userRole} userEmail={user?.email}>
                            <StudentDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/" 
                        element={
                          <Navigate 
                            to={userRole ? `/${userRole}` : (localStorage.getItem('lastRoute') || '/faculty')} 
                            replace 
                          />
                        } 
                      />
                      <Route 
                        path="*" 
                        element={
                          <Navigate 
                            to={userRole ? `/${userRole}` : (localStorage.getItem('lastRoute') || '/faculty')} 
                            replace 
                          />
                        } 
                      />
                    </>
                  )}
                </Routes>
              </RouteTracker>
            </Suspense>
          </main>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;