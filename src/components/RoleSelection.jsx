import React from 'react';
import { GraduationCap, Users, UserCog } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const RoleSelection = () => {
  const loginAsStudent = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch user data to validate email
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        
        const userEmail = response.data.email;
        
        // Validate student email must end with @sastra.ac.in
        if (!userEmail.endsWith('@sastra.ac.in')) {
          alert('Students must use their SASTRA email address (@sastra.ac.in) to login.');
          return;
        }
        
        localStorage.setItem('googleToken', tokenResponse.access_token);
        localStorage.setItem('lastRoute', '/student');
        localStorage.setItem('userRole', 'student'); // Remember role on this device
        localStorage.setItem('userData', JSON.stringify(response.data));
        
        window.location.href = '/student';
      } catch (error) {
        console.error('Failed to fetch user data');
        alert('Login failed. Please try again.');
      }
    },
    onError: () => {
      alert('Login failed. Please try again.');
    },
    flow: 'implicit'
  });

  const loginAsFaculty = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        
        const userEmail = response.data.email;
        
        // Faculty cannot use @sastra.ac.in student emails
        if (userEmail.endsWith('@sastra.ac.in')) {
          alert('Faculty members cannot use student email addresses. Please use your faculty email.');
          return;
        }
        
        localStorage.setItem('googleToken', tokenResponse.access_token);
        localStorage.setItem('lastRoute', '/faculty');
        localStorage.setItem('userRole', 'faculty'); // Remember role on this device
        localStorage.setItem('userData', JSON.stringify(response.data));
        
        window.location.href = '/faculty';
      } catch (error) {
        console.error('Failed to fetch user data');
        alert('Login failed. Please try again.');
      }
    },
    onError: () => {
      alert('Login failed. Please try again.');
    },
    flow: 'implicit'
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 to-white flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <GraduationCap className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AttendEase</h1>
          <p className="text-xl text-gray-600">Select your role to continue</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <button onClick={() => loginAsFaculty()} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-indigo-500">
            <UserCog className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Faculty</h2>
            <p className="text-gray-600">Sign in with Google</p>
          </button>
          <button onClick={() => loginAsStudent()} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-green-500">
            <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Student</h2>
            <p className="text-gray-600">Sign in with Google</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;