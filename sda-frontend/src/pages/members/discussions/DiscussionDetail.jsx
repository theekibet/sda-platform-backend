// src/pages/members/discussions/DiscussionDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { discussionsService } from '../../../services/discussionsService';
import VoteButton from '../../../components/discussions/VoteButton';

function DiscussionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [upvotingCommentId, setUpvotingCommentId] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDiscussion();
    }
  }, [id]);

  const fetchDiscussion = async () => {
    setLoading(true);
    setError(null);
    try {
      // The service returns the discussion object directly
      const discussionData = await discussionsService.getDiscussionById(id);
      console.log('Fetched discussion:', discussionData); // Debug log
      setDiscussion(discussionData);
      setComments(discussionData?.comments || []);
      setIsBookmarked(discussionData?.isBookmarked || false);
    } catch (error) {
      console.error('Error fetching discussion:', error);
      if (error.response?.status === 404) {
        setError('Discussion not found');
      } else if (error.response?.status === 403) {
        setError('You do not have access to this discussion');
      } else {
        setError('Failed to load discussion');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (value) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      await discussionsService.voteDiscussion(id, value);
      // Optimistic update for discussion vote
      setDiscussion(prev => ({
        ...prev,
        upvotes: value === 1 ? (prev?.upvotes || 0) + 1 : (prev?.upvotes || 0) - 1,
        userVote: value,
      }));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (bookmarking) return;

    setBookmarking(true);
    const previousState = isBookmarked;
    // Optimistic update
    setIsBookmarked(!previousState);

    try {
      const result = await discussionsService.toggleBookmark(id);
      // If the server response says different, sync it
      setIsBookmarked(result.bookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert optimistic update
      setIsBookmarked(previousState);
    } finally {
      setBookmarking(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim() || !user) return;

    setSubmitting(true);
    try {
      const newComment = await discussionsService.addComment(
        id,
        commentContent.trim(),
        replyingTo?.id
      );
      
      if (replyingTo) {
        // Add reply to the parent comment's replies array
        setComments(prev => prev.map(comment => {
          if (comment.id === replyingTo.id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment],
            };
          }
          return comment;
        }));
      } else {
        // Add new top-level comment
        setComments(prev => [newComment, ...prev]);
      }
      
      setCommentContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setReplyingTo(comment);
    // Scroll to comment form
    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpvoteComment = async (commentId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setUpvotingCommentId(commentId);
    try {
      await discussionsService.upvoteComment(commentId);
      // Refetch to get updated comment votes
      await fetchDiscussion();
    } catch (error) {
      console.error('Error upvoting comment:', error);
      alert('Failed to upvote comment. Please try again.');
    } finally {
      setUpvotingCommentId(null);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    if (diffMinutes < 2880) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Helper to compute total comment count including replies
  const totalCommentCount = () => {
    return comments.reduce((acc, comment) => {
      return acc + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-5">
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-5">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/discussions')}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
          >
            ← Back to Discussions
          </button>
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="max-w-4xl mx-auto p-5">
        <div className="text-center py-12">
          <p className="text-gray-500">Discussion not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-5">
      {/* Back Button */}
      <button
        onClick={() => navigate('/discussions')}
        className="mb-4 text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← Back to Discussions
      </button>

      {/* Discussion Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        {/* Tags */}
        {discussion.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {discussion.tags.map(tag => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-3">{discussion.title}</h1>

        {/* Author & Meta */}
        <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
          {discussion.isAnonymous ? (
            <span className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                ?
              </div>
              Anonymous
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {discussion.author?.avatarUrl ? (
                <img
                  src={discussion.author.avatarUrl}
                  alt={discussion.author.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center">
                  {discussion.author?.name?.charAt(0) || '?'}
                </div>
              )}
              {discussion.author?.name}
            </span>
          )}
          <span>•</span>
          <span>{formatTimeAgo(discussion.createdAt)}</span>
          {discussion.group && (
            <>
              <span>•</span>
              <span>in {discussion.group.name}</span>
            </>
          )}
        </div>

        {/* Content */}
        <div className="prose max-w-none mb-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
          {discussion.content}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <VoteButton
            upvotes={discussion.upvotes}
            userVote={discussion.userVote}
            onVote={handleVote}
          />
          
          <span className="text-sm text-gray-500">
            💬 {totalCommentCount()} comments
          </span>
          
          <span className="text-sm text-gray-500">
            👁️ {discussion.viewCount || 0} views
          </span>

          {/* Bookmark Button */}
          {user && (
            <button
              onClick={handleBookmark}
              disabled={bookmarking}
              className={`text-sm transition ${bookmarking ? 'opacity-50' : 'hover:scale-110'}`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <span className="text-lg">
                {isBookmarked ? '🔖' : '📖'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Comment Form */}
      {user ? (
        <div id="comment-form" className="bg-white rounded-xl shadow-md p-5 mb-4">
          {replyingTo && (
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">
                Replying to <strong>{replyingTo.author?.name}</strong>
              </span>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmitComment}>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
            />
            <div className="flex justify-end gap-3 mt-3">
              {replyingTo && (
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!commentContent.trim() || submitting}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition disabled:opacity-50"
              >
                {submitting ? 'Posting...' : replyingTo ? 'Post Reply' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-5 mb-4 text-center">
          <p className="text-gray-600 mb-3">Sign in to join the discussion</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Comments ({totalCommentCount()})
        </h3>

        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onUpvote={handleUpvoteComment}
              formatTimeAgo={formatTimeAgo}
              currentUser={user}
              isUpvoting={upvotingCommentId === comment.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Comment Item Component (nested replies supported)
function CommentItem({ comment, onReply, onUpvote, formatTimeAgo, currentUser, isUpvoting }) {
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      {/* Comment Header */}
      <div className="flex items-center gap-2 mb-2">
        {comment.author?.avatarUrl ? (
          <img
            src={comment.author.avatarUrl}
            alt={comment.author.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm">
            {comment.author?.name?.charAt(0) || '?'}
          </div>
        )}
        <span className="font-medium text-gray-800">{comment.author?.name}</span>
        <span className="text-gray-400">•</span>
        <span className="text-sm text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
      </div>

      {/* Comment Content */}
      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{comment.content}</p>

      {/* Comment Actions */}
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={() => onUpvote(comment.id)}
          disabled={isUpvoting}
          className="flex items-center gap-1 text-gray-500 hover:text-primary-500 transition disabled:opacity-50"
        >
          {isUpvoting ? (
            <span className="animate-spin inline-block w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full"></span>
          ) : (
            '▲'
          )}
          <span>{comment.upvotes || 0}</span>
        </button>
        
        <button
          onClick={() => onReply(comment)}
          className="text-gray-500 hover:text-primary-500 transition"
        >
          Reply
        </button>
      </div>

      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-200">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          
          {showReplies && (
            <div className="space-y-3">
              {comment.replies.map(reply => (
                <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {reply.author?.avatarUrl ? (
                      <img
                        src={reply.author.avatarUrl}
                        alt={reply.author.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs">
                        {reply.author?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <span className="font-medium text-sm text-gray-800">{reply.author?.name}</span>
                    <span className="text-xs text-gray-400">{formatTimeAgo(reply.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DiscussionDetail;