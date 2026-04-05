/**
 * Date validation utilities for community posts
 * Ensures dates are valid and not in the past
 */

/**
 * Check if a date is in the past
 * @param {Date|string} date - The date to check
 * @returns {boolean} - True if date is in the past
 */
export const isDateInPast = (date) => {
    if (!date) return false;
    
    const checkDate = new Date(date);
    const now = new Date();
    
    // Reset time to midnight for date-only comparison
    const checkDateMidnight = new Date(checkDate);
    checkDateMidnight.setHours(0, 0, 0, 0);
    
    const nowMidnight = new Date(now);
    nowMidnight.setHours(0, 0, 0, 0);
    
    return checkDateMidnight < nowMidnight;
  };
  
  /**
   * Check if a date is today
   * @param {Date|string} date - The date to check
   * @returns {boolean} - True if date is today
   */
  export const isToday = (date) => {
    if (!date) return false;
    
    const checkDate = new Date(date);
    const today = new Date();
    
    return checkDate.toDateString() === today.toDateString();
  };
  
  /**
   * Check if a date is within a certain number of days from now
   * @param {Date|string} date - The date to check
   * @param {number} days - Number of days
   * @returns {boolean} - True if date is within the specified days
   */
  export const isWithinDays = (date, days) => {
    if (!date) return false;
    
    const checkDate = new Date(date);
    const now = new Date();
    const daysInMs = days * 24 * 60 * 60 * 1000;
    
    return (checkDate - now) <= daysInMs && !isDateInPast(date);
  };
  
  /**
   * Validate event date (cannot be in the past)
   * @param {Date|string} eventDate - The event date to validate
   * @returns {Object} - { isValid: boolean, message: string }
   */
  export const validateEventDate = (eventDate) => {
    if (!eventDate) {
      return { isValid: false, message: 'Event date is required' };
    }
    
    if (isDateInPast(eventDate)) {
      return { isValid: false, message: 'Event date cannot be in the past' };
    }
    
    return { isValid: true, message: null };
  };
  
  /**
   * Validate donation goal
   * @param {number} goalAmount - The donation goal amount
   * @returns {Object} - { isValid: boolean, message: string }
   */
  export const validateDonationGoal = (goalAmount) => {
    if (!goalAmount && goalAmount !== 0) {
      return { isValid: true, message: null }; // Optional field
    }
    
    if (goalAmount <= 0) {
      return { isValid: false, message: 'Goal amount must be greater than 0' };
    }
    
    if (goalAmount > 10000000) {
      return { isValid: false, message: 'Goal amount cannot exceed 10,000,000 KSh' };
    }
    
    return { isValid: true, message: null };
  };
  
  /**
   * Validate contact phone for donation posts
   * @param {string} phone - The phone number
   * @param {string} postType - The type of post
   * @returns {Object} - { isValid: boolean, message: string }
   */
  export const validateContactPhone = (phone, postType) => {
    if (postType === 'donation' && !phone) {
      return { isValid: false, message: 'Contact phone is required for donation posts' };
    }
    
    if (phone) {
      // Kenyan phone number pattern (0712345678, +254712345678, 0712-345-678)
      const phonePattern = /^(\+254|0)[17]\d{8}$|^(\+254|0)[17]\d{2}-\d{3}-\d{3}$/;
      if (!phonePattern.test(phone.replace(/-/g, ''))) {
        return { isValid: false, message: 'Please enter a valid Kenyan phone number' };
      }
    }
    
    return { isValid: true, message: null };
  };
  
  /**
   * Get human-readable time until a date
   * @param {Date|string} date - The future date
   * @returns {string} - Human-readable time until
   */
  export const getTimeUntil = (date) => {
    if (!date || isDateInPast(date)) return null;
    
    const targetDate = new Date(date);
    const now = new Date();
    const diffMs = targetDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 30) {
      return `in ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''}`;
    }
    if (diffDays > 1) {
      return `in ${diffDays} days`;
    }
    if (diffDays === 1) {
      return 'tomorrow';
    }
    if (diffHours > 1) {
      return `in ${diffHours} hours`;
    }
    if (diffHours === 1) {
      return 'in 1 hour';
    }
    return 'soon';
  };
  
  /**
   * Check if a post is expired based on its type and dates
   * @param {Object} post - The post object
   * @returns {boolean} - True if expired
   */
  export const isPostExpired = (post) => {
    if (post.status === 'expired' || post.status === 'archived') {
      return true;
    }
    
    const now = new Date();
    
    if (post.type === 'event' && post.eventDate) {
      return new Date(post.eventDate) < now;
    }
    
    if (post.type === 'donation' && post.expiresAt) {
      return new Date(post.expiresAt) < now;
    }
    
    // General posts expire after 30 days
    if (post.type === 'general') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(post.createdAt) < thirtyDaysAgo;
    }
    
    return false;
  };
  
  /**
   * Get post status badge info
   * @param {Object} post - The post object
   * @returns {Object} - { label, className, icon }
   */
  export const getPostStatusInfo = (post) => {
    const now = new Date();
    
    if (post.status === 'expired' || post.status === 'archived') {
      return { label: 'Expired', className: 'status-expired', icon: '⏰' };
    }
    
    if (post.status === 'reported') {
      return { label: 'Under Review', className: 'status-warning', icon: '🚩' };
    }
    
    if (post.type === 'event' && post.eventDate) {
      const eventDate = new Date(post.eventDate);
      if (eventDate < now) {
        return { label: 'Past Event', className: 'status-expired', icon: '📅' };
      }
      const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 3) {
        return { label: `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`, className: 'status-upcoming', icon: '🔥' };
      }
      if (daysUntil <= 7) {
        return { label: 'This week', className: 'status-upcoming', icon: '📅' };
      }
    }
    
    if (post.type === 'donation' && post.expiresAt && new Date(post.expiresAt) < now) {
      return { label: 'Campaign Ended', className: 'status-expired', icon: '🎁' };
    }
    
    // Check if post is expiring soon (within 5 days for general)
    const daysOld = Math.ceil((now - new Date(post.createdAt)) / (1000 * 60 * 60 * 24));
    if (post.type === 'general' && daysOld > 25) {
      return { label: 'Expiring soon', className: 'status-warning', icon: '⚠️' };
    }
    
    return null;
  };