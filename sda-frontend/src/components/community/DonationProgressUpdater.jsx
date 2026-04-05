import React, { useState } from 'react';
import { communityService } from '../../services/communityService';

const DonationProgressUpdater = ({ post, onClose, onUpdate }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentAmount = post.currentAmount || 0;
  const goalAmount = post.goalAmount;
  const remaining = goalAmount - currentAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (donationAmount > remaining) {
      setError(`Amount cannot exceed remaining goal of KSh ${remaining.toLocaleString()}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await communityService.updateDonationProgress(post.id, donationAmount);
      if (response.success) {
        onUpdate(response.data);
        onClose();
      } else {
        setError('Failed to update donation progress');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update donation progress');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-[90%] max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-gray-800">🎁 Update Donation Progress</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none transition"
          >
            ✕
          </button>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Goal:</span>
            <strong className="text-gray-800">KSh {goalAmount.toLocaleString()}</strong>
          </div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Raised:</span>
            <strong className="text-green-600">KSh {currentAmount.toLocaleString()}</strong>
          </div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Remaining:</span>
            <strong className="text-gray-800">KSh {remaining.toLocaleString()}</strong>
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(currentAmount / goalAmount) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Received (KSh)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              max={remaining}
              step="1"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-2 bg-red-50 text-red-600 rounded-md mb-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Add Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonationProgressUpdater;