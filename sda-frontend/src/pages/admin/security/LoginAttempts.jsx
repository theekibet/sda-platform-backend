// src/pages/admin/security/LoginAttempts.jsx
import React, { useState, useEffect } from 'react';
import { getLoginAttempts, getFailedLoginAttempts } from '../../../services/api';

const LoginAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [failedGrouped, setFailedGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);
  const [viewMode, setViewMode] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchData();
  }, [days, viewMode, pagination.page]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (viewMode === 'all') {
        const response = await getLoginAttempts(days, pagination.page, pagination.limit);
        setAttempts(response.data.attempts || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
        }));
      } else {
        const response = await getFailedLoginAttempts(days);
        setFailedGrouped(response.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load login attempts');
      console.error('Error fetching login attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = (success) => {
    return {
      label: success ? 'Success' : 'Failed',
      color: success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
    };
  };

  if (loading && attempts.length === 0 && failedGrouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-3">Loading login attempts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Login Attempts
        </h3>
        <div className="flex flex-wrap gap-3">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'all'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Attempts
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'grouped'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Failed by Email
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Monitor login attempts and identify potential security threats.
      </p>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* All Attempts View */}
      {viewMode === 'all' && (
        <>
          {attempts.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">No Login Attempts</h4>
              <p className="text-gray-500">No login attempts recorded in this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">IP Address</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attempts.map(attempt => {
                    const status = getStatusBadge(attempt.success);
                    return (
                      <tr key={attempt.id} className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-gray-800">{attempt.email}</span>
                            {attempt.user && (
                              <span className="text-xs text-primary-600">{attempt.user.name}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                            {attempt.ipAddress || 'Unknown'}
                          </code>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{formatDate(attempt.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                            {attempt.failureReason && (
                              <span className="text-xs text-gray-400 italic">{attempt.failureReason}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-gray-500 max-w-[200px] truncate" title={attempt.userAgent}>
                            {attempt.userAgent || 'Unknown'}
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
        </>
      )}

      {/* Grouped Failed Attempts View */}
      {viewMode === 'grouped' && (
        <>
          {failedGrouped.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-5xl mb-4">🛡️</div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">No Failed Attempts</h4>
              <p className="text-gray-500">No failed login attempts in this period.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {failedGrouped.map(item => (
                <div key={item.email} className="glass-card p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-medium text-gray-800 break-all">{item.email}</div>
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
                      {item.attempts} attempt{item.attempts !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.attempts > 5 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min((item.attempts / 10) * 100, 100)}%` }}
                    />
                  </div>

                  {item.attempts > 5 && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>High number of failed attempts - possible brute force attack</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (window.confirm(`Block IPs associated with ${item.email}?`)) {
                        alert('This would block all IPs used by this email');
                      }
                    }}
                    className="w-full mt-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                  >
                    🚫 Block Associated IPs
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LoginAttempts;