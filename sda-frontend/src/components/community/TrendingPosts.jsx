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

// Heroicons SVG Components
const Icons = {
  Calendar: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Gift: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  Heart: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Speaker: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  Chat: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Document: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Fire: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  Exclamation: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Crown: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 16l-3-9h4l3 6 3-6h4l3 6 3-6h4l-3 9H5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16h16v4H4z" />
    </svg>
  ),
  Star: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  Inbox: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4" />
    </svg>
  )
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
    if (post.stats && typeof post.stats.supportCount === 'number') {
      return post.stats.supportCount;
    }
    if (post.supportCount !== undefined && typeof post.supportCount === 'number') {
      return post.supportCount;
    }
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
      case 'event': return Icons.Calendar;
      case 'donation': return Icons.Gift;
      case 'support': return Icons.Heart;
      case 'prayer': return Icons.Heart;
      case 'announcement': return Icons.Speaker;
      case 'general': return Icons.Chat;
      default: return Icons.Document;
    }
  };

  const getPostTypeColor = (type) => {
    switch (type) {
      case 'event': return 'bg-blue-100 text-blue-700';
      case 'donation': return 'bg-rose-100 text-rose-700';
      case 'support': return 'bg-amber-100 text-amber-700';
      case 'prayer': return 'bg-purple-100 text-purple-700';
      case 'announcement': return 'bg-indigo-100 text-indigo-700';
      case 'general': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Icons.Crown />;
      case 1: return <Icons.Star />;
      case 2: return <Icons.Sparkles />;
      default: return null;
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0: return 'bg-amber-400 text-amber-900';
      case 1: return 'bg-gray-300 text-gray-700';
      case 2: return 'bg-amber-600 text-white';
      default: return 'bg-primary-100 text-primary-700';
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
      <div className="glass-card flex items-center justify-center gap-3 p-6 text-gray-500">
        <Icons.Spinner />
        <span>Loading trending posts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-200">
        <Icons.Exclamation />
        <span>{error}</span>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="glass-card p-6 text-gray-400 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
          <Icons.Inbox />
        </div>
        <p className="italic">No trending posts yet</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 pt-4 pb-2 border-b border-gray-200/80 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="text-orange-500">
            <Icons.Fire />
          </span>
          Trending in the Community
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          Updated weekly
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {posts.map((post, index) => {
          const supportCount = getSupportCount(post);
          const TypeIcon = getPostTypeIcon(post.type);
          const typeColor = getPostTypeColor(post.type);
          const avatarUrl = getImageUrl(post.author?.avatarUrl);
          const authorInitials = getAuthorInitials(post.author?.name);
          const rankIcon = getRankIcon(index);
          
          return (
            <div
              key={post.id}
              className="flex gap-4 p-4 hover:bg-gray-50/80 cursor-pointer transition-all duration-200 group"
              onClick={() => onPostClick && onPostClick(post.id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') onPostClick && onPostClick(post.id);
              }}
            >
              {/* Rank Number */}
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 group-hover:scale-110 ${getRankColor(index)}`}>
                  {index + 1}
                </div>
              </div>
              
              {/* Post Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
                  <span className={`p-1 rounded ${typeColor}`}>
                    <TypeIcon />
                  </span>
                  <span className={`capitalize px-2 py-0.5 rounded-full ${typeColor}`}>
                    {post.type}
                  </span>
                  {post.stats?.isUrgent && (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                      <Icons.Exclamation /> Urgent
                    </span>
                  )}
                </div>
                
                <h4 className="font-semibold text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                  {post.title}
                </h4>
                
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {truncateText(post.description, 100)}
                </p>
                
                {/* Author with Avatar and Badges */}
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
                    <div className="flex items-center flex-wrap gap-1">
                      <span className="text-gray-600 font-medium">
                        {post.author?.name || 'Anonymous'}
                      </span>
                      {post.author?.isSuperAdmin && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Super Admin
                        </span>
                      )}
                      {post.author?.isModerator && !post.author?.isSuperAdmin && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Moderator
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-orange-500">
                      <Icons.Fire />
                    </span>
                    <span>{supportCount} {supportCount === 1 ? 'fire' : 'fires'}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <Icons.Clock />
                    <span>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              {/* Trending Indicator for top 3 */}
              {rankIcon && (
                <div className="flex-shrink-0 self-center">
                  <div className={`transition-all duration-200 ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-yellow-500' : 'text-orange-400'} opacity-40 group-hover:opacity-100`}>
                    {rankIcon}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Footer with view all link */}
      {posts.length === limit && (
        <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 text-center">
          <button 
            onClick={() => window.location.href = '/community?sort=trending'}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium transition inline-flex items-center gap-1"
          >
            View all trending posts
            <Icons.ArrowRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default TrendingPosts;