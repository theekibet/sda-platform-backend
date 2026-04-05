// src/pages/members/discussions/CreateDiscussion.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { discussionsService } from '../../../services/discussionsService';
import { groupsService } from '../../../services/groupsService';
import { tagsService } from '../../../services/tagsService';
import TagSelector from '../../../components/tags/TagSelector';

function CreateDiscussion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const preselectedGroupId = searchParams.get('groupId');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    groupId: preselectedGroupId || '',
    tagNames: [],
    isAnonymous: false,
  });

  const [userGroups, setUserGroups] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/discussions/create' } });
      return;
    }
    
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    setFetchingData(true);
    try {
      const groupsResponse = await groupsService.getMyGroups();
      let groups = [];
      if (groupsResponse.data?.data) {
        groups = groupsResponse.data.data;
      } else if (groupsResponse.data) {
        groups = groupsResponse.data;
      } else if (Array.isArray(groupsResponse)) {
        groups = groupsResponse;
      } else {
        groups = groupsResponse || [];
      }
      setUserGroups(groups);

      const tagsResponse = await tagsService.getAllTags();
      let tags = [];
      if (tagsResponse.data) {
        tags = tagsResponse.data;
      } else if (Array.isArray(tagsResponse)) {
        tags = tagsResponse;
      } else {
        tags = tagsResponse || [];
      }
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTagsChange = (tags) => {
    setFormData(prev => ({
      ...prev,
      tagNames: tags,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (formData.content.length < 10) {
      setError('Content must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newDiscussion = await discussionsService.createDiscussion({
        title: formData.title.trim(),
        content: formData.content.trim(),
        groupId: formData.groupId || undefined,
        tagNames: formData.tagNames,
        isAnonymous: formData.isAnonymous,
      });

      if (newDiscussion && newDiscussion.id) {
        navigate(`/discussions/${newDiscussion.id}`);
      } else {
        setError('Failed to create discussion: No ID returned from server');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
      setError(
        error.response?.data?.message || 
        'Failed to create discussion. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (preselectedGroupId) {
      navigate(`/groups/${preselectedGroupId}`);
    } else {
      navigate('/discussions');
    }
  };

  if (fetchingData) {
    return (
      <div className="max-w-3xl mx-auto p-5">
        <div className="text-center py-12">
          <div className="spinner-gradient mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Blob Backgrounds */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      
      <div className="max-w-3xl mx-auto p-5 relative z-10">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="group flex items-center gap-1 text-gray-500 hover:text-primary-500 transition-all duration-300 hover:translate-x-[-4px]"
          >
            <span className="text-lg">←</span>
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gradient mt-4 mb-2">Create New Discussion</h1>
          <p className="text-gray-500">Share your thoughts with the community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card-enhanced p-6 md:p-8 space-y-6 animate-slide-up">
          {error && (
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-600 p-4 rounded-xl text-sm animate-slide-up flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              placeholder="What's on your mind?"
              maxLength={200}
              className={`input-glass w-full transition-all duration-300 ${focusedField === 'title' ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}
            />
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Be clear and specific</span>
              <span className={`${formData.title.length > 180 ? 'text-amber-500' : 'text-gray-400'}`}>
                {formData.title.length}/200
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              onFocus={() => setFocusedField('content')}
              onBlur={() => setFocusedField(null)}
              placeholder="Elaborate on your topic... (minimum 10 characters)"
              rows={8}
              maxLength={5000}
              className={`input-glass w-full resize-y transition-all duration-300 ${focusedField === 'content' ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}
            />
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Provide context and details</span>
              <span className={`${formData.content.length > 4500 ? 'text-amber-500' : 'text-gray-400'}`}>
                {formData.content.length}/5000
              </span>
            </div>
          </div>

          {/* Group Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Post in Group <span className="text-gray-400">(optional)</span>
            </label>
            <select
              name="groupId"
              value={formData.groupId}
              onChange={handleChange}
              className="select-glass w-full"
            >
              <option value="">🌍 Public (no specific group)</option>
              {userGroups.map(group => (
                <option key={group.id} value={group.id}>
                  🤝 {group.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Select a group to post in, or leave public for everyone to see
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tags <span className="text-gray-400">(optional, up to 5)</span>
            </label>
            <TagSelector
              availableTags={availableTags}
              selectedTags={formData.tagNames}
              onChange={handleTagsChange}
              maxTags={5}
            />
            <p className="text-xs text-gray-400 mt-1">
              Add tags to help others find your discussion
            </p>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-start gap-3 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-gray-100">
            <input
              type="checkbox"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
              className="checkbox-custom mt-0.5"
              id="anonymous"
            />
            <div>
              <label htmlFor="anonymous" className="text-sm font-medium text-gray-700 cursor-pointer">
                Post anonymously
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Your name won't be shown, but moderators can still see your identity
              </p>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span> Posting Tips
            </h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Be clear and specific in your title
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Provide context in your content
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Use tags to reach the right audience
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Be respectful and constructive
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 hover:-translate-y-0.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-shine px-6 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner-gradient w-4 h-4 border-2"></span>
                  Creating...
                </span>
              ) : (
                'Create Discussion'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateDiscussion;