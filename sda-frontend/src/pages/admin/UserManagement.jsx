// src/pages/admin/UserManagement.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getUsers, 
  suspendUser,
  toggleModerator,           // ✅ changed from toggleAdmin
  adminResetPassword,
  deleteUser,
} from '../../services/api';
import Avatar from '../../components/common/Avatar';

function UserManagement() {
  const { user: currentUser } = useAuth(); // logged-in user (should be super admin)
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
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('7');

  // Normalize user for Avatar component
  const normalizeUserForAvatar = (userData) => {
    if (!userData) return null;
    return {
      name: userData.name || userData.username || 'Unknown',
      avatarUrl: userData.avatarUrl || userData.avatar || null
    };
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers({ page: 1, limit: 100 });
      
      const processedUsers = (response.data.users || []).map(user => ({
        ...user,
        // ensure avatarUrl exists
        avatarUrl: user.avatarUrl || null
      }));
      
      setUsers(processedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to fetch users'}`);
    } finally {
      setLoading(false);
    }
  };

  // Suspension handler (works for both suspend & unsuspend)
  const handleSuspendUser = async (userId, reason, duration) => {
    try {
      // suspendUser API expects { suspend: true, reason, until? }
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

  // ✅ Toggle moderator (only for super admin)
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

  // Bulk selection logic
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
      setSelectAll(false);
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      alert('No users selected');
      return;
    }

    if (action === 'delete') {
      if (window.confirm(`⚠️ Delete ${selectedUsers.length} users? This cannot be undone.`)) {
        alert('Bulk delete not yet implemented');
      }
    } else if (action === 'suspend') {
      setConfirmAction({
        type: 'bulk_suspend',
        onConfirm: (reason, duration) => {
          // Implement bulk suspend logic here (call backend)
          alert(`Would suspend ${selectedUsers.length} users`);
          setShowConfirmDialog(false);
          setSelectedUsers([]);
          setSelectAll(false);
          setSuspendReason('');
          setSuspendDuration('7');
        }
      });
      setShowConfirmDialog(true);
    } else if (action === 'makeModerator') {
      // Bulk make moderator (only super admin)
      if (window.confirm(`Grant moderator privileges to ${selectedUsers.length} users?`)) {
        // TODO: implement bulk makeModerator API call
        alert('Bulk make moderator not yet implemented');
      }
    } else if (action === 'removeModerator') {
      if (window.confirm(`Remove moderator privileges from ${selectedUsers.length} users?`)) {
        alert('Bulk remove moderator not yet implemented');
      }
    }
  };

  // Filter users based on search and role/status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
    
    let matchesRole = true;
    if (filters.role === 'superadmin') {
      matchesRole = user.isSuperAdmin === true;
    } else if (filters.role === 'moderator') {
      matchesRole = user.isModerator === true && !user.isSuperAdmin;
    } else if (filters.role === 'member') {
      matchesRole = !user.isSuperAdmin && !user.isModerator;
    }
    
    let matchesStatus = true;
    if (filters.status === 'active') {
      matchesStatus = user.isSuspended === false;
    } else if (filters.status === 'suspended') {
      matchesStatus = user.isSuspended === true;
    }
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Helper to determine if current user can edit another user
  const canEditUser = (targetUser) => {
    if (!currentUser) return false;
    // Super admin can edit anyone except themselves? We'll allow but backend will prevent self-demotion.
    if (currentUser.isSuperAdmin) return true;
    return false; // only super admin can access this page anyway (protected by route)
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">👥</span>
            User Management
          </h1>
          <p className="text-gray-500 mt-1">Manage users, roles, and permissions</p>
        </div>
        
        {/* Stats Cards */}
        <div className="flex gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center min-w-[100px] border border-gray-100">
            <div className="text-2xl font-bold text-primary-600">{users.length}</div>
            <div className="text-xs text-gray-500">Total Users</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center min-w-[100px] border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.isSuperAdmin).length}</div>
            <div className="text-xs text-gray-500">Super Admins</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center min-w-[100px] border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.isModerator && !u.isSuperAdmin).length}</div>
            <div className="text-xs text-gray-500">Moderators</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center min-w-[100px] border border-gray-100">
            <div className="text-2xl font-bold text-red-600">{users.filter(u => u.isSuspended).length}</div>
            <div className="text-xs text-gray-500">Suspended</div>
          </div>
        </div>
      </div>

      {/* Filters and Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.role}
            onChange={(e) => setFilters({...filters, role: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="moderator">Moderator</option>
            <option value="member">Member</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-gray-700">{selectedUsers.length} selected</span>
            <button 
              onClick={() => handleBulkAction('suspend')}
              className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition"
            >
              ⛔ Suspend
            </button>
            <button 
              onClick={() => handleBulkAction('makeModerator')}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition"
            >
              🛡️ Make Moderator
            </button>
            <button 
              onClick={() => handleBulkAction('removeModerator')}
              className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition"
            >
              🔽 Remove Moderator
            </button>
            <button 
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">User</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Joined</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Last Active</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map(user => {
                const isSuperAdmin = user.isSuperAdmin === true;
                const isModerator = user.isModerator === true && !isSuperAdmin;
                const isMember = !isSuperAdmin && !isModerator;
                const isCurrentUser = currentUser?.id === user.id;

                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        disabled={isSuperAdmin && isCurrentUser} // cannot select yourself
                        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={normalizeUserForAvatar(user)} size="medium" />
                        <div>
                          <div className="font-medium text-gray-800">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{user.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isSuperAdmin ? 'bg-purple-100 text-purple-700' :
                        isModerator ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {isSuperAdmin ? '👑 Super Admin' : isModerator ? '🛡️ Moderator' : '👤 Member'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {user.isSuspended ? '⛔ Suspended' : '✅ Active'}
                        </span>
                        {user.suspendedUntil && (
                          <div className="text-xs text-gray-400 mt-1">
                            until {new Date(user.suspendedUntil).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-primary-500 rounded-md transition"
                          title="View Details"
                        >
                          👁️
                        </button>
                        
                        {/* Only show toggle moderator if not super admin and not current user */}
                        {!isSuperAdmin && canEditUser(user) && (
                          <button
                            onClick={() => handleToggleModerator(user.id)}
                            className="p-1.5 text-gray-400 hover:text-primary-500 rounded-md transition"
                            title={isModerator ? 'Remove Moderator' : 'Make Moderator'}
                          >
                            {isModerator ? '🔽' : '🛡️'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="p-1.5 text-gray-400 hover:text-primary-500 rounded-md transition"
                          title="Reset Password"
                        >
                          🔑
                        </button>
                        
                        {!user.isSuspended ? (
                          <button
                            onClick={() => {
                              setConfirmAction({
                                type: 'suspend',
                                user: user,
                                onConfirm: (reason, duration) => handleSuspendUser(user.id, reason, duration)
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
                            onClick={() => handleUnsuspendUser(user.id)}
                            className="p-1.5 text-gray-400 hover:text-green-500 rounded-md transition"
                            title="Unsuspend"
                          >
                            ✅
                          </button>
                        )}
                        
                        {!isSuperAdmin && canEditUser(user) && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
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

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">User Profile</h2>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar user={normalizeUserForAvatar(selectedUser)} size="xlarge" />
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
                  <div className="text-xs text-gray-400 mb-1">📅 Joined</div>
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
                {!selectedUser.isSuperAdmin && canEditUser(selectedUser) && (
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
                    ⛔ Suspend User
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnsuspendUser(selectedUser.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                  >
                    ✅ Unsuspend User
                  </button>
                )}
                {!selectedUser.isSuperAdmin && canEditUser(selectedUser) && (
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

      {/* Confirmation Dialog (suspend) */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirmDialog(false)}>
          <div className="bg-white rounded-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⚠️</span>
                <h3 className="text-xl font-bold text-gray-800">
                  {confirmAction.type === 'suspend' ? 'Suspend User' : 'Confirm Bulk Action'}
                </h3>
              </div>
              
              {(confirmAction.type === 'suspend' || confirmAction.type === 'bulk_suspend') && (
                <div>
                  <p className="text-gray-600 mb-4">
                    {confirmAction.type === 'suspend' 
                      ? `Suspend ${confirmAction.user?.name}?`
                      : `Suspend ${selectedUsers.length} selected users?`
                    }
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

export default UserManagement;