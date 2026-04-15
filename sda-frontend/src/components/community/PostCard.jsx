// src/components/community/PostCard.jsx
import React, { useState } from 'react';
import { renderLinks, getMeetingPlatform } from '../../utils/linkRenderer';
import { useAuth } from '../../contexts/AuthContext';
import { communityService } from '../../services/communityService';
import ReportButton from "../common/ReportButton";
import ShareMenu from './ShareMenu';
import PostBookmark from './PostBookmark';
import DonationProgressUpdater from './DonationProgressUpdater';
import PostEditModal from './PostEditModal';
import PostAnalytics from './PostAnalytics';
import Avatar from '../common/Avatar';

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

const PostCard = ({ post, currentUser, formatDistance, onPostDeleted, onPostUpdated }) => {
  const { user, isAdmin } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDonationUpdater, setShowDonationUpdater] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showResponseMenu, setShowResponseMenu] = useState(false);
  const [responseComment, setResponseComment] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Check permissions
  const canDelete = () => user && (user.id === post.authorId || isAdmin);
  const canEdit = () => user && (user.id === post.authorId || isAdmin);
  const canViewAnalytics = () => user && (user.id === post.authorId || isAdmin);
  const canUpdateDonation = () => user && (user.id === post.authorId || isAdmin);

  // Handle deletion
  const handleDelete = async () => {
    if (!canDelete()) return;
    setDeleting(true);
    try {
      const response = await communityService.deletePost(post.id);
      if (response.success) {
        if (onPostDeleted) onPostDeleted(post.id);
      } else {
        alert('Failed to delete post. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    if (onPostUpdated) onPostUpdated(updatedPost);
  };

  const handleDonationUpdate = (updatedPost) => {
    if (onPostUpdated) onPostUpdated(updatedPost);
    setShowDonationUpdater(false);
  };

  // Handle support response
  const handleSupport = async () => {
    if (!user) {
      alert('Please login to support posts');
      return;
    }

    setSubmittingResponse(true);
    try {
      const response = await communityService.addResponse(post.id, {
        response: 'support',
        comment: responseComment.trim() || undefined,
      });

      if (response.success) {
        const updatedPost = {
          ...post,
          stats: {
            ...post.stats,
            supportCount: (post.stats?.supportCount || 0) + (post.userHasSupported ? 0 : 1),
          },
          userHasSupported: !post.userHasSupported,
        };
        if (onPostUpdated) onPostUpdated(updatedPost);
        setResponseComment('');
        setShowResponseMenu(false);
      }
    } catch (error) {
      console.error('Error supporting post:', error);
      alert('Failed to add support. Please try again.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleRemoveSupport = async () => {
    if (!window.confirm('Are you sure you want to remove your support?')) return;

    setSubmittingResponse(true);
    try {
      const response = await communityService.removeResponse(post.id);
      if (response.success) {
        const updatedPost = {
          ...post,
          stats: {
            ...post.stats,
            supportCount: Math.max(0, (post.stats?.supportCount || 0) - 1),
          },
          userHasSupported: false,
        };
        if (onPostUpdated) onPostUpdated(updatedPost);
      }
    } catch (error) {
      console.error('Error removing support:', error);
      alert('Failed to remove support. Please try again.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const getLocationDisplay = () => {
    if (post.distance !== undefined && post.distance !== null) {
      if (formatDistance) return formatDistance(post.distance);
      if (post.distance < 1) return `${Math.round(post.distance * 1000)}m away`;
      return `${post.distance.toFixed(1)}km away`;
    }
    if (post.author?.locationName) {
      const city = post.author.locationName.split(',')[0].trim();
      return `📍 ${city}`;
    }
    if (post.location) return `📍 ${post.location}`;
    return null;
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

  const getTypeColorClass = (type) => {
    const classes = {
      event: 'bg-blue-100 text-blue-800',
      support: 'bg-yellow-100 text-yellow-800',
      donation: 'bg-pink-100 text-pink-800',
      announcement: 'bg-indigo-100 text-indigo-800',
      prayer: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return classes[type] || classes.general;
  };

  const getTypeIcon = (type) => {
    const icons = {
      event: '📅',
      support: '🙏',
      donation: '🎁',
      announcement: '📢',
      prayer: '🙏',
      general: '📌',
    };
    return icons[type] || '📝';
  };

  const normalizeUserForAvatar = (author) => {
    if (!author) return null;
    return {
      name: author.name || 'Unknown',
      avatarUrl: author.avatarUrl || null,
    };
  };

  const calculateProgress = () => {
    if (!post.goalAmount || post.goalAmount === 0) return 0;
    return Math.min(((post.currentAmount || 0) / post.goalAmount) * 100, 100);
  };

  const getPostStatus = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (post.status === 'expired' || post.status === 'archived') {
      return { label: 'Expired', className: 'bg-gray-200 text-gray-700', icon: '⏰' };
    }
    if (post.type === 'event' && post.eventDate) {
      const eventDate = new Date(post.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate < now) {
        return { label: 'Past Event', className: 'bg-gray-100 text-gray-500', icon: '📅' };
      }
      const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 3) {
        return { label: `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`, className: 'bg-orange-100 text-orange-800', icon: '🔥' };
      }
      if (daysUntil <= 7) {
        return { label: 'This week', className: 'bg-orange-100 text-orange-800', icon: '📅' };
      }
    }
    if (post.type === 'donation' && post.expiresAt && new Date(post.expiresAt) < now) {
      return { label: 'Campaign Ended', className: 'bg-gray-200 text-gray-700', icon: '🎁' };
    }
    if (post.stats?.isUrgent) {
      return { label: `Expires in ${post.stats.daysUntilExpiry} day${post.stats.daysUntilExpiry !== 1 ? 's' : ''}`, className: 'bg-red-100 text-red-800', icon: '⚠️' };
    }
    const daysOld = Math.ceil((now - new Date(post.createdAt)) / (1000 * 60 * 60 * 24));
    if (post.type === 'general' && daysOld > 25) {
      return { label: 'Expiring soon', className: 'bg-yellow-100 text-yellow-800', icon: '⚠️' };
    }
    return null;
  };

  const renderDescription = () => {
    if (!post.description) return null;
    const rendered = renderLinks(post.description);
    if (typeof rendered === 'string') return rendered;
    return rendered.map((part, idx) => {
      if (part.type === 'link') {
        const platform = getMeetingPlatform(part.url);
        return (
          <span key={idx} className="inline-flex items-center gap-1">
            {platform && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: platform.color }}
              >
                {platform.icon} {platform.label}
              </span>
            )}
            <a
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part.url}
            </a>
          </span>
        );
      }
      return <span key={idx}>{part.content}</span>;
    });
  };

  const locationDisplay = getLocationDisplay();
  const status = getPostStatus();
  const supportCount = post.stats?.supportCount || 0;
  const commentCount = post.stats?.commentCount || 0;
  const userHasSupported = post.userHasSupported || false;

  return (
    <div className={`glass-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${status?.label === 'Past Event' ? 'opacity-85' : ''}`}>
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <Avatar user={normalizeUserForAvatar(post.author)} size="medium" />
            <div>
              <div className="font-semibold text-gray-900">{post.author?.name || 'Anonymous'}</div>
              <div className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</div>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColorClass(post.type)}`}>
            {getTypeIcon(post.type)} {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {locationDisplay && (
            <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {locationDisplay}
            </div>
          )}

          {status && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
              <span>{status.icon}</span> {status.label}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 pt-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">{post.title}</h3>
        <div className="text-gray-600 text-sm leading-relaxed mb-3 break-words whitespace-pre-wrap">
          {renderDescription()}
        </div>

        {/* Type-specific details */}
        <div className="space-y-2 mt-2 pt-2 border-t border-gray-100">
          {post.type === 'event' && post.eventDate && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-500">Date:</span>
                <span className="text-gray-700">
                  {new Date(post.eventDate).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                  })}
                  {post.eventDate.includes('T') && (
                    <span className="ml-1 text-gray-500">
                      at {new Date(post.eventDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </span>
              </div>
              {post.location && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="text-gray-500">Venue:</span>
                  <span className="text-gray-700">{post.location}</span>
                </div>
              )}
            </>
          )}

          {(post.type === 'donation' || post.type === 'support') && post.goalAmount && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-green-600">KSh {(post.currentAmount || 0).toLocaleString()}</span>
                <span className="text-gray-400">of KSh {post.goalAmount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${calculateProgress()}%` }} />
              </div>
              {post.stats?.donationProgress && (
                <div className="text-xs text-gray-500 mt-1">
                  {post.stats.donationProgress.percentage}% complete
                </div>
              )}
              {canUpdateDonation() && post.type === 'donation' && (
                <button
                  onClick={() => setShowDonationUpdater(true)}
                  className="mt-2 text-xs bg-primary-600 text-white px-3 py-1 rounded-full hover:bg-primary-700 transition"
                >
                  + Add Donation
                </button>
              )}
            </div>
          )}

          {post.type === 'support' && post.itemsNeeded && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-gray-500">Needs:</span>
              <span className="text-gray-700">{post.itemsNeeded}</span>
            </div>
          )}

          {post.type === 'prayer' && (
            <div className="flex items-center gap-2 text-sm bg-purple-50 p-2 rounded-lg">
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-gray-600">Prayer request from the Prayer Wall</span>
            </div>
          )}
        </div>

        {(post.contactPhone || post.contactEmail) && (
          <div className="flex flex-wrap gap-3 mt-3 pt-2 border-t border-gray-100 text-sm">
            {post.contactPhone && (
              <div className="flex items-center gap-1 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${post.contactPhone}`} className="text-primary-600 hover:underline">{post.contactPhone}</a>
              </div>
            )}
            {post.contactEmail && (
              <div className="flex items-center gap-1 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${post.contactEmail}`} className="text-primary-600 hover:underline">{post.contactEmail}</a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50/80 rounded-b-xl border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
        {/* Support Count Display */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {supportCount > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {supportCount} {supportCount === 1 ? 'support' : 'supports'}
            </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </div>
          )}
          {!supportCount && !commentCount && (
            <div className="text-gray-400 text-xs">Be the first to support 🙏</div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Support Button */}
          {!userHasSupported ? (
            <div className="relative">
              <button
                onClick={() => setShowResponseMenu(!showResponseMenu)}
                disabled={submittingResponse}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-all text-sm font-medium disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Support
              </button>
              {showResponseMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-64 z-10">
                  <textarea
                    value={responseComment}
                    onChange={(e) => setResponseComment(e.target.value)}
                    placeholder="Add a message of support (optional)..."
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows="3"
                    maxLength="500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSupport}
                      disabled={submittingResponse}
                      className="flex-1 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition"
                    >
                      {submittingResponse ? '...' : 'Support 🙏'}
                    </button>
                    <button
                      onClick={() => setShowResponseMenu(false)}
                      className="py-1.5 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleRemoveSupport}
              disabled={submittingResponse}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-all text-sm font-medium disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Supported
            </button>
          )}

          <PostBookmark postId={post.id} />
          
          <button
            onClick={() => setShowShareMenu(true)}
            className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition"
            title="Share"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          
          <ReportButton
            contentType="communityPost"
            contentId={post.id}
            authorId={post.authorId}
            size="small"
            variant="icon"
          />
          
          {/* Analytics Button - Only for post owners and admins */}
          {canViewAnalytics() && (
            <button
              onClick={() => setShowAnalytics(true)}
              className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition"
              title="View Analytics"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          )}
          
          {canEdit() && (
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition"
              title="Edit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          {canDelete() && (
            <div className="relative">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition"
                  title="Delete post"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              ) : (
                <div className="absolute right-0 bottom-full mb-2 flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1 text-xs shadow-md z-10 whitespace-nowrap">
                  <span className="text-yellow-800">Delete?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                  >
                    {deleting ? '...' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-0.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showShareMenu && <ShareMenu post={post} onClose={() => setShowShareMenu(false)} />}
      {showEditModal && (
        <PostEditModal
          post={post}
          onClose={() => setShowEditModal(false)}
          onUpdate={handlePostUpdate}
        />
      )}
      {showDonationUpdater && (
        <DonationProgressUpdater
          post={post}
          onClose={() => setShowDonationUpdater(false)}
          onUpdate={handleDonationUpdate}
        />
      )}
      
      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAnalytics(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <PostAnalytics 
              postId={post.id} 
              onClose={() => setShowAnalytics(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;