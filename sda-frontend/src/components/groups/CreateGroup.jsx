// src/pages/members/groups/CreateGroup.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { groupsService } from '../../services/groupsService';
import { tagsService } from '../../services/tagsService';
import TagSelector from '../../components/tags/TagSelector';
import { useNavigate } from 'react-router-dom';

function CreateGroup({ onClose, onGroupCreated }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tagNames: [],
    location: '',
    isPrivate: false,
    requireApproval: false, // Changed default to false (open by default)
    rules: '',
    isLocationBased: false,
    meetingType: 'online',
  });
  
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available tags on mount
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await tagsService.getAllTags();
      setAvailableTags(response.data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use groupsService instead of generic api
      const response = await groupsService.createGroup({
        name: formData.name,
        description: formData.description,
        tagNames: formData.tagNames,
        isPrivate: formData.isPrivate,
        location: formData.location,
        rules: formData.rules,
        requireApproval: formData.requireApproval,
        isLocationBased: formData.isLocationBased,
        meetingType: formData.meetingType,
      });
      
      const groupData = response.data?.data || response.data;
      const groupId = groupData?.id;
      
      if (groupId) {
        if (onGroupCreated) {
          onGroupCreated(groupData);
        }
        
        onClose();
        
        setTimeout(() => {
          navigate(`/groups/${groupId}`, { replace: true });
        }, 100);
      } else {
        setError('Failed to get group ID from response');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error creating group:', error);
      setError(error.response?.data?.message || 'Failed to create group');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleTagsChange = (tags) => {
    setFormData({
      ...formData,
      tagNames: tags,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Create a New Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={100}
              placeholder="e.g., Young Professionals Prayer Circle"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              minLength={10}
              maxLength={2000}
              placeholder="What is this group about? Who is it for?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
            />
          </div>

          {/* Tags - REPLACES CATEGORY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags *
            </label>
            <TagSelector
              availableTags={availableTags}
              selectedTags={formData.tagNames}
              onChange={handleTagsChange}
              maxTags={5}
            />
            <p className="text-xs text-gray-500 mt-1">
              Add tags to help people find your group (e.g., "prayer", "bible-study", "young-adults")
            </p>
          </div>

          {/* Meeting Type & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Type *
              </label>
              <select
                name="meetingType"
                value={formData.meetingType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="online">💻 Online</option>
                <option value="in-person">🤝 In-Person</option>
                <option value="hybrid">🔄 Hybrid (Both)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                maxLength={200}
                placeholder={
                  formData.meetingType === 'online'
                    ? 'e.g., "Online" or "Zoom"'
                    : 'e.g., "Nairobi CBD"'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Based Checkbox */}
          {(formData.meetingType === 'in-person' || formData.meetingType === 'hybrid') && (
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="isLocationBased"
                checked={formData.isLocationBased}
                onChange={handleChange}
                className="mt-1"
              />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  This group serves a specific geographic area
                </label>
                <p className="text-xs text-gray-500">
                  Check this only if your group is truly location-specific.
                </p>
              </div>
            </div>
          )}

          {/* Group Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Rules (Optional)
            </label>
            <textarea
              name="rules"
              value={formData.rules}
              onChange={handleChange}
              maxLength={5000}
              placeholder="Any rules members should follow?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
            />
          </div>

          {/* Privacy Settings */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              name="isPrivate"
              checked={formData.isPrivate}
              onChange={handleChange}
              className="mt-1"
            />
            <div>
              <label className="text-sm font-medium text-gray-700">
                Private Group
              </label>
              <p className="text-xs text-gray-500">
                Only members can see posts and members
              </p>
            </div>
          </div>

          {/* Approval Settings */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              name="requireApproval"
              checked={formData.requireApproval}
              onChange={handleChange}
              className="mt-1"
            />
            <div>
              <label className="text-sm font-medium text-gray-700">
                Require Approval to Join
              </label>
              <p className="text-xs text-gray-500">
                New members need admin approval (uncheck for open groups)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.tagNames.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroup;