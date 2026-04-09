// src/pages/members/Profile.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getProfile,
  updateProfile,
  changePassword,
  updateLocation,
} from '../../services/api';
import { useProfilePicture } from '../../hooks/useProfilePicture';
import Avatar from '../../components/common/Avatar';

function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', bio: '', gender: '', dateOfBirth: '',
  });

  // Location state
  const [locationData, setLocationData] = useState({
    locationName: '', latitude: null, longitude: null,
  });
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  // Profile picture
  const { upload, remove, uploading, error: uploadError } = useProfilePicture();
  const [previewUrl, setPreviewUrl] = useState(null);

  // Calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate days until next birthday
  const getDaysUntilBirthday = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = nextBirthday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const age = calculateAge(formData.dateOfBirth);
  const daysUntilBirthday = getDaysUntilBirthday(formData.dateOfBirth);

  useEffect(() => { 
    fetchProfile();
    refreshUserData();
  }, []);

  const refreshUserData = async () => {
    try {
      const response = await getProfile();
      const freshUser = response.data.data;
      updateUser(freshUser);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      alert('Failed to refresh user data');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      const data = response.data.data;
      setProfile(data);
      setFormData({
        name:        data.name        || '',
        email:       data.email       || '',
        phone:       data.phone       || '',
        bio:         data.bio         || '',
        gender:      data.gender      || '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
      });
      setLocationData({
        locationName: data.locationName || '',
        latitude:     data.latitude     || null,
        longitude:    data.longitude    || null,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const detectMyLocation = async () => {
    setDetectingLocation(true);
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            { headers: { 'User-Agent': 'YouthMinistryPlatform/1.0' } }
          );
          const data = await response.json();
          const address = data.address;
          const city = address.city || address.town || address.village || address.county || '';
          const country = address.country || 'Kenya';
          const locationName = city ? `${city}, ${country}` : country;

          const newLocationData = { locationName, latitude, longitude };
          setLocationData(newLocationData);
          await updateLocation(newLocationData);
          updateUser({ ...user, ...newLocationData });
          setProfile(prev => ({ ...prev, ...newLocationData }));
          alert(`📍 Location updated to ${locationName}`);
        } catch (error) {
          console.error(error);
          alert('Could not determine your location');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        const messages = {
          1: 'Location access denied',
          2: 'Location unavailable',
          3: 'Location request timed out',
        };
        alert(messages[error.code] || 'Location detection failed');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size cannot exceed 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    const result = await upload(file);
    if (result.success) {
      const profileResponse = await getProfile();
      const freshUser = profileResponse.data.data;
      updateUser({ ...user, ...freshUser });
      setProfile(freshUser);
      setPreviewUrl(null);
      alert('Profile picture updated!');
    } else {
      alert(uploadError || 'Failed to upload image');
    }
  };

  const handleRemove = async () => {
    if (window.confirm('Remove profile picture?')) {
      const result = await remove();
      if (result.success) {
        const profileResponse = await getProfile();
        const freshUser = profileResponse.data.data;
        updateUser({ ...user, ...freshUser });
        setProfile(freshUser);
        alert('Profile picture removed');
      }
    }
  };

  const buildCleanPayload = (data) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === null || value === undefined) continue;
      cleaned[key] = value;
    }
    return cleaned;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildCleanPayload(formData);
      // Remove email, name, and dateOfBirth from payload (all are read-only)
      delete payload.email;
      delete payload.name;
      delete payload.dateOfBirth;
      await updateProfile(payload);
      await fetchProfile();
      const profileResponse = await getProfile();
      const freshUser = profileResponse.data.data;
      updateUser({ ...user, ...freshUser });
      alert('Profile updated successfully!');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Update failed';
      alert(typeof msg === 'string' ? msg : msg.join(', '));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
      setActiveTab('profile');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Password change failed';
      alert(typeof msg === 'string' ? msg : msg.join(', '));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3 text-primary-500">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className="max-w-3xl mx-auto px-4 py-6 relative z-10">
        {/* Header Card with Avatar */}
        <div className="glass-card-enhanced p-6 flex flex-col items-center text-center mb-6">
          <div className="relative">
            <Avatar
              user={{
                name: user?.name,
                avatarUrl: previewUrl || user?.avatarUrl
              }}
              size="xlarge"
              className="ring-4 ring-primary-200 shadow-glow"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold font-display text-gradient mt-3">{user?.name}</h2>
          <p className="text-gray-500">{user?.email}</p>

          <div className="flex gap-2 flex-wrap justify-center mt-4">
            <label className="btn-shine px-4 py-2 text-sm cursor-pointer bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-glow transition">
              {uploading ? 'Uploading…' : '📷 Change Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>
            {user?.avatarUrl && (
              <button onClick={handleRemove} disabled={uploading} className="px-4 py-2 text-sm bg-gray-100 text-red-500 rounded-xl hover:bg-red-50 transition">
                Remove
              </button>
            )}
            <button 
              onClick={detectMyLocation} 
              disabled={detectingLocation} 
              className="btn-shine px-4 py-2 text-sm bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-glow disabled:opacity-60"
            >
              {detectingLocation ? '🔄 Detecting...' : '📍 Update Your Location'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium text-sm transition-all ${
              activeTab === 'profile'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👤 Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 font-medium text-sm transition-all ${
              activeTab === 'security'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔒 Security
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 font-medium text-sm transition-all ${
              activeTab === 'preferences'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ Preferences
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Edit Form */}
            <div className="glass-card-enhanced p-6">
              <h3 className="font-semibold font-display text-gray-800 mb-4">Edit Profile</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      disabled 
                      className="input-glass w-full bg-gray-100 cursor-not-allowed opacity-75" 
                    />
                    <p className="text-xs text-gray-400 mt-1">Full name cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={formData.email} disabled className="input-glass w-full bg-gray-100 cursor-not-allowed opacity-75" />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={formData.phone} className="input-glass w-full" onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input 
                      type="date" 
                      value={formData.dateOfBirth} 
                      disabled 
                      className="input-glass w-full bg-gray-100 cursor-not-allowed opacity-75" 
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Date of birth cannot be changed after registration
                    </p>
                    {formData.dateOfBirth && (
                      <div className="mt-2 text-sm space-y-1">
                        <p className="text-primary-600 font-medium">🎂 Current Age: {age} years old</p>
                        <p className="text-secondary-600">📅 {daysUntilBirthday} days until your next birthday</p>
                        {daysUntilBirthday === 0 && (
                          <p className="text-yellow-600 font-medium">🎉 Happy Birthday! 🎉</p>
                        )}
                        {daysUntilBirthday <= 7 && daysUntilBirthday > 0 && (
                          <p className="text-primary-600">✨ Your birthday is coming up soon! ✨</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select value={formData.gender} className="select-glass w-full" onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea value={formData.bio} rows="3" className="input-glass w-full resize-none" onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell us about yourself..." />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="btn-shine px-5 py-2 text-sm bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-glow disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Location Display Card */}
            <div className="glass-card-enhanced p-6">
              <h3 className="font-semibold font-display text-gray-800 mb-2">📍 Your Current Location</h3>
              <p className="text-sm text-gray-600">{locationData.locationName || 'Location not set'}</p>
              <p className="text-xs text-gray-400 mt-2">Click "Update Your Location" button above to change your location</p>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="glass-card-enhanced p-6">
            <h3 className="font-semibold font-display text-gray-800 mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" value={passwordData.currentPassword} required className="input-glass w-full" onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={passwordData.newPassword} required minLength="8" className="input-glass w-full" onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" value={passwordData.confirmPassword} required className="input-glass w-full" onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-shine px-5 py-2 text-sm bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-glow disabled:opacity-60">
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="glass-card-enhanced p-6">
            <h3 className="font-semibold font-display text-gray-800 mb-4">Notification Preferences</h3>
            <p className="text-sm text-gray-600 mb-4">Customize which notifications you receive.</p>
            <Link
              to="/settings/notifications"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 transition"
            >
              <span>🔔</span> Manage Notification Settings
              <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;