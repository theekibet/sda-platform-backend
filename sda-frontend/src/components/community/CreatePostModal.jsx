// src/components/community/CreatePostModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { communityService } from '../../services/communityService';
import PostTemplate from './PostTemplate';

// Heroicons as components for consistency
const Icons = {
  X: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Heart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Gift: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  Speaker: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  Document: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Template: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Location: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Currency: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Phone: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Mail: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Box: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Exclamation: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
};

const postTypes = [
  { id: 'event', label: 'Event', icon: Icons.Calendar, color: 'blue', desc: 'Share upcoming gatherings' },
  { id: 'support', label: 'Support', icon: Icons.Heart, color: 'rose', desc: 'Request prayer or help' },
  { id: 'donation', label: 'Donation', icon: Icons.Gift, color: 'emerald', desc: 'Raise funds or items' },
  { id: 'announcement', label: 'Announcement', icon: Icons.Speaker, color: 'amber', desc: 'Share important news' },
  { id: 'general', label: 'General', icon: Icons.Document, color: 'gray', desc: 'General discussions' },
];

function CreatePostModal({ onClose, onPostCreated, initialData = null, isEdit = false }) {
  const [postType, setPostType] = useState(initialData?.type || 'event');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
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
  const [shake, setShake] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [charCount, setCharCount] = useState(formData.description.length);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [formData.description]);

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'description') setCharCount(value.length);
    if (error) setError('');
  };

  const handleTypeSelect = (typeId) => {
    setPostType(typeId);
    setFormData(prev => ({ ...prev, type: typeId }));
    // Small animation feedback
    const element = document.getElementById(`type-${typeId}`);
    if (element) {
      element.classList.add('scale-95');
      setTimeout(() => element.classList.remove('scale-95'), 150);
    }
  };

  const handleTemplateSelect = (templateFields) => {
    setFormData(prev => ({
      ...prev,
      ...templateFields,
    }));
    setPostType(templateFields.type);
    setShowTemplateSelector(false);
  };

  const validateForm = () => {
    if (postType === 'event' && formData.eventDate) {
      const selectedDate = new Date(formData.eventDate);
      const now = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      if (selectedDate < now) {
        setError('Event date cannot be in the past. Please select a future date.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return false;
      }
    }

    if (postType === 'donation' && !formData.contactPhone) {
      setError('Contact phone is required for donation posts.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      const submitData = { ...formData, type: postType };
      
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
      
      onPostCreated?.(response.data);
      onClose?.();
    } catch (err) {
      console.error('Post error:', err);
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} post. Please try again.`);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  // Get color classes based on post type
  const getTypeColor = (type) => {
    const colors = {
      event: 'blue',
      support: 'rose',
      donation: 'emerald',
      announcement: 'amber',
      general: 'gray'
    };
    return colors[type] || 'gray';
  };

  const currentColor = getTypeColor(postType);

  const renderTypeSpecificFields = () => {
    const colorClasses = {
      blue: 'focus:ring-blue-500 border-blue-200',
      rose: 'focus:ring-rose-500 border-rose-200',
      emerald: 'focus:ring-emerald-500 border-emerald-200',
      amber: 'focus:ring-amber-500 border-amber-200',
      gray: 'focus:ring-gray-500 border-gray-200'
    };

    const ringClass = colorClasses[currentColor] || colorClasses.gray;

    switch(postType) {
      case 'event':
        return (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                <Icons.Calendar />
                Event Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                required
                min={getMinDateTime()}
                className={`w-full px-4 py-2.5 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 ${ringClass} focus:border-transparent transition-all duration-200`}
              />
              <small className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
                <Icons.Clock />
                Please select a future date and time
              </small>
            </div>
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                <Icons.Location />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Church Hall, Zoom link, Nairobi CBD, etc."
                className={`w-full px-4 py-2.5 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 ${ringClass} focus:border-transparent transition-all duration-200`}
              />
            </div>
          </div>
        );

      case 'support':
      case 'donation':
        return (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                <Icons.Currency />
                {postType === 'donation' ? 'Goal Amount (KSh) *' : 'Goal Amount (KSh) - Optional'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">KSh</span>
                <input
                  type="number"
                  name="goalAmount"
                  value={formData.goalAmount}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  step="0.01"
                  className={`w-full pl-12 pr-4 py-2.5 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 ${ringClass} focus:border-transparent transition-all duration-200`}
                />
              </div>
            </div>
            
            {postType === 'donation' && (
              <div className="group animate-in slide-in-from-top-1 duration-300">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                  <Icons.Currency />
                  Current Amount Raised (KSh) - Optional
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">KSh</span>
                  <input
                    type="number"
                    name="currentAmount"
                    value={formData.currentAmount}
                    onChange={handleChange}
                    placeholder="25000"
                    min="0"
                    step="0.01"
                    className={`w-full pl-12 pr-4 py-2.5 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 ${ringClass} focus:border-transparent transition-all duration-200`}
                  />
                </div>
              </div>
            )}
            
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                <Icons.Box />
                {postType === 'donation' ? 'Items Needed (Optional)' : 'Items Needed'}
              </label>
              <input
                type="text"
                name="itemsNeeded"
                value={formData.itemsNeeded}
                onChange={handleChange}
                placeholder="Bibles, clothes, food, school supplies..."
                className={`w-full px-4 py-2.5 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 ${ringClass} focus:border-transparent transition-all duration-200`}
              />
            </div>
          </div>
        );

      case 'announcement':
        return (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
              <Icons.Location />
              Additional Details
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Location or context for this announcement"
              className={`w-full px-4 py-2.5 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 ${colorClasses.amber} focus:border-transparent transition-all duration-200`}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-white/95 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl ring-1 ring-white/50 ${shake ? 'animate-shake' : ''} animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${currentColor}-100 text-${currentColor}-600 transition-colors duration-300`}>
              {React.createElement(postTypes.find(t => t.id === postType)?.icon || Icons.Document)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEdit ? 'Edit' : 'Create'} {postType.charAt(0).toUpperCase() + postType.slice(1)} Post
              </h2>
              <p className="text-xs text-gray-500">
                {isEdit ? 'Update your post details' : 'Share with your community'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
          >
            <Icons.X />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Template Button Bar */}
          <div className="px-6 pt-4 pb-2">
            <button
              type="button"
              onClick={() => setShowTemplateSelector(true)}
              className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-primary-300 hover:shadow-md transition-all duration-200"
            >
              <span className="text-primary-600 group-hover:scale-110 transition-transform">
                <Icons.Template />
              </span>
              Use Template
              <Icons.Sparkles />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Interactive Type Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Post Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {postTypes.map((type) => {
                  const isSelected = postType === type.id;
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      id={`type-${type.id}`}
                      type="button"
                      onClick={() => handleTypeSelect(type.id)}
                      className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? `border-${type.color}-500 bg-${type.color}-50 shadow-md`
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex items-center gap-2 mb-1 ${isSelected ? `text-${type.color}-700` : 'text-gray-700'}`}>
                        <span className={isSelected ? `text-${type.color}-600` : 'text-gray-500'}>
                          <Icon />
                        </span>
                        <span className="font-semibold text-sm">{type.label}</span>
                      </div>
                      <p className={`text-xs ${isSelected ? `text-${type.color}-600` : 'text-gray-500'}`}>
                        {type.desc}
                      </p>
                      {isSelected && (
                        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full bg-${type.color}-500 text-white flex items-center justify-center`}>
                          <Icons.Check />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* Title Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                placeholder="Give your post a clear, descriptive title"
                required
                maxLength={100}
                className={`w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${currentColor}-500 focus:border-transparent transition-all duration-200 ${focusedField === 'title' ? 'shadow-lg' : ''}`}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Be specific and concise</span>
                <span>{formData.title.length}/100</span>
              </div>
            </div>

            {/* Description Field with Auto-resize */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={textareaRef}
                name="description"
                value={formData.description}
                onChange={handleChange}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                rows="4"
                maxLength={5000}
                className={`w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${currentColor}-500 focus:border-transparent resize-none transition-all duration-200 ${focusedField === 'description' ? 'shadow-lg' : ''}`}
                placeholder="Provide details about your post..."
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Markdown supported</span>
                <div className={`text-xs transition-colors ${charCount > 4500 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                  {charCount}/5000
                  {charCount > 4500 && <span className="ml-1">⚠️</span>}
                </div>
              </div>
            </div>

            {/* Animated Type-specific Fields */}
            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              {renderTypeSpecificFields()}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Icons.Phone />
                  Contact Phone {postType === 'donation' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="+254 700 000 000"
                  required={postType === 'donation'}
                  className={`w-full px-4 py-2.5 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${currentColor}-500 focus:border-transparent transition-all duration-200 ${focusedField === 'phone' ? 'shadow-lg' : ''}`}
                />
                {postType === 'donation' && (
                  <small className="flex items-center gap-1 text-xs text-gray-500">
                    <Icons.Exclamation />
                    Required for donation posts to help verify legitimacy
                  </small>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Icons.Mail />
                  Contact Email (Optional)
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-2.5 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${currentColor}-500 focus:border-transparent transition-all duration-200 ${focusedField === 'email' ? 'shadow-lg' : ''}`}
                />
              </div>
            </div>

            {/* Error Message with Animation */}
            {error && (
              <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-in slide-in-from-top-2">
                <span className="mt-0.5 flex-shrink-0"><Icons.Exclamation /></span>
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 disabled:opacity-50 transition-all duration-200 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`group px-6 py-2.5 bg-${currentColor}-600 text-white rounded-full font-medium hover:bg-${currentColor}-700 disabled:opacity-50 transition-all duration-200 hover:shadow-lg flex items-center gap-2`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{isEdit ? 'Saving...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isEdit ? 'Save Changes' : `Create ${postType.charAt(0).toUpperCase() + postType.slice(1)}`}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <PostTemplate
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {/* Custom Styles for Animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-in {
          animation-duration: 0.2s;
          animation-fill-mode: both;
        }
        .fade-in { animation-name: fadeIn; }
        .zoom-in-95 { animation-name: zoomIn95; }
        .slide-in-from-top-1 { animation-name: slideInFromTop1; }
        .slide-in-from-top-2 { animation-name: slideInFromTop2; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn95 {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInFromTop1 {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromTop2 {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default CreatePostModal;