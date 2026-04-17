// src/pages/admin/DeletionRequests.jsx
import { useState, useEffect } from 'react';
import { getDeletionRequests, getDeletionRequestStats, approveDeletionRequest, rejectDeletionRequest } from '../../services/api';
import Avatar from '../../components/common/Avatar';

export default function DeletionRequests() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, statsRes] = await Promise.all([
        getDeletionRequests({ status: 'pending' }),
        getDeletionRequestStats(),
      ]);
      setRequests(requestsRes.data.requests);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
      alert('Failed to load deletion requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setPendingAction('approve');
    setShowConfirmModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setPendingAction('reject');
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;

    try {
      if (pendingAction === 'approve') {
        await approveDeletionRequest(selectedRequest.id, adminNotes);
        alert(`Deletion request approved. Account will be deleted in 7 days.`);
      } else {
        await rejectDeletionRequest(selectedRequest.id, adminNotes);
        alert('Deletion request rejected.');
      }
      fetchData();
    } catch (error) {
      alert(`Failed to ${pendingAction} request: ${error.response?.data?.message || error.message}`);
    } finally {
      setShowConfirmModal(false);
      setSelectedRequest(null);
      setPendingAction(null);
      setAdminNotes('');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      completed: 'bg-green-100 text-green-700',
    };
    return config[status] || config.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-primary-500">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading deletion requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Account Deletion Requests</h1>
              <p className="text-sm text-gray-500">Review and process user account deletion requests</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="flex gap-3">
            <div className="bg-yellow-50 rounded-2xl px-5 py-3 text-center">
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
              <div className="text-xs text-yellow-600 font-medium">Pending</div>
            </div>
            <div className="bg-blue-50 rounded-2xl px-5 py-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.approved}</div>
              <div className="text-xs text-blue-600 font-medium">Approved</div>
            </div>
            <div className="bg-green-50 rounded-2xl px-5 py-3 text-center">
              <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
              <div className="text-xs text-green-600 font-medium">Completed</div>
            </div>
            <div className="bg-red-50 rounded-2xl px-5 py-3 text-center">
              <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
              <div className="text-xs text-red-600 font-medium">Rejected</div>
            </div>
          </div>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">User</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Reason</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Requested</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={{ name: request.user.name, avatarUrl: request.user.avatarUrl }} size="medium" />
                      <div>
                        <div className="font-semibold text-gray-800">{request.user.name}</div>
                        <div className="text-xs text-gray-400">{request.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600 max-w-xs truncate">
                      {request.reason || 'No reason provided'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requests.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-gray-500 font-medium text-lg">No pending deletion requests</div>
            <div className="text-gray-400 text-sm mt-1">All clear for now</div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className={`w-12 h-12 rounded-full ${pendingAction === 'approve' ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center mx-auto mb-4`}>
              {pendingAction === 'approve' ? (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
              {pendingAction === 'approve' ? 'Approve Deletion Request' : 'Reject Deletion Request'}
            </h3>
            <p className="text-center text-gray-500 text-sm mb-4">
              {pendingAction === 'approve' 
                ? `User ${selectedRequest.user.name}'s account will be scheduled for deletion in 7 days.`
                : `User ${selectedRequest.user.name}'s deletion request will be rejected.`}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this decision..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 py-2.5 ${pendingAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-xl font-medium transition`}
              >
                Confirm {pendingAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}