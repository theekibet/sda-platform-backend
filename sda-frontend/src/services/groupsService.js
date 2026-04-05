// src/services/groupsService.js
import { API } from './api';

export const groupsService = {
  // ============ GROUP CRUD ============
  getGroups: async (params = {}) => {
    const queryParams = new URLSearchParams();
    // UPDATED: Replace 'category' with 'tags' (tagNames array joined by commas)
    if (params.tagNames && params.tagNames.length) {
      queryParams.append('tags', params.tagNames.join(','));
    }
    if (params.location) queryParams.append('location', params.location);
    if (params.search) queryParams.append('search', params.search);
    if (params.meetingType) queryParams.append('meetingType', params.meetingType);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const response = await API.get(`/groups?${queryParams}`);
    return response.data;
  },

  getMyGroups: async (page = 1) => {
    const response = await API.get(`/groups/my-groups?page=${page}`);
    return response.data;
  },

  getGroupById: async (groupId) => {
    const response = await API.get(`/groups/${groupId}`);
    return response.data;
  },

  createGroup: async (data) => {
    const response = await API.post('/groups', data);
    return response.data;
  },

  updateGroup: async (groupId, data) => {
    const response = await API.put(`/groups/${groupId}`, data);
    return response.data;
  },

  deleteGroup: async (groupId) => {
    const response = await API.delete(`/groups/${groupId}`);
    return response.data;
  },

  // ============ GROUP MEMBERSHIP ============
  joinGroup: async (groupId, message = '') => {
    const response = await API.post(`/groups/${groupId}/join`, { message });
    return response.data;
  },

  leaveGroup: async (groupId) => {
    const response = await API.post(`/groups/${groupId}/leave`);
    return response.data;
  },

  approveMember: async (groupId, memberId) => {
    const response = await API.post(`/groups/${groupId}/approve/${memberId}`);
    return response.data;
  },

  rejectMember: async (groupId, memberId) => {
    const response = await API.post(`/groups/${groupId}/reject/${memberId}`);
    return response.data;
  },

  // ============ DISCOVERY ============

  getMyGroupsWithStats: async () => {
    const response = await API.get('/groups/discover/my-groups');
    return response.data;
  },

  getDiscoverGroups: async () => {
    const response = await API.get('/groups/discover/suggestions');
    return response.data;
  },
};