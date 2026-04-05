// src/services/tagsService.js
import api from './api';

export const tagsService = {
  // ============ TAG CRUD ============
  
  getAllTags: async () => {
    const response = await api.get('/tags');
    return response.data;
  },

  getTrendingTags: async (limit = 10) => {
    const response = await api.get(`/tags/trending?limit=${limit}`);
    return response.data;
  },

  getTagById: async (id) => {
    const response = await api.get(`/tags/${id}`);
    return response.data;
  },

  getTagByName: async (name) => {
    const response = await api.get(`/tags/by-name/${encodeURIComponent(name)}`);
    return response.data;
  },

  createTag: async (data) => {
    const response = await api.post('/tags', data);
    return response.data;
  },

  // ============ DISCUSSIONS BY TAG ============
  
  getDiscussionsByTag: async (tagId, page = 1, limit = 20) => {
    const response = await api.get(`/tags/${tagId}/discussions?page=${page}&limit=${limit}`);
    return response.data;
  },

  // ============ UTILITY ============
  
  // Find or create tags by names (batch)
  findOrCreateTags: async (tagNames) => {
    // This is handled by the backend when creating/updating groups/discussions
    // But if you need a dedicated endpoint:
    const response = await api.post('/tags/find-or-create', { names: tagNames });
    return response.data;
  },
};

export default tagsService;