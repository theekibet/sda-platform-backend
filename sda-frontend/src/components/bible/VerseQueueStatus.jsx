// src/components/bible/VerseQueueStatus.jsx
import React, { useEffect } from 'react';
import { useBible } from '../../hooks/useBible';

const VerseQueueStatus = () => {
  const { queueStatus, loading, error, fetchQueueStatus } = useBible();

  useEffect(() => {
    fetchQueueStatus();
  }, []);

  if (loading) return <div className="text-gray-500 text-center py-4">Loading queue...</div>;
  if (error) return <div className="text-red-500 text-center py-4">Error loading queue</div>;
  if (!queueStatus) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <h4 className="text-lg font-semibold text-gray-800 mb-3">📋 Verse Queue</h4>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-primary-500">{queueStatus.pending}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-primary-500">{queueStatus.scheduled}</div>
          <div className="text-xs text-gray-500">Scheduled</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-primary-500">
            {queueStatus.pending + queueStatus.scheduled}
          </div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>

      <div className="p-3 bg-primary-50 rounded-lg text-sm mb-3">
        <strong>Next available:</strong> {formatDate(queueStatus.nextAvailableDate)}
      </div>

      {queueStatus.pending === 0 && queueStatus.scheduled === 0 ? (
        <p className="text-center text-green-600 text-sm mt-2">✨ Be the first to share a verse!</p>
      ) : (
        <p className="text-center text-sm mt-2">
          <a href="/my-submissions" className="text-primary-500 hover:underline">View my submissions →</a>
        </p>
      )}
    </div>
  );
};

export default VerseQueueStatus;