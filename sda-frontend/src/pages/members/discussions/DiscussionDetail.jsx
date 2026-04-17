// src/pages/members/discussions/DiscussionDetail.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { discussionsService } from '../../../services/discussionsService';
import VoteButton from '../../../components/discussions/VoteButton';
import Avatar from '../../../components/common/Avatar';

function DiscussionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upvotingCommentId, setUpvotingCommentId] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  
  const [newCommentContent, setNewCommentContent] = useState('');
  const [submittingNew, setSubmittingNew] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (id) fetchDiscussion();
  }, [id]);

  const fetchDiscussion = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await discussionsService.getDiscussionById(id);
      setDiscussion(data);
      setComments(data?.comments || []);
      setIsBookmarked(data?.isBookmarked || false);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) setError('Discussion not found');
      else if (err.response?.status === 403) setError('You do not have access');
      else setError('Failed to load discussion');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (value) => {
    if (!user) return navigate('/login');
    try {
      await discussionsService.voteDiscussion(id, value);
      setDiscussion(prev => ({
        ...prev,
        upvotes: value === 1 ? (prev?.upvotes || 0) + 1 : (prev?.upvotes || 0) - 1,
        userVote: value,
      }));
    } catch (err) { console.error(err); }
  };

  const handleBookmark = async () => {
    if (!user) return navigate('/login');
    if (bookmarking) return;
    setBookmarking(true);
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      const result = await discussionsService.toggleBookmark(id);
      setIsBookmarked(result.bookmarked);
    } catch (err) {
      setIsBookmarked(prev);
    } finally {
      setBookmarking(false);
    }
  };

  const handleSubmitNewComment = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim() || !user) return;
    setSubmittingNew(true);
    try {
      const newComment = await discussionsService.addComment(id, newCommentContent.trim());
      setComments(prev => [newComment, ...prev]);
      setNewCommentContent('');
      setIsFocused(false);
    } catch (err) {
      alert('Failed to add comment');
    } finally {
      setSubmittingNew(false);
    }
  };

  const handleReplySubmit = async (parentCommentId, replyText) => {
    if (!replyText.trim() || !user) return;
    try {
      const newReply = await discussionsService.addComment(id, replyText.trim(), parentCommentId);
      setComments(prev =>
        prev.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply],
            };
          }
          return comment;
        })
      );
    } catch (err) {
      alert('Failed to post reply');
      throw err;
    }
  };

  const handleUpvoteComment = async (commentId) => {
    if (!user) return navigate('/login');
    setUpvotingCommentId(commentId);
    try {
      await discussionsService.upvoteComment(commentId);
      await fetchDiscussion();
    } catch (err) {
      alert('Failed to upvote comment');
    } finally {
      setUpvotingCommentId(null);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const diff = Math.floor((Date.now() - date) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 2880) return 'Yesterday';
    if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const totalCommentCount = () =>
    comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="glass-card p-6 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/groups')}
            className="btn-primary"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  if (!discussion) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-20">
        {/* Back Button */}
        <button
          onClick={() => navigate('/groups')}
          className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Groups</span>
        </button>

        {/* Discussion Post */}
        <article className="glass-card p-6 sm:p-8 mb-6 animate-slide-up">
          {/* Tags */}
          {discussion.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {discussion.tags.map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium hover:bg-primary-100 transition-colors cursor-pointer"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
            {discussion.title}
          </h1>

          {/* Author Info with badges */}
          <div className="flex items-center gap-3 mb-6">
            {discussion.isAnonymous ? (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-semibold">
                  ?
                </div>
                <div>
                  <p className="font-medium text-gray-900">Anonymous</p>
                  <p className="text-sm text-gray-500">{formatTimeAgo(discussion.createdAt)}</p>
                </div>
              </>
            ) : (
              <>
                <Avatar user={discussion.author} size="medium" />
                <div>
                  <div className="flex items-center flex-wrap gap-1">
                    <p className="font-medium text-gray-900">{discussion.author?.name}</p>
                    {discussion.author?.isSuperAdmin && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Super Admin
                      </span>
                    )}
                    {discussion.author?.isModerator && !discussion.author?.isSuperAdmin && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Moderator
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatTimeAgo(discussion.createdAt)}</span>
                    {discussion.group && (
                      <>
                        <span>•</span>
                        <span className="text-primary-600 font-medium">{discussion.group.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-sm sm:prose max-w-none mb-6">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {discussion.content}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
            <VoteButton
              upvotes={discussion.upvotes}
              userVote={discussion.userVote}
              onVote={handleVote}
            />
            
            <button className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">{totalCommentCount()}</span>
            </button>

            <button className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm font-medium">{discussion.viewCount || 0}</span>
            </button>

            {user && (
              <button
                onClick={handleBookmark}
                disabled={bookmarking}
                className="ml-auto flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors group"
              >
                <svg
                  className={`w-5 h-5 group-hover:scale-110 transition-transform ${isBookmarked ? 'fill-primary-600 text-primary-600' : 'fill-none'}`}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}
          </div>
        </article>

        {/* Comment Input */}
        {user ? (
          <div className={`glass-card mb-6 transition-all duration-300 ${isFocused ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}>
            <form onSubmit={handleSubmitNewComment} className="p-4">
              <div className="flex gap-3">
                <Avatar user={user} size="medium" />
                <div className="flex-1">
                  <textarea
                    value={newCommentContent}
                    onChange={e => setNewCommentContent(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => !newCommentContent && setIsFocused(false)}
                    placeholder="Share your thoughts..."
                    rows={isFocused ? 3 : 1}
                    className="w-full p-3 border-0 focus:ring-0 rounded-xl bg-gray-50 focus:bg-white transition-all resize-none placeholder:text-gray-400"
                  />
                  {isFocused && (
                    <div className="flex justify-end gap-2 mt-3 animate-slide-up">
                      <button
                        type="button"
                        onClick={() => {
                          setNewCommentContent('');
                          setIsFocused(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newCommentContent.trim() || submittingNew}
                        className="px-6 py-2 text-sm font-medium bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
                      >
                        {submittingNew ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Posting...
                          </span>
                        ) : (
                          'Comment'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="glass-card p-6 text-center mb-6">
            <p className="text-gray-700 mb-4">Join the conversation</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Sign In to Comment
            </button>
          </div>
        )}

        {/* Comments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {totalCommentCount() === 0 ? 'Comments' : `${totalCommentCount()} ${totalCommentCount() === 1 ? 'Comment' : 'Comments'}`}
            </h2>
          </div>

          {comments.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No comments yet</h3>
              <p className="text-gray-600">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment, index) => (
                <div
                  key={comment.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CommentItem
                    comment={comment}
                    onReplySubmit={handleReplySubmit}
                    onUpvote={handleUpvoteComment}
                    formatTimeAgo={formatTimeAgo}
                    currentUser={user}
                    isUpvoting={upvotingCommentId === comment.id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Comment Component with badges for comment authors and replies
function CommentItem({ comment, onReplySubmit, onUpvote, formatTimeAgo, currentUser, isUpvoting }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const textareaRef = useRef(null);

  const handleReplyClick = () => {
    setShowReplyForm(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await onReplySubmit(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    } catch (err) {
      // Error handled in parent
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const hasReplies = comment.replies?.length > 0;

  return (
    <div className="glass-card hover:shadow-md transition-all duration-200">
      <div className="p-4 sm:p-5">
        {/* Comment Header with badges */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar user={comment.author} size="medium" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{comment.author?.name}</span>
              {comment.author?.isSuperAdmin && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Super Admin
                </span>
              )}
              {comment.author?.isModerator && !comment.author?.isSuperAdmin && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Moderator
                </span>
              )}
              <span className="text-gray-400">·</span>
              <span className="text-sm text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Comment Content */}
        <p className="text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap pl-0 sm:pl-12">
          {comment.content}
        </p>

        {/* Comment Actions */}
        <div className="flex items-center gap-6 text-sm pl-0 sm:pl-12">
          <button
            onClick={() => onUpvote(comment.id)}
            disabled={isUpvoting}
            className={`flex items-center gap-2 font-medium transition-all group ${
              comment.userVote ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'
            }`}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isUpvoting ? 'animate-spin' : 'group-hover:scale-110'}`}
              fill={comment.userVote ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span>{comment.upvotes || 0}</span>
          </button>

          {currentUser && (
            <button
              onClick={handleReplyClick}
              className="flex items-center gap-2 text-gray-500 hover:text-primary-600 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4 pl-0 sm:pl-12 animate-slide-up">
            <form onSubmit={handleSubmitReply}>
              <div className="flex gap-3">
                <Avatar user={currentUser} size="small" />
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={`Reply to ${comment.author?.name}...`}
                    rows={2}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none bg-gray-50 focus:bg-white transition-colors"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(false)}
                      className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!replyText.trim() || isSubmittingReply}
                      className="px-4 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmittingReply ? 'Replying...' : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Replies Section */}
      {hasReplies && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="w-full px-4 sm:px-5 py-3 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showReplies ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>

          {showReplies && (
            <div className="px-4 sm:px-5 pb-4 space-y-4">
              {comment.replies.map(reply => (
                <div key={reply.id} className="flex gap-3 animate-slide-up">
                  <Avatar user={reply.author} size="small" />
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">{reply.author?.name}</span>
                        {reply.author?.isSuperAdmin && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Super Admin
                          </span>
                        )}
                        {reply.author?.isModerator && !reply.author?.isSuperAdmin && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Moderator
                          </span>
                        )}
                        <span className="text-gray-400">·</span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
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