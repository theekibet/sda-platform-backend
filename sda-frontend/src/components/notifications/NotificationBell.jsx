// src/components/notifications/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, requestBrowserPermission } = useNotifications();
  const bellRef = useRef(null);

  useEffect(() => {
    requestBrowserPermission();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={bellRef}>
      <button
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-50">
          <NotificationDropdown onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;