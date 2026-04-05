// src/components/notifications/NotificationDropdown.jsx
import React, { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ onClose }) => {
  const { notifications, loading, fetchNotifications, markAllAsRead, unreadCount } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleViewAll = () => {
    window.location.href = '/notifications';
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/90 backdrop-blur-md border border-white/20 shadow-soft-xl rounded-2xl z-50 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 font-display text-base">
          Notifications
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-200"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <span className="text-4xl">📭</span>
            <p className="text-sm font-medium">No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.slice(0, 5).map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}

            {notifications.length > 5 && (
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  onClick={handleViewAll}
                  className="w-full py-2 text-sm font-semibold text-primary-600 hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-secondary-500 rounded-xl transition-all duration-300 border border-primary-200 hover:border-transparent hover:shadow-md"
                >
                  View all {notifications.length} notifications
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;