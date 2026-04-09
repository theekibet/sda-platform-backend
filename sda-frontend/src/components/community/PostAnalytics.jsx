// src/components/community/PostAnalytics.jsx
import React, { useState, useEffect } from 'react';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (avatarUrl) => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${API_BASE_URL}${avatarUrl}`;
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const PostAnalytics = ({ postId, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [postId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/analytics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError('Failed to load analytics');
      }
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 min-w-[300px] max-w-[500px] max-h-[80vh] overflow-auto shadow-2xl">
        <div className="text-center py-10 text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-5 min-w-[300px] max-w-[500px] max-h-[80vh] overflow-auto shadow-2xl">
        <div className="text-center py-5 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 min-w-[300px] max-w-[500px] max-h-[80vh] overflow-auto shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-gray-800">📊 Post Analytics</h3>
        <button onClick={onClose} className="bg-none border-none text-xl cursor-pointer text-gray-400 hover:text-gray-600 transition">
          ✕
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="block text-2xl font-bold text-primary-500">{analytics?.views || 0}</div>
          <div className="text-xs text-gray-500">Views</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="block text-2xl font-bold text-primary-500">{analytics?.uniqueViews || 0}</div>
          <div className="text-xs text-gray-500">Unique Views</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="block text-2xl font-bold text-primary-500">{analytics?.avgViewTime || 0}s</div>
          <div className="text-xs text-gray-500">Avg. View Time</div>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Engagement</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-3xl">🙏</span>
            <div>
              <div className="text-xl font-bold text-gray-800">{analytics?.supportCount || 0}</div>
              <div className="text-xs text-gray-500">Support</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-3xl">💬</span>
            <div>
              <div className="text-xl font-bold text-gray-800">{analytics?.commentCount || 0}</div>
              <div className="text-xs text-gray-500">Comments</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-3xl">🔖</span>
            <div>
              <div className="text-xl font-bold text-gray-800">{analytics?.bookmarkCount || 0}</div>
              <div className="text-xs text-gray-500">Bookmarks</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-3xl">📤</span>
            <div>
              <div className="text-xl font-bold text-gray-800">{analytics?.shareCount || 0}</div>
              <div className="text-xs text-gray-500">Shares</div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Over Time Chart */}
      {analytics?.supportOverTime && analytics.supportOverTime.length > 0 && (
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Support Over Time</h4>
          <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg h-40">
            {analytics.supportOverTime.slice(-7).map((day, i) => {
              const maxCount = Math.max(...analytics.supportOverTime.map(d => d.count), 1);
              const heightPercent = (day.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                  <div className="w-full bg-primary-500 rounded transition-all duration-300" style={{ height: `${heightPercent}%`, minHeight: '4px' }} />
                  <div className="text-[9px] text-gray-500">{day.date.slice(5)}</div>
                  <div className="text-[10px] font-bold text-gray-700">{day.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Donation Stats */}
      {analytics?.donation && (
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Donation Campaign</h4>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${analytics.donation.percentage}%` }} />
            </div>
            <div className="flex justify-between text-xs mb-2 flex-wrap gap-2">
              <span className="font-semibold text-green-600">Raised: KSh {analytics.donation.currentAmount?.toLocaleString()}</span>
              <span className="text-gray-500">Goal: KSh {analytics.donation.goalAmount?.toLocaleString()}</span>
              <span className="text-gray-500">{analytics.donation.percentage}% Complete</span>
            </div>
            <div className="text-xs text-gray-500">👥 {analytics.donation.donorCount || 0} donors</div>
          </div>
        </div>
      )}

      {/* Top Supporters */}
      {analytics?.topSupporters && analytics.topSupporters.length > 0 && (
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Supporters 🙏</h4>
          <div className="space-y-2.5">
            {analytics.topSupporters.slice(0, 5).map((supporter, index) => {
              const avatarUrl = getImageUrl(supporter.userAvatar);
              const initials = getInitials(supporter.userName);
              
              return (
                <div key={supporter.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-primary-500 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-base font-bold overflow-hidden">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={supporter.userName || 'User'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerText = initials;
                          e.target.parentElement.classList.add('bg-primary-500', 'text-white');
                        }}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800">{supporter.userName}</div>
                    {supporter.comment && (
                      <div className="text-xs text-gray-500 italic mt-0.5">"{supporter.comment.substring(0, 50)}"</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(supporter.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Views Over Time Chart (fallback) */}
      {(!analytics?.supportOverTime || analytics.supportOverTime.length === 0) && analytics?.viewsOverTime && analytics.viewsOverTime.length > 0 && (
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Views Over Time</h4>
          <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg h-40">
            {analytics.viewsOverTime.slice(-7).map((day, i) => {
              const maxCount = Math.max(...analytics.viewsOverTime.map(d => d.count), 1);
              const heightPercent = (day.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                  <div className="w-full bg-primary-500 rounded transition-all duration-300" style={{ height: `${heightPercent}%`, minHeight: '4px' }} />
                  <div className="text-[9px] text-gray-500">{day.date.slice(5)}</div>
                  <div className="text-[10px] font-bold text-gray-700">{day.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Performance Metrics</h4>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500">Engagement Rate</span>
            <span className="text-sm font-bold text-gray-800">
              {analytics?.views ? ((analytics.supportCount / analytics.views) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500">Comments per Support</span>
            <span className="text-sm font-bold text-gray-800">
              {analytics?.supportCount ? (analytics.commentCount / analytics.supportCount).toFixed(1) : 0}
            </span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500">Avg Response Time</span>
            <span className="text-sm font-bold text-gray-800">
              {analytics?.avgResponseTime ? `${analytics.avgResponseTime}h` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostAnalytics;