// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Helper to decode JWT
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // ============ EMAIL/PASSWORD LOGIN ============
  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      const { token: newToken, user: userData } = response.data;
      
      const decoded = parseJwt(newToken);
      
      let finalUser = { ...userData };
      if (!finalUser.username && decoded?.username) {
        finalUser.username = decoded.username;
      }
      if (finalUser.isModerator === undefined || finalUser.isSuperAdmin === undefined) {
        if (decoded) {
          finalUser.isModerator = decoded.isModerator || false;
          finalUser.isSuperAdmin = decoded.isSuperAdmin || false;
        } else {
          finalUser.isModerator = false;
          finalUser.isSuperAdmin = false;
        }
      }
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(finalUser));
      setToken(newToken);
      setUser(finalUser);
      
      try {
        const profileResponse = await getProfile();
        const fullUser = profileResponse.data.data;
        const updatedUser = { ...finalUser, ...fullUser };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } catch (err) {
        console.warn('Could not fetch full profile after login:', err);
      }
      
      return { success: true, user: finalUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  // ============ EMAIL/PASSWORD REGISTRATION (fixed) ============
  const register = async (userData) => {
    try {
      const response = await apiRegister(userData);
      const { success, message, user } = response.data;   // Backend returns { success, message, user } – no token
      
      if (success) {
        // Do NOT store token or user – email verification required first
        // The user stays on the Auth page and sees a success message
        return { success: true, message: message || 'Registration successful' };
      } else {
        return { success: false, error: message || 'Registration failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  // ============ GOOGLE OAUTH ============
  const googleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleGoogleCallback = (userData, authToken) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    return { success: true, user: userData };
  };

  // ============ LOGOUT ============
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const isAuthenticated = !!user;
  const isModerator = user?.isModerator === true;
  const isSuperAdmin = user?.isSuperAdmin === true;
  const hasModeratorAccess = isModerator || isSuperAdmin;
  const isMember = !isModerator && !isSuperAdmin;

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isModerator,
    isSuperAdmin,
    hasModeratorAccess,
    isMember,
    login,
    register,
    googleLogin,
    handleGoogleCallback,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};