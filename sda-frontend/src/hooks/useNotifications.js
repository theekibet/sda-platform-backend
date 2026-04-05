// src/hooks/useNotifications.js
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications as useNotificationContext } from '../contexts/NotificationContext';
import { notificationService } from '../services/notificationService';

export const useNotifications = (options = {}) => {
  const { user } = useAuth();
  const {
    notifications: contextNotifications,
    unreadCount: contextUnreadCount,
    loading: contextLoading,
    preferences,
    fetchPreferences,
    updatePreferences,
    markAsRead: contextMarkAsRead,
    markAllAsRead: contextMarkAllAsRead,
    deleteNotification: contextDeleteNotification,
    archiveNotification: contextArchiveNotification,
    requestBrowserPermission: contextRequestPermission,
  } = useNotificationContext();

  const [localNotifications, setLocalNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    read: 'all', // 'all', 'read', 'unread'
    dateRange: { start: null, end: null },
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Use context notifications or local based on options
  const notifications = options.useContext ? contextNotifications : localNotifications;
  const unreadCount = options.useContext ? contextUnreadCount : 
    localNotifications.filter(n => !n.isRead).length;
  const loading = options.useContext ? contextLoading : false;

  // Fetch notifications from API (for local mode)
  const fetchNotifications = useCallback(async (params = {}) => {
    try {
      const response = await notificationService.getNotifications({
        page: pagination.page,
        limit: pagination.limit,
        type: filters.type !== 'all' ? filters.type : undefined,
        ...params,
      });
      
      setLocalNotifications(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: response.totalPages || 1,
      }));
      
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: error.message };
    }
  }, [pagination.page, pagination.limit, filters.type]);

  // Apply filters to notifications
  const applyFilters = useCallback(() => {
    let filtered = [...notifications];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    // Filter by read status
    if (filters.read === 'read') {
      filtered = filtered.filter(n => n.isRead === true);
    } else if (filters.read === 'unread') {
      filtered = filtered.filter(n => n.isRead === false);
    }

    // Filter by date range
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      filtered = filtered.filter(n => new Date(n.createdAt) >= startDate);
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      filtered = filtered.filter(n => new Date(n.createdAt) <= endDate);
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredNotifications(filtered);
  }, [notifications, filters]);

  // Update filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      read: 'all',
      dateRange: { start: null, end: null },
    });
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (options.useContext) {
      return await contextMarkAsRead(notificationId);
    } else {
      // Local mode
      try {
        await notificationService.markAsRead(notificationId);
        setLocalNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }, [options.useContext, contextMarkAsRead]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (options.useContext) {
      return await contextMarkAllAsRead();
    } else {
      // Local mode
      try {
        await notificationService.markAllAsRead();
        setLocalNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }, [options.useContext, contextMarkAllAsRead]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (options.useContext) {
      return await contextDeleteNotification(notificationId);
    } else {
      // Local mode
      try {
        await notificationService.deleteNotification(notificationId);
        setLocalNotifications(prev => prev.filter(n => n.id !== notificationId));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }, [options.useContext, contextDeleteNotification]);

  // Archive notification
  const archiveNotification = useCallback(async (notificationId) => {
    if (options.useContext) {
      return await contextArchiveNotification(notificationId);
    } else {
      // Local mode
      try {
        await notificationService.archiveNotification(notificationId);
        setLocalNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isArchived: true } : n
          )
        );
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }, [options.useContext, contextArchiveNotification]);

  // Get notification by ID
  const getNotification = useCallback((notificationId) => {
    return notifications.find(n => n.id === notificationId);
  }, [notifications]);

  // Get notifications grouped by date
  const getGroupedByDate = useCallback(() => {
    const grouped = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    (filteredNotifications.length ? filteredNotifications : notifications).forEach(n => {
      const date = new Date(n.createdAt);
      let group;

      if (date >= today) {
        group = 'Today';
      } else if (date >= yesterday) {
        group = 'Yesterday';
      } else if (date >= thisWeek) {
        group = 'This Week';
      } else if (date >= thisMonth) {
        group = 'This Month';
      } else {
        group = 'Older';
      }

      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(n);
    });

    return grouped;
  }, [notifications, filteredNotifications]);

  // Get notification type stats
  const getTypeStats = useCallback(() => {
    const stats = {};
    notifications.forEach(n => {
      if (!stats[n.type]) {
        stats[n.type] = { total: 0, unread: 0 };
      }
      stats[n.type].total++;
      if (!n.isRead) {
        stats[n.type].unread++;
      }
    });
    return stats;
  }, [notifications]);

  // Request browser permission
  const requestBrowserPermission = useCallback(() => {
    contextRequestPermission();
  }, [contextRequestPermission]);

  // Auto-fetch on mount (local mode only)
  useEffect(() => {
    if (!options.useContext && options.autoFetch !== false) {
      fetchNotifications();
    }
  }, [options.useContext, options.autoFetch, fetchNotifications]);

  // Apply filters when notifications or filters change
  useEffect(() => {
    applyFilters();
  }, [notifications, filters, applyFilters]);

  return {
    // State
    notifications: filteredNotifications.length ? filteredNotifications : notifications,
    allNotifications: notifications,
    unreadCount,
    loading,
    filters,
    pagination,
    preferences,
    
    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    updateFilter,
    clearFilters,
    setPage: (page) => setPagination(prev => ({ ...prev, page })),
    getNotification,
    getGroupedByDate,
    getTypeStats,
    updatePreferences,
    fetchPreferences,
    requestBrowserPermission,
    
    // Helpers
    hasMore: pagination.page < pagination.totalPages,
    total: pagination.total,
  };
};

export default useNotifications;