import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

function GoogleCallback() {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      // The backend redirects to this page with the user data in the response
      // But since we're using redirect flow, the backend returns JSON directly.
      // Alternative: The backend redirects to frontend with token in URL fragment.
      // We'll use the approach where backend returns JSON and frontend receives it.
      
      // However, with full redirect, the browser receives JSON directly.
      // To make it work nicely, we can have backend redirect to:
      // http://localhost:5173/auth/google/callback?token=xxx&user=...
      
      // Let's read from URL params
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userParam = params.get('user');
      
      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          await handleGoogleCallback(user, token);
          navigate('/dashboard');
        } catch (err) {
          setError('Failed to process Google login');
        }
      } else {
        // If no token in URL, maybe backend sent JSON directly? We'll call API.
        try {
          const response = await api.get('/auth/google/callback', { withCredentials: true });
          const { token, ...user } = response.data;
          await handleGoogleCallback(user, token);
          navigate('/dashboard');
        } catch (err) {
          setError(err.response?.data?.message || 'Google login failed');
        }
      }
    };

    handleCallback();
  }, [navigate, handleGoogleCallback]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Login Failed</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Signing in with Google...</p>
      </div>
    </div>
  );
}

export default GoogleCallback;