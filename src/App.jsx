import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';

// Lazy load components for better performance
const FacultyDashboard = lazy(() => import('./components/FacultyDashboard'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const RoleSelection = lazy(() => import('./components/RoleSelection'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
  </div>
);

// Component to track and save current route
function RouteTracker({ children }) {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/' && location.pathname !== '') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location]);

  return children;
}

// Protected route component to enforce role-based access
function ProtectedRoute({ children, allowedRole, userRole, userEmail }) {
  if (allowedRole === 'student') {
    if (!userEmail || !userEmail.endsWith('@sastra.ac.in')) {
      return <Navigate to="/" replace />;
    }
  }

  if (allowedRole === 'faculty') {
    if (userEmail && userEmail.endsWith('@sastra.ac.in')) {
      return <Navigate to="/student" replace />;
    }
  }

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

      if (savedRole) {
        setUserRole(savedRole);
      }

      // Load cached user data immediately
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser({ ...userData, token });
          setLoading(false);
        } catch (e) {
          console.error('Failed to parse cached user data');
        }
      }

      try {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = { ...response.data, token };
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(response.data));
        localStorage.removeItem('tokenExpired');
      } catch (error) {
        if (!savedUser) {
          setUser(null);
          localStorage.removeItem('googleToken');
          localStorage.removeItem('userRole');
        }
        localStorage.setItem('tokenExpired', 'true');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* No top-level nav bar — each dashboard has its own header */}
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
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;