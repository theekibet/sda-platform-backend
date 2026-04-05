/**
 * Rate limiting utilities for community posts
 * Prevents spam by limiting how often users can create posts
 * 
 * This is a CLIENT-SIDE utility that works with the backend rate limit service.
 * For production, rate limits are enforced on the backend.
 * This utility provides:
 * - Local caching of rate limit status
 * - Human-readable formatting
 * - Fallback for when backend is unavailable
 */

import rateLimitService from '../services/rateLimitService';

// Store for local rate limit caching
// This reduces API calls to the backend
const localRateLimitCache = new Map();

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = 60000; // 1 minute

/**
 * Get rate limit status from backend with local caching
 * @param {string} userId - The user ID to check
 * @returns {Promise<Object>} - Rate limit status
 */
export const checkRateLimit = async (userId, action = 'create_post') => {
  if (!userId) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: null,
      message: 'User not authenticated',
    };
  }

  // Check cache first
  const cacheKey = `${userId}:${action}`;
  const cached = localRateLimitCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Call backend rate limit service
    let result;
    switch (action) {
      case 'create_post':
        result = await rateLimitService.canCreatePost();
        break;
      case 'add_response':
        result = await rateLimitService.canAddResponse();
        break;
      case 'report_content':
        result = await rateLimitService.canReport();
        break;
      default:
        result = await rateLimitService.checkLimit(action);
    }

    // Cache the result
    localRateLimitCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    console.error('Error checking rate limit from backend:', error);
    
    // Fallback to client-side only rate limiting
    return fallbackCheckRateLimit(userId, action);
  }
};

/**
 * Fallback client-side rate limiting when backend is unavailable
 * @param {string} userId - The user ID to check
 * @returns {Object} - Rate limit status
 */
const fallbackCheckRateLimit = (userId, action) => {
  const now = Date.now();
  const userData = userPostCounts.get(userId);

  // If user has no history, they can post
  if (!userData) {
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxPosts,
      resetTime: new Date(now + RATE_LIMIT_CONFIG.windowMs),
      message: null,
    };
  }

  // Check if user is in cooldown
  if (userData.cooldownUntil && userData.cooldownUntil > now) {
    const cooldownRemaining = Math.ceil((userData.cooldownUntil - now) / 1000 / 60);
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(userData.cooldownUntil),
      message: `You've reached the post limit. Please wait ${cooldownRemaining} minutes before posting again.`,
    };
  }

  // Check if the window has expired
  if (userData.windowStart + RATE_LIMIT_CONFIG.windowMs < now) {
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxPosts,
      resetTime: new Date(now + RATE_LIMIT_CONFIG.windowMs),
      message: null,
    };
  }

  // Check if user has exceeded the limit
  const remaining = RATE_LIMIT_CONFIG.maxPosts - userData.count;
  
  if (remaining <= 0) {
    const cooldownUntil = now + RATE_LIMIT_CONFIG.cooldownMs;
    userPostCounts.set(userId, {
      ...userData,
      cooldownUntil,
    });
    
    const cooldownMinutes = Math.ceil(RATE_LIMIT_CONFIG.cooldownMs / 1000 / 60);
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(cooldownUntil),
      message: `You've reached the maximum of ${RATE_LIMIT_CONFIG.maxPosts} posts in 24 hours. Please wait ${cooldownMinutes} minutes before posting again.`,
    };
  }

  return {
    allowed: true,
    remaining,
    resetTime: new Date(userData.windowStart + RATE_LIMIT_CONFIG.windowMs),
    message: null,
  };
};

// Store for rate limit tracking (fallback only)
// In production, this should be moved to a database or Redis
const userPostCounts = new Map();

/**
 * Rate limit configuration (fallback only)
 */
const RATE_LIMIT_CONFIG = {
  // Maximum posts per time window
  maxPosts: 5,
  // Time window in milliseconds (24 hours)
  windowMs: 24 * 60 * 60 * 1000,
  // Cooldown after limit reached (1 hour)
  cooldownMs: 60 * 60 * 1000,
};

/**
 * Record a new post for rate limiting (used by fallback)
 * @param {string} userId - The user ID
 */
export const recordPost = (userId) => {
  if (!userId) return;

  const now = Date.now();
  const userData = userPostCounts.get(userId);

  if (!userData) {
    // First post from this user
    userPostCounts.set(userId, {
      count: 1,
      windowStart: now,
      cooldownUntil: null,
    });
    return;
  }

  // Check if we need to reset the window
  if (userData.windowStart + RATE_LIMIT_CONFIG.windowMs < now) {
    // New window
    userPostCounts.set(userId, {
      count: 1,
      windowStart: now,
      cooldownUntil: null,
    });
    return;
  }

  // Increment count
  userPostCounts.set(userId, {
    ...userData,
    count: userData.count + 1,
    cooldownUntil: null, // Reset cooldown if they're posting within limits
  });
};

/**
 * Record a new post with backend sync
 * @param {string} userId - The user ID
 * @param {string} action - The action being recorded
 */
export const recordAction = async (userId, action = 'create_post') => {
  if (!userId) return;

  // Clear local cache for this user/action
  const cacheKey = `${userId}:${action}`;
  localRateLimitCache.delete(cacheKey);

  // Also record in fallback storage
  if (action === 'create_post') {
    recordPost(userId);
  }
};

/**
 * Get the current rate limit status for a user (async version)
 * @param {string} userId - The user ID
 * @param {string} action - The action to check
 * @returns {Promise<Object>} - Current status
 */
export const getRateLimitStatus = async (userId, action = 'create_post') => {
  if (!userId) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: null,
    };
  }

  try {
    const result = await checkRateLimit(userId, action);
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime: result.resetTime,
    };
  } catch (error) {
    // Fallback to local calculation
    const now = Date.now();
    const userData = userPostCounts.get(userId);

    if (!userData) {
      return {
        allowed: true,
        remaining: RATE_LIMIT_CONFIG.maxPosts,
        resetTime: new Date(now + RATE_LIMIT_CONFIG.windowMs),
      };
    }

    // Check cooldown
    if (userData.cooldownUntil && userData.cooldownUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(userData.cooldownUntil),
      };
    }

    // Check if window has expired
    if (userData.windowStart + RATE_LIMIT_CONFIG.windowMs < now) {
      return {
        allowed: true,
        remaining: RATE_LIMIT_CONFIG.maxPosts,
        resetTime: new Date(now + RATE_LIMIT_CONFIG.windowMs),
      };
    }

    return {
      allowed: userData.count < RATE_LIMIT_CONFIG.maxPosts,
      remaining: Math.max(0, RATE_LIMIT_CONFIG.maxPosts - userData.count),
      resetTime: new Date(userData.windowStart + RATE_LIMIT_CONFIG.windowMs),
    };
  }
};

/**
 * Get rate limit status synchronously (for UI that doesn't need backend)
 * @param {string} userId - The user ID
 * @returns {Object} - Current status
 */
export const getLocalRateLimitStatus = (userId) => {
  if (!userId) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: null,
    };
  }

  const now = Date.now();
  const userData = userPostCounts.get(userId);

  if (!userData) {
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxPosts,
      resetTime: new Date(now + RATE_LIMIT_CONFIG.windowMs),
    };
  }

  // Check cooldown
  if (userData.cooldownUntil && userData.cooldownUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(userData.cooldownUntil),
    };
  }

  // Check if window has expired
  if (userData.windowStart + RATE_LIMIT_CONFIG.windowMs < now) {
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxPosts,
      resetTime: new Date(now + RATE_LIMIT_CONFIG.windowMs),
    };
  }

  return {
    allowed: userData.count < RATE_LIMIT_CONFIG.maxPosts,
    remaining: Math.max(0, RATE_LIMIT_CONFIG.maxPosts - userData.count),
    resetTime: new Date(userData.windowStart + RATE_LIMIT_CONFIG.windowMs),
  };
};

/**
 * Reset rate limit for a user (useful for admin testing)
 * @param {string} userId - The user ID
 */
export const resetRateLimit = (userId) => {
  if (!userId) return;
  
  // Clear local cache
  const keysToDelete = [];
  for (const key of localRateLimitCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => localRateLimitCache.delete(key));
  
  // Clear fallback storage
  userPostCounts.delete(userId);
};

/**
 * Clear all rate limits (for testing/development)
 */
export const clearAllRateLimits = () => {
  localRateLimitCache.clear();
  userPostCounts.clear();
};

/**
 * Get human-readable reset time
 * @param {Date} resetTime - The reset time
 * @returns {string} - Human-readable time
 */
export const getResetTimeHuman = (resetTime) => {
  if (!resetTime) return null;
  
  const now = new Date();
  const diffMs = resetTime - now;
  
  if (diffMs <= 0) return 'now';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}${diffMinutes > 0 ? ` and ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}` : ''}`;
  }
  
  return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
};

/**
 * Check if user can perform action (with UI-friendly message)
 * @param {string} userId - The user ID
 * @param {string} action - The action to check
 * @returns {Promise<{can: boolean, message: string, remaining: number, resetTime: Date}>}
 */
export const canPerformAction = async (userId, action = 'create_post') => {
  const result = await checkRateLimit(userId, action);
  
  if (result.allowed) {
    return {
      can: true,
      message: null,
      remaining: result.remaining,
      resetTime: result.resetTime,
    };
  }
  
  return {
    can: false,
    message: result.message || `Rate limit exceeded. Try again ${getResetTimeHuman(result.resetTime)}.`,
    remaining: 0,
    resetTime: result.resetTime,
  };
};

/**
 * Format rate limit message for display
 * @param {Object} status - Rate limit status
 * @returns {string} - Formatted message
 */
export const formatRateLimitMessage = (status) => {
  if (!status) return '';
  
  if (status.allowed) {
    if (status.remaining === 1) {
      return `You have ${status.remaining} post remaining today.`;
    }
    return `You have ${status.remaining} posts remaining today.`;
  }
  
  return `Rate limit reached. Try again in ${getResetTimeHuman(status.resetTime)}.`;
};

// Export configuration for use in other components
export const getRateLimitConfig = () => ({ ...RATE_LIMIT_CONFIG });