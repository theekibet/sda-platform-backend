// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    community: true,
    prayer: true,
    groups: true,
    announcements: true,
    mentions: true,
  });
  const [wsConnected, setWsConnected] = useState(false);

  // Fetch initial notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [user]);

  // Setup WebSocket connection
  useEffect(() => {
    if (user && token) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Connect to WebSocket
      const socketInstance = io(`${API_URL}/notifications`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('Connected to notification server');
        setWsConnected(true);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setWsConnected(false);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from notification server');
        setWsConnected(false);
      });

      socketInstance.on('NEW_NOTIFICATION', (notification) => {
        console.log('New notification:', notification);
        
        // Check if user wants this type of notification
        const notificationType = notification.data?.type;
        if (shouldShowNotification(notificationType)) {
          // Add to notifications list
          setNotifications(prev => [notification.data, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if supported
          showBrowserNotification(notification.data);
        }
      });

      socketInstance.on('notificationUpdated', ({ id }) => {
        // Update notification in list
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      });

      setSocket(socketInstance);

      return () => {
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    }
  }, [user, token]);

  const shouldShowNotification = (type) => {
    if (!type) return true;
    
    switch (type) {
      case 'new_community_post':
      case 'community_response':
      case 'post_mentioned':
        return preferences.community;
      case 'prayer_response':
      case 'prayer_answered':
        return preferences.prayer;
      case 'group_invite':
      case 'group_message':
        return preferences.groups;
      case 'announcement':
        return preferences.announcements;
      case 'mention':
        return preferences.mentions;
      default:
        return true;
    }
  };

  const fetchNotifications = async (page = 1, type = null) => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications({ page, type });
      if (response && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.unreadCount || 0);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await notificationService.getPreferences();
      if (response && response.data) {
        setPreferences(response.data);
      } else {
        // Keep default preferences
        console.log('Using default notification preferences');
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Keep default preferences on error
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await notificationService.updatePreferences(newPreferences);
      if (response && response.data) {
        setPreferences(prev => ({ ...prev, ...response.data }));
      } else {
        setPreferences(prev => ({ ...prev, ...newPreferences }));
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { success: false, error: error.message };
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const deleted = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      await notificationService.archiveNotification(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isArchived: true } : n
        )
      );
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const showBrowserNotification = (notification) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        tag: notification.id,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  const requestBrowserPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Clear all notifications (for logout)
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    preferences,
    wsConnected,
    fetchNotifications,
    fetchPreferences,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    requestBrowserPermission,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};