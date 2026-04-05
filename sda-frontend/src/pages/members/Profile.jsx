// src/pages/members/Profile.jsx

import { useState, useEffect } from 'react';
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
  const { user, setUser, updateUserLocation } = useAuth();
  const [profile,           setProfile]           = useState(null);
  const [isEditing,         setIsEditing]         = useState(false);
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [changingPassword,  setChangingPassword]  = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMessage,   setLocationMessage]   = useState({ type: '', text: '' });
  const [saveMessage,       setSaveMessage]       = useState({ type: '', text: '' });

  const { upload, remove, uploading, error: uploadError } = useProfilePicture();
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', bio: '', age: '', gender: '',
  });

  const [locationData, setLocationData] = useState({
    locationName: '', latitude: null, longitude: null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      const data = response.data.data;
      setProfile(data);
      setFormData({
        name:   data.name   || '',
        email:  data.email  || '',
        phone:  data.phone  || '',
        bio:    data.bio    || '',
        age:    data.age    || '',
        gender: data.gender || '',
      });
      setLocationData({
        locationName: data.locationName || '',
        latitude:     data.latitude     || null,
        longitude:    data.longitude    || null,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectMyLocation = async () => {
    setDetectingLocation(true);
    setLocationMessage({ type: '', text: '' });

    if (!navigator.geolocation) {
      setLocationMessage({ type: 'error', text: 'Geolocation is not supported by your browser' });
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
          const city    = address.city || address.town || address.village || address.county || '';
          const country = address.country || 'Kenya';
          const locationName = city ? `${city}, ${country}` : country;

          const newLocationData = { locationName, latitude, longitude };
          setLocationData(newLocationData);
          await updateLocation(newLocationData);
          setUser({ ...user, ...newLocationData });
          setProfile(prev => ({ ...prev, ...newLocationData }));
          setLocationMessage({ type: 'success', text: `📍 Location updated: ${locationName}` });
          setTimeout(() => setLocationMessage({ type: '', text: '' }), 3000);
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setLocationMessage({ type: 'error', text: 'Could not determine your location. Please try again.' });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        const messages = {
          [error.PERMISSION_DENIED]:    'Location access denied. Please enable location in your browser settings.',
          [error.POSITION_UNAVAILABLE]: 'Unable to detect your location. Please try again later.',
          [error.TIMEOUT]:              'Location request timed out. Please try again.',
        };
        setLocationMessage({ type: 'error', text: messages[error.code] || 'Could not detect your location.' });
        setTimeout(() => setLocationMessage({ type: '', text: '' }), 5000);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024)    { alert('File size cannot exceed 5MB');   return; }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    const result = await upload(file);
    if (result.success) {
      setUser({ ...user, avatarUrl: result.avatarUrl });
      setProfile(prev => ({ ...prev, avatarUrl: result.avatarUrl }));
      setPreviewUrl(null);
      alert('Profile picture updated!');
    }
  };

  const handleRemove = async () => {
    if (window.confirm('Remove profile picture?')) {
      const result = await remove();
      if (result.success) {
        setUser({ ...user, avatarUrl: null });
        setProfile(prev => ({ ...prev, avatarUrl: null }));
      }
    }
  };

  const buildCleanPayload = (data) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === null || value === undefined) continue;
      if (key === 'age') {
        const num = Number(value);
        if (!isNaN(num)) cleaned[key] = num;
        continue;
      }
      cleaned[key] = value;
    }
    return cleaned;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage({ type: '', text: '' });
    try {
      const payload = buildCleanPayload(formData);
      await updateProfile(payload);
      await fetchProfile();
      setIsEditing(false);
      setSaveMessage({ type: 'success', text: '✅ Profile updated successfully!' });
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Update profile error:', err);
      const msg = err?.response?.data?.message || 'Error updating profile. Please try again.';
      setSaveMessage({ type: 'error', text: typeof msg === 'string' ? msg : msg.join(', ') });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    setSaveMessage({ type: '', text: '' });
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaveMessage({ type: 'success', text: '✅ Password changed successfully!' });
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Change password error:', err);
      const msg = err?.response?.data?.message || 'Error changing password. Please try again.';
      setSaveMessage({ type: 'error', text: typeof msg === 'string' ? msg : msg.join(', ') });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return 'Not available'; }
  };

  // Shared class tokens
  const labelClass    = 'block mb-1 text-sm font-medium text-gray-700';
  const inputClass    = 'input-glass w-full';
  const infoRowClass  = 'flex gap-2 py-2.5 border-b border-gray-100 last:border-0 text-sm text-gray-700';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3 text-primary-500">
          <div className="spinner-gradient" />
          <p className="text-sm font-medium">Loading profile…</p>
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
      
      <div className="max-w-2xl mx-auto flex flex-col gap-6 py-6 px-4 relative z-10">
        {/* Global save / error banner */}
        {saveMessage.text && (
          <div
            className={`animate-slide-up rounded-xl px-4 py-3 font-medium border ${
              saveMessage.type === 'success'
                ? 'bg-green-50/90 backdrop-blur-sm text-green-700 border-green-200'
                : 'bg-red-50/90 backdrop-blur-sm text-red-600 border-red-200'
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Avatar card */}
        <div className="glass-card-enhanced p-6 flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <Avatar
              src={previewUrl || profile?.avatarUrl}
              name={profile?.name}
              size="xl"
              className="ring-4 ring-primary-200 shadow-glow"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                <div className="spinner-gradient w-6 h-6 border-2"></div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold font-display text-gradient">{profile?.name}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            <label className="btn-shine px-4 py-2 text-sm cursor-pointer bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-glow transition-all duration-300">
              {uploading ? 'Uploading…' : '📷 Change Photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
            {profile?.avatarUrl && (
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="px-4 py-2 text-sm bg-gray-100 text-red-500 rounded-xl hover:bg-red-50 transition-all duration-300 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>

          {uploadError && (
            <p className="text-xs text-red-500">{uploadError}</p>
          )}
        </div>

        {/* Action buttons */}
        {!isEditing && !changingPassword && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => { setIsEditing(true); setSaveMessage({ type: '', text: '' }); }}
              className="btn-shine px-5 py-2.5 text-sm bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-glow transition-all duration-300"
            >
              ✏️ Edit Profile
            </button>
            <button
              onClick={() => { setChangingPassword(true); setSaveMessage({ type: '', text: '' }); }}
              className="px-5 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300"
            >
              🔒 Change Password
            </button>
          </div>
        )}

        {/* Location card */}
        <div className="glass-card-enhanced p-6 flex flex-col gap-3">
          <h3 className="font-semibold font-display text-gray-800">📍 Your Location</h3>
          <p className="text-sm text-gray-600">
            {locationData.locationName || 'Location not set yet'}
          </p>

          <div className="flex flex-col gap-1">
            <button
              onClick={detectMyLocation}
              disabled={detectingLocation}
              className="btn-shine px-4 py-2 text-sm self-start bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-glow transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {detectingLocation ? '🔄 Detecting…' : '📍 Update My Location'}
            </button>
            <p className="text-xs text-gray-400 mt-1">
              We'll detect your current city. You can update anytime.
            </p>
          </div>

          {locationMessage.text && (
            <div
              className={`animate-slide-up rounded-xl px-4 py-3 font-medium border ${
                locationMessage.type === 'success'
                  ? 'bg-green-50/90 backdrop-blur-sm text-green-700 border-green-200'
                  : 'bg-red-50/90 backdrop-blur-sm text-red-600 border-red-200'
              }`}
            >
              {locationMessage.text}
            </div>
          )}
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <div className="glass-card-enhanced p-6">
            <h3 className="font-semibold font-display text-gray-800 mb-4">Edit Profile</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  required
                  className={inputClass}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  required
                  className={inputClass}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  placeholder="+254 700 000 000"
                  className={inputClass}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself…"
                  rows="3"
                  className="input-glass w-full resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    min="13"
                    max="120"
                    className={inputClass}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    value={formData.gender}
                    className="select-glass w-full"
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-shine px-5 py-2.5 text-sm bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-glow transition-all duration-300 disabled:opacity-60"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="spinner-gradient w-4 h-4 border-2"></span>
                      Saving…
                    </span>
                  ) : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setSaveMessage({ type: '', text: '' }); }}
                  className="px-5 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Change Password Form */}
        {changingPassword && (
          <div className="glass-card-enhanced p-6">
            <h3 className="font-semibold font-display text-gray-800 mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  required
                  className={inputClass}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  required
                  minLength="8"
                  className={inputClass}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  required
                  className={inputClass}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-shine px-5 py-2.5 text-sm bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-glow transition-all duration-300 disabled:opacity-60"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="spinner-gradient w-4 h-4 border-2"></span>
                      Changing…
                    </span>
                  ) : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => { setChangingPassword(false); setSaveMessage({ type: '', text: '' }); }}
                  className="px-5 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Profile Info View */}
        {!isEditing && !changingPassword && profile && (
          <div className="glass-card-enhanced p-6">
            <h3 className="font-semibold font-display text-gray-800 mb-3">Profile Details</h3>
            <div className="flex flex-col">
              <div className={infoRowClass}>
                <span className="font-semibold text-gray-500 w-28 shrink-0">Name</span>
                <span>{profile.name || 'Not set'}</span>
              </div>
              <div className={infoRowClass}>
                <span className="font-semibold text-gray-500 w-28 shrink-0">Email</span>
                <span>{profile.email || 'Not set'}</span>
              </div>
              {profile.phone && (
                <div className={infoRowClass}>
                  <span className="font-semibold text-gray-500 w-28 shrink-0">Phone</span>
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.bio && (
                <div className={infoRowClass}>
                  <span className="font-semibold text-gray-500 w-28 shrink-0">Bio</span>
                  <span className="line-clamp-3">{profile.bio}</span>
                </div>
              )}
              {profile.age && (
                <div className={infoRowClass}>
                  <span className="font-semibold text-gray-500 w-28 shrink-0">Age</span>
                  <span>{profile.age}</span>
                </div>
              )}
              {profile.gender && (
                <div className={infoRowClass}>
                  <span className="font-semibold text-gray-500 w-28 shrink-0">Gender</span>
                  <span className="capitalize">{profile.gender.replace(/-/g, ' ')}</span>
                </div>
              )}
              <div className={infoRowClass}>
                <span className="font-semibold text-gray-500 w-28 shrink-0">Location</span>
                <span>{profile.locationName || 'Not set'}</span>
              </div>
              <div className={infoRowClass}>
                <span className="font-semibold text-gray-500 w-28 shrink-0">Member Since</span>
                <span>{formatDate(profile.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;