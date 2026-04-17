// src/components/profile/DeleteAccountModal.jsx
import { useState, useEffect } from 'react';
import { requestAccountDeletion, getDeletionRequestStatus, cancelDeletionRequest } from '../../services/api';

export default function DeleteAccountModal({ isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [existingRequest, setExistingRequest] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkExistingRequest();
    }
  }, [isOpen]);

  const checkExistingRequest = async () => {
    try {
      const response = await getDeletionRequestStatus();
      if (response.data.hasRequest) {
        setExistingRequest(response.data);
      } else {
        setExistingRequest(null);
      }
    } catch (err) {
      console.error('Failed to check deletion request status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await requestAccountDeletion(reason.trim() || undefined);
      if (response.data.success) {
        onSuccess?.(response.data.message);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit deletion request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!confirm('Are you sure you want to cancel your deletion request?')) return;
    
    setLoading(true);
    try {
      await cancelDeletionRequest();
      setExistingRequest(null);
      alert('Your deletion request has been cancelled.');
    } catch (err) {
      alert('Failed to cancel request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Show existing request status
  if (existingRequest) {
    const statusConfig = {
      pending: { color: 'yellow', message: 'Your deletion request is pending review.' },
      approved: { color: 'blue', message: 'Your deletion request has been approved. Your account will be deleted soon.' },
      rejected: { color: 'red', message: 'Your deletion request was rejected. Please contact support for assistance.' },
    };
    const config = statusConfig[existingRequest.status] || statusConfig.pending;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className={`w-12 h-12 rounded-full bg-${config.color}-100 flex items-center justify-center mx-auto mb-4`}>
            <svg className={`w-6 h-6 text-${config.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Deletion Request {existingRequest.status}</h3>
          <p className={`text-center text-${config.color}-600 mb-4`}>{config.message}</p>
          <p className="text-sm text-gray-500 text-center mb-6">
            Submitted on {new Date(existingRequest.createdAt).toLocaleDateString()}
          </p>
          {existingRequest.status === 'pending' && (
            <button
              onClick={handleCancelRequest}
              disabled={loading}
              className="w-full py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
            >
              Cancel Request
            </button>
          )}
          <button onClick={onClose} className="w-full mt-3 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Delete Account</h3>
        <p className="text-center text-gray-500 text-sm mb-6">
          This action is permanent and cannot be undone. All your data will be removed from our system.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for leaving (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="We'd appreciate your feedback to help us improve..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Request Deletion'}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Your request will be reviewed within 3-5 business days. You will receive an email notification once processed.
        </p>
      </div>
    </div>
  );
}