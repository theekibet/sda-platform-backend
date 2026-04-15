// src/components/notifications/NotificationDropdown.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';

// Heroicons SVG Components
const Icons = {
  Cog: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  Inbox: () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4" />
    </svg>
  ),
  CheckAll: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 13l4 4L19 7" />
    </svg>
  )
};

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
    <div className="w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
      
      {/* Header with Settings Icon */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800 text-base">
            Notifications
          </h3>
          {/* Settings Icon Button */}
          <button
            onClick={handleOpenSettings}
            className="p-1.5 text-gray-400 hover:text-primary-600 transition-all duration-200 rounded-full hover:bg-white/80 hover:shadow-sm"
            title="Notification Settings"
            aria-label="Notification Settings"
          >
            <Icons.Cog />
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200 px-2 py-1 rounded-full hover:bg-primary-50"
          >
            <Icons.CheckAll />
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icons.Spinner />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <div className="p-4 rounded-full bg-gray-50">
              <Icons.Inbox />
            </div>
            <p className="text-sm font-medium text-gray-600">No notifications yet</p>
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
              <div className="p-3 bg-gray-50/80">
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