import React, { useState } from 'react';
import { communityService } from '../../services/communityService';

const PostEditModal = ({ post, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: post.title || '',
    description: post.description || '',
    type: post.type || 'general',
    eventDate: post.eventDate ? new Date(post.eventDate).toISOString().slice(0, 16) : '',
    location: post.location || '',
    goalAmount: post.goalAmount || '',
    itemsNeeded: post.itemsNeeded || '',
    contactPhone: post.contactPhone || '',
    contactEmail: post.contactEmail || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.type === 'event' && formData.eventDate) {
      const selectedDate = new Date(formData.eventDate);
      const now = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      if (selectedDate < now) {
        setError('Event date cannot be in the past');
        setLoading(false);
        return;
      }
    }

    const submitData = { ...formData };
    if (submitData.goalAmount) submitData.goalAmount = parseFloat(submitData.goalAmount);
    
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === '' || submitData[key] === null || submitData[key] === undefined) {
        delete submitData[key];
      }
    });

    try {
      const response = await communityService.updatePost(post.id, submitData);
      if (response.success) {
        onUpdate(response.data);
        onClose();
      } else {
        setError('Failed to update post');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = () => {
    const icons = { event: '📅', support: '🙏', donation: '🎁', announcement: '📢', general: '📌' };
    return icons[formData.type] || '📝';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-gray-800">{getTypeIcon()} Edit Post</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={100}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              maxLength={5000}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
            />
          </div>

          {formData.type === 'event' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Event Date & Time</label>
              <input
                type="datetime-local"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                min={getMinDateTime()}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

          {(formData.type === 'event' || formData.type === 'announcement') && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Venue or location"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

          {(formData.type === 'donation' || formData.type === 'support') && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Goal Amount (KSh)</label>
                <input
                  type="number"
                  name="goalAmount"
                  value={formData.goalAmount}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Items Needed</label>
                <input
                  type="text"
                  name="itemsNeeded"
                  value={formData.itemsNeeded}
                  onChange={handleChange}
                  placeholder="Bibles, food, clothes, etc."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contact Phone {formData.type === 'donation' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              required={formData.type === 'donation'}
              placeholder="+254 700 000 000"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Email (Optional)</label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostEditModal;