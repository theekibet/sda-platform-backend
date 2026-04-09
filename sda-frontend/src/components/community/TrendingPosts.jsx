// src/components/community/TrendingPosts.jsx
import React, { useState, useEffect } from 'react';
import { communityService } from '../../services/communityService';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (avatarUrl) => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${API_BASE_URL}${avatarUrl}`;
};

const TrendingPosts = ({ limit = 5, onPostClick }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrending();
  }, [limit]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const response = await communityService.getTrendingPosts('week', limit);
      setPosts(response.data || []);
    } catch (err) {
      console.error('Error fetching trending posts:', err);
      setError('Failed to load trending posts');
    } finally {
      setLoading(false);
    }
  };

  const getSupportCount = (post) => {
    // Check for supportCount in various possible locations in the response
    if (post.stats && typeof post.stats.supportCount === 'number') {
      return post.stats.supportCount;
    }
    if (post.supportCount !== undefined && typeof post.supportCount === 'number') {
      return post.supportCount;
    }
    // Fallback for backward compatibility with old data structure
    if (post.stats && typeof post.stats.total === 'number') {
      return post.stats.total;
    }
    if (post._count && typeof post._count.responses === 'number') {
      return post._count.responses;
    }
    if (post.responseCount !== undefined) {
      return post.responseCount;
    }
    return 0;
  };

  const getPostTypeIcon = (type) => {
    switch (type) {
      case 'event': return '📅';
      case 'donation': return '🎁';
      case 'support': return '🙏';
      case 'prayer': return '🙏';
      case 'announcement': return '📢';
      case 'general': return '💬';
      default: return '📝';
    }
  };

  const getPostTypeColor = (type) => {
    switch (type) {
      case 'event': return 'bg-blue-100 text-blue-700';
      case 'donation': return 'bg-pink-100 text-pink-700';
      case 'support': return 'bg-yellow-100 text-yellow-700';
      case 'prayer': return 'bg-purple-100 text-purple-700';
      case 'announcement': return 'bg-indigo-100 text-indigo-700';
      case 'general': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getAuthorInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-4 text-gray-500">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
        <span>Loading trending posts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
        <span>⚠️</span>
        <span>{error}</span>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="p-4 text-gray-400 text-center italic">
        ✨ No trending posts yet
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-5 pt-4 pb-2 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">
          🔥 Trending in the Community
        </h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          Updated weekly
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {posts.map((post, index) => {
          const supportCount = getSupportCount(post);
          const typeIcon = getPostTypeIcon(post.type);
          const typeColor = getPostTypeColor(post.type);
          const avatarUrl = getImageUrl(post.author?.avatarUrl);
          const authorInitials = getAuthorInitials(post.author?.name);
          
          return (
            <div
              key={post.id}
              className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
              onClick={() => onPostClick && onPostClick(post.id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') onPostClick && onPostClick(post.id);
              }}
            >
              {/* Rank Number */}
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 group-hover:scale-105 ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-amber-600 text-white' :
                  'bg-primary-100 text-primary-700'
                }`}>
                  {index + 1}
                </div>
              </div>
              
              {/* Post Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
                  <span className="text-base">{typeIcon}</span>
                  <span className={`capitalize px-2 py-0.5 rounded-full ${typeColor}`}>
                    {post.type}
                  </span>
                  {post.stats?.isUrgent && (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                      <span>⚠️</span> Urgent
                    </span>
                  )}
                </div>
                
                <h4 className="font-semibold text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                  {post.title}
                </h4>
                
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {truncateText(post.description, 100)}
                </p>
                
                {/* Author with Avatar */}
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={post.author?.name || 'User'} 
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px] font-bold';
                            fallback.innerText = authorInitials;
                            parent.appendChild(fallback);
                            e.target.remove();
                          }
                        }}
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px] font-bold">
                        {authorInitials}
                      </div>
                    )}
                    <span className="text-gray-600 font-medium">
                      {post.author?.name || 'Anonymous'}
                    </span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">🙏</span>
                    <span>{supportCount} {supportCount === 1 ? 'support' : 'supports'}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">🕒</span>
                    <span>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              {/* Trending Indicator for top 3 */}
              {index < 3 && (
                <div className="flex-shrink-0 self-center">
                  <div className="text-2xl opacity-30 group-hover:opacity-100 transition-opacity">
                    {index === 0 ? '👑' : index === 1 ? '⭐' : '✨'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Footer with view all link */}
      {posts.length === limit && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <button 
            onClick={() => window.location.href = '/community?sort=trending'}
            className="text-xs text-primary-500 hover:text-primary-600 font-medium transition"
          >
            View all trending posts →
          </button>
        </div>
      )}
    </div>
  );
};

export default TrendingPosts;