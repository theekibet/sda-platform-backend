// src/pages/members/discussions/CreateDiscussion.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { discussionsService } from '../../../services/discussionsService';
import { groupsService } from '../../../services/groupsService';

function CreateDiscussion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const preselectedGroupId = searchParams.get('groupId');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [group, setGroup] = useState(null);
  const [fetchingGroup, setFetchingGroup] = useState(!!preselectedGroupId);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/discussions/create' } });
      return;
    }
    if (preselectedGroupId) {
      groupsService.getGroupById(preselectedGroupId)
        .then(res => {
          const groupData = res.data?.data || res.data;
          setGroup(groupData);
        })
        .catch(err => console.error('Failed to fetch group:', err))
        .finally(() => setFetchingGroup(false));
    } else {
      setFetchingGroup(false);
    }
  }, [user, preselectedGroupId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newDiscussion = await discussionsService.createDiscussion({
        title: title.trim(),
        content: content.trim() || undefined,
        groupId: preselectedGroupId || undefined,
        isAnonymous,
      });

      if (newDiscussion && newDiscussion.id) {
        navigate(`/discussions/${newDiscussion.id}`);
      } else {
        setError('Failed to create discussion. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
      setError(
        error.response?.data?.message ||
        'Failed to create discussion. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (preselectedGroupId) {
      navigate(`/groups/${preselectedGroupId}`);
    } else {
      navigate('/discussions');
    }
  };

  if (fetchingGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-20">
        {/* Back button */}
        <button
          onClick={handleCancel}
          className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create a post</h1>
          <p className="text-gray-500 mt-1">Share your thoughts with the community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-5 animate-slide-up">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Group context badge */}
          {group && (
            <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-xl text-sm text-primary-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Posting in <strong>{group.name}</strong></span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
              autoFocus
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write something... (minimum 10 characters if provided)"
              rows={6}
              maxLength={5000}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y bg-gray-50 focus:bg-white transition"
            />
          </div>

          {/* Anonymous Option */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <label htmlFor="anonymous" className="text-sm font-medium text-gray-700 cursor-pointer">
                Post anonymously
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Your name won't be shown, but moderators can still see your identity
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateDiscussion;