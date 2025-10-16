import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const validClientId = clientId && !clientId.includes('your-google-client-id') 
  ? clientId 
  : '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={validClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
