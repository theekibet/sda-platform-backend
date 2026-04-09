// src/components/notifications/NotificationItem.jsx
import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification, onClose }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const [isDeleting, setIsDeleting] = useState(false);

  const getIcon = (type) => {
    const icons = {
      forum_reply: '💬',
      prayer_response: '🙏',
      verse_published: '📖',
      group_invite: '👥',
      announcement: '📢',
      discussion_reply: '💬',
      discussion_upvote: '👍',
      prayer_request: '🙏',
      testimony: '✨',
      community_post: '📢',
    };
    return icons[type] || '🔔';
  };

  const getBgColor = (isRead) => {
    return isRead ? 'bg-white hover:bg-gray-50' : 'bg-primary-50/30 hover:bg-primary-50/50';
  };

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification data
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

  return (
    <div 
      className={`flex items-start gap-3 p-4 cursor-pointer transition-all duration-200 ${getBgColor(notification.isRead)} hover:scale-[1.01] active:scale-[0.99]`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full text-xl">
        {getIcon(notification.type)}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-semibold ${notification.isRead ? 'text-gray-700' : 'text-primary-700'}`}>
            {notification.title}
          </h4>
          <button 
            className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors duration-200 text-xs font-bold"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete"
          >
            {isDeleting ? '⋯' : '✕'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300"></span>
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

export default NotificationItem;