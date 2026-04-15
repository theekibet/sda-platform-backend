// src/components/discussions/CommentThread.jsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';

// Fire Icon Component (matches VoteButton style)
const FireIcon = ({ filled = false, className = "w-5 h-5" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    className={className}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? "0" : "1.5"}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" 
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" 
    />
  </svg>
);

// Other Icons
const Icons = {
  More: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  ),
  Reply: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Delete: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
};

function CommentThread({ 
  comment, 
  onReply, 
  onUpvote, 
  onEdit, 
  onDelete, 
  depth = 0, 
  maxDepth = 3 
}) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const textareaRef = useRef(null);
  const editTextareaRef = useRef(null);

  const isAuthor = user?.id === comment.authorId;
  const canReply = depth < maxDepth;
  const hasReplies = comment.replies && comment.replies.length > 0;

  useEffect(() => {
    if (showReplyForm && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showReplyForm]);

  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.setSelectionRange(
        editTextareaRef.current.value.length,
        editTextareaRef.current.value.length
      );
    }
  }, [isEditing]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setIsSubmittingReply(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyForm(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }
    onEdit(comment.id, editContent.trim());
    setIsEditing(false);
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 2880) return 'Yesterday';
    if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Thread connector styles based on depth
  const threadStyles = depth > 0 ? 'ml-6 sm:ml-8 md:ml-10 pl-4 border-l-2 border-gray-200' : '';

  return (
    <div className={`${threadStyles} ${depth === 0 ? 'mb-4' : 'mt-4'} group relative`}>
      {/* Comment Card */}
      <div className={`glass-card hover:shadow-md transition-all duration-200 ${isEditing ? 'ring-2 ring-primary-500' : ''}`}>
        <div className="p-4">
          {/* Comment Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar user={comment.author} size={depth > 0 ? 'small' : 'medium'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-semibold text-gray-900 ${depth > 0 ? 'text-sm' : ''}`}>
                  {comment.author?.name}
                </span>
                <span className="text-gray-400 text-xs">·</span>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(comment.createdAt)}
                </span>
                {comment.updatedAt !== comment.createdAt && (
                  <span className="text-xs text-gray-400 italic">(edited)</span>
                )}
              </div>
            </div>

            {/* Action Menu (visible on hover for author) */}
            {isAuthor && !isEditing && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Icons.More />
                </button>
              </div>
            )}
          </div>

          {/* Edit Mode */}
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <textarea
                ref={editTextareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditContent(comment.content);
                    setIsEditing(false);
                  }}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editContent.trim() || editContent === comment.content}
                  className="px-4 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Comment Content */}
              <p className={`text-gray-800 leading-relaxed mb-3 whitespace-pre-wrap ${depth > 0 ? 'text-sm' : ''}`}>
                {comment.content}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 text-sm">
                {/* Fire Vote Button */}
                <button
                  onClick={() => onUpvote(comment.id)}
                  className={`
                    flex items-center gap-1.5 font-medium transition-all duration-200 group/fire
                    ${comment.userVote 
                      ? 'text-orange-500' 
                      : 'text-gray-500 hover:text-orange-400'
                    }
                  `}
                  title={comment.userVote ? 'Remove fire' : 'Give fire'}
                >
                  <span className={`
                    p-1 rounded-full transition-all duration-200
                    ${comment.userVote 
                      ? 'bg-orange-100 text-orange-500' 
                      : 'group-hover/fire:bg-orange-50'
                    }
                  `}>
                    <FireIcon 
                      filled={comment.userVote} 
                      className={`w-5 h-5 transition-transform duration-200 ${comment.userVote ? 'scale-110' : 'group-hover/fire:scale-110'}`} 
                    />
                  </span>
                  <span className={comment.userVote ? 'font-semibold' : ''}>
                    {comment.upvotes || 0}
                  </span>
                </button>

                {canReply && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 font-medium transition-colors"
                  >
                    <Icons.Reply />
                    Reply
                  </button>
                )}

                {isAuthor && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 font-medium transition-colors"
                    >
                      <Icons.Edit />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this comment?')) {
                          onDelete(comment.id);
                        }
                      }}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 font-medium transition-colors"
                    >
                      <Icons.Delete />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Reply Form */}
          {showReplyForm && !isEditing && (
            <div className="mt-4 pt-4 border-t border-gray-100 animate-slide-up">
              <form onSubmit={handleReplySubmit}>
                <div className="flex gap-3">
                  <Avatar user={user} size="small" />
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${comment.author?.name}...`}
                      rows={2}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none bg-gray-50 focus:bg-white transition-colors"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowReplyForm(false);
                          setReplyContent('');
                        }}
                        className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!replyContent.trim() || isSubmittingReply}
                        className="px-4 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isSubmittingReply ? (
                          <span className="flex items-center gap-2">
                            <Icons.Spinner />
                            Replying...
                          </span>
                        ) : (
                          'Reply'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {hasReplies && (
          <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <Icons.ChevronDown />
              </span>
              {isExpanded ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>

            {isExpanded && (
              <div className="pb-2">
                {comment.replies.map((reply, index) => (
                  <div
                    key={reply.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <CommentThread
                      comment={reply}
                      onReply={onReply}
                      onUpvote={onUpvote}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      depth={depth + 1}
                      maxDepth={maxDepth}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Skeleton Loader
export function CommentThreadSkeleton({ count = 3, depth = 0 }) {
  const threadStyles = depth > 0 ? 'ml-6 sm:ml-8 md:ml-10 pl-4 border-l-2 border-gray-200' : '';
  
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${threadStyles} animate-pulse`}>
          <div className="glass-card p-4">
            <div className="flex gap-3">
              <div className={`${depth > 0 ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-200 rounded-full flex-shrink-0`} />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </div>
                <div className="flex gap-4">
                  <div className="h-5 bg-gray-200 rounded w-12" />
                  <div className="h-5 bg-gray-200 rounded w-12" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CommentThread;