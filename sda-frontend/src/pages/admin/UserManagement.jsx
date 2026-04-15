// src/pages/admin/UserManagement.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getUsers, 
  suspendUser,
  toggleModerator,
  adminResetPassword,
  deleteUser,
} from '../../services/api';
import Avatar from '../../components/common/Avatar';

function UserManagement() {
  const { user: currentUser } = useAuth();
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
      if (window.confirm(`Grant moderator privileges to ${selectedUsers.length} users?`)) {
        alert('Bulk make moderator not yet implemented');
      }
    } else if (action === 'removeModerator') {
      if (window.confirm(`Remove moderator privileges from ${selectedUsers.length} users?`)) {
        alert('Bulk remove moderator not yet implemented');
      }
    }
  };

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

  const canEditUser = (targetUser) => {
    if (!currentUser) return false;
    if (currentUser.isSuperAdmin) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-blue-500">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
              <p className="text-sm text-gray-500">Manage users, roles, and permissions</p>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="flex gap-3">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 px-5 py-3 text-center min-w-[90px]">
            <div className="text-2xl font-bold text-gray-800">{users.length}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total</div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 px-5 py-3 text-center min-w-[90px]">
            <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.isSuperAdmin).length}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Admins</div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 px-5 py-3 text-center min-w-[90px]">
            <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.isModerator && !u.isSuperAdmin).length}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Mods</div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 px-5 py-3 text-center min-w-[90px]">
            <div className="text-2xl font-bold text-red-600">{users.filter(u => u.isSuspended).length}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Suspended</div>
          </div>
        </div>
      </div>

      {/* Filters and Actions Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl w-72 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
            />
          </div>
          
          <select
            value={filters.role}
            onChange={(e) => setFilters({...filters, role: e.target.value})}
            className="px-4 py-2.5 bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="moderator">Moderator</option>
            <option value="member">Member</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-4 py-2.5 bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 px-4 py-2">
            <span className="text-sm font-semibold text-gray-700">{selectedUsers.length} selected</span>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button 
              onClick={() => handleBulkAction('suspend')}
              className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Suspend
            </button>
            <button 
              onClick={() => handleBulkAction('makeModerator')}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Make Mod
            </button>
            <button 
              onClick={() => handleBulkAction('removeModerator')}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove Mod
            </button>
            <button 
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-4 font-semibold text-gray-600">User</th>
                <th className="text-left px-4 py-4 font-semibold text-gray-600">Contact</th>
                <th className="text-left px-4 py-4 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-4 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-4 font-semibold text-gray-600">Joined</th>
                <th className="text-left px-4 py-4 font-semibold text-gray-600">Last Active</th>
                <th className="text-left px-4 py-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map(user => {
                const isSuperAdmin = user.isSuperAdmin === true;
                const isModerator = user.isModerator === true && !isSuperAdmin;
                const isMember = !isSuperAdmin && !isModerator;
                const isCurrentUser = currentUser?.id === user.id;

                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        disabled={isSuperAdmin && isCurrentUser}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={normalizeUserForAvatar(user)} size="medium" />
                        <div>
                          <div className="font-semibold text-gray-800">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{user.phone || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isSuperAdmin ? 'bg-purple-100 text-purple-700' :
                        isModerator ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {isSuperAdmin && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                        {isModerator && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                        {isMember && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                        {isSuperAdmin ? 'Super Admin' : isModerator ? 'Moderator' : 'Member'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {user.isSuspended ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {user.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                        {user.suspendedUntil && (
                          <div className="text-xs text-gray-400 mt-1">
                            until {new Date(user.suspendedUntil).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        {!isSuperAdmin && canEditUser(user) && (
                          <button
                            onClick={() => handleToggleModerator(user.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                            title={isModerator ? 'Remove Moderator' : 'Make Moderator'}
                          >
                            {isModerator ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                          title="Reset Password"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
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
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200"
                            title="Suspend"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnsuspendUser(user.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200"
                            title="Unsuspend"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        
                        {!isSuperAdmin && canEditUser(user) && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                            title="Delete User"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="text-gray-500 font-medium text-lg">No users found</div>
            <div className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up border border-white/50" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl flex justify-between items-center p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">User Profile</h2>
              </div>
              <button onClick={() => setShowUserModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-5 mb-8">
                <Avatar user={normalizeUserForAvatar(selectedUser)} size="xlarge" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-3">
                    {selectedUser.isSuperAdmin && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Super Admin
                      </span>
                    )}
                    {selectedUser.isModerator && !selectedUser.isSuperAdmin && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Moderator
                      </span>
                    )}
                    {selectedUser.isSuspended && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Suspended
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Phone
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{selectedUser.phone || 'Not provided'}</div>
                </div>
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{selectedUser.locationName || 'Not set'}</div>
                </div>
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Age
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{selectedUser.age || 'Not provided'}</div>
                </div>
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Gender
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{selectedUser.gender || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Joined
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last Active
                  </div>
                  <div className="text-sm font-semibold text-gray-700">
                    {selectedUser.lastActiveAt ? new Date(selectedUser.lastActiveAt).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </div>

              {selectedUser.isSuspended && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
                  <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Suspension Details
                  </h4>
                  <p className="text-sm text-red-700 mb-1"><span className="font-semibold">Reason:</span> {selectedUser.suspensionReason || 'No reason provided'}</p>
                  <p className="text-sm text-red-700">
                    <span className="font-semibold">Until:</span> {selectedUser.suspendedUntil 
                      ? new Date(selectedUser.suspendedUntil).toLocaleDateString()
                      : 'Permanent'}
                  </p>
                </div>
              )}

              {selectedUser.adminNotes && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Admin Notes
                  </h4>
                  <p className="text-sm text-amber-700 whitespace-pre-wrap">{selectedUser.adminNotes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
                {!selectedUser.isSuperAdmin && canEditUser(selectedUser) && (
                  <button
                    onClick={() => handleToggleModerator(selectedUser.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {selectedUser.isModerator ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Remove Moderator
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Make Moderator
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleResetPassword(selectedUser.id)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-600 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Reset Password
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Suspend User
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnsuspendUser(selectedUser.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Unsuspend User
                  </button>
                )}
                {!selectedUser.isSuperAdmin && canEditUser(selectedUser) && (
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog (suspend) */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowConfirmDialog(false)}>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full border border-white/50 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {confirmAction.type === 'suspend' ? 'Suspend User' : 'Confirm Bulk Action'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {confirmAction.type === 'suspend' 
                      ? `Suspend ${confirmAction.user?.name}?`
                      : `Suspend ${selectedUsers.length} selected users?`
                    }
                  </p>
                </div>
              </div>
              
              {(confirmAction.type === 'suspend' || confirmAction.type === 'bulk_suspend') && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for suspension:</label>
                    <textarea
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Enter reason..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration:</label>
                    <select
                      value={suspendDuration}
                      onChange={(e) => setSuspendDuration(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 cursor-pointer"
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
                      className="flex-1 px-5 py-3 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Confirm Suspension
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmDialog(false);
                        setSuspendReason('');
                        setSuspendDuration('7');
                      }}
                      className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-200"
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