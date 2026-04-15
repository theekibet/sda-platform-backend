// src/components/bible/InteractiveVerseCard.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVerseInteractions } from '../../hooks/useVerseInteractions';
import VerseCard from './VerseCard';
import Avatar from '../common/Avatar';

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

  const normalizeUserForAvatar = (userData) => {
    if (!userData) return null;
    return {
      name: userData.name || 'Anonymous',
      avatarUrl: userData.avatarUrl || null,
    };
  };

  if (!verse) return null;

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      <VerseCard verse={verse} showSharedBy={showSharedBy} />

      {/* Interaction Bar */}
      <div className="flex justify-around items-center p-4 border-t border-gray-100 gap-2 flex-wrap bg-gray-50/50">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            liked 
              ? 'text-red-600 bg-red-50' 
              : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
          }`}
          disabled={loading}
          title={liked ? "Unlike this verse" : "Like this verse"}
        >
          <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {likeCount > 0 && <span className="text-sm font-medium">{likeCount}</span>}
        </button>

        {/* Comments Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            showComments 
              ? 'text-primary-600 bg-primary-50' 
              : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'
          }`}
          title="View comments"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {comments.length > 0 && <span className="text-sm font-medium">{comments.length}</span>}
        </button>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            bookmarked 
              ? 'text-amber-600 bg-amber-50' 
              : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
          }`}
          disabled={loading}
          title={bookmarked ? "Remove bookmark" : "Bookmark this verse"}
        >
          <svg className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        {/* Read Button */}
        {showReadButton && getVerseData().book && getVerseData().chapter && (
          <button
            onClick={() => {
              const { book, chapter } = getVerseData();
              window.open(`/bible/read/${book}/${chapter}`, '_blank');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
            title="Read in context"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Read
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border-t border-red-100 text-red-600 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="p-5 border-t border-gray-100 bg-gray-50">
          <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comments {comments.length > 0 && `(${comments.length})`}
          </h3>

          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={onSubmitComment} className="mb-5">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this verse..."
                rows={3}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y bg-white transition"
                disabled={submittingComment}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingComment ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </>
                  ) : (
                    'Post Comment'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center p-5 bg-white rounded-xl mb-5">
              <p className="text-gray-600">
                <a href="/login" className="text-primary-600 font-semibold hover:underline">Login</a> to join the discussion
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-white rounded-xl">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>{user ? "No comments yet. Be the first to share your thoughts!" : "No comments yet."}</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar user={normalizeUserForAvatar(comment.user)} size="small" />
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