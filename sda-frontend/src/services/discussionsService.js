// src/services/discussionsService.js
import api from './api';

export const discussionsService = {
  // ============ HOME FEED & DISCOVERY ============
  
  getHomeFeed: async (page = 1, limit = 20) => {
    const response = await api.get(`/discussions/feed?page=${page}&limit=${limit}`);
    return response.data;
  },

  getTrendingNow: async (limit = 10) => {
    const response = await api.get(`/discussions/trending/now?limit=${limit}`);
    return response.data;
  },

  getRecommended: async (limit = 5) => {
    const response = await api.get(`/discussions/recommended?limit=${limit}`);
    return response.data;
  },

  // ============ CRUD ============
  
  createDiscussion: async (data) => {
    const response = await api.post('/discussions', data);
    return response.data;
  },

  getDiscussions: async (filters = {}) => {
    const { groupId, tagId, authorId, page = 1, limit = 20, sort = 'new' } = filters;
    const params = new URLSearchParams();
    
    if (groupId) params.append('groupId', groupId);
    if (tagId) params.append('tagId', tagId);
    if (authorId) params.append('authorId', authorId);
    params.append('page', page);
    params.append('limit', limit);
    params.append('sort', sort);
    
    const response = await api.get(`/discussions?${params.toString()}`);
    return response.data;
  },

  getDiscussionById: async (id) => {
    try {
      const response = await api.get(`/discussions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching discussion ${id}:`, error.response?.status, error.response?.data);
      throw error;
    }
  },

  updateDiscussion: async (id, data) => {
    const response = await api.patch(`/discussions/${id}`, data);
    return response.data;
  },

  deleteDiscussion: async (id) => {
    const response = await api.delete(`/discussions/${id}`);
    return response.data;
  },

  // ============ VOTING ============
  
  voteDiscussion: async (id, value) => {
    try {
      console.log('Sending vote request:', { discussionId: id, value });
      const response = await api.post(`/discussions/${id}/vote`, { value });
      console.log('Vote response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Vote error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // ============ SEARCH ============
  
  searchDiscussions: async (query, page = 1, limit = 20) => {
    const response = await api.get(`/discussions/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  },

  // ============ COMMENTS ============
  
  getComments: async (discussionId, page = 1, limit = 20) => {
    const response = await api.get(`/discussions/${discussionId}/comments?page=${page}&limit=${limit}`);
    return response.data;
  },

  addComment: async (discussionId, content, parentId = null) => {
    const response = await api.post(`/discussions/${discussionId}/comments`, {
      content,
      discussionId,
      parentId,
    });
    return response.data;
  },

  addReply: async (discussionId, commentId, content) => {
    const response = await api.post(`/discussions/${discussionId}/comments/${commentId}/reply`, {
      content,
    });
    return response.data;
  },

  updateComment: async (commentId, content) => {
    const response = await api.patch(`/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  upvoteComment: async (commentId) => {
    const response = await api.post(`/discussions/comments/${commentId}/upvote`);
    return response.data;
  },

  // ============ GROUP DISCUSSIONS ============
  
  getGroupDiscussions: async (groupId, page = 1, limit = 20) => {
    const response = await api.get(`/groups/${groupId}/discussions?page=${page}&limit=${limit}`);
    return response.data;
  },

  // ============ BOOKMARKS ============
  
  toggleBookmark: async (discussionId) => {
    try {
      const response = await api.post(`/discussions/${discussionId}/bookmark`);
      return response.data;
    } catch (error) {
      console.error('Error toggling bookmark:', error.response?.data);
      throw error;
    }
  },

  getUserBookmarks: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(`/discussions/bookmarks?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bookmarks:', error.response?.status, error.response?.data);
      // Return empty result instead of throwing to prevent UI breakage
      return { discussions: [], total: 0, page: 1, totalPages: 0 };
    }
  },
};

export default discussionsService;