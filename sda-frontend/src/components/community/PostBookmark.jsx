// src/components/community/PostBookmark.jsx
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
      className={`inline-flex items-center gap-1.5 p-1.5 rounded-lg transition-all duration-200 ${
        isBookmarked
          ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
          : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isBookmarked ? 'Remove from bookmarks' : 'Save to bookmarks'}
    >
      <svg 
        className={`w-5 h-5 transition-transform ${loading ? 'animate-pulse' : ''}`}
        fill={isBookmarked ? 'currentColor' : 'none'}
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
        />
      </svg>
    </button>
  );
};

export default PostBookmark;