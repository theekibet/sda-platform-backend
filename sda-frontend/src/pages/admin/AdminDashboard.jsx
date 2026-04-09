// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getDashboardStats, 
  getUsers, 
  suspendUser,
  toggleModerator,
  adminResetPassword,
  deleteUser,
} from '../../services/api';
import Avatar from '../../components/common/Avatar';
import ModeratorDashboard from './ModeratorDashboard'; // ✅ import moderator dashboard

function AdminDashboard() {
  const { user, isSuperAdmin } = useAuth();

  // ✅ If not super admin, show moderator dashboard
  if (!isSuperAdmin) {
    return <ModeratorDashboard />;
  }

  // === Everything below is only for super admin ===
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('7');

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId, reason, duration) => {
    try {
      const until = duration !== 'permanent' 
        ? new Date(Date.now() + parseInt(duration) * 86400000).toISOString()
        : undefined;
      await suspendUser(userId, { suspend: true, reason, until });
      fetchUsers();
      setShowConfirmDialog(false);
      setSuspendReason('');
      setSuspendDuration('7');
      alert('User suspended successfully');
    } catch (error) {
      alert('Error suspending user: ' + error.message);
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await suspendUser(userId, { suspend: false });
      fetchUsers();
      alert('User unsuspended successfully');
    } catch (error) {
      alert('Error unsuspending user: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('⚠️ This action is irreversible. All user data will be permanently deleted. Continue?')) {
      try {
        await deleteUser(userId);
        fetchUsers();
        alert('User deleted successfully');
      } catch (error) {
        alert('Error deleting user: ' + error.message);
      }
    }
  };

  const handleToggleModerator = async (userId) => {
    try {
      await toggleModerator(userId);
      fetchUsers();
      alert('Moderator status updated');
    } catch (error) {
      alert('Error updating moderator status: ' + error.message);
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new temporary password (min 8 characters):');
    if (newPassword && newPassword.length >= 8) {
      try {
        await adminResetPassword({ userId, newPassword });
        alert('Password reset successful');
      } catch (error) {
        alert('Error resetting password: ' + error.message);
      }
    }
  };

  const filteredUsers = users.filter(userItem => {
    const matchesSearch = 
      userItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.phone?.includes(searchTerm);
    
    let matchesRole = true;
    if (filters.role === 'superadmin') {
      matchesRole = userItem.isSuperAdmin === true;
    } else if (filters.role === 'moderator') {
      matchesRole = userItem.isModerator === true && !userItem.isSuperAdmin;
    } else if (filters.role === 'member') {
      matchesRole = !userItem.isSuperAdmin && !userItem.isModerator;
    }
    
    let matchesStatus = true;
    if (filters.status === 'active') {
      matchesStatus = userItem.isSuspended === false;
    } else if (filters.status === 'suspended') {
      matchesStatus = userItem.isSuspended === true;
    }
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-purple-600 mb-1">👑 Admin Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name}</p>
      </div>

      {/* Quick Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <span className="text-4xl">👥</span>
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Total Users</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.users?.total || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <span className="text-4xl">📝</span>
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Forum Posts</h3>
              <p className="text-2xl font-bold text-gray-800">—</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <span className="text-4xl">🙏</span>
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Prayer Requests</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.content?.prayerRequests || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <span className="text-4xl">🤝</span>
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Groups</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.content?.groups || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Management Section (only for super admin) */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">User Management</h2>
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <select
                value={filters.role}
                onChange={(e) => setFilters({...filters, role: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Roles</option>
                <option value="superadmin">Super Admin</option>
                <option value="moderator">Moderator</option>
                <option value="member">Member</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map(userItem => {
                const isSuperAdmin = userItem.isSuperAdmin === true;
                const isModerator = userItem.isModerator === true && !isSuperAdmin;
                
                return (
                  <tr key={userItem.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={userItem} size="medium" />
                        <div>
                          <div className="font-medium text-gray-800">{userItem.name}</div>
                          <div className="text-xs text-gray-400">{userItem.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{userItem.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isSuperAdmin ? 'bg-purple-100 text-purple-700' :
                        isModerator ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {isSuperAdmin ? '👑 Super Admin' : isModerator ? '🛡️ Moderator' : '👤 Member'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        userItem.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {userItem.isSuspended ? '⛔ Suspended' : '✅ Active'}
                      </span>
                      {userItem.suspendedUntil && (
                        <div className="text-xs text-gray-400 mt-1">
                          until {new Date(userItem.suspendedUntil).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(userItem);
                            setShowUserModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-primary-500 rounded-md transition"
                          title="View Details"
                        >
                          👁️
                        </button>
                        {!isSuperAdmin && (
                          <button
                            onClick={() => handleToggleModerator(userItem.id)}
                            className="p-1.5 text-gray-400 hover:text-primary-500 rounded-md transition"
                            title={isModerator ? 'Remove Moderator' : 'Make Moderator'}
                          >
                            {isModerator ? '🔽' : '🛡️'}
                          </button>
                        )}
                        <button
                          onClick={() => handleResetPassword(userItem.id)}
                          className="p-1.5 text-gray-400 hover:text-primary-500 rounded-md transition"
                          title="Reset Password"
                        >
                          🔑
                        </button>
                        {!userItem.isSuspended ? (
                          <button
                            onClick={() => {
                              setConfirmAction({
                                type: 'suspend',
                                user: userItem,
                                onConfirm: (reason, duration) => handleSuspendUser(userItem.id, reason, duration)
                              });
                              setShowConfirmDialog(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-yellow-500 rounded-md transition"
                            title="Suspend"
                          >
                            ⛔
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnsuspendUser(userItem.id)}
                            className="p-1.5 text-gray-400 hover:text-green-500 rounded-md transition"
                            title="Unsuspend"
                          >
                            ✅
                          </button>
                        )}
                        {!isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteUser(userItem.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-md transition"
                            title="Delete User"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🔍</div>
            <div className="text-gray-500 font-medium">No users found</div>
            <div className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</div>
          </div>
        )}
      </div>

      {/* User Details Modal (same as before) */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">User Details</h2>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar user={selectedUser} size="xlarge" />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedUser.isSuperAdmin && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Super Admin</span>
                    )}
                    {selectedUser.isModerator && !selectedUser.isSuperAdmin && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Moderator</span>
                    )}
                    {selectedUser.isSuspended && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Suspended</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">📞 Phone</div>
                  <div className="text-sm font-medium text-gray-700">{selectedUser.phone || 'Not provided'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">📍 Location</div>
                  <div className="text-sm font-medium text-gray-700">{selectedUser.locationName || 'Not set'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">🎂 Age</div>
                  <div className="text-sm font-medium text-gray-700">{selectedUser.age || 'Not provided'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">⚥ Gender</div>
                  <div className="text-sm font-medium text-gray-700">{selectedUser.gender || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">📅 Member Since</div>
                  <div className="text-sm font-medium text-gray-700">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">⏱️ Last Active</div>
                  <div className="text-sm font-medium text-gray-700">
                    {selectedUser.lastActiveAt ? new Date(selectedUser.lastActiveAt).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </div>

              {selectedUser.isSuspended && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-red-800 mb-2">⛔ Suspension Details</h4>
                  <p className="text-sm text-red-700"><strong>Reason:</strong> {selectedUser.suspensionReason || 'No reason provided'}</p>
                  <p className="text-sm text-red-700 mt-1">
                    <strong>Until:</strong> {selectedUser.suspendedUntil 
                      ? new Date(selectedUser.suspendedUntil).toLocaleDateString()
                      : 'Permanent'}
                  </p>
                </div>
              )}

              {selectedUser.adminNotes && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-700 mb-2">📝 Admin Notes</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedUser.adminNotes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {!selectedUser.isSuperAdmin && (
                  <button
                    onClick={() => handleToggleModerator(selectedUser.id)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-sm"
                  >
                    {selectedUser.isModerator ? '🔽 Remove Moderator' : '🛡️ Make Moderator'}
                  </button>
                )}
                <button
                  onClick={() => handleResetPassword(selectedUser.id)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  🔑 Reset Password
                </button>
                {!selectedUser.isSuspended ? (
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setConfirmAction({
                        type: 'suspend',
                        user: selectedUser,
                        onConfirm: (reason, duration) => handleSuspendUser(selectedUser.id, reason, duration)
                      });
                      setShowConfirmDialog(true);
                    }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm"
                  >
                    ⛔ Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnsuspendUser(selectedUser.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                  >
                    ✅ Unsuspend
                  </button>
                )}
                {!selectedUser.isSuperAdmin && (
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                  >
                    🗑️ Delete User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirmDialog(false)}>
          <div className="bg-white rounded-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⚠️</span>
                <h3 className="text-xl font-bold text-gray-800">
                  {confirmAction.type === 'suspend' ? 'Suspend User' : 'Confirm Action'}
                </h3>
              </div>
              
              {confirmAction.type === 'suspend' && (
                <div>
                  <p className="text-gray-600 mb-4">
                    Suspend <strong>{confirmAction.user?.name}</strong>?
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for suspension:</label>
                    <textarea
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Enter reason..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration:</label>
                    <select
                      value={suspendDuration}
                      onChange={(e) => setSuspendDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="1">1 day</option>
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="permanent">Permanent</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (suspendReason.trim()) {
                          confirmAction.onConfirm(suspendReason, suspendDuration);
                          setSuspendReason('');
                          setSuspendDuration('7');
                        } else {
                          alert('Please provide a reason');
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                    >
                      Confirm Suspension
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmDialog(false);
                        setSuspendReason('');
                        setSuspendDuration('7');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;