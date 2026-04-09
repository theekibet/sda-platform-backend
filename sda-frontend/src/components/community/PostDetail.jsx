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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-600">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p>Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{error || 'Post not found'}</h2>
        <p className="text-gray-600 mb-6">
          The post you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/community')}
          className="inline-flex items-center gap-2 text-primary-500 hover:underline"
        >
          ← Back to Community Board
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/community')}
        className="inline-flex items-center gap-2 text-primary-500 hover:underline mb-6"
      >
        ← Back to Community Board
      </button>

      {/* Post Card - Handles main post author avatar */}
      <PostCard
        post={post}
        currentUser={user}
        onPostDeleted={() => navigate('/community')}
        onPostUpdated={handlePostUpdate}
      />

      {/* Support Section */}
      {user && post.status !== 'expired' && post.status !== 'archived' && (
        <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {userHasSupported ? 'You support this 🙏' : 'Show your support'}
            </h3>
            {userHasSupported && (
              <button
                onClick={handleDeleteResponse}
                disabled={submitting}
                className="text-sm text-red-600 hover:text-red-700 transition"
              >
                Remove Support
              </button>
            )}
          </div>

          {!userHasSupported ? (
            <div className="space-y-4">
              {!showCommentInput ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSupport('')}
                    disabled={submitting}
                    className="flex-1 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">🙏</span>
                    <span>Support</span>
                  </button>
                  <button
                    onClick={() => setShowCommentInput(true)}
                    disabled={submitting}
                    className="py-3 px-6 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Add Comment
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={responseComment}
                    onChange={(e) => setResponseComment(e.target.value)}
                    placeholder="Write a message of support... (optional)"
                    rows="3"
                    maxLength="500"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                    autoFocus
                  />
                  <div className="text-right text-xs text-gray-500">
                    {responseComment.length}/500
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSupport(responseComment)}
                      disabled={submitting}
                      className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Support with Comment'}
                    </button>
                    <button
                      onClick={() => setShowCommentInput(false)}
                      className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-600">
              <p className="mb-2">Thank you for supporting this post! 🙏</p>
              <p className="text-sm text-gray-500">
                Your support helps encourage the author and community.
              </p>
            </div>
          )}
        </div>
      )}

      {/* All Support Responses Section - WITH AVATARS */}
      {post.responses && post.responses.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🙏</span>
            <span>Support &amp; Comments ({post.responses.length})</span>
          </h3>
          <div className="space-y-4">
            {post.responses.map((response) => {
              const avatarUrl = getImageUrl(response.user?.avatarUrl);
              const initials = getInitials(response.user?.name);
              
              return (
                <div key={response.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      {/* Avatar with image support */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-base">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={response.user?.name || 'User'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerText = initials;
                              e.target.parentElement.classList.add('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500');
                            }}
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {response.user?.name || 'Anonymous'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(response.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <span>🙏</span> Support
                      </span>
                      {response.userId === user?.id && !editingCommentId && (
                        <button
                          onClick={() => handleEditComment(response)}
                          className="text-gray-400 hover:text-primary-500 transition text-sm"
                          title="Edit comment"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {editingCommentId === response.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows="3"
                        maxLength="500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateComment(response.id)}
                          disabled={submitting}
                          className="px-4 py-1.5 bg-primary-500 text-white rounded-md text-sm hover:bg-primary-600 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText('');
                          }}
                          className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    response.comment && (
                      <p className="mt-3 pl-12 text-gray-600 text-sm leading-relaxed">
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

      {/* No Responses Message */}
      {(!post.responses || post.responses.length === 0) && (
        <div className="mt-8 p-8 bg-gray-50 rounded-xl text-center">
          <div className="text-4xl mb-3">🙏</div>
          <p className="text-gray-500">No supports yet. Be the first to support this post!</p>
        </div>
      )}

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
    </div>
  );
}

export default PostDetail;