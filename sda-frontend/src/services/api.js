// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Request interceptor - add token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/admin/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ENDPOINTS ============
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

// ============ PROFILE ENDPOINTS ============
export const getProfile = () => API.get('/members/profile/me');
export const updateProfile = (data) => API.patch('/members/profile/me', data);
export const changePassword = (currentPassword, newPassword) => 
  API.post('/members/profile/change-password', { currentPassword, newPassword });

// ============ USERNAME ENDPOINTS ============
export const getUsernameStatus = () => API.get('/members/profile/username/status');
export const updateUsername = (username) => API.put('/members/profile/username', { username });

// ============ PROFILE PICTURE ENDPOINTS ============
export const uploadProfilePicture = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/members/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const removeProfilePicture = () => API.delete('/members/profile/picture');

// ============ LOCATION ENDPOINTS ============
export const updateLocation = (data) => API.post('/location/update', data);
export const getLocationStats = () => API.get('/location/stats');
export const getPrivacyOptions = () => API.get('/location/privacy-options'); // DEPRECATED

// ============ PRAYER ENDPOINTS ============
export const getPrayerRequests = (city, page = 1) => {
  const params = new URLSearchParams();
  if (city) params.append('city', city);
  params.append('page', page);
  return API.get(`/prayer/requests?${params.toString()}`);
};
export const getTrendingPrayers = () => API.get('/prayer/requests/trending');
export const getPrayerRequest = (id) => API.get(`/prayer/requests/${id}`);
export const createPrayerRequest = (data) => API.post('/prayer/requests', data);
export const prayForRequest = (id) => API.post(`/prayer/requests/${id}/pray`);
export const getMyPrayerRequests = () => API.get('/prayer/requests/my');
export const updatePrayerRequest = (id, data) => API.put(`/prayer/requests/${id}`, data);
export const deletePrayerRequest = (id) => API.delete(`/prayer/requests/${id}`);

// ============ TESTIMONY ENDPOINTS ============
export const getTestimonies = (page = 1) => API.get(`/prayer/testimonies?page=${page}`);
export const createTestimony = (data) => API.post('/prayer/testimonies', data);
export const encourageTestimony = (id) => API.post(`/prayer/testimonies/${id}/encourage`);
export const getMyTestimonies = () => API.get('/prayer/testimonies/my');
export const updateTestimony = (id, data) => API.put(`/prayer/testimonies/${id}`, data);
export const deleteTestimony = (id) => API.delete(`/prayer/testimonies/${id}`);

// ============ GROUPS ENDPOINTS ============
export const getGroups = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append('category', params.category);
  if (params.location) queryParams.append('location', params.location);
  if (params.search) queryParams.append('search', params.search);
  if (params.meetingType) queryParams.append('meetingType', params.meetingType);
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/groups?${queryParams.toString()}`);
};
export const getMyGroups = (page = 1) => API.get(`/groups/my-groups?page=${page}`);
export const getGroupById = (groupId) => API.get(`/groups/${groupId}`);
export const createGroup = (data) => API.post('/groups', data);
export const updateGroup = (groupId, data) => API.put(`/groups/${groupId}`, data);
export const deleteGroup = (groupId) => API.delete(`/groups/${groupId}`);
export const joinGroup = (groupId, message = '') => API.post(`/groups/${groupId}/join`, { message });
export const leaveGroup = (groupId) => API.post(`/groups/${groupId}/leave`);
export const approveMember = (groupId, memberId) => API.post(`/groups/${groupId}/approve/${memberId}`);
export const rejectMember = (groupId, memberId) => API.post(`/groups/${groupId}/reject/${memberId}`);

// ============ REPORTS ENDPOINTS ============
export const createReport = (data) => API.post('/reports', data);
export const getMyReports = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.contentType) queryParams.append('contentType', params.contentType);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/reports/my-reports?${queryParams.toString()}`);
};
export const getReportById = (reportId) => API.get(`/reports/my-reports/${reportId}`);

// ============ ADMIN DASHBOARD ============
export const getDashboardStats = () => API.get('/admin/dashboard');

// ============ ADMIN USER MANAGEMENT ============
export const getUsers = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.isModerator !== undefined) queryParams.append('isModerator', params.isModerator);
  if (params.isSuspended !== undefined) queryParams.append('isSuspended', params.isSuspended);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  const url = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return API.get(url);
};
export const getUserDetails = (userId) => API.get(`/admin/users/${userId}`);
export const suspendUser = (userId, data) => API.post(`/admin/users/${userId}/suspend`, data);
export const toggleModerator = (userId) => API.post(`/admin/users/${userId}/toggle-moderator`);
export const adminResetPassword = (data) => API.post('/admin/users/reset-password', data);
export const deleteUser = (userId) => API.delete(`/admin/users/${userId}`);
export const bulkUserAction = (action, userIds, data) => 
  API.post('/admin/users/bulk', { action, userIds, data });

// ============ ADMIN REPORTS MANAGEMENT ============
export const getReports = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.priority) queryParams.append('priority', params.priority);
  if (params.contentType) queryParams.append('contentType', params.contentType);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/admin/reports?${queryParams.toString()}`);
};
export const getReportStats = () => API.get('/admin/reports/stats');
export const getAdminReportById = (reportId) => API.get(`/admin/reports/${reportId}`);
export const resolveReport = (reportId, data) => 
  API.post(`/admin/reports/${reportId}/resolve`, data);
export const assignReport = (reportId, assigneeId) => 
  API.post(`/admin/reports/${reportId}/assign`, { assigneeId });

// ============ ADMIN MODERATION ============
export const getContentModerationQueue = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.append('type', params.type);
  if (params.status) queryParams.append('status', params.status);
  if (params.severity) queryParams.append('severity', params.severity);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  return API.get(`/admin/moderation/queue?${queryParams.toString()}`);
};
export const getContentForReview = (contentType, contentId) => 
  API.get(`/admin/moderation/content/${contentType}/${contentId}`);
export const moderateContent = (contentId, data) => 
  API.post(`/admin/moderation/content/${contentId}`, data);
export const getModerationLogs = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.moderatorId) queryParams.append('moderatorId', params.moderatorId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/admin/moderation/logs?${queryParams.toString()}`);
};

// ============ ADMIN ANALYTICS ============
export const getUserGrowth = (startDate, endDate, period = 'daily') => {
  const params = new URLSearchParams();
  params.append('startDate', startDate);
  params.append('endDate', endDate);
  params.append('period', period);
  return API.get(`/admin/analytics/user-growth?${params.toString()}`);
};
export const getDemographics = () => API.get('/admin/analytics/demographics');
export const getContentAnalytics = (startDate, endDate) => {
  const params = new URLSearchParams();
  params.append('startDate', startDate);
  params.append('endDate', endDate);
  return API.get(`/admin/analytics/content?${params.toString()}`);
};
export const getEngagementMetrics = (days = 30) => 
  API.get(`/admin/analytics/engagement?days=${days}`);

// ============ ADMIN ANNOUNCEMENTS ============
// Create a new announcement (Super Admin only)
export const createAnnouncement = (data) => API.post('/admin/announcements', data);

// Get all announcements with pagination and filters (Super Admin only)
// ✅ FIXED: Added config parameter for abort signal support
export const getAnnouncements = (params = {}, config = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.active) queryParams.append('active', params.active);
  if (params.type) queryParams.append('type', params.type);
  if (params.search) queryParams.append('search', params.search);
  const url = `/admin/announcements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return API.get(url, config);
};

// Get active announcements for members/moderators (public endpoint)
// ✅ FIXED: Added config parameter for abort signal support
export const getActiveAnnouncements = (config = {}) => API.get('/announcements/active', config);

// Get single announcement by ID
export const getAnnouncementById = (id) => API.get(`/admin/announcements/${id}`);

// Update announcement (Super Admin only)
export const updateAnnouncement = (id, data) => API.put(`/admin/announcements/${id}`, data);

// Delete announcement (Super Admin only)
export const deleteAnnouncement = (id) => API.delete(`/admin/announcements/${id}`);

// Mark announcement as viewed by current user (members/moderators)
export const markAnnouncementAsViewed = (id) => API.post(`/announcements/${id}/view`);

// Get announcement view statistics (Super Admin only)
export const getAnnouncementViews = (id) => API.get(`/admin/announcements/${id}/views`);

// Bulk delete announcements (Super Admin only)
export const bulkDeleteAnnouncements = (ids) => API.post('/admin/announcements/bulk-delete', { ids });

// Bulk update announcement status (Super Admin only)
export const bulkUpdateAnnouncementStatus = (ids, isActive) => 
  API.post('/admin/announcements/bulk-update', { ids, isActive });

// ============ ADMIN SETTINGS ============
export const getSystemSettings = () => API.get('/admin/settings');
export const updateSystemSettings = (settings) => API.put('/admin/settings', settings);
export const getFeatureFlags = () => API.get('/admin/features');
export const updateFeatureFlag = (flag, enabled) => 
  API.patch(`/admin/features/${flag}`, { enabled });
export const getEmailTemplates = () => API.get('/admin/email-templates');
export const updateEmailTemplate = (name, content) => 
  API.put(`/admin/email-templates/${name}`, content);
export const sendTestEmail = (template, testEmail) => 
  API.post('/admin/email-templates/test', { template, testEmail });

// ============ ADMIN SECURITY ============
export const getBlockedIPs = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/admin/security/blocked-ips?${queryParams.toString()}`);
};
export const blockIP = (ipAddress, data) => API.post('/admin/security/block-ip', { ipAddress, ...data });
export const unblockIP = (ipAddress) => API.delete(`/admin/security/block-ip/${ipAddress}`);
export const getActiveSessions = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/admin/security/sessions?${queryParams.toString()}`);
};
export const terminateSession = (sessionId) => API.delete(`/admin/security/sessions/${sessionId}`);
export const terminateAllUserSessions = (userId) => 
  API.delete(`/admin/security/sessions/user/${userId}`);
export const getLoginAttempts = (days = 7, params = {}) => {
  const queryParams = new URLSearchParams();
  queryParams.append('days', days);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/admin/security/login-attempts?${queryParams.toString()}`);
};
export const getFailedLoginAttempts = (days = 7) => 
  API.get(`/admin/security/login-attempts/failed/grouped?days=${days}`);

// ============ ADMIN MAINTENANCE ============
export const getSystemHealth = () => API.get('/admin/maintenance/health');
export const clearCache = () => API.post('/admin/maintenance/cache/clear');
export const getDatabaseStats = () => API.get('/admin/maintenance/database/stats');
export const optimizeDatabase = () => API.post('/admin/maintenance/database/optimize');
export const createDatabaseBackup = (data = {}) => API.post('/admin/maintenance/backup/create', data);
export const getBackupList = () => API.get('/admin/maintenance/backup/list');
export const downloadBackup = (backupId) => 
  API.get(`/admin/maintenance/backup/download/${backupId}`, { responseType: 'blob' });
export const restoreBackup = (backupId) => API.post(`/admin/maintenance/backup/restore/${backupId}`);
export const deleteBackup = (backupId) => API.delete(`/admin/maintenance/backup/${backupId}`);

// ============ MODERATOR ENDPOINTS ============
export const getModeratorQueue = () => API.get('/moderator/queue');
export const moderatePost = (postId, action, reason) => 
  API.post(`/moderator/posts/${postId}`, { action, reason });
export const warnUser = (userId, reason) => 
  API.post(`/moderator/users/${userId}/warn`, { reason });
export const getModeratorStats = () => API.get('/moderator/stats');

// ============ ANALYTICS EXPORT ============
export const exportAnalytics = (type, dateRange, format = 'csv') => {
  const params = new URLSearchParams();
  params.append('type', type);
  params.append('startDate', dateRange.start);
  params.append('endDate', dateRange.end);
  params.append('format', format);
  return API.get(`/admin/analytics/export?${params.toString()}`, { responseType: 'blob' });
};

export const getAuthAnalytics = () => API.get('/admin/analytics/auth');

// ============ COMMUNITY POSTS ENDPOINTS ============
export const getCommunityPosts = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.append('type', params.type);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  if (params.local) queryParams.append('local', params.local);
  if (params.radius) queryParams.append('radius', params.radius);
  return API.get(`/community/posts?${queryParams.toString()}`);
};
export const getLocalCommunityPosts = (radius = 10, limit = 10) => {
  return API.get(`/community/posts/local?radius=${radius}&limit=${limit}`);
};
export const getCommunityPost = (postId) => API.get(`/community/posts/${postId}`);
export const createCommunityPost = (data) => API.post('/community/posts', data);
export const updateCommunityPost = (postId, data) => API.put(`/community/posts/${postId}`, data);
export const deleteCommunityPost = (postId) => API.delete(`/community/posts/${postId}`);
export const addCommunityResponse = (postId, data) => API.post(`/community/posts/${postId}/responses`, data);
export const removeCommunityResponse = (postId) => API.delete(`/community/posts/${postId}/responses`);
export const getUserCommunityPosts = (userId, page = 1) => API.get(`/community/users/${userId}/posts?page=${page}`);
export const updateDonationProgress = (postId, amount) => API.patch(`/community/posts/${postId}/donation`, { amount });
export const getTrendingCommunityPosts = (timeframe = 'week', limit = 10) => 
  API.get(`/community/posts/trending?timeframe=${timeframe}&limit=${limit}`);
export const getPostAnalytics = (postId) => API.get(`/community/posts/${postId}/analytics`);

// ============ COMMUNITY REPORTS ============
export const reportCommunityPost = (postId, data) => API.post(`/community/reports/${postId}`, data);

// ============ BOOKMARKS ============
export const getBookmarkStatus = (postId) => API.get(`/community/posts/${postId}/bookmark-status`);
export const addBookmark = (postId) => API.post(`/community/posts/${postId}/bookmark`);
export const removeBookmark = (postId) => API.delete(`/community/posts/${postId}/bookmark`);
export const getBookmarks = () => API.get('/community/bookmarks');

// ============ ACCOUNT DELETION REQUESTS ============
export const requestAccountDeletion = (reason) => 
  API.post('/members/profile/delete-request', { reason });

export const getDeletionRequestStatus = () => 
  API.get('/members/profile/delete-request/status');

export const cancelDeletionRequest = () => 
  API.delete('/members/profile/delete-request');

// ============ ADMIN - DELETION REQUESTS ============
export const getDeletionRequests = (params) => 
  API.get('/admin/deletion-requests', { params });

export const getDeletionRequestStats = () => 
  API.get('/admin/deletion-requests/stats');

export const approveDeletionRequest = (requestId, adminNotes) => 
  API.post(`/admin/deletion-requests/${requestId}/approve`, { adminNotes });

export const rejectDeletionRequest = (requestId, adminNotes) => 
  API.post(`/admin/deletion-requests/${requestId}/reject`, { adminNotes });

// ============ MY CONTENT METHODS ============
export const getMyPosts = () => API.get('/community/posts/my');
export const getMyVerseSubmissions = () => API.get('/bible/verses/my');
export const getMyComments = () => API.get('/discussions/comments/my');
export const deleteMyContent = (type, id) => {
  switch (type) {
    case 'posts':
      return API.delete(`/community/posts/${id}`);
    case 'prayers':
      return API.delete(`/prayer/requests/${id}`);
    case 'testimonies':
      return API.delete(`/prayer/testimonies/${id}`);
    case 'verses':
      return API.delete(`/bible/verses/${id}`);
    case 'comments':
      return API.delete(`/discussions/comments/${id}`);
    default:
      throw new Error('Unknown content type');
  }
};

// ============ RATE LIMIT ============
export const checkRateLimit = (action) => API.get(`/rate-limit/check/${action}`);
export const getRateLimitStatus = () => API.get('/rate-limit/status');

export { API };
export default API;