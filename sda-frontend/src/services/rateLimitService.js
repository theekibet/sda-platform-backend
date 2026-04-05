// src/services/rateLimitService.js
import { API } from './api';

export const rateLimitService = {
  // Check if user can perform an action
  checkLimit: async (action) => {
    try {
      const response = await API.get(`/rate-limit/check/${action}`);
      return {
        allowed: response.data.allowed,
        remaining: response.data.remaining,
        resetTime: response.data.resetTime,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return {
        allowed: true,
        remaining: 999,
        resetTime: null,
        message: null,
      };
    }
  },

  // Get current rate limit status for user
  getStatus: async () => {
    try {
      const response = await API.get('/rate-limit/status');
      return response.data;
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return null;
    }
  },

  // Check before creating a post
  canCreatePost: async () => {
    return await rateLimitService.checkLimit('create_post');
  },

  // Check before adding a response
  canAddResponse: async () => {
    return await rateLimitService.checkLimit('add_response');
  },

  // Check before reporting
  canReport: async () => {
    return await rateLimitService.checkLimit('report_content');
  },

  // Get remaining posts for today
  getRemainingPosts: async () => {
    const status = await rateLimitService.getStatus();
    return status?.remaining?.create_post || 5;
  },

  // Format reset time for display
  formatResetTime: (resetTime) => {
    if (!resetTime) return null;
    const resetDate = new Date(resetTime);
    const now = new Date();
    const diffMs = resetDate - now;
    
    if (diffMs <= 0) return 'now';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}${diffMinutes > 0 ? ` and ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}` : ''}`;
    }
    
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  },
};

export default rateLimitService;