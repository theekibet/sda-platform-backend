// src/pages/members/discussions/DiscussionCard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { discussionsService } from '../../services/discussionsService';

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

  // Debug log to see discussion data
  console.log('DiscussionCard rendering:', { id: discussion.id, title: discussion.title });

  const handleCardClick = (e) => {
    // Don't navigate if clicking on interactive elements
    if (e.target.closest('.interactive')) {
      return;
    }
    if (onClick) {
      onClick();
    } else {
      console.log('Navigating to discussion:', discussion.id);
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

    // Optimistic update
    if (userVote === 1) {
      setLocalUpvotes(prev => prev - 1);
      setUserVote(null);
    } else {
      setLocalUpvotes(prev => prev + 1);
      setUserVote(1);
    }

    try {
      console.log('Sending vote:', { discussionId: discussion.id, value: newVoteValue });
      await discussionsService.voteDiscussion(discussion.id, newVoteValue);
      if (onVote) {
        onVote(discussion.id, newVoteValue);
      }
    } catch (error) {
      console.error('Error voting:', error);
      console.error('Error response:', error.response?.data);
      // Revert optimistic update
      setLocalUpvotes(previousUpvotes);
      setUserVote(previousUserVote);
    } finally {
      setVoting(false);
    }
  };

  const handleCommentsClick = (e) => {
    e.stopPropagation();
    console.log('Comments clicked for discussion:', discussion.id);
    if (onClick) {
      onClick();
    } else {
      navigate(`/discussions/${discussion.id}#comments`);
    }
  };

  const handleViewsClick = (e) => {
    e.stopPropagation();
    console.log('Views clicked for discussion:', discussion.id);
    if (onClick) {
      onClick();
    } else {
      navigate(`/discussions/${discussion.id}`);
    }
  };

  // Truncate content for preview
  const previewContent = discussion.content?.length > 150
    ? discussion.content.substring(0, 150) + '...'
    : discussion.content;

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition cursor-pointer"
    >
      {/* Tags */}
      {discussion.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {discussion.tags.map(tag => (
            <span
              key={tag.id}
              onClick={(e) => handleTagClick(e, tag)}
              className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs hover:bg-primary-200 transition interactive"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 hover:text-primary-600 transition">
        {discussion.title}
      </h3>

      {/* Content Preview */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {previewContent}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        {/* Left: Author & Meta */}
        <div className="flex items-center gap-3">
          {/* Author */}
          <div 
            onClick={handleAuthorClick}
            className={`flex items-center gap-2 ${!discussion.isAnonymous ? 'hover:opacity-80 transition interactive' : ''}`}
          >
            {discussion.isAnonymous ? (
              <>
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs">
                  ?
                </div>
                <span className="text-gray-500">Anonymous</span>
              </>
            ) : (
              <>
                {discussion.author?.avatarUrl ? (
                  <img
                    src={discussion.author.avatarUrl}
                    alt={discussion.author.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs">
                    {discussion.author?.name?.charAt(0) || '?'}
                  </div>
                )}
                <span className="text-gray-700 font-medium">
                  {discussion.author?.name || 'Unknown'}
                </span>
              </>
            )}
          </div>

          <span className="text-gray-400">•</span>

          {/* Time */}
          <span className="text-gray-500">
            {formatTimeAgo ? formatTimeAgo(discussion.createdAt) : new Date(discussion.createdAt).toLocaleDateString()}
          </span>

          {/* Group (if applicable) */}
          {discussion.group && (
            <>
              <span className="text-gray-400">•</span>
              <span 
                onClick={handleGroupClick}
                className="text-primary-600 hover:underline interactive"
              >
                {discussion.group.name}
              </span>
            </>
          )}
        </div>

        {/* Right: Stats & Bookmark */}
        <div className="flex items-center gap-4 text-gray-500">
          {/* Upvotes - Clickable */}
          <button
            onClick={handleVoteClick}
            disabled={voting}
            className="flex items-center gap-1 hover:text-primary-500 transition interactive"
            title={userVote === 1 ? 'Remove upvote' : 'Upvote'}
          >
            <span className={userVote === 1 ? 'text-primary-500' : ''}>
              ▲
            </span>
            <span>{localUpvotes.toLocaleString()}</span>
          </button>

          {/* Comments - Clickable */}
          <button
            onClick={handleCommentsClick}
            className="flex items-center gap-1 hover:text-primary-500 transition interactive"
            title="Comments"
          >
            💬 <span>{discussion._count?.comments || discussion.comments?.length || 0}</span>
          </button>

          {/* Views - Clickable */}
          <button
            onClick={handleViewsClick}
            className="flex items-center gap-1 hover:text-primary-500 transition interactive"
            title="Views"
          >
            👁️ <span>{discussion.viewCount || 0}</span>
          </button>

          {/* Bookmark */}
          {user && (
            <button
              onClick={handleBookmarkClick}
              disabled={bookmarking}
              className={`transition interactive ${bookmarking ? 'opacity-50' : 'hover:scale-110'}`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <span className="text-lg">
                {isBookmarked ? '🔖' : '📖'}
              </span>
            </button>
          )}
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
    if (e.target.closest('.interactive')) {
      return;
    }
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

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1 flex-1">
          {discussion.title}
        </h4>
        {onToggleBookmark && (
          <button
            onClick={handleBookmarkClick}
            disabled={bookmarking}
            className="text-gray-400 hover:text-primary-500 transition ml-2 interactive"
          >
            {isBookmarked ? '🔖' : '📖'}
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {discussion.isAnonymous ? (
          <span>Anonymous</span>
        ) : (
          <span>{discussion.author?.name}</span>
        )}
        <span>•</span>
        <span>
          {formatTimeAgo 
            ? formatTimeAgo(discussion.createdAt) 
            : new Date(discussion.createdAt).toLocaleDateString()
          }
        </span>
        <span>•</span>
        <span>▲ {discussion.upvotes || 0}</span>
        <span>💬 {discussion._count?.comments || 0}</span>
      </div>
    </div>
  );
}

// Skeleton loader for loading states
export function DiscussionCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
        <div className="w-12 h-5 bg-gray-200 rounded-full"></div>
      </div>
      
      <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded mb-1 w-full"></div>
      <div className="h-4 bg-gray-200 rounded mb-1 w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded mb-4 w-4/6"></div>
      
      <div className="flex justify-between">
        <div className="flex gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-20 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="flex gap-3">
          <div className="w-12 h-4 bg-gray-200 rounded"></div>
          <div className="w-12 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default DiscussionCard;