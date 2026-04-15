// src/pages/members/discussions/DiscussionCard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { discussionsService } from '../../services/discussionsService';
import Avatar from '../../components/common/Avatar';

function DiscussionCard({ 
  discussion, 
  onClick, 
  formatTimeAgo,
  onBookmarkChange,
  isBookmarked: propIsBookmarked,
  onVote
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(propIsBookmarked || false);
  const [bookmarking, setBookmarking] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(discussion.upvotes || 0);
  const [userVote, setUserVote] = useState(discussion.userVote || null);
  const [voting, setVoting] = useState(false);

  const handleCardClick = (e) => {
    if (e.target.closest('.interactive')) return;
    if (onClick) {
      onClick();
    } else {
      navigate(`/discussions/${discussion.id}`);
    }
  };

  const handleAuthorClick = (e) => {
    e.stopPropagation();
    if (!discussion.isAnonymous && discussion.author?.id) {
      navigate(`/members/${discussion.author.id}`);
    }
  };

  const handleTagClick = (e, tag) => {
    e.stopPropagation();
    navigate(`/discussions?tag=${tag.id}`);
  };

  const handleGroupClick = (e) => {
    e.stopPropagation();
    if (discussion.group?.id) {
      navigate(`/groups/${discussion.group.id}`);
    }
  };

  const handleBookmarkClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (bookmarking) return;

    setBookmarking(true);
    const previousState = isBookmarked;
    setIsBookmarked(!previousState);

    try {
      const result = await discussionsService.toggleBookmark(discussion.id);
      setIsBookmarked(result.bookmarked);
      if (onBookmarkChange) {
        onBookmarkChange(discussion.id, result.bookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setIsBookmarked(previousState);
    } finally {
      setBookmarking(false);
    }
  };

  const handleVoteClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (voting) return;

    setVoting(true);
    const newVoteValue = userVote === 1 ? 0 : 1;
    const previousUpvotes = localUpvotes;
    const previousUserVote = userVote;

    if (userVote === 1) {
      setLocalUpvotes(prev => prev - 1);
      setUserVote(null);
    } else {
      setLocalUpvotes(prev => prev + 1);
      setUserVote(1);
    }

    try {
      await discussionsService.voteDiscussion(discussion.id, newVoteValue);
      if (onVote) {
        onVote(discussion.id, newVoteValue);
      }
    } catch (error) {
      console.error('Error voting:', error);
      setLocalUpvotes(previousUpvotes);
      setUserVote(previousUserVote);
    } finally {
      setVoting(false);
    }
  };

  const handleCommentsClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      navigate(`/discussions/${discussion.id}#comments`);
    }
  };

  const handleViewsClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      navigate(`/discussions/${discussion.id}`);
    }
  };

  const previewContent = discussion.content?.length > 150
    ? discussion.content.substring(0, 150) + '...'
    : discussion.content;

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 2880) return 'Yesterday';
    if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={handleCardClick}
      className="group glass-card hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
    >
      <div className="p-5">
        {/* Tags */}
        {discussion.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {discussion.tags.map(tag => (
              <span
                key={tag.id}
                onClick={(e) => handleTagClick(e, tag)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium hover:bg-primary-100 transition-colors interactive"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {discussion.title}
        </h3>

        {/* Content Preview */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {previewContent}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
          {/* Left: Author & Meta */}
          <div className="flex items-center gap-3">
            <div 
              onClick={handleAuthorClick}
              className={`flex items-center gap-2 ${!discussion.isAnonymous ? 'hover:opacity-80 transition interactive' : ''}`}
            >
              {discussion.isAnonymous ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs">
                    ?
                  </div>
                  <span className="text-gray-500 text-sm">Anonymous</span>
                </>
              ) : (
                <>
                  <Avatar user={discussion.author} size="small" />
                  <span className="text-gray-700 font-medium text-sm">
                    {discussion.author?.name || 'Unknown'}
                  </span>
                </>
              )}
            </div>

            <span className="text-gray-400 text-xs">•</span>

            <span className="text-gray-500 text-xs">
              {formatTimeAgo ? formatTimeAgo(discussion.createdAt) : formatRelativeTime(discussion.createdAt)}
            </span>

            {discussion.group && (
              <>
                <span className="text-gray-400 text-xs">•</span>
                <span 
                  onClick={handleGroupClick}
                  className="text-primary-600 hover:underline text-xs font-medium interactive"
                >
                  {discussion.group.name}
                </span>
              </>
            )}
          </div>

          {/* Right: Stats & Bookmark */}
          <div className="flex items-center gap-4">
            {/* Upvotes */}
            <button
              onClick={handleVoteClick}
              disabled={voting}
              className={`flex items-center gap-1.5 text-sm font-medium transition-all group/upvote interactive ${
                userVote === 1 ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'
              }`}
              title={userVote === 1 ? 'Remove upvote' : 'Upvote'}
            >
              <svg
                className="w-4 h-4 group-hover/upvote:scale-110 transition-transform"
                fill={userVote === 1 ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span>{localUpvotes.toLocaleString()}</span>
            </button>

            {/* Comments */}
            <button
              onClick={handleCommentsClick}
              className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 transition interactive"
              title="Comments"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{discussion._count?.comments || discussion.comments?.length || 0}</span>
            </button>

            {/* Views */}
            <button
              onClick={handleViewsClick}
              className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 transition interactive"
              title="Views"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{discussion.viewCount || 0}</span>
            </button>

            {/* Bookmark */}
            {user && (
              <button
                onClick={handleBookmarkClick}
                disabled={bookmarking}
                className={`transition interactive ${bookmarking ? 'opacity-50' : 'hover:scale-110'}`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              >
                <svg
                  className={`w-4 h-4 ${isBookmarked ? 'fill-primary-600 text-primary-600' : 'text-gray-500 fill-none'}`}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for sidebars or smaller spaces
export function DiscussionCardCompact({ discussion, onClick, formatTimeAgo, isBookmarked, onToggleBookmark }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookmarking, setBookmarking] = useState(false);

  const handleCardClick = (e) => {
    if (e.target.closest('.interactive')) return;
    if (onClick) {
      onClick();
    } else {
      navigate(`/discussions/${discussion.id}`);
    }
  };

  const handleBookmarkClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (bookmarking) return;
    setBookmarking(true);
    try {
      await onToggleBookmark(discussion.id);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setBookmarking(false);
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    if (diff < 2880) return 'Yesterday';
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={handleCardClick}
      className="glass-card p-3 hover:shadow-md transition cursor-pointer group"
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-semibold text-gray-800 text-sm line-clamp-1 flex-1 group-hover:text-primary-600 transition">
          {discussion.title}
        </h4>
        {onToggleBookmark && (
          <button
            onClick={handleBookmarkClick}
            disabled={bookmarking}
            className="text-gray-400 hover:text-primary-500 transition interactive flex-shrink-0"
          >
            <svg
              className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-primary-600 text-primary-600' : 'fill-none'}`}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
        {discussion.isAnonymous ? (
          <span>Anonymous</span>
        ) : (
          <span>{discussion.author?.name}</span>
        )}
        <span>•</span>
        <span>
          {formatTimeAgo 
            ? formatTimeAgo(discussion.createdAt) 
            : formatRelativeTime(discussion.createdAt)
          }
        </span>
        <span>•</span>
        <span className="flex items-center gap-0.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          {discussion.upvotes || 0}
        </span>
        <span className="flex items-center gap-0.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {discussion._count?.comments || 0}
        </span>
      </div>
    </div>
  );
}

// Skeleton loader for loading states
export function DiscussionCardSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
        <div className="w-12 h-5 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded mb-1 w-full"></div>
      <div className="h-4 bg-gray-200 rounded mb-1 w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded mb-4 w-4/6"></div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-20 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-4 bg-gray-200 rounded"></div>
          <div className="w-8 h-4 bg-gray-200 rounded"></div>
          <div className="w-8 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default DiscussionCard;