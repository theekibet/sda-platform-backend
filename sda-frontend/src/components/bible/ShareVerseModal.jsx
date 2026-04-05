// src/components/bible/ShareVerseModal.jsx
import React, { useState } from 'react';
import { useBible } from '../../hooks/useBible';
import { useAuth } from '../../contexts/AuthContext';

const ShareVerseModal = ({ verse, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { shareVerse, loading } = useBible();
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [queuePosition, setQueuePosition] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to share a verse');
      return;
    }

    const result = await shareVerse(verse.id, comment);
    
    if (result.success) {
      setQueuePosition(result.data?.queuePosition);
      setSubmitted(true);
    } else {
      setError(result.error || 'Failed to share verse');
    }
  };

  const handleDone = () => {
    if (onSuccess) onSuccess({ queuePosition });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-auto relative p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        
        <h2 className="text-xl font-bold text-gray-800 mb-4">📖 Share This Verse</h2>
        
        {!submitted ? (
          <>
            <div className="bg-gray-50 p-4 rounded-lg mb-5">
              <strong className="block text-primary-500 mb-2">{verse.reference}</strong>
              <p className="text-gray-600 italic leading-relaxed text-sm">"{verse.text}"</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1">Your Reflection (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Why does this verse speak to you? How has it impacted your life?"
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {error && <div className="p-2 bg-red-50 text-red-700 rounded-lg mb-4 text-sm">{error}</div>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition"
                >
                  {loading ? 'Adding...' : 'Add to Queue'}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
              Your verse will be reviewed by admins before being scheduled. When approved, it will appear as Verse of the Day!
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">Verse Added to Queue!</h3>
            <p className="text-gray-600 mb-2">
              Your verse is now in position <strong>#{queuePosition}</strong> in the queue.
            </p>
            <p className="text-gray-500 text-sm mb-5">You'll be notified when it's approved and scheduled.</p>
            <button
              onClick={handleDone}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareVerseModal;