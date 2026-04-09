// src/components/notifications/NotificationDropdown.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, loading, fetchNotifications, markAllAsRead, unreadCount } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  const handleOpenSettings = () => {
    navigate('/settings/notifications');
    onClose();
  };

  return (
    <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up-fade">
      
      {/* Header with Settings Icon */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800 font-display text-base">
            Notifications
          </h3>
          {/* Settings Icon Button */}
          <button
            onClick={handleOpenSettings}
            className="p-1 text-gray-400 hover:text-primary-600 transition-colors duration-200 rounded-full hover:bg-white/50"
            title="Notification Settings"
            aria-label="Notification Settings"
          >
            <span className="text-sm">⚙️</span>
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <span className="text-5xl">📭</span>
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-gray-400">When you get notifications, they'll appear here</p>
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
              <div className="p-3 bg-gray-50">
                <button
                  onClick={handleViewAll}
                  className="w-full py-2.5 text-sm font-semibold text-primary-600 bg-white hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-secondary-500 rounded-xl transition-all duration-300 border border-primary-200 hover:border-transparent shadow-sm hover:shadow-md"
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