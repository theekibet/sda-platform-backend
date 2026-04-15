// src/components/notifications/NotificationItem.jsx
import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

// Heroicons SVG Components
const Icons = {
  Chat: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Heart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  BookOpen: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Speaker: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  ThumbUp: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Building: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
};

const NotificationItem = ({ notification, onClose }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const [isDeleting, setIsDeleting] = useState(false);

  const getIcon = (type) => {
    const icons = {
      forum_reply: Icons.Chat,
      prayer_response: Icons.Heart,
      verse_published: Icons.BookOpen,
      group_invite: Icons.Users,
      announcement: Icons.Speaker,
      discussion_reply: Icons.Chat,
      discussion_upvote: Icons.ThumbUp,
      prayer_request: Icons.Heart,
      testimony: Icons.Sparkles,
      community_post: Icons.Building,
    };
    return icons[type] || Icons.Bell;
  };

  const getIconColor = (type) => {
    const colors = {
      forum_reply: 'text-blue-600 bg-blue-100',
      prayer_response: 'text-rose-600 bg-rose-100',
      verse_published: 'text-amber-600 bg-amber-100',
      group_invite: 'text-indigo-600 bg-indigo-100',
      announcement: 'text-purple-600 bg-purple-100',
      discussion_reply: 'text-blue-600 bg-blue-100',
      discussion_upvote: 'text-green-600 bg-green-100',
      prayer_request: 'text-rose-600 bg-rose-100',
      testimony: 'text-yellow-600 bg-yellow-100',
      community_post: 'text-primary-600 bg-primary-100',
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const getBgColor = (isRead) => {
    return isRead ? 'bg-white hover:bg-gray-50' : 'bg-primary-50/30 hover:bg-primary-50/50';
  };

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }
    
    onClose();
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    await deleteNotification(notification.id);
    setIsDeleting(false);
  };

  const IconComponent = getIcon(notification.type);
  const iconColorClass = getIconColor(notification.type);

  return (
    <div 
      className={`flex items-start gap-3 p-4 cursor-pointer transition-all duration-200 ${getBgColor(notification.isRead)} hover:scale-[1.01] active:scale-[0.99] overflow-hidden`}
      onClick={handleClick}
    >
      {/* Icon - fixed width to prevent layout shift */}
      <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${iconColorClass}`}>
        <IconComponent />
      </div>
      
      {/* Content - with proper text wrapping and no overflow */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-semibold break-words ${notification.isRead ? 'text-gray-700' : 'text-primary-700'}`}>
            {notification.title}
          </h4>
          <button 
            className="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete notification"
            title="Delete"
          >
            {isDeleting ? <Icons.Spinner /> : <Icons.X />}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-0.5 break-words whitespace-normal">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
          <span className={`inline-block w-2 h-2 rounded-full ${notification.isRead ? 'bg-gray-300' : 'bg-primary-400'}`}></span>
          <span className="flex items-center gap-1">
            <Icons.Clock />
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </p>
      </div>
    </div>
  );
};

export default NotificationItem;