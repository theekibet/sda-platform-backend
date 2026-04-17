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

  // Get type icon and color
  const getTypeInfo = (type) => {
    const typeInfo = ANNOUNCEMENT_TYPES.find(t => t.value === type) || ANNOUNCEMENT_TYPES[0];
    return {
      icon: typeInfo.icon,
      label: typeInfo.label,
      color: typeInfo.color,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-gray-400 hover:text-gray-600 transition-colors p-1 leading-none z-10"
          aria-label="Close"
        >
          ✕
        </button>
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">
            {announcement ? 'Edit Announcement' : 'Create New Announcement'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {announcement ? 'Update your announcement details' : 'Fill in the details to create a new announcement'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter announcement title"
              className={`w-full px-3 py-2 rounded-lg border-2 transition-colors focus:outline-none focus:border-blue-500 ${
                errors.title ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your announcement here..."
              rows="5"
              className={`w-full px-3 py-2 rounded-lg border-2 transition-colors focus:outline-none focus:border-blue-500 resize-vertical ${
                errors.content ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            />
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
            <p className="text-xs text-gray-400">Supports plain text. Keep it concise and clear.</p>
          </div>

          {/* Type and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 focus:outline-none focus:border-blue-500 transition-colors bg-white"
              >
                {ANNOUNCEMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              {formData.type && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span>{getTypeInfo(formData.type).icon}</span>
                  <span>{getTypeInfo(formData.type).label} announcement style</span>
                </p>
              )}
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span>Active immediately</span>
              </label>
            </div>
          </div>

          {/* Scheduling Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Schedule Start</label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-400">Leave empty to publish immediately</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Expires</label>
              <input
                type="datetime-local"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border-2 transition-colors focus:outline-none focus:border-blue-500 ${
                  errors.expiresAt ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              />
              {errors.expiresAt && <p className="text-xs text-red-500 mt-1">{errors.expiresAt}</p>}
              <p className="text-xs text-gray-400">Leave empty for no expiration</p>
            </div>
          </div>

          {/* Targeting */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Target Audience</label>
            <select
              name="targetRole"
              value={formData.targetRole}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 focus:outline-none focus:border-blue-500 transition-colors bg-white"
            >
              <option value="all">📢 All Users</option>
              <option value="admin">👑 Admins Only</option>
              <option value="user">👤 Regular Users</option>
              <option value="specific">🎯 Specific Users</option>
            </select>
          </div>

          {/* Specific Users (if selected) */}
          {formData.targetRole === 'specific' && (
            <div className="space-y-3 pl-4 border-l-2 border-blue-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="Enter user ID"
                  className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTargetUser())}
                />
                <button
                  type="button"
                  onClick={handleAddTargetUser}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Add User
                </button>
              </div>

              {formData.targetUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.targetUsers.map(userId => (
                    <div key={userId} className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md text-sm">
                      <span className="font-mono text-gray-600">{userId}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTargetUser(userId)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove user"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400">Add specific user IDs who should see this announcement</p>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <span className="text-lg">⚠️</span>
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                announcement ? 'Update Announcement' : 'Create Announcement'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add global animations if needed
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`;
document.head.appendChild(styleSheet);

export default AnnouncementForm;