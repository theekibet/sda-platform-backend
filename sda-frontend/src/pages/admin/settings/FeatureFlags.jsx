// src/pages/admin/settings/FeatureFlags.jsx
import React, { useState, useEffect } from 'react';
import { getFeatureFlags, updateFeatureFlag } from '../../../services/api';
import { FEATURE_FLAGS } from '../../../constants/constants';

const FeatureFlags = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getFeatureFlags();
      setFlags(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feature flags');
      console.error('Error fetching feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (flagName, currentValue) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await updateFeatureFlag(flagName, !currentValue);
      
      // Update local state
      setFlags(prev => 
        prev.map(flag => 
          flag.name === flagName ? { ...flag, enabled: !currentValue } : flag
        )
      );
      
      setSuccess(`Feature "${flagName}" ${!currentValue ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update feature flag');
    } finally {
      setSaving(false);
    }
  };

  const getFlagDescription = (flagName) => {
    const descriptions = {
      [FEATURE_FLAGS.PRAYER_WALL]: 'Enable or disable the prayer wall',
      [FEATURE_FLAGS.GROUPS]: 'Enable or disable fellowship groups',
      [FEATURE_FLAGS.LOCATION]: 'Enable or disable location-based features',
      [FEATURE_FLAGS.ANNOUNCEMENTS]: 'Enable or disable announcements',
      [FEATURE_FLAGS.REPORTS]: 'Enable or disable user reporting',
    };
    
    return descriptions[flagName] || 'Toggle this feature on or off';
  };

  const getFlagIcon = (flagName) => {
    const icons = {
      [FEATURE_FLAGS.FORUM]: '💬',
      [FEATURE_FLAGS.PRAYER_WALL]: '🙏',
      [FEATURE_FLAGS.GROUPS]: '🤝',
      [FEATURE_FLAGS.LOCATION]: '📍',
      [FEATURE_FLAGS.ANNOUNCEMENTS]: '📢',
      [FEATURE_FLAGS.REPORTS]: '🚩',
    };
    
    return icons[flagName] || '⚙️';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading feature flags...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🚩 Feature Flags</h3>
      <p style={styles.description}>
        Enable or disable platform features. Changes take effect immediately.
      </p>

      {error && (
        <div style={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={styles.success}>
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      <div style={styles.flagsList}>
        {flags.map(flag => (
          <div key={flag.id || flag.name} style={styles.flagCard}>
            <div style={styles.flagHeader}>
              <span style={styles.flagIcon}>{getFlagIcon(flag.name)}</span>
              <div style={styles.flagInfo}>
                <h4 style={styles.flagName}>{flag.name}</h4>
                {flag.description && (
                  <p style={styles.flagDescription}>{flag.description}</p>
                )}
                <p style={styles.flagHelp}>{getFlagDescription(flag.name)}</p>
              </div>
            </div>

            <div style={styles.flagControls}>
              <div style={styles.flagStatus}>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: flag.enabled ? '#27ae60' : '#95a5a6',
                }}>
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <label style={styles.switch}>
                <input
                  type="checkbox"
                  checked={flag.enabled || false}
                  onChange={() => handleToggle(flag.name, flag.enabled)}
                  disabled={saving}
                />
                <span style={styles.slider}></span>
              </label>
            </div>

            {flag.percentage !== undefined && flag.percentage < 100 && (
              <div style={styles.rolloutInfo}>
                <span>Rolling out to {flag.percentage}% of users</span>
                <div style={styles.progressBar}>
                  <div style={{...styles.progress, width: `${flag.percentage}%`}}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {flags.length === 0 && (
        <div style={styles.emptyState}>
          <p>No feature flags configured.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px 0',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#666',
  },
  loadingSpinner: {
    width: '30px',
    height: '30px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px',
  },
  title: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '20px',
  },
  description: {
    margin: '0 0 20px 0',
    color: '#666',
    fontSize: '14px',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  success: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  flagsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  flagCard: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  flagHeader: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
  },
  flagIcon: {
    fontSize: '32px',
    lineHeight: 1,
  },
  flagInfo: {
    flex: 1,
  },
  flagName: {
    margin: '0 0 5px 0',
    fontSize: '16px',
    color: '#333',
    textTransform: 'capitalize',
  },
  flagDescription: {
    margin: '0 0 5px 0',
    fontSize: '14px',
    color: '#666',
  },
  flagHelp: {
    margin: 0,
    fontSize: '12px',
    color: '#999',
    fontStyle: 'italic',
  },
  flagControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flagStatus: {
    display: 'flex',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '50px',
    height: '24px',
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '.4s',
    borderRadius: '24px',
    '&:before': {
      position: 'absolute',
      content: '""',
      height: '16px',
      width: '16px',
      left: '4px',
      bottom: '4px',
      backgroundColor: 'white',
      transition: '.4s',
      borderRadius: '50%',
    },
  },
  rolloutInfo: {
    marginTop: '15px',
    fontSize: '12px',
    color: '#666',
  },
  progressBar: {
    marginTop: '5px',
    height: '4px',
    backgroundColor: '#e0e0e0',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
};

// Add CSS for switch checked state
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  input:checked + .slider {
    background-color: #667eea;
  }
  
  input:focus + .slider {
    box-shadow: 0 0 1px #667eea;
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
`;
document.head.appendChild(styleSheet);

export default FeatureFlags;
