import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role');

  useEffect(() => {
    if (!role) {
      navigate('/');
    }
  }, [role, navigate]);

  useEffect(() => {
    const hash = window.location.hash;

    if (hash.includes('access_token')) {
      const path = role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard';
      navigate(path);
    }
  }, [navigate, role]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Google OAuth will be handled by the RoleSelection component
      navigate('/');
      
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in as {role === 'faculty' ? 'Faculty' : 'Student'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your {role === 'faculty' ? 'SASTRA faculty' : 'SASTRA student'} email
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div>
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-5 h-5 mr-2"
                />
                Continue with Google
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-500 text-sm"
          >
            ← Back to role selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;