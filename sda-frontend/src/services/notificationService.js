// src/services/notificationService.js
import { API } from './api';  // Use named import, not default

export const notificationService = {
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);
    if (params.type) queryParams.append('type', params.type);
    
    const response = await API.get(`/notifications?${queryParams}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await API.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await API.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await API.post('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await API.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  archiveNotification: async (notificationId) => {
    const response = await API.patch(`/notifications/${notificationId}/archive`);
    return response.data;
  },

  // ============ NOTIFICATION PREFERENCES ============
  
  // Get user notification preferences
  getPreferences: async () => {
    try {
      const response = await API.get('/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Return default preferences if endpoint doesn't exist
      return {
        data: {
          community: true,
          prayer: true,
          groups: true,
          announcements: true,
          mentions: true,
        }
      };
    }
  },

  // Update user notification preferences
  updatePreferences: async (preferences) => {
    const response = await API.put('/notifications/preferences', preferences);
    return response.data;
  },

  // ============ COMMUNITY POST NOTIFICATIONS ============
  
  // Subscribe to community post updates
  subscribeToCommunity: async (postId) => {
    const response = await API.post(`/notifications/subscribe/community/${postId}`);
    return response.data;
  },

  // Unsubscribe from community post updates
  unsubscribeFromCommunity: async (postId) => {
    const response = await API.delete(`/notifications/subscribe/community/${postId}`);
    return response.data;
  },

  // Get notification settings for a specific post
  getPostNotificationSettings: async (postId) => {
    const response = await API.get(`/notifications/community/${postId}/settings`);
    return response.data;
  },

  // ============ PUSH NOTIFICATIONS ============
  
  // Register device for push notifications
  registerDevice: async (deviceToken, deviceType) => {
    const response = await API.post('/notifications/register-device', {
      deviceToken,
      deviceType,
    });
    return response.data;
  },

  // Unregister device
  unregisterDevice: async (deviceToken) => {
    const response = await API.delete(`/notifications/unregister-device/${deviceToken}`);
    return response.data;
  },

  // ============ NOTIFICATION STATS ============
  
  // Get notification statistics
  getNotificationStats: async () => {
    const response = await API.get('/notifications/stats');
    return response.data;
  },

  // Get notification history
  getNotificationHistory: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await API.get(`/notifications/history?${queryParams}`);
    return response.data;
  },
};