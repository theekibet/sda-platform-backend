import React, { useState } from 'react';
import { communityService } from '../../services/communityService';
import PostScheduler from './PostScheduler';
import PostTemplate from './PostTemplate';

function CreatePostModal({ onClose, onPostCreated, initialData = null, isEdit = false }) {
  const [postType, setPostType] = useState(initialData?.type || 'event');
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [formData, setFormData] = useState({
    type: initialData?.type || 'event',
    title: initialData?.title || '',
    description: initialData?.description || '',
    eventDate: initialData?.eventDate || '',
    location: initialData?.location || '',
    goalAmount: initialData?.goalAmount || '',
    currentAmount: initialData?.currentAmount || '',
    itemsNeeded: initialData?.itemsNeeded || '',
    contactPhone: initialData?.contactPhone || '',
    contactEmail: initialData?.contactEmail || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setPostType(newType);
    setFormData({
      ...formData,
      type: newType,
    });
  };

  const handleTemplateSelect = (templateFields) => {
    setFormData({
      ...formData,
      ...templateFields,
    });
    setPostType(templateFields.type);
    setShowTemplateSelector(false);
  };

  const handleSchedule = (date) => {
    setScheduledDate(date);
    setShowScheduler(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (postType === 'event' && formData.eventDate) {
      const selectedDate = new Date(formData.eventDate);
      const now = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      if (selectedDate < now) {
        setError('Event date cannot be in the past. Please select a future date.');
        setLoading(false);
        return;
      }
    }

    if (postType === 'donation' && !formData.contactPhone) {
      setError('Contact phone is required for donation posts.');
      setLoading(false);
      return;
    }

    try {
      const submitData = { ...formData };
      submitData.type = postType;
      
      if (scheduledDate) {
        submitData.scheduledFor = scheduledDate.toISOString();
      }
      
      if (submitData.goalAmount) submitData.goalAmount = parseFloat(submitData.goalAmount);
      if (submitData.currentAmount) submitData.currentAmount = parseFloat(submitData.currentAmount);
      
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null || submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      let response;
      if (isEdit && initialData?.id) {
        response = await communityService.updatePost(initialData.id, submitData);
      } else {
        response = await communityService.createPost(submitData);
      }
      
      if (onPostCreated) {
        onPostCreated(response.data);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Post error:', err);
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} post. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch(postType) {
      case 'event':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Event Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                required
                min={getMinDateTime()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <small className="block text-xs text-gray-500 mt-1">
                Please select a future date and time
              </small>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Church Hall, Zoom link, Nairobi CBD, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'support':
      case 'donation':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {postType === 'donation' ? 'Goal Amount (KSh) *' : 'Goal Amount (KSh) - Optional'}
              </label>
              <input
                type="number"
                name="goalAmount"
                value={formData.goalAmount}
                onChange={handleChange}
                placeholder="50000"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {postType === 'donation' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Current Amount Raised (KSh) - Optional
                </label>
                <input
                  type="number"
                  name="currentAmount"
                  value={formData.currentAmount}
                  onChange={handleChange}
                  placeholder="25000"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {postType === 'donation' ? 'Items Needed (Optional)' : 'Items Needed'}
              </label>
              <input
                type="text"
                name="itemsNeeded"
                value={formData.itemsNeeded}
                onChange={handleChange}
                placeholder="Bibles, clothes, food, school supplies..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'announcement':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Additional Details
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Location or context for this announcement"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const getTypeDescription = () => {
    const descriptions = {
      event: 'Share upcoming church events, youth gatherings, or community meetups',
      support: 'Request prayer, emotional support, or assistance from the community',
      donation: 'Raise funds or collect items for a cause',
      announcement: 'Share important news or updates with the community',
      general: 'Share thoughts, questions, or general discussions'
    };
    return descriptions[postType];
  };

  const getTypeIcon = () => {
    const icons = {
      event: '📅',
      support: '🙏',
      donation: '🎁',
      announcement: '📢',
      general: '📌'
    };
    return icons[postType] || '📝';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {getTypeIcon()} {isEdit ? 'Edit' : 'Create New'} {postType.charAt(0).toUpperCase() + postType.slice(1)} Post
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-2 px-6 pt-4 pb-3 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setShowTemplateSelector(true)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition"
          >
            📋 Use Template
          </button>
          <button
            type="button"
            onClick={() => setShowScheduler(true)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition"
          >
            📅 Schedule
          </button>
          {scheduledDate && (
            <span className="px-3 py-1.5 text-xs bg-amber-100 text-amber-800 rounded-full">
              Scheduled for {scheduledDate.toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Post Type <span className="text-red-500">*</span>
            </label>
            <select
              value={postType}
              onChange={handleTypeChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="event">📅 Event</option>
              <option value="support">🙏 Support Needed</option>
              <option value="donation">🎁 Donation</option>
              <option value="announcement">📢 Announcement</option>
              <option value="general">📌 General</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{getTypeDescription()}</p>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Basic Fields */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Give your post a clear, descriptive title"
              required
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              maxLength={5000}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
              placeholder="Provide details about your post..."
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {formData.description.length}/5000
            </div>
          </div>

          {/* Type-specific fields */}
          {renderTypeSpecificFields()}

          <div className="h-px bg-gray-200" />

          {/* Contact Information */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Contact Phone {postType === 'donation' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+254 700 000 000"
              required={postType === 'donation'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {postType === 'donation' && (
              <small className="block text-xs text-gray-500 mt-1">
                Required for donation posts to help verify legitimacy
              </small>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Contact Email (Optional)
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 transition"
            >
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? '✓ Save Changes' : `✓ Create ${postType.charAt(0).toUpperCase() + postType.slice(1)} Post`)}
            </button>
          </div>

          {scheduledDate && (
            <p className="text-center text-xs text-amber-600 mt-2">
              ⏰ This post will be published on {scheduledDate.toLocaleString()}
            </p>
          )}
        </form>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <PostTemplate
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {/* Scheduler Modal */}
      {showScheduler && (
        <PostScheduler
          onSchedule={handleSchedule}
          onCancel={() => setShowScheduler(false)}
          initialDate={scheduledDate}
        />
      )}
    </div>
  );
}

export default CreatePostModal;