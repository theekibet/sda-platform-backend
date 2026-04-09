// src/constants.js

// ============ REPORT CATEGORIES ============
export const REPORT_CATEGORIES = [
  { value: 'spam', label: 'Spam', icon: '📧', description: 'Unsolicited or repetitive content' },
  { value: 'harassment', label: 'Harassment', icon: '⚠️', description: 'Bullying, threats, or harassment' },
  { value: 'inappropriate', label: 'Inappropriate', icon: '🔞', description: 'Offensive or explicit content' },
  { value: 'fake', label: 'Fake Account/Info', icon: '🪪', description: 'Impersonation or false information' },
  { value: 'hate_speech', label: 'Hate Speech', icon: '🚫', description: 'Discriminatory or hateful content' },
  { value: 'misinformation', label: 'Misinformation', icon: '📰', description: 'False or misleading information' },
  { value: 'other', label: 'Other', icon: '📌', description: 'Other violations' },
];

// ============ REPORT STATUS ============
export const REPORT_STATUS = {
  PENDING: 'pending',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
};

// ============ REPORT PRIORITY ============
export const REPORT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// ============ CONTENT TYPES ============
export const CONTENT_TYPES = {
  PRAYER_REQUEST: 'prayerRequest',
  TESTIMONY: 'testimony',
  GROUP_DISCUSSION: 'groupDiscussion',
  USER: 'user',
};

// ============ MODERATION ACTIONS ============
export const MODERATION_ACTIONS = [
  { value: 'approve', label: 'Approve', icon: '✅', color: '#27ae60' },
  { value: 'remove', label: 'Remove', icon: '❌', color: '#e74c3c' },
  { value: 'warn', label: 'Warn User', icon: '⚠️', color: '#f39c12' },
  { value: 'flag', label: 'Flag for Review', icon: '🚩', color: '#3498db' },
  { value: 'dismiss', label: 'Dismiss', icon: '🗑️', color: '#95a5a6' },
];

// ============ ANNOUNCEMENT TYPES ============
export const ANNOUNCEMENT_TYPES = [
  { value: 'info', label: 'Information', icon: 'ℹ️', color: '#3498db' },
  { value: 'warning', label: 'Warning', icon: '⚠️', color: '#f39c12' },
  { value: 'success', label: 'Success', icon: '✅', color: '#27ae60' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧', color: '#9b59b6' },
];

// ============ USER ROLES (Updated for Super Admin / Moderator / Member) ============
export const USER_ROLES = {
  MEMBER: 'member',
  MODERATOR: 'moderator',
  SUPER_ADMIN: 'super_admin',
};

// Helper to check role hierarchy
export const hasModeratorAccess = (user) => {
  return user?.isModerator === true || user?.isSuperAdmin === true;
};

export const hasSuperAdminAccess = (user) => {
  return user?.isSuperAdmin === true;
};

// ============ FEATURE FLAGS ============
export const FEATURE_FLAGS = {
  PRAYER_WALL: 'prayerWall',
  GROUPS: 'groups',
  LOCATION: 'location',
  ANNOUNCEMENTS: 'announcements',
  REPORTS: 'reports',
};

// ============ SUSPENSION DURATIONS ============
export const SUSPENSION_DURATIONS = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: 'permanent', label: 'Permanent' },
];