// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, hasModeratorAccess, isSuperAdmin, isModerator } = useAuth();
  const location = useLocation();

  const memberLinks = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/prayer-wall', icon: '🙏', label: 'Prayer Wall' },
    { path: '/groups', icon: '🤝', label: 'Groups' },
    { path: '/community', icon: '📢', label: 'Community Board' },
  ];

  const bibleLinks = [
    { path: '/bible/reader', icon: '📖', label: 'Bible Reader' },
    { path: '/bible/queue', icon: '⏳', label: 'Verse Queue' },
    { path: '/bookmarks', icon: '🔖', label: 'Bookmarks' },
    { path: '/my-submissions', icon: '📤', label: 'My Shared Verses' },
    { path: '/learning', icon: '📚', label: 'Learning Hub' },
  ];

  // Links available to all moderators (including super admins) – no duplicate Dashboard
  const moderatorLinks = [
    { path: '/admin/moderation', icon: '📝', label: 'Content Moderation' },
    { path: '/admin/bible/queue', icon: '📖', label: 'Verse Moderation' },
    { path: '/admin/announcements', icon: '📢', label: 'Announcements' },
    { path: '/admin/analytics', icon: '📈', label: 'Analytics' },
    { path: '/admin/security/sessions', icon: '🖥️', label: 'Sessions (View Only)' },
    { path: '/admin/security/attempts', icon: '🔐', label: 'Login Attempts' },
    { path: '/admin/health', icon: '🏥', label: 'System Health' },
  ];

  // Links only for super admins
  const superAdminLinks = [
    { path: '/admin/users', icon: '👥', label: 'User Management' },
    { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
    { path: '/admin/security/ip', icon: '🔒', label: 'IP Blocking' },
    { path: '/admin/backups', icon: '💾', label: 'Backups' },
  ];

  if (!user) return null;

  const NavLinkItem = ({ link, onClick }) => (
    <NavLink
      key={link.path}
      to={link.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
      onClick={onClick}
    >
      <span className="text-xl leading-none w-6">{link.icon}</span>
      <span>{link.label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Overlay (only on mobile when sidebar is open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:z-0
        `}
      >
        {/* Sidebar Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-lg font-bold text-gray-800">Imani Hub</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100 md:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
          {/* ✅ Fixed role badge: Super Admin first, then Moderator */}
          {isSuperAdmin && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Super Admin</span>
            </div>
          )}
          {!isSuperAdmin && isModerator && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Moderator</span>
            </div>
          )}
        </div>

        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100%-180px)]">
          {/* Main Section */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Main
            </h4>
            {memberLinks.map(link => (
              <NavLinkItem key={link.path} link={link} onClick={onClose} />
            ))}
          </div>

          {/* Bible Tools Section */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Bible Tools
            </h4>
            {bibleLinks.map(link => (
              <NavLinkItem key={link.path} link={link} onClick={onClose} />
            ))}
          </div>

          {/* Moderation Tools Section (for both moderators and super admins) */}
          {hasModeratorAccess && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Moderation
              </h4>
              {moderatorLinks.map(link => (
                <NavLinkItem key={link.path} link={link} onClick={onClose} />
              ))}
            </div>
          )}

          {/* Super Admin Section (only for super admins) */}
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Administration
              </h4>
              {superAdminLinks.map(link => (
                <NavLinkItem key={link.path} link={link} onClick={onClose} />
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;