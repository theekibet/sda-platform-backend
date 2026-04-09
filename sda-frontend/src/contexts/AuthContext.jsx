// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';

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

  // Helper to decode JWT and extract user data (including roles)
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

  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      const { token: newToken, user: userData } = response.data;
      
      // Merge userData with JWT claims (if needed)
      let finalUser = { ...userData };
      
      // If roles missing, try JWT
      if (finalUser.isModerator === undefined || finalUser.isSuperAdmin === undefined) {
        const decoded = parseJwt(newToken);
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
      
      return { success: true, user: finalUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiRegister(userData);
      const { token: newToken, user: newUser } = response.data;
      
      const finalUser = {
        ...newUser,
        isModerator: false,
        isSuperAdmin: false,
      };
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(finalUser));
      setToken(newToken);
      setUser(finalUser);
      
      return { success: true, user: finalUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

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
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};