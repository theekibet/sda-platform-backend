// src/pages/admin/UserManagement.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getUsers, 
  suspendUser,
  toggleAdmin,
  adminResetPassword,
  deleteUser,
} from '../../services/api';
import Avatar from '../../components/common/Avatar';
import '../../styles/admin/UserManagement.css'; // Import the CSS file

function UserManagement() {
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers({ page: 1, limit: 100 });
      
      // Process users to ensure avatar URLs are properly formatted
      const processedUsers = (response.data.users || []).map(user => ({
        ...user,
        avatarUrl: user.avatarUrl || null
      }));
      
      setUsers(processedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response) {
        alert(`Error: ${error.response.data.message || 'Failed to fetch users'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId, reason, duration) => {
    try {
      await suspendUser(userId, { reason, duration });
      fetchUsers();
      setShowConfirmDialog(false);
      alert('User suspended successfully');
    } catch (error) {
      alert('Error suspending user: ' + error.message);
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

  const handleToggleAdmin = async (userId) => {
    try {
      await toggleAdmin(userId);
      fetchUsers();
      alert('Admin status updated');
    } catch (error) {
      alert('Error updating admin status: ' + error.message);
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
        // Implement bulk delete
        alert('Bulk delete not yet implemented');
      }
    } else if (action === 'suspend') {
      setConfirmAction({
        type: 'bulk_suspend',
        onConfirm: (reason, duration) => {
          // Implement bulk suspend
          alert(`Would suspend ${selectedUsers.length} users`);
          setShowConfirmDialog(false);
          setSelectedUsers([]);
          setSelectAll(false);
        }
      });
      setShowConfirmDialog(true);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
    
    let matchesRole = true;
    if (filters.role === 'admin') {
      matchesRole = user.isAdmin === true;
    } else if (filters.role === 'moderator') {
      matchesRole = user.isModerator === true;
    } else if (filters.role === 'user') {
      matchesRole = !user.isAdmin && !user.isModerator;
    }
    
    let matchesStatus = true;
    if (filters.status === 'active') {
      matchesStatus = user.isSuspended === false;
    } else if (filters.status === 'suspended') {
      matchesStatus = user.isSuspended === true;
    }
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="user-management-loading-container">
        <div className="user-management-loading-spinner"></div>
        <div className="user-management-loading-text">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Header Section */}
      <div className="user-management-header">
        <div className="user-management-header-left">
          <h1 className="user-management-title">
            <span className="user-management-title-icon">👥</span>
            User Management
          </h1>
          <p className="user-management-subtitle">
            Manage users, roles, and permissions
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="user-management-stats-container">
          <div className="user-management-stat-card">
            <span className="user-management-stat-value">{users.length}</span>
            <span className="user-management-stat-label">Total Users</span>
          </div>
          <div className="user-management-stat-card">
            <span className="user-management-stat-value">{users.filter(u => u.isAdmin).length}</span>
            <span className="user-management-stat-label">Admins</span>
          </div>
          <div className="user-management-stat-card">
            <span className="user-management-stat-value">{users.filter(u => u.isSuspended).length}</span>
            <span className="user-management-stat-label">Suspended</span>
          </div>
        </div>
      </div>

      {/* Filters and Actions Bar */}
      <div className="user-management-filters-bar">
        <div className="user-management-search-section">
          <div className="user-management-search-wrapper">
            <span className="user-management-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-management-search-input"
            />
          </div>
          
          <select
            value={filters.role}
            onChange={(e) => setFilters({...filters, role: e.target.value})}
            className="user-management-filter-select"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="user">User</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="user-management-filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {selectedUsers.length > 0 && (
          <div className="user-management-bulk-actions">
            <span className="user-management-selected-count">{selectedUsers.length} selected</span>
            <button 
              onClick={() => handleBulkAction('suspend')}
              className="user-management-bulk-suspend-button"
            >
              ⛔ Suspend Selected
            </button>
            <button 
              onClick={() => handleBulkAction('delete')}
              className="user-management-bulk-delete-button"
            >
              🗑️ Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="user-management-table-container">
        <table className="user-management-table">
          <thead className="user-management-table-head">
            <tr>
              <th className="user-management-checkbox-cell">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="user-management-checkbox"
                />
              </th>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="user-management-table-row">
                <td className="user-management-checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                    className="user-management-checkbox"
                  />
                </td>
                <td>
                  <div className="user-management-user-cell">
                    <Avatar user={user} size="small" />
                    <div className="user-management-user-info">
                      <div className="user-management-user-name">{user.name}</div>
                      <div className="user-management-user-email">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="user-management-contact-info">
                    <div>{user.phone || '—'}</div>
                    {user.city && <div className="user-management-user-location">📍 {user.city}</div>}
                  </div>
                </td>
                <td>
                  <span className={`user-management-role-badge ${user.isAdmin ? 'user-management-admin-role' : ''} ${user.isModerator ? 'user-management-moderator-role' : ''}`}>
                    {user.isAdmin ? 'Admin' : user.isModerator ? 'Moderator' : 'User'}
                  </span>
                </td>
                <td>
                  <span className={`user-management-status-badge ${user.isSuspended ? 'user-management-suspended-status' : 'user-management-active-status'}`}>
                    {user.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                  {user.suspendedUntil && (
                    <div className="user-management-suspended-until">
                      until {new Date(user.suspendedUntil).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td>
                  <div className="user-management-date-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <div className="user-management-date-cell">
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
                  </div>
                </td>
                <td>
                  <div className="user-management-action-buttons">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="user-management-action-button"
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handleToggleAdmin(user.id)}
                      className="user-management-action-button"
                      title={user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    >
                      {user.isAdmin ? '👑' : '⭐'}
                    </button>
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      className="user-management-action-button"
                      title="Reset Password"
                    >
                      🔑
                    </button>
                    <button
                      onClick={() => {
                        setConfirmAction({
                          type: 'suspend',
                          user: user,
                          onConfirm: (reason, duration) => handleSuspendUser(user.id, reason, duration)
                        });
                        setShowConfirmDialog(true);
                      }}
                      className={`user-management-action-button ${user.isSuspended ? 'user-management-unsuspend-button' : 'user-management-suspend-button'}`}
                      title={user.isSuspended ? 'Unsuspend' : 'Suspend'}
                    >
                      {user.isSuspended ? '✅' : '⛔'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="user-management-action-button user-management-delete-button"
                      title="Delete User"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="user-management-no-results">
            <div className="user-management-no-results-icon">🔍</div>
            <h3>No users found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="user-management-modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="user-management-modal" onClick={e => e.stopPropagation()}>
            <div className="user-management-modal-header">
              <h2 className="user-management-modal-title">User Profile</h2>
              <button onClick={() => setShowUserModal(false)} className="user-management-modal-close">✕</button>
            </div>
            
            <div className="user-management-modal-body">
              <div className="user-management-profile-header">
                <Avatar user={selectedUser} size="xlarge" />
                <div className="user-management-profile-title">
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.email}</p>
                  <div className="user-management-profile-badges">
                    {selectedUser.isAdmin && <span className="user-management-profile-admin-badge">Admin</span>}
                    {selectedUser.isSuspended && <span className="user-management-profile-suspended-badge">Suspended</span>}
                  </div>
                </div>
              </div>

              <div className="user-management-info-grid">
                <div className="user-management-info-card">
                  <div className="user-management-info-label">📞 Phone</div>
                  <div className="user-management-info-value">{selectedUser.phone || 'Not provided'}</div>
                </div>
                <div className="user-management-info-card">
                  <div className="user-management-info-label">📍 Location</div>
                  <div className="user-management-info-value">
                    {[selectedUser.city, selectedUser.region, selectedUser.country]
                      .filter(Boolean).join(', ') || 'Not set'}
                  </div>
                </div>
                <div className="user-management-info-card">
                  <div className="user-management-info-label">🎂 Age</div>
                  <div className="user-management-info-value">{selectedUser.age || 'Not provided'}</div>
                </div>
                <div className="user-management-info-card">
                  <div className="user-management-info-label">⚥ Gender</div>
                  <div className="user-management-info-value">{selectedUser.gender || 'Not specified'}</div>
                </div>
                <div className="user-management-info-card">
                  <div className="user-management-info-label">📅 Joined</div>
                  <div className="user-management-info-value">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="user-management-info-card">
                  <div className="user-management-info-label">⏱️ Last Active</div>
                  <div className="user-management-info-value">
                    {selectedUser.lastActiveAt 
                      ? new Date(selectedUser.lastActiveAt).toLocaleDateString()
                      : 'Never'}
                  </div>
                </div>
              </div>

              {selectedUser.isSuspended && (
                <div className="user-management-suspension-card">
                  <h4 className="user-management-suspension-title">⛔ Suspension Details</h4>
                  <p><strong>Reason:</strong> {selectedUser.suspensionReason}</p>
                  <p><strong>Until:</strong> {selectedUser.suspendedUntil 
                    ? new Date(selectedUser.suspendedUntil).toLocaleDateString()
                    : 'Permanent'}</p>
                </div>
              )}

              {selectedUser.adminNotes && (
                <div className="user-management-notes-card">
                  <h4 className="user-management-notes-title">📝 Admin Notes</h4>
                  <p>{selectedUser.adminNotes}</p>
                </div>
              )}

              <div className="user-management-modal-actions">
                <button
                  onClick={() => handleToggleAdmin(selectedUser.id)}
                  className="user-management-modal-button"
                >
                  {selectedUser.isAdmin ? '👑 Remove Admin' : '⭐ Make Admin'}
                </button>
                <button
                  onClick={() => handleResetPassword(selectedUser.id)}
                  className="user-management-modal-button"
                >
                  🔑 Reset Password
                </button>
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
                  className={`user-management-modal-button ${selectedUser.isSuspended ? 'user-management-modal-unsuspend-button' : 'user-management-modal-suspend-button'}`}
                >
                  {selectedUser.isSuspended ? '✅ Unsuspend User' : '⛔ Suspend User'}
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="user-management-modal-button user-management-modal-delete-button"
                >
                  🗑️ Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="user-management-modal-overlay" onClick={() => setShowConfirmDialog(false)}>
          <div className="user-management-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="user-management-confirm-header">
              <span className="user-management-confirm-icon">⚠️</span>
              <h3 className="user-management-confirm-title">
                {confirmAction.type === 'suspend' ? 'Suspend User' : 'Confirm Action'}
              </h3>
            </div>
            
            {confirmAction.type === 'suspend' && (
              <div className="user-management-confirm-body">
                <p className="user-management-confirm-message">
                  Suspend <strong>{confirmAction.user?.name}</strong>?
                </p>
                
                <div className="user-management-form-group">
                  <label className="user-management-form-label">Reason for suspension:</label>
                  <textarea
                    placeholder="Enter reason..."
                    className="user-management-textarea"
                    rows="3"
                    id="suspendReason"
                  />
                </div>
                
                <div className="user-management-form-group">
                  <label className="user-management-form-label">Duration:</label>
                  <select className="user-management-select" id="suspendDuration">
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>

                <div className="user-management-confirm-actions">
                  <button
                    onClick={() => {
                      const reason = document.getElementById('suspendReason').value;
                      const duration = document.getElementById('suspendDuration').value;
                      if (reason) {
                        confirmAction.onConfirm(reason, duration);
                        setShowConfirmDialog(false);
                      } else {
                        alert('Please provide a reason');
                      }
                    }}
                    className="user-management-confirm-button"
                  >
                    Confirm Suspension
                  </button>
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="user-management-cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {confirmAction.type === 'bulk_suspend' && (
              <div className="user-management-confirm-body">
                <p className="user-management-confirm-message">
                  Suspend <strong>{selectedUsers.length} selected users</strong>?
                </p>
                
                <div className="user-management-form-group">
                  <label className="user-management-form-label">Reason for suspension:</label>
                  <textarea
                    placeholder="Enter reason..."
                    className="user-management-textarea"
                    rows="3"
                    id="suspendReason"
                  />
                </div>
                
                <div className="user-management-form-group">
                  <label className="user-management-form-label">Duration:</label>
                  <select className="user-management-select" id="suspendDuration">
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>

                <div className="user-management-confirm-actions">
                  <button
                    onClick={() => {
                      const reason = document.getElementById('suspendReason').value;
                      const duration = document.getElementById('suspendDuration').value;
                      if (reason) {
                        confirmAction.onConfirm(reason, duration);
                        setShowConfirmDialog(false);
                        setSelectedUsers([]);
                        setSelectAll(false);
                      } else {
                        alert('Please provide a reason');
                      }
                    }}
                    className="user-management-confirm-button"
                  >
                    Confirm Bulk Suspension
                  </button>
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="user-management-cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
