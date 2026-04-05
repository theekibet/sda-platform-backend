// src/services/searchService.js
import api from './api';

export const searchService = {
  // ============ GLOBAL SEARCH ============
  
  search: async (query, type = 'all', page = 1, limit = 20) => {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('type', type);
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await api.get(`/search?${params.toString()}`);
    return response.data;
  },

  searchAuthenticated: async (query, type = 'all', page = 1, limit = 20) => {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('type', type);
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await api.get(`/search/authenticated?${params.toString()}`);
    return response.data;
  },

  // ============ RECENT & TRENDING ============
  
  getRecentSearches: async (limit = 10) => {
    const response = await api.get(`/search/recent?limit=${limit}`);
    return response.data;
  },

  getTrendingSearches: async (limit = 10) => {
    const response = await api.get(`/search/trending?limit=${limit}`);
    return response.data;
  },

  // ============ TYPE-SPECIFIC HELPERS ============
  
  searchDiscussions: async (query, page = 1, limit = 20) => {
    return searchService.search(query, 'discussions', page, limit);
  },

  searchGroups: async (query, page = 1, limit = 20) => {
    return searchService.search(query, 'groups', page, limit);
  },

  searchMessages: async (query, page = 1, limit = 20) => {
    return searchService.search(query, 'messages', page, limit);
  },

  searchTags: async (query, page = 1, limit = 20) => {
    return searchService.search(query, 'tags', page, limit);
  },
};

export default searchService;