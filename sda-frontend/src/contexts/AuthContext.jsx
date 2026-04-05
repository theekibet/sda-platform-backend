import { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getProfile } from '../services/api';

// Create the context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      // Try to load user from localStorage if no token (for persistence)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      // FIX: Access the nested data property
      const userData = response.data.data;
      
      // Ensure location fields are included
      const userWithLocation = {
        ...userData,
        locationName: userData.locationName || null,
        latitude: userData.latitude || null,
        longitude: userData.longitude || null,
      };
      
      setUser(userWithLocation);
      
      // Store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userWithLocation));
      
      // Set permissions based on user role
      if (userData.isAdmin) {
        setPermissions(['admin', 'moderate', 'manage_users', 'manage_settings', 'view_reports', 'manage_announcements']);
      } else if (userData.isModerator) {
        setPermissions(['moderate', 'view_reports']);
      } else {
        setPermissions([]);
      }

      // Fetch bookmarks if user is logged in
      await fetchBookmarks();
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user bookmarks
  const fetchBookmarks = async () => {
    if (!user) return;
    try {
      const { communityService } = await import('../services/communityService');
      const response = await communityService.getBookmarks();
      if (response.success) {
        setBookmarks(response.data);
        setBookmarkCount(response.data.length);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  // Add bookmark
  const addBookmark = async (postId) => {
    try {
      const { communityService } = await import('../services/communityService');
      const response = await communityService.addBookmark(postId);
      if (response.success) {
        await fetchBookmarks();
        return { success: true, data: response.data };
      }
      return { success: false, error: 'Failed to add bookmark' };
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return { success: false, error: error.message };
    }
  };

  // Remove bookmark
  const removeBookmark = async (postId) => {
    try {
      const { communityService } = await import('../services/communityService');
      const response = await communityService.removeBookmark(postId);
      if (response.success) {
        await fetchBookmarks();
        return { success: true };
      }
      return { success: false, error: 'Failed to remove bookmark' };
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if post is bookmarked
  const isBookmarked = (postId) => {
    return bookmarks.some(bookmark => bookmark.postId === postId);
  };

  const handleLogin = async (email, password) => {
    try {
      setError(null);
      const response = await apiLogin({ email, password });
      const { token, ...userData } = response.data;
      
      // Ensure location fields are included
      const userWithLocation = {
        ...userData,
        locationName: userData.locationName || null,
        latitude: userData.latitude || null,
        longitude: userData.longitude || null,
      };
      
      // Store token and user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithLocation));
      setToken(token);
      setUser(userWithLocation);
      
      // Set permissions based on user role
      if (userData.isAdmin) {
        setPermissions(['admin', 'moderate', 'manage_users', 'manage_settings', 'view_reports', 'manage_announcements']);
      } else if (userData.isModerator) {
        setPermissions(['moderate', 'view_reports']);
      } else {
        setPermissions([]);
      }

      // Fetch bookmarks after login
      await fetchBookmarks();
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const handleRegister = async (userData) => {
    try {
      setError(null);
      const response = await apiRegister(userData);
      const { token, message, ...newUser } = response.data;
      
      // Ensure location fields are included (will be null initially)
      const userWithLocation = {
        ...newUser,
        locationName: null,
        latitude: null,
        longitude: null,
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithLocation));
      setToken(token);
      setUser(userWithLocation);
      
      // Regular users have no special permissions
      setPermissions([]);
      
      return { 
        success: true, 
        message: message || 'Registration successful!'
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Update user location (called after location detection)
  const updateUserLocation = (locationData) => {
    const updatedUser = {
      ...user,
      locationName: locationData.locationName || user?.locationName,
      latitude: locationData.latitude ?? user?.latitude,
      longitude: locationData.longitude ?? user?.longitude,
    };
    
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return updatedUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setPermissions([]);
    setBookmarks([]);
    setBookmarkCount(0);
  };

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  // Check if user is admin
  const isAdmin = user?.isAdmin || false;

  // Check if user is moderator
  const isModerator = user?.isModerator || false;

  // Get user's display location (city only)
  const getUserCity = () => {
    if (!user?.locationName) return null;
    return user.locationName.split(',')[0].trim();
  };

  // Check if user has location set
  const hasLocation = () => {
    return !!(user?.latitude && user?.longitude);
  };

  const value = {
    user,
    setUser,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout,
    hasPermission,
    isAdmin,
    isModerator,
    permissions,
    token,
    // NEW: Location helpers
    updateUserLocation,
    getUserCity,
    hasLocation,
    // NEW: Bookmark helpers
    bookmarks,
    bookmarkCount,
    addBookmark,
    removeBookmark,
    isBookmarked,
    refreshBookmarks: fetchBookmarks,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook - MUST be exported after the provider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};