// src/components/settings/NotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';

const NotificationSettings = () => {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getPreferences();
      // Backend returns { success: true, data: { ...preferences } }
      const preferencesData = res.data || res;
      setPrefs(preferencesData);
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setError('Unable to load notification settings. Please try again.');
      // Set default fallback preferences
      setPrefs({
        emailEnabled: true,
        inAppEnabled: true,
        communityPosts: true,
        communityResponses: true,
        postMentions: true,
        discussionReplies: true,
        discussionUpvotes: true,
        discussionMentions: true,
        prayerResponses: true,
        versePublished: true,
        groupInvites: true,
        announcements: true,
        digestFrequency: 'daily',
        quietHoursEnabled: false,
        quietHoursStart: 22,
        quietHoursEnd: 8,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key, value) => {
    if (!prefs) return;
    
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    setError(null);
    
    try {
      await notificationService.updatePreferences(updated);
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setError('Failed to save changes. Please try again.');
      // Revert on error
      await loadPreferences();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600">Loading preferences...</span>
        </div>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Unable to load notification settings. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">🔔 Notification Preferences</h2>
      <p className="text-gray-500 text-sm mb-6">Choose which notifications you'd like to receive</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Global Settings */}
        <Section title="Global Settings">
          <ToggleRow
            label="In‑App Notifications"
            description="Show notifications within the app"
            checked={prefs.inAppEnabled}
            onChange={(val) => handleToggle('inAppEnabled', val)}
            disabled={saving}
          />
          <ToggleRow
            label="Email Notifications"
            description="Send notifications to your email address"
            checked={prefs.emailEnabled}
            onChange={(val) => handleToggle('emailEnabled', val)}
            disabled={saving}
          />
        </Section>

        <Section title="Community & Discussions">
          <ToggleRow
            label="New community posts"
            description="When someone posts in your local community"
            checked={prefs.communityPosts}
            onChange={(val) => handleToggle('communityPosts', val)}
            disabled={saving}
          />
          <ToggleRow
            label="Responses to my posts"
            description="When someone responds to your community post"
            checked={prefs.communityResponses}
            onChange={(val) => handleToggle('communityResponses', val)}
            disabled={saving}
          />
          <ToggleRow
            label="Mentions (@username)"
            description="When someone mentions you in a post or comment"
            checked={prefs.postMentions}
            onChange={(val) => handleToggle('postMentions', val)}
            disabled={saving}
          />
          <ToggleRow
            label="Discussion replies"
            description="When someone replies to your discussion comment"
            checked={prefs.discussionReplies}
            onChange={(val) => handleToggle('discussionReplies', val)}
            disabled={saving}
          />
          <ToggleRow
            label="Discussion upvotes"
            description="When someone upvotes your discussion"
            checked={prefs.discussionUpvotes}
            onChange={(val) => handleToggle('discussionUpvotes', val)}
            disabled={saving}
          />
          <ToggleRow
            label="Discussion mentions"
            description="When someone mentions you in a discussion"
            checked={prefs.discussionMentions}
            onChange={(val) => handleToggle('discussionMentions', val)}
            disabled={saving}
          />
        </Section>

        <Section title="Prayer & Bible">
          <ToggleRow
            label="Prayer request responses"
            description="When someone prays for your prayer request"
            checked={prefs.prayerResponses}
            onChange={(val) => handleToggle('prayerResponses', val)}
            disabled={saving}
          />
          <ToggleRow
            label="Verse of the Day published"
            description="When your shared verse becomes Verse of the Day"
            checked={prefs.versePublished}
            onChange={(val) => handleToggle('versePublished', val)}
            disabled={saving}
          />
        </Section>

        <Section title="System">
          <ToggleRow
            label="Announcements"
            description="Important platform announcements"
            checked={prefs.announcements}
            onChange={(val) => handleToggle('announcements', val)}
            disabled={saving}
          />
          <ToggleRow
            label="Group invites"
            description="When someone invites you to a group"
            checked={prefs.groupInvites}
            onChange={(val) => handleToggle('groupInvites', val)}
            disabled={saving}
          />
        </Section>

        {/* Quiet Hours Section (Optional) */}
        <Section title="Quiet Hours">
          <ToggleRow
            label="Enable quiet hours"
            description="Pause notifications during specific hours"
            checked={prefs.quietHoursEnabled || false}
            onChange={(val) => handleToggle('quietHoursEnabled', val)}
            disabled={saving}
          />
          {prefs.quietHoursEnabled && (
            <div className="pl-6 pt-2 space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-600 w-24">Start time:</label>
                <select
                  value={prefs.quietHoursStart ?? 22}
                  onChange={(e) => handleToggle('quietHoursStart', parseInt(e.target.value))}
                  className="px-3 py-1 border rounded-lg"
                  disabled={saving}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i}:00</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-600 w-24">End time:</label>
                <select
                  value={prefs.quietHoursEnd ?? 8}
                  onChange={(e) => handleToggle('quietHoursEnd', parseInt(e.target.value))}
                  className="px-3 py-1 border rounded-lg"
                  disabled={saving}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i}:00</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Section>

        {saving && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Saving changes...</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const Section = ({ title, children }) => (
  <div className="border-b border-gray-200 pb-4 last:border-0">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const ToggleRow = ({ label, description, checked, onChange, disabled }) => (
  <div className="flex justify-between items-start py-2">
    <div className="flex-1 pr-4">
      <div className="font-medium text-gray-700">{label}</div>
      {description && <div className="text-xs text-gray-400 mt-0.5">{description}</div>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        checked ? 'bg-primary-500' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default NotificationSettings;