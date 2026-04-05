// src/components/bible/InteractiveVerseCard.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVerseInteractions } from '../../hooks/useVerseInteractions';
import VerseCard from './VerseCard';

const InteractiveVerseCard = ({ 
  verse, 
  className = '',
  showReadButton = true,
  showSharedBy = true,
}) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const getVerseId = () => verse?.verse?.id || verse?.id;
  const verseId = getVerseId();

  const {
    liked,
    bookmarked,
    likeCount,
    comments,
    loading,
    error,
    handleLike,
    handleBookmark,
    handleAddComment,
  } = useVerseInteractions(verseId);

  const onSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    const success = await handleAddComment(newComment);
    if (success) setNewComment('');
    setSubmittingComment(false);
  };

  const getVerseData = () => {
    const verseData = verse?.verse || verse;
    return {
      book: verseData?.book,
      chapter: verseData?.chapter,
    };
  };

  if (!verse) return null;

  return (
    <div className={`bg-white rounded-xl shadow-md ${className}`}>
      <VerseCard verse={verse} showSharedBy={showSharedBy} />

      {/* Interaction Bar */}
      <div className="flex justify-around items-center p-4 border-t border-gray-200 gap-2 flex-wrap">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          disabled={loading}
          title={liked ? "Unlike this verse" : "Like this verse"}
        >
          {liked ? '❤️' : '🤍'}
          {likeCount > 0 && <span className="text-sm font-medium">{likeCount}</span>}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${showComments ? 'text-primary-500' : 'text-gray-500 hover:text-primary-500'}`}
          title="View comments"
        >
          💬 {comments.length > 0 && <span className="text-sm font-medium">{comments.length}</span>}
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${bookmarked ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}
          disabled={loading}
          title={bookmarked ? "Remove bookmark" : "Bookmark this verse"}
        >
          {bookmarked ? '🔖' : '📑'}
        </button>

        {showReadButton && getVerseData().book && getVerseData().chapter && (
          <button
            onClick={() => {
              const { book, chapter } = getVerseData();
              window.open(`/bible/read/${book}/${chapter}`, '_blank');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-gray-500 hover:text-primary-500 transition-all"
            title="Read in context"
          >
            📖 Read
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm border-t border-red-100">
          {error}
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            💬 Comments {comments.length > 0 && `(${comments.length})`}
          </h3>

          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={onSubmitComment} className="mb-5 bg-white p-4 rounded-lg shadow-sm">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this verse..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                disabled={submittingComment}
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="mt-2 float-right px-4 py-2 bg-primary-500 text-white rounded-md font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
              <div className="clear-both" />
            </form>
          ) : (
            <div className="text-center p-5 bg-white rounded-lg shadow-sm mb-5">
              <p>
                <a href="/login" className="text-primary-500 font-semibold hover:underline">Login</a> to join the discussion
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-2">
            {comments.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                {user ? "No comments yet. Be the first to share your thoughts!" : "No comments yet."}
              </p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold uppercase">
                        {(comment.user?.name || 'A')[0]}
                      </div>
                      <strong className="text-gray-800">{comment.user?.name || 'Anonymous'}</strong>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: new Date(comment.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveVerseCard;