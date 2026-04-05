// src/components/discussions/CommentThread.jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { VoteButtonCompact } from './VoteButton';

function CommentThread({ 
  comment, 
  onReply, 
  onUpvote, 
  onEdit, 
  onDelete, 
  depth = 0, 
  maxDepth = 2 
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const isAuthor = user?.id === comment.authorId;
  const canReply = depth < maxDepth;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    onReply(comment.id, replyContent.trim());
    setReplyContent('');
    setShowReplyForm(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    
    onEdit(comment.id, editContent.trim());
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment.id);
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

  if (isEditing) {
    return (
      <div className={`${depth > 0 ? 'ml-4 pl-4 border-l-2 border-gray-200' : ''}`}>
        <form onSubmit={handleEditSubmit} className="bg-gray-50 rounded-lg p-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-y"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`${depth > 0 ? 'ml-4 pl-4 border-l-2 border-gray-200' : ''}`}>
      {/* Comment Header */}
      <div className="flex items-center gap-2 mb-1">
        {comment.author?.avatarUrl ? (
          <img
            src={comment.author.avatarUrl}
            alt={comment.author.name}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-semibold">
            {comment.author?.name?.charAt(0) || '?'}
          </div>
        )}
        <span className="font-medium text-sm text-gray-800">
          {comment.author?.name || 'Unknown'}
        </span>
        <span className="text-gray-400">•</span>
        <span className="text-xs text-gray-500">
          {formatTimeAgo(comment.createdAt)}
        </span>
        {comment.updatedAt !== comment.createdAt && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-400">edited</span>
          </>
        )}
      </div>

      {/* Comment Content */}
      <div className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">
        {comment.content}
      </div>

      {/* Comment Actions */}
      <div className="flex items-center gap-4 text-xs mb-3">
        <VoteButtonCompact 
          upvotes={comment.upvotes} 
          onUpvote={() => onUpvote(comment.id)} 
        />
        
        {canReply && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-gray-500 hover:text-primary-500 transition"
          >
            Reply
          </button>
        )}

        {isAuthor && (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-500 hover:text-primary-500 transition"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-500 hover:text-red-500 transition"
            >
              Delete
            </button>
          </>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="mb-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-y"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setShowReplyForm(false);
                setReplyContent('');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!replyContent.trim()}
              className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition disabled:opacity-50"
            >
              Reply
            </button>
          </div>
        </form>
      )}

      {/* Nested Replies */}
      {hasReplies && (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            {isExpanded ? '▼' : '▶'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          
          {isExpanded && (
            <div className="space-y-3">
              {comment.replies.map(reply => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onUpvote={onUpvote}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Loading skeleton for comments
export function CommentThreadSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-200 rounded"></div>
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state for comments
export function CommentEmptyState({ onCreate }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    onCreate?.();
  };

  return (
    <div className="text-center py-8 text-gray-500">
      <p className="mb-2">No comments yet</p>
      <p className="text-sm text-gray-400 mb-4">Be the first to share your thoughts!</p>
      {onCreate && (
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition text-sm"
        >
          Add a comment
        </button>
      )}
    </div>
  );
}

export default CommentThread;