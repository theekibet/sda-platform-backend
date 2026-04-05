// src/hooks/useCommunityPosts.js
import { useState, useEffect, useCallback } from 'react';
import { communityService } from '../services/communityService';

export const useCommunityPosts = (options = {}) => {
  const {
    initialType = 'all',
    initialSearch = '',
    initialRadius = 50,
    autoFetch = true,
    userId = null,
  } = options;

  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 20,
  });

  // Filter states
  const [filters, setFilters] = useState({
    type: initialType,
    search: initialSearch,
    sortBy: 'newest', // newest, popular, nearest
    dateRange: { start: null, end: null },
    radius: initialRadius,
    authorId: null,
  });

  const [viewMode, setViewMode] = useState('all'); // 'all', 'nearby', 'myPosts'
  const [userLocation, setUserLocation] = useState(null);

  // Fetch posts based on current filters
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (viewMode === 'nearby' && userLocation?.latitude && userLocation?.longitude) {
        response = await communityService.getLocalPosts(filters.radius, pagination.limit);
      } else if (viewMode === 'myPosts' && userId) {
        response = await communityService.getUserPosts(userId, pagination.page);
      } else {
        response = await communityService.getPosts({
          type: filters.type !== 'all' ? filters.type : undefined,
          search: filters.search || undefined,
          page: pagination.page,
          limit: pagination.limit,
        });
      }

      if (response.success) {
        setPosts(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 1,
        }));
      } else {
        setError('Failed to fetch posts');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [viewMode, filters, pagination.page, userLocation, userId]);

  // Apply client-side filters (type, search, sorting)
  const applyFilters = useCallback(() => {
    let filtered = [...posts];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(post => post.type === filters.type);
    }

    // Filter by search
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(post =>
        post.title?.toLowerCase().includes(query) ||
        post.description?.toLowerCase().includes(query) ||
        post.author?.name?.toLowerCase().includes(query)
      );
    }

    // Filter by author
    if (filters.authorId) {
      filtered = filtered.filter(post => post.authorId === filters.authorId);
    }

    // Sort posts
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.stats?.total || 0) - (a.stats?.total || 0));
        break;
      case 'nearest':
        if (userLocation) {
          filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }
        break;
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredPosts(filtered);
  }, [posts, filters, userLocation]);

  // Auto-fetch on mount or when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchPosts();
    }
  }, [fetchPosts, autoFetch]);

  // Apply filters when posts or filters change
  useEffect(() => {
    applyFilters();
  }, [posts, filters, applyFilters]);

  // Update filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      search: '',
      sortBy: 'newest',
      dateRange: { start: null, end: null },
      radius: 50,
      authorId: null,
    });
  }, []);

  // Change page
  const setPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Set user location for nearby posts
  const setLocation = useCallback((latitude, longitude) => {
    setUserLocation({ latitude, longitude });
  }, []);

  // Refresh posts
  const refresh = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Delete a post from state
  const removePost = useCallback((postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setFilteredPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  // Update a post in state
  const updatePost = useCallback((updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    setFilteredPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  }, []);

  // Add a new post to state
  const addPost = useCallback((newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setFilteredPosts(prev => [newPost, ...prev]);
  }, []);

  return {
    // State
    posts: filteredPosts,
    allPosts: posts,
    loading,
    error,
    pagination,
    filters,
    viewMode,
    
    // Actions
    fetchPosts,
    refresh,
    setPage,
    updateFilter,
    clearFilters,
    setViewMode,
    setLocation,
    removePost,
    updatePost,
    addPost,
    
    // Helpers
    hasMore: pagination.page < pagination.totalPages,
    total: pagination.total,
  };
};

export default useCommunityPosts;