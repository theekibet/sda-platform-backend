// src/pages/admin/security/Sessions.jsx
import React, { useState, useEffect } from 'react';
import { getActiveSessions, terminateSession, terminateAllUserSessions } from '../../../services/api';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showTerminateAll, setShowTerminateAll] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchSessions();
  }, [pagination.page]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getActiveSessions({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      setSessions(response.data.sessions || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load active sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to terminate this session?')) return;
    
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await terminateSession(sessionId);
      setSuccess('Session terminated successfully');
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to terminate session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateAllUserSessions = async (userId) => {
    if (!window.confirm('Are you sure you want to terminate ALL sessions for this user?')) return;
    
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await terminateAllUserSessions(userId);
      setSuccess('All user sessions terminated');
      setShowTerminateAll(false);
      setSelectedUserId(null);
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to terminate sessions');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    
    if (diffMs < 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} minutes`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days`;
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return '💻';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return '📱';
    if (ua.includes('tablet')) return '📱';
    if (ua.includes('mac')) return '💻';
    if (ua.includes('windows')) return '🖥️';
    if (ua.includes('linux')) return '🐧';
    return '💻';
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-3">Loading active sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Active Sessions
        </h3>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium">
            <strong>{pagination.total}</strong> active sessions
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        View and manage all active user sessions across the platform.
      </p>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Sessions Table */}
      {sessions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">💤</div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">No Active Sessions</h4>
          <p className="text-gray-500">There are no active user sessions at the moment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Device</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">IP Address</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Active</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Expires In</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map(session => {
                const timeRemaining = getTimeRemaining(session.expiresAt);
                const isExpiringSoon = timeRemaining.includes('minutes') || timeRemaining.includes('hour');
                const timeColor = timeRemaining === 'Expired' 
                  ? 'text-gray-400' 
                  : isExpiringSoon 
                    ? 'text-yellow-600' 
                    : 'text-green-600';
                
                return (
                  <tr key={session.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-semibold">
                          {session.user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{session.user?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">{session.user?.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getDeviceIcon(session.userAgent)}</span>
                        <span className="text-gray-600 text-xs">{session.userAgent?.split(' ')[0] || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                        {session.ipAddress || 'Unknown'}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(session.lastActive)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${timeColor}`}>
                        {timeRemaining}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        session.isRevoked 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {session.isRevoked ? 'Revoked' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUserId(session.user?.id);
                            setShowTerminateAll(true);
                          }}
                          className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200 transition"
                          title="Terminate all sessions for this user"
                        >
                          All
                        </button>
                        <button
                          onClick={() => handleTerminateSession(session.id)}
                          disabled={actionLoading || session.isRevoked}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Terminate this session"
                        >
                          Terminate
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}

      {/* Terminate All Confirmation Modal */}
      {showTerminateAll && selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowTerminateAll(false)}>
          <div className="glass-card max-w-md w-full animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Terminate All Sessions
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to terminate ALL active sessions for this user?
                This will force them to log in again on all devices.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowTerminateAll(false)}
                  className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTerminateAllUserSessions(selectedUserId)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Terminating...
                    </>
                  ) : (
                    'Yes, Terminate All'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;