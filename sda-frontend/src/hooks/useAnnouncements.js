import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  getAnnouncements, 
  getActiveAnnouncements, 
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsViewed
} from '../services/api';

// Cache structure with separate keys for different data types
const cache = {
  active: {
    data: null,
    timestamp: null,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  },
  admin: {
    data: null,
    pagination: null,
    timestamp: null,
    cacheTTL: 2 * 60 * 1000, // 2 minutes
  },
};

export const useAnnouncements = (options = {}) => {
  const { autoFetch = true, fetchActive = false, limit = 20 } = options;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [activeAnnouncements, setActiveAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: limit,
  });
  
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const safeSetState = useCallback((setter, value) => {
    if (isMounted.current) {
      setter(value);
    }
  }, []);

  // Fetch all announcements (admin) with caching
  const fetchAnnouncements = useCallback(async (params = {}, forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = 'admin';
    
    // Check cache
    if (!forceRefresh && 
        cache[cacheKey].data && 
        cache[cacheKey].pagination &&
        (now - cache[cacheKey].timestamp) < cache[cacheKey].cacheTTL &&
        cache[cacheKey].pagination.page === (params.page || pagination.page)) {
      safeSetState(setAnnouncements, cache[cacheKey].data);
      safeSetState(setPagination, cache[cacheKey].pagination);
      safeSetState(setInitialLoading, false);
      return { 
        success: true, 
        data: cache[cacheKey].data, 
        total: cache[cacheKey].pagination.total, 
        totalPages: cache[cacheKey].pagination.totalPages 
      };
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    safeSetState(setLoading, true);
    safeSetState(setError, null);
    
    try {
      const response = await getAnnouncements({
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        ...params
      }, {
        signal: abortControllerRef.current.signal
      });
      
      const data = response.data || response;
      const announcementsList = data.announcements || data.data || [];
      const total = data.total || data.pagination?.total || 0;
      const totalPages = data.totalPages || data.pagination?.totalPages || 1;
      
      const newPagination = {
        ...pagination,
        page: params.page || pagination.page,
        total: total,
        totalPages: totalPages,
      };
      
      // Update cache
      cache[cacheKey].data = announcementsList;
      cache[cacheKey].pagination = newPagination;
      cache[cacheKey].timestamp = now;
      
      safeSetState(setAnnouncements, announcementsList);
      safeSetState(setPagination, newPagination);
      safeSetState(setInitialLoading, false);
      
      return { success: true, data: announcementsList, total, totalPages };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Request cancelled' };
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch announcements';
      safeSetState(setError, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      safeSetState(setLoading, false);
      abortControllerRef.current = null;
    }
  }, [pagination.page, pagination.limit, safeSetState]);

  // Fetch active announcements (for users) with caching
  const fetchActiveAnnouncements = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'active';
    const now = Date.now();
    
    // Check cache
    if (!forceRefresh && 
        cache[cacheKey].data && 
        cache[cacheKey].timestamp && 
        (now - cache[cacheKey].timestamp) < cache[cacheKey].cacheTTL) {
      safeSetState(setActiveAnnouncements, cache[cacheKey].data);
      safeSetState(setInitialLoading, false);
      return cache[cacheKey].data;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    safeSetState(setLoading, true);
    safeSetState(setError, null);
    
    try {
      const response = await getActiveAnnouncements({
        signal: abortControllerRef.current.signal
      });
      
      const data = response.data || response;
      const announcementsList = Array.isArray(data) 
        ? data 
        : (data.announcements || data.data || []);
      
      const announcementsWithViewed = announcementsList.map(announcement => ({
        ...announcement,
        viewed: announcement.viewed || false,
      }));
      
      // Update cache
      cache[cacheKey].data = announcementsWithViewed;
      cache[cacheKey].timestamp = now;
      
      safeSetState(setActiveAnnouncements, announcementsWithViewed);
      safeSetState(setInitialLoading, false);
      
      return announcementsWithViewed;
    } catch (err) {
      if (err.name === 'AbortError') {
        return cache[cacheKey].data || [];
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch active announcements';
      safeSetState(setError, errorMessage);
      return [];
    } finally {
      safeSetState(setLoading, false);
      abortControllerRef.current = null;
    }
  }, [safeSetState]);

  // Create new announcement
  const createNewAnnouncement = useCallback(async (announcementData) => {
    safeSetState(setLoading, true);
    safeSetState(setError, null);
    
    try {
      const response = await createAnnouncement(announcementData);
      const data = response.data || response;
      
      // Invalidate all caches
      cache.active.timestamp = null;
      cache.admin.timestamp = null;
      
      await fetchAnnouncements({}, true);
      
      return { 
        success: true, 
        data: data,
        message: 'Announcement created successfully'
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create announcement';
      safeSetState(setError, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      safeSetState(setLoading, false);
    }
  }, [fetchAnnouncements, safeSetState]);

  // Update announcement
  const updateExistingAnnouncement = useCallback(async (id, announcementData) => {
    if (!id) {
      return { success: false, error: 'Announcement ID is required' };
    }
    
    safeSetState(setLoading, true);
    safeSetState(setError, null);
    
    try {
      const response = await updateAnnouncement(id, announcementData);
      const data = response.data || response;
      
      // Invalidate caches
      cache.active.timestamp = null;
      cache.admin.timestamp = null;
      
      await fetchAnnouncements({}, true);
      
      if (selectedAnnouncement?.id === id) {
        safeSetState(setSelectedAnnouncement, data);
      }
      
      return { 
        success: true, 
        data: data,
        message: 'Announcement updated successfully'
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update announcement';
      safeSetState(setError, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      safeSetState(setLoading, false);
    }
  }, [fetchAnnouncements, selectedAnnouncement, safeSetState]);

  // Delete announcement
  const deleteExistingAnnouncement = useCallback(async (id) => {
    if (!id) {
      return { success: false, error: 'Announcement ID is required' };
    }
    
    safeSetState(setLoading, true);
    safeSetState(setError, null);
    
    try {
      await deleteAnnouncement(id);
      
      // Invalidate caches
      cache.active.timestamp = null;
      cache.admin.timestamp = null;
      
      await fetchAnnouncements({}, true);
      
      if (selectedAnnouncement?.id === id) {
        safeSetState(setSelectedAnnouncement, null);
      }
      
      return { 
        success: true, 
        message: 'Announcement deleted successfully'
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete announcement';
      safeSetState(setError, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      safeSetState(setLoading, false);
    }
  }, [fetchAnnouncements, selectedAnnouncement, safeSetState]);

  // Mark as viewed with optimistic update
  const markAsViewed = useCallback(async (announcementId) => {
    if (!announcementId) {
      return { success: false, error: 'Announcement ID is required' };
    }
    
    // Optimistic update
    safeSetState(setActiveAnnouncements, prev => 
      prev.map(announcement => 
        announcement.id === announcementId 
          ? { ...announcement, viewed: true } 
          : announcement
      )
    );
    
    if (cache.active.data) {
      cache.active.data = cache.active.data.map(announcement =>
        announcement.id === announcementId
          ? { ...announcement, viewed: true }
          : announcement
      );
    }
    
    try {
      await markAnnouncementAsViewed(announcementId);
      return { success: true };
    } catch (err) {
      // Rollback
      safeSetState(setActiveAnnouncements, prev => 
        prev.map(announcement => 
          announcement.id === announcementId 
            ? { ...announcement, viewed: false } 
            : announcement
        )
      );
      
      if (cache.active.data) {
        cache.active.data = cache.active.data.map(announcement =>
          announcement.id === announcementId
            ? { ...announcement, viewed: false }
            : announcement
        );
      }
      
      return { success: false, error: err.message };
    }
  }, [safeSetState]);

  const selectAnnouncement = useCallback((announcement) => {
    safeSetState(setSelectedAnnouncement, announcement);
  }, [safeSetState]);

  const clearSelectedAnnouncement = useCallback(() => {
    safeSetState(setSelectedAnnouncement, null);
  }, [safeSetState]);

  const setPage = useCallback((page) => {
    if (page < 1 || page > pagination.totalPages) return;
    safeSetState(setPagination, prev => ({ ...prev, page }));
  }, [pagination.totalPages, safeSetState]);

  const resetPagination = useCallback(() => {
    safeSetState(setPagination, prev => ({
      ...prev,
      page: 1,
      total: 0,
      totalPages: 1,
    }));
    cache.admin.timestamp = null;
  }, [safeSetState]);

  const clearCache = useCallback(() => {
    cache.active.data = null;
    cache.active.timestamp = null;
    cache.admin.data = null;
    cache.admin.pagination = null;
    cache.admin.timestamp = null;
  }, []);

  // ✅ FIXED: Removed pagination.page from dependencies to prevent infinite loop
  useEffect(() => {
    if (!autoFetch) return;
    
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      if (fetchActive) {
        fetchActiveAnnouncements();
      } else {
        fetchAnnouncements();
      }
    }, 100);
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [autoFetch, fetchActive]); // ✅ Removed pagination.page

  return {
    loading,
    initialLoading,
    error,
    announcements,
    activeAnnouncements,
    selectedAnnouncement,
    pagination,
    fetchAnnouncements,
    fetchActiveAnnouncements,
    createNewAnnouncement,
    updateExistingAnnouncement,
    deleteExistingAnnouncement,
    markAsViewed,
    selectAnnouncement,
    clearSelectedAnnouncement,
    setPage,
    resetPagination,
    clearCache,
  };
};