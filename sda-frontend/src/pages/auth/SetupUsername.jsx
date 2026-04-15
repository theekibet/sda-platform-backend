// src/pages/auth/SetupUsername.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function SetupUsername() {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    
    // Validate format
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmed)) {
      setError('Username must be 3–30 characters and can only contain letters, numbers, and underscores.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/members/profile/username', { username: trimmed });
      // Backend returns the updated user object (with username)
      const updatedUser = response.data;
      
      // Update local user state and localStorage
      updateUser({ ...user, username: updatedUser.username });
      
      // Optional: refresh token to include username in JWT (but not strictly required)
      // You could also call a refresh endpoint here if needed.
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message;
      if (message === 'Username already taken') {
        setError('That username is already taken. Please choose another.');
      } else {
        setError(message || 'Failed to set username. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // If user already has a username, redirect to dashboard (safety)
  if (user?.username) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs matching your auth pages */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md glass-card-enhanced rounded-3xl overflow-hidden relative shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">✨</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Choose a Username</h2>
          <p className="text-sm text-gray-500">
            This is how others will see you in the community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="e.g., john_doe, johndoe123"
              autoFocus
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Only letters, numbers, and underscores. 3–30 characters.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Continue to Dashboard'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          You can change your username once every 30 days.
        </p>
      </div>
    </div>
  );
}