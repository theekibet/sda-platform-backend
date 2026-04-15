// src/pages/admin/security/IPBlocking.jsx
import React, { useState, useEffect } from 'react';
import { getBlockedIPs, blockIP, unblockIP } from '../../../services/api';

const IPBlocking = () => {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIP, setNewIP] = useState({
    ipAddress: '',
    reason: '',
    expiresAt: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchBlockedIPs();
  }, [pagination.page]);

  const fetchBlockedIPs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getBlockedIPs({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      setIps(response.data.ips || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load blocked IPs');
      console.error('Error fetching blocked IPs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async (e) => {
    e.preventDefault();
    
    if (!newIP.ipAddress) {
      setError('IP address is required');
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await blockIP(newIP.ipAddress, {
        reason: newIP.reason,
        expiresAt: newIP.expiresAt || undefined,
      });
      
      setSuccess(`IP ${newIP.ipAddress} has been blocked`);
      setShowAddForm(false);
      setNewIP({ ipAddress: '', reason: '', expiresAt: '' });
      fetchBlockedIPs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to block IP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockIP = async (ipAddress) => {
    if (!window.confirm(`Are you sure you want to unblock ${ipAddress}?`)) {
      return;
    }
    
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await unblockIP(ipAddress);
      setSuccess(`IP ${ipAddress} has been unblocked`);
      fetchBlockedIPs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unblock IP');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading && ips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-3">Loading blocked IPs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          IP Blocking
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showAddForm ? 'Cancel' : 'Block IP'}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Block malicious IP addresses from accessing your platform.
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

      {/* Add IP Form */}
      {showAddForm && (
        <div className="glass-card p-5 border border-gray-100">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Block New IP Address</h4>
          
          <form onSubmit={handleBlockIP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IP Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newIP.ipAddress}
                onChange={(e) => setNewIP({...newIP, ipAddress: e.target.value})}
                placeholder="e.g., 192.168.1.1 or 203.0.113.0/24"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <input
                type="text"
                value={newIP.reason}
                onChange={(e) => setNewIP({...newIP, reason: e.target.value})}
                placeholder="Why is this IP being blocked?"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires At <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={newIP.expiresAt}
                onChange={(e) => setNewIP({...newIP, expiresAt: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Blocking...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Block IP
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IP List */}
      {ips.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">🛡️</div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">No Blocked IPs</h4>
          <p className="text-gray-500">All IP addresses are currently allowed.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">IP Address</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Blocked By</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Blocked At</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Expires</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ips.map(ip => {
                const expired = isExpired(ip.expiresAt);
                return (
                  <tr key={ip.id} className={`${expired ? 'opacity-60' : ''} hover:bg-gray-50 transition`}>
                    <td className="py-3 px-4">
                      <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                        {ip.ipAddress}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{ip.reason || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{ip.blockedBy?.name || 'System'}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(ip.createdAt)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(ip.expiresAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        expired ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                      }`}>
                        {expired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleUnblockIP(ip.ipAddress)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                        title="Unblock IP"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Unblock
                      </button>
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
    </div>
  );
};

export default IPBlocking;