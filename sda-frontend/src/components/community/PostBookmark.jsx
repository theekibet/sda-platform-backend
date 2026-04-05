import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { communityService } from '../../services/communityService';

const PostBookmark = ({ postId, onBookmarkChange }) => {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkBookmarkStatus();
    }
  }, [user, postId]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await communityService.getBookmarkStatus(postId);
      setIsBookmarked(response.data?.isBookmarked || false);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      alert('Please login to bookmark posts');
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        await communityService.removeBookmark(postId);
      } else {
        await communityService.addBookmark(postId);
      }
      setIsBookmarked(!isBookmarked);
      if (onBookmarkChange) {
        onBookmarkChange(!isBookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full border transition-all duration-200 cursor-pointer text-sm ${
        isBookmarked
          ? 'bg-amber-50 border-amber-500 text-amber-600'
          : 'bg-transparent border-gray-300 text-gray-600 hover:border-amber-400 hover:text-amber-500'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isBookmarked ? 'Remove from bookmarks' : 'Save to bookmarks'}
    >
      <span className="text-sm">{isBookmarked ? '🔖' : '📑'}</span>
      <span className="text-xs font-medium">{isBookmarked ? 'Saved' : 'Save'}</span>
    </button>
  );
};

export default PostBookmark;