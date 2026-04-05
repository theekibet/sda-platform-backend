// src/pages/admin/announcements/AnnouncementForm.jsx
import React, { useState, useEffect } from 'react';
import { useAnnouncements } from '../../../hooks/useAnnouncements'; 
import { ANNOUNCEMENT_TYPES } from '../../../constants/constants';

const AnnouncementForm = ({ announcement, onClose, onSuccess }) => {
  const { createNewAnnouncement, updateExistingAnnouncement, loading } = useAnnouncements();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    targetRole: 'all',
    targetUsers: [],
    scheduledAt: '',
    expiresAt: '',
    isActive: true,
  });
  
  const [errors, setErrors] = useState({});
  const [targetInput, setTargetInput] = useState('');
  const [showTargetUsers, setShowTargetUsers] = useState(false);

  // Load announcement data if editing
  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        type: announcement.type || 'info',
        targetRole: announcement.targetRole || 'all',
        targetUsers: announcement.targetUsers ? JSON.parse(announcement.targetUsers) : [],
        scheduledAt: announcement.scheduledAt ? announcement.scheduledAt.slice(0, 16) : '',
        expiresAt: announcement.expiresAt ? announcement.expiresAt.slice(0, 16) : '',
        isActive: announcement.isActive ?? true,
      });
    }
  }, [announcement]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAddTargetUser = () => {
    if (!targetInput.trim()) return;
    
    const userId = targetInput.trim();
    if (!formData.targetUsers.includes(userId)) {
      setFormData(prev => ({
        ...prev,
        targetUsers: [...prev.targetUsers, userId],
      }));
    }
    setTargetInput('');
  };

  const handleRemoveTargetUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      targetUsers: prev.targetUsers.filter(id => id !== userId),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (formData.scheduledAt && formData.expiresAt) {
      if (new Date(formData.scheduledAt) >= new Date(formData.expiresAt)) {
        newErrors.expiresAt = 'Expiry date must be after scheduled date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const data = {
      ...formData,
      targetUsers: formData.targetUsers.length > 0 ? formData.targetUsers : undefined,
    };

    let result;
    if (announcement) {
      result = await updateExistingAnnouncement(announcement.id, data);
    } else {
      result = await createNewAnnouncement(data);
    }

    if (result.success) {
      onSuccess();
    } else {
      setErrors({ submit: result.error });
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
        
        <div style={styles.header}>
          <h2 style={styles.title}>
            {announcement ? 'Edit Announcement' : 'Create New Announcement'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Title <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Announcement title"
              style={{
                ...styles.input,
                ...(errors.title ? styles.inputError : {}),
              }}
            />
            {errors.title && <span style={styles.errorText}>{errors.title}</span>}
          </div>

          {/* Content */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Content <span style={styles.required}>*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your announcement here..."
              rows="5"
              style={{
                ...styles.textarea,
                ...(errors.content ? styles.inputError : {}),
              }}
            />
            {errors.content && <span style={styles.errorText}>{errors.content}</span>}
          </div>

          {/* Type and Status Row */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={styles.select}
              >
                {ANNOUNCEMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span>Active immediately</span>
              </label>
            </div>
          </div>

          {/* Scheduling Row */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Schedule Start</label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Expires</label>
              <input
                type="datetime-local"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.expiresAt ? styles.inputError : {}),
                }}
              />
              {errors.expiresAt && <span style={styles.errorText}>{errors.expiresAt}</span>}
            </div>
          </div>

          {/* Targeting */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Target Audience</label>
            <select
              name="targetRole"
              value={formData.targetRole}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="all">All Users</option>
              <option value="admin">Admins Only</option>
              <option value="user">Regular Users</option>
              <option value="specific">Specific Users</option>
            </select>
          </div>

          {/* Specific Users (if selected) */}
          {formData.targetRole === 'specific' && (
            <div style={styles.targetUsersSection}>
              <div style={styles.targetInputGroup}>
                <input
                  type="text"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="Enter user ID"
                  style={styles.targetInput}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTargetUser())}
                />
                <button
                  type="button"
                  onClick={handleAddTargetUser}
                  style={styles.addButton}
                >
                  Add
                </button>
              </div>

              {formData.targetUsers.length > 0 && (
                <div style={styles.targetUsersList}>
                  {formData.targetUsers.map(userId => (
                    <div key={userId} style={styles.targetUserTag}>
                      <span>{userId}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTargetUser(userId)}
                        style={styles.removeButton}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div style={styles.submitError}>
              <span>⚠️</span>
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Form Actions */}
          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                ...(loading ? styles.submitButtonDisabled : {}),
              }}
            >
              {loading ? 'Saving...' : announcement ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    padding: '30px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#999',
    padding: '5px',
    lineHeight: 1,
    '&:hover': {
      color: '#333',
    },
  },
  header: {
    marginBottom: '25px',
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '24px',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    padding: '10px',
    borderRadius: '5px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: '#667eea',
    },
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  textarea: {
    padding: '10px',
    borderRadius: '5px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    '&:focus': {
      outline: 'none',
      borderColor: '#667eea',
    },
  },
  select: {
    padding: '10px',
    borderRadius: '5px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
    backgroundColor: 'white',
    '&:focus': {
      outline: 'none',
      borderColor: '#667eea',
    },
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#555',
    marginTop: '20px',
  },
  errorText: {
    fontSize: '12px',
    color: '#e74c3c',
  },
  targetUsersSection: {
    marginTop: '10px',
  },
  targetInputGroup: {
    display: 'flex',
    gap: '10px',
  },
  targetInput: {
    flex: 1,
    padding: '8px',
    borderRadius: '5px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
  targetUsersList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px',
  },
  targetUserTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    fontSize: '12px',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
    padding: '2px',
    '&:hover': {
      color: '#e74c3c',
    },
  },
  submitError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '5px',
    fontSize: '14px',
  },
  footer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '10px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
    '&:hover': {
      backgroundColor: '#5a6fd8',
    },
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

export default AnnouncementForm;
