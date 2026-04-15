import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { communityService } from '../../services/communityService';
import PostCard from './PostCard';
import ReportButton from '../common/ReportButton';
import ShareMenu from './ShareMenu';
import PostBookmark from './PostBookmark';
import DonationProgressUpdater from './DonationProgressUpdater';
import PostEditModal from './PostEditModal';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (avatarUrl) => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${API_BASE_URL}${avatarUrl}`;
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// Heroicons SVG Components
const Icons = {
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Heart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  HeartSolid: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Chat: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Pencil: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Inbox: () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4" />
    </svg>
  ),
  Exclamation: () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
};

function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseComment, setResponseComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDonationUpdater, setShowDonationUpdater] = useState(false);
  const [userHasSupported, setUserHasSupported] = useState(false);
  const [supportCount, setSupportCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await communityService.getPost(postId);
      if (response.success) {
        setPost(response.data);
        setSupportCount(response.data.stats?.supportCount || 0);
        setCommentCount(response.data.stats?.commentCount || 0);
        setUserHasSupported(response.data.userHasSupported || false);
      } else {
        setError('Post not found');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleSupport = async (comment = '') => {
    if (!user) {
      alert('Please login to support posts');
      return;
    }

    setSubmitting(true);
    try {
      const response = await communityService.addResponse(postId, {
        response: 'support',
        comment: comment.trim() || undefined,
      });

      if (response.success) {
        await fetchPost();
        setResponseComment('');
        setShowCommentInput(false);
      }
    } catch (err) {
      console.error('Error supporting post:', err);
      alert('Failed to add support. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSupport = async () => {
    if (!window.confirm('Are you sure you want to remove your support?')) return;

    setSubmitting(true);
    try {
      const response = await communityService.removeResponse(postId);
      if (response.success) {
        await fetchPost();
      }
    } catch (err) {
      console.error('Error removing support:', err);
      alert('Failed to remove support. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (response) => {
    setEditingCommentId(response.id);
    setEditingCommentText(response.comment || '');
  };

  const handleUpdateComment = async (responseId) => {
    setSubmitting(true);
    try {
      const response = await communityService.addResponse(postId, {
        response: 'support',
        comment: editingCommentText.trim() || undefined,
      });

      if (response.success) {
        await fetchPost();
        setEditingCommentId(null);
        setEditingCommentText('');
      }
    } catch (err) {
      console.error('Error updating comment:', err);
      alert('Failed to update comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResponse = async () => {
    if (!window.confirm('Are you sure you want to remove your support and comment?')) return;

    setSubmitting(true);
    try {
      const response = await communityService.removeResponse(postId);
      if (response.success) {
        await fetchPost();
      }
    } catch (err) {
      console.error('Error removing response:', err);
      alert('Failed to remove support. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPost(updatedPost);
    setShowEditModal(false);
    fetchPost();
  };

  const handleDonationUpdate = (updatedPost) => {
    setPost(updatedPost);
    setShowDonationUpdater(false);
    fetchPost();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
        <div className="max-w-md mx-auto text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 text-gray-400 mb-6">
            <Icons.Exclamation />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error || 'Post not found'}</h2>
          <p className="text-gray-600 mb-8">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/community')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all hover:shadow-md"
          >
            <Icons.ArrowLeft />
            Back to Community Board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/community')}
          className="group inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 mb-6 transition-colors duration-200"
        >
          <span className="p-2 rounded-full bg-white shadow-sm group-hover:shadow-md group-hover:bg-primary-50 transition-all duration-200">
            <Icons.ArrowLeft />
          </span>
          <span className="font-medium">Back to Community Board</span>
        </button>

        {/* Post Card */}
        <div className="mb-6">
          <PostCard
            post={post}
            currentUser={user}
            onPostDeleted={() => navigate('/community')}
            onPostUpdated={handlePostUpdate}
          />
        </div>

        {/* Support Section */}
        {user && post.status !== 'expired' && post.status !== 'archived' && (
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${userHasSupported ? 'bg-rose-100 text-rose-600' : 'bg-primary-100 text-primary-600'}`}>
                  {userHasSupported ? <Icons.HeartSolid /> : <Icons.Heart />}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {userHasSupported ? 'You support this' : 'Show your support'}
                </h3>
              </div>
              {userHasSupported && (
                <button
                  onClick={handleDeleteResponse}
                  disabled={submitting}
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-full transition-all duration-200"
                >
                  <Icons.Trash />
                  Remove Support
                </button>
              )}
            </div>

            {!userHasSupported ? (
              <div className="space-y-4">
                {!showCommentInput ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleSupport('')}
                      disabled={submitting}
                      className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all duration-200 hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Icons.Heart />
                      <span>Support</span>
                    </button>
                    <button
                      onClick={() => setShowCommentInput(true)}
                      disabled={submitting}
                      className="py-3 px-6 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Icons.Chat />
                      <span>Add Comment</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in slide-in-from-top-2">
                    <textarea
                      value={responseComment}
                      onChange={(e) => setResponseComment(e.target.value)}
                      placeholder="Write a message of support... (optional)"
                      rows="3"
                      maxLength="500"
                      className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all duration-200"
                      autoFocus
                    />
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${responseComment.length > 450 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                        {responseComment.length}/500
                      </span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowCommentInput(false)}
                          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSupport(responseComment)}
                          disabled={submitting}
                          className="px-5 py-2 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all duration-200 hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <Icons.Spinner />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Icons.Heart />
                              <span>Support with Comment</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-500 mb-3">
                  <Icons.HeartSolid />
                </div>
                <p className="text-gray-700 font-medium mb-1">Thank you for supporting this post!</p>
                <p className="text-sm text-gray-500">
                  Your support helps encourage the author and community.
                </p>
              </div>
            )}
          </div>
        )}

        {/* All Support Responses Section */}
        {post.responses && post.responses.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-100 text-primary-600">
                <Icons.Users />
              </div>
              <span>Support & Comments ({post.responses.length})</span>
            </h3>
            <div className="space-y-4">
              {post.responses.map((response) => {
                const avatarUrl = getImageUrl(response.user?.avatarUrl);
                const initials = getInitials(response.user?.name);
                const isEditing = editingCommentId === response.id;
                
                return (
                  <div 
                    key={response.id} 
                    className="glass-card p-5 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {avatarUrl ? (
                            <img 
                              src={avatarUrl} 
                              alt={response.user?.name || 'User'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerText = initials;
                              }}
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">
                            {response.user?.name || 'Anonymous'}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Icons.Heart className="w-3 h-3" />
                            {formatDate(response.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <Icons.Heart className="w-3 h-3" />
                          Support
                        </span>
                        {response.userId === user?.id && !isEditing && (
                          <button
                            onClick={() => handleEditComment(response)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all duration-200"
                            title="Edit comment"
                          >
                            <Icons.Pencil />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {isEditing ? (
                      <div className="mt-3 space-y-2 animate-in slide-in-from-top-1">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="w-full px-3 py-2 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
                          rows="3"
                          maxLength="500"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentText('');
                            }}
                            className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateComment(response.id)}
                            disabled={submitting}
                            className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            <Icons.Check />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      response.comment && (
                        <p className="mt-3 pl-13 text-gray-600 text-sm leading-relaxed border-l-2 border-primary-200 pl-4">
                          {response.comment}
                        </p>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Responses Empty State */}
        {(!post.responses || post.responses.length === 0) && (
          <div className="glass-card p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
              <Icons.Inbox />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">No supports yet</h4>
            <p className="text-gray-500 text-sm mb-4">Be the first to support this post and encourage the community!</p>
            {!user && (
              <button
                onClick={() => alert('Please login to support posts')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all hover:shadow-md"
              >
                <Icons.Heart />
                Login to Support
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showShareMenu && <ShareMenu post={post} onClose={() => setShowShareMenu(false)} />}
      {showEditModal && (
        <PostEditModal
          post={post}
          onClose={() => setShowEditModal(false)}
          onUpdate={handlePostUpdate}
        />
      )}
      {showDonationUpdater && (
        <DonationProgressUpdater
          post={post}
          onClose={() => setShowDonationUpdater(false)}
          onUpdate={handleDonationUpdate}
        />
      )}

      {/* Animation Styles */}
      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .animate-in {
          animation-duration: 0.2s;
          animation-fill-mode: both;
        }
        .slide-in-from-top-1 { animation-name: slideInFromTop1; }
        .slide-in-from-top-2 { animation-name: slideInFromTop2; }
        @keyframes slideInFromTop1 {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromTop2 {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default PostDetail;