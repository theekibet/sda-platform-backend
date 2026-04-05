// src/services/communityService.js
import { API } from './api';

export const communityService = {
  // Get all posts with optional filters
  getPosts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);
    if (filters.local) params.append('local', filters.local);
    if (filters.radius) params.append('radius', filters.radius);
    
    const response = await API.get(`/community/posts?${params}`);
    // Return the nested data structure directly for easier access
    return {
      success: response.data.success,
      data: response.data.data?.posts || [],
      pagination: response.data.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
  },

  // Get local posts within radius
  getLocalPosts: async (radius = 10, limit = 10) => {
    const params = new URLSearchParams();
    params.append('radius', radius);
    params.append('limit', limit);
    const response = await API.get(`/community/posts/local?${params}`);
    return {
      success: response.data.success,
      data: response.data.data || [],
    };
  },

  // Get a single post
  getPost: async (postId) => {
    const response = await API.get(`/community/posts/${postId}`);
    return {
      success: response.data.success,
      data: response.data.data,
    };
  },

  // Create a new post
  createPost: async (postData) => {
    const response = await API.post('/community/posts', postData);
    return {
      success: response.data.success,
      data: response.data.data,
    };
  },

  // Update a post
  updatePost: async (postId, postData) => {
    const response = await API.put(`/community/posts/${postId}`, postData);
    return {
      success: response.data.success,
      data: response.data.data,
    };
  },

  // Delete a post
  deletePost: async (postId) => {
    const response = await API.delete(`/community/posts/${postId}`);
    return {
      success: response.data.success,
      message: response.data.message,
    };
  },

  // Add response to a post
  addResponse: async (postId, responseData) => {
    const response = await API.post(`/community/posts/${postId}/responses`, responseData);
    return {
      success: response.data.success,
      data: response.data.data,
    };
  },

  // Remove response from a post
  removeResponse: async (postId) => {
    const response = await API.delete(`/community/posts/${postId}/responses`);
    return {
      success: response.data.success,
      message: response.data.message,
    };
  },

  // Get posts by user
  getUserPosts: async (userId, page = 1) => {
    const response = await API.get(`/community/users/${userId}/posts?page=${page}`);
    return {
      success: response.data.success,
      data: response.data.data?.posts || [],
      pagination: response.data.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  // ============ NEW METHODS ============

  // Update donation progress
  updateDonationProgress: async (postId, amount) => {
    const response = await API.patch(`/community/posts/${postId}/donation`, { amount });
    return {
      success: response.data.success,
      data: response.data.data,
    };
  },

  // Get trending posts
  getTrendingPosts: async (timeframe = 'week', limit = 10) => {
    const response = await API.get(`/community/posts/trending?timeframe=${timeframe}&limit=${limit}`);
    return {
      success: response.data.success,
      data: response.data.data || [],
    };
  },

  // Get post analytics
  getPostAnalytics: async (postId) => {
    const response = await API.get(`/community/posts/${postId}/analytics`);
    return {
      success: response.data.success,
      data: response.data.data,
    };
  },

  // ============ BOOKMARK METHODS ============

  // Check bookmark status
  getBookmarkStatus: async (postId) => {
    const response = await API.get(`/community/posts/${postId}/bookmark-status`);
    return {
      success: response.data.success,
      data: response.data.data,
    };
  },

  // Add bookmark
  addBookmark: async (postId) => {
    const response = await API.post(`/community/posts/${postId}/bookmark`);
    return {
      success: response.data.success,
      data: response.data.data,
    };
  },

  // Remove bookmark
  removeBookmark: async (postId) => {
    const response = await API.delete(`/community/posts/${postId}/bookmark`);
    return {
      success: response.data.success,
      message: response.data.message,
    };
  },

  // Get all user bookmarks
  getBookmarks: async () => {
    const response = await API.get('/community/bookmarks');
    return {
      success: response.data.success,
      data: response.data.data || [],
    };
  },

  // ============ REPORT METHODS ============

  // Report a community post
  reportPost: async (postId, data) => {
    const response = await API.post(`/community/reports/${postId}`, data);
    return {
      success: response.data.success,
      data: response.data.data,
    };
  },
};

export default communityService;