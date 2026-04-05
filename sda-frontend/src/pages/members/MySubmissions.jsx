// src/pages/members/MySubmissions.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBible } from '../../hooks/useBible';
import VerseCard from '../../components/bible/VerseCard';

function MySubmissions() {
  const { user } = useAuth();
  const { mySubmissions, loading, cancelSubmission, fetchMySubmissions } = useBible();
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [queueStats, setQueueStats] = useState(null);

  useEffect(() => {
    fetchMySubmissions();
    fetchQueueStats();
  }, []);

  const fetchQueueStats = async () => {
    try {
      // You'll need to add this to your useBible hook or call directly
      const response = await bibleService.getMyQueueStats();
      setQueueStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch queue stats:', err);
    }
  };

  const handleCancelSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to cancel this submission? This action cannot be undone.')) {
      return;
    }

    setCancellingId(submissionId);
    const result = await cancelSubmission(submissionId);
    
    if (!result.success) {
      setError(result.error || 'Failed to cancel submission');
    }
    setCancellingId(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-orange-500', text: '⏳ Pending Review', icon: '⏳' },
      approved: { color: 'bg-blue-500', text: '✅ Approved', icon: '✅' },
      scheduled: { color: 'bg-green-600', text: '📅 Scheduled', icon: '📅' },
      published: { color: 'bg-green-500', text: '✨ Published', icon: '✨' },
      rejected: { color: 'bg-red-500', text: '❌ Rejected', icon: '❌' },
    };
    return badges[status] || { color: 'bg-gray-500', text: status, icon: '📄' };
  };

  const getQueuePosition = (submission) => {
    if (!queueStats || submission.status !== 'pending') return null;
    const stats = queueStats.yourSubmissions?.find(s => s.id === submission.id);
    return stats?.position;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p>Loading your submissions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <h2 className="text-3xl font-bold text-gray-800 m-0">📤 My Shared Verses</h2>
        <div className="flex gap-4 bg-primary-50 px-4 py-2 rounded-full">
          <span className="text-sm text-gray-700">
            Total: <strong>{mySubmissions.length}</strong>
          </span>
          <span className="text-sm text-gray-700">
            Pending: <strong>{mySubmissions.filter(s => s.status === 'pending').length}</strong>
          </span>
          {queueStats && (
            <span className="text-sm text-gray-700">
              Queue: <strong>{queueStats.totalPending} total</strong>
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md mb-5">
          {error}
        </div>
      )}

      {/* Empty State */}
      {mySubmissions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <div className="text-5xl mb-5">📖</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Verses Shared Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-5">
            Browse the Bible and share verses that speak to you. They'll be added to the queue for review.
          </p>
          <button
            onClick={() => window.location.href = '/bible/reader'}
            className="px-8 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
          >
            Browse Bible
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {mySubmissions.map(sub => {
            const badge = getStatusBadge(sub.status);
            const isExpanded = expandedId === sub.id;
            const queuePosition = getQueuePosition(sub);
            
            return (
              <div key={sub.id} className="bg-white rounded-xl shadow-md p-5 transition-all hover:shadow-lg">
                {/* Card Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`${badge.color} text-white px-3 py-1 rounded-full text-xs font-medium`}>
                      {badge.icon} {badge.text}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(sub.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleExpand(sub.id)}
                    className="text-primary-500 hover:text-primary-600 text-sm font-medium p-1"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                </div>

                {/* Verse Preview (always visible) */}
                <div className="mb-3">
                  <VerseCard verse={sub.verse} />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    {/* User's Reflection */}
                    {sub.comment && (
                      <div className="mb-5 p-4 bg-gray-50 rounded-lg">
                        <strong className="block text-gray-700 mb-1">Your reflection:</strong>
                        <p className="text-gray-600">{sub.comment}</p>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-400 block">Submission ID</span>
                        <span className="text-sm font-medium text-gray-800">#{sub.id.slice(-8)}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-400 block">Submitted</span>
                        <span className="text-sm font-medium text-gray-800">{formatDate(sub.createdAt)}</span>
                      </div>
                      {sub.scheduledFor && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="text-xs text-gray-400 block">Scheduled for</span>
                          <span className="text-sm font-medium text-gray-800">{formatDate(sub.scheduledFor)}</span>
                        </div>
                      )}
                      {sub.status === 'pending' && queuePosition && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="text-xs text-gray-400 block">Queue Position</span>
                          <span className="text-sm font-medium text-gray-800">
                            #{queuePosition} of {queueStats?.totalPending || '?'}
                          </span>
                        </div>
                      )}
                      {sub.status === 'approved' && sub.reviewedAt && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="text-xs text-gray-400 block">Approved on</span>
                          <span className="text-sm font-medium text-gray-800">{formatDate(sub.reviewedAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Admin Feedback */}
                    {sub.reviewNotes && (
                      <div className={`mb-5 p-4 rounded-lg ${sub.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-700'}`}>
                        <strong className="block mb-1">
                          {sub.status === 'rejected' ? '❌ Rejection reason:' : '📝 Admin notes:'}
                        </strong>
                        <p className="text-sm">{sub.reviewNotes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end flex-wrap">
                      {sub.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleCancelSubmission(sub.id)}
                            disabled={cancellingId === sub.id}
                            className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 disabled:opacity-50 transition"
                          >
                            {cancellingId === sub.id ? 'Cancelling...' : '❌ Cancel Submission'}
                          </button>
                          <button
                            onClick={() => window.location.href = `/bible/read/${sub.verse.book}/${sub.verse.chapter}`}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition"
                          >
                            📖 Read in Context
                          </button>
                        </>
                      )}
                      {sub.status === 'approved' && (
                        <button
                          onClick={() => window.location.href = `/bible/read/${sub.verse.book}/${sub.verse.chapter}`}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition"
                        >
                          📖 View Verse
                        </button>
                      )}
                      {sub.status === 'scheduled' && sub.scheduledFor && (
                        <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm">
                          📅 This verse will be published on {formatDate(sub.scheduledFor)}
                        </div>
                      )}
                      {sub.status === 'rejected' && (
                        <button
                          onClick={() => window.location.href = `/bible/read/${sub.verse.book}/${sub.verse.chapter}`}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition"
                        >
                          🔄 Try a Different Verse
                        </button>
                      )}
                      {sub.status === 'published' && (
                        <button
                          onClick={() => window.open(`/bible/read/${sub.verse.book}/${sub.verse.chapter}`, '_blank')}
                          className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition"
                        >
                          ✨ View Published Verse
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MySubmissions;