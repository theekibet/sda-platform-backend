// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Avatar from '../common/Avatar';
import NotificationDropdown from '../notifications/NotificationDropdown';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { unreadCount, requestBrowserPermission } = useNotifications();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Request browser notification permission on mount
  useEffect(() => {
    requestBrowserPermission();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14 md:h-16">
        {/* Hamburger Menu Button (for mobile) */}
        <button
          className="md:hidden text-2xl p-2 text-gray-600 hover:text-gray-800"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        {/* Logo - always goes to appropriate home */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">✝️</span>
          <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Imani
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions, groups, tags..."
                className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </form>
        </div>

        {/* User Menu / Auth Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Bell with Badge */}
              <div className="relative" ref={notificationRef}>
                <button
                  className="relative text-xl p-1 text-gray-600 hover:text-gray-800"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                >
                  <span>🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <NotificationDropdown onClose={() => setShowNotifications(false)} />
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100"
                  aria-label="Profile menu"
                >
                  <Avatar user={user} size="small" />
                  <span className="hidden md:inline text-sm font-medium text-gray-700">{user.name}</span>
                  <span className="text-xs text-gray-500">▼</span>
                </button>
                
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <span>🏠</span> Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <span>👤</span> My Profile
                    </Link>
                    <Link
                      to="/bookmarks"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <span>🔖</span> Bookmarks
                    </Link>
                    <Link
                      to="/my-submissions"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <span>📤</span> My Verses
                    </Link>
                    <Link
                      to="/community"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <span>👥</span> Community
                    </Link>
                    <Link
                      to="/learning"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <span>📚</span> Learning Hub
                    </Link>
                    {user.isAdmin && (
                      <>
                        <hr className="my-1 border-gray-200" />
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <span>⚙️</span> Admin Panel
                        </Link>
                      </>
                    )}
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span>🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200 p-4 flex flex-col space-y-2 md:hidden">
          {/* Search bar in mobile menu (optional, but convenient) */}
          <form onSubmit={handleSearchSubmit} className="mb-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </form>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>🏠</span> Dashboard
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>👤</span> My Profile
              </Link>
              <Link
                to="/bookmarks"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>🔖</span> Bookmarks
              </Link>
              <Link
                to="/my-submissions"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>📤</span> My Verses
              </Link>
              <Link
                to="/community"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>👥</span> Community
              </Link>
              <Link
                to="/learning"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>📚</span> Learning Hub
              </Link>
              {user.isAdmin && (
                <>
                  <hr className="border-gray-200" />
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>⚙️</span> Admin Panel
                  </Link>
                </>
              )}
              <hr className="border-gray-200" />
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span>🚪</span> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>🏠</span> Home
              </Link>
              <Link
                to="/about"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>ℹ️</span> About
              </Link>
              <Link
                to="/contact"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>📧</span> Contact
              </Link>
              <hr className="border-gray-200" />
              <button
                onClick={() => {
                  navigate('/login');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-primary-600 hover:bg-gray-100 rounded-md"
              >
                Login
              </button>
              <button
                onClick={() => {
                  navigate('/register');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;