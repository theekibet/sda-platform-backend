// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

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

  const adminLinks = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/users', icon: '👥', label: 'User Management' },
    { path: '/admin/moderation', icon: '📝', label: 'Content Moderation' },
    { path: '/admin/bible/queue', icon: '📖', label: 'Verse Moderation' },
    { path: '/admin/announcements', icon: '📢', label: 'Announcements' },
    { path: '/admin/analytics', icon: '📈', label: 'Analytics' },
    { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
    { path: '/admin/security/ip', icon: '🔒', label: 'IP Blocking' },
    { path: '/admin/security/sessions', icon: '🖥️', label: 'Sessions' },
    { path: '/admin/security/attempts', icon: '🔐', label: 'Login Attempts' },
    { path: '/admin/backups', icon: '💾', label: 'Backups' },
    { path: '/admin/health', icon: '🏥', label: 'System Health' },
  ];

  if (!user) return null;

  return (
    <>
      {/* Overlay (only on mobile when sidebar is open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:z-0
        `}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Menu</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl md:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="p-4 space-y-6 overflow-y-auto h-full">
          {!isAdmin && (
            <>
              {/* Main Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Main
                </h4>
                {memberLinks.map(link => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`
                    }
                    onClick={onClose}
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>

              {/* Bible Tools Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  📖 Bible Tools
                </h4>
                {bibleLinks.map(link => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`
                    }
                    onClick={onClose}
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>
            </>
          )}

          {isAdmin && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                👑 Admin Panel
              </h4>
              {adminLinks.map(link => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                  onClick={onClose}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;