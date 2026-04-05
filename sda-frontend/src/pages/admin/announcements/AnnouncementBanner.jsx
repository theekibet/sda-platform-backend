import React, { useState, useEffect } from 'react';
import { useAnnouncements } from '../../../hooks/useAnnouncements';
import { ANNOUNCEMENT_TYPES } from '../../../constants/constants';

const AnnouncementBanner = ({ onView }) => {
  const { activeAnnouncements, markAsViewed, loading } = useAnnouncements({ 
    autoFetch: true, 
    fetchActive: true 
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(new Set());

  // Get current announcement
  const currentAnnouncement = activeAnnouncements[currentIndex];

  // Auto-cycle through announcements
  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeAnnouncements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeAnnouncements.length]);

  // Handle view tracking
  useEffect(() => {
    if (currentAnnouncement && !currentAnnouncement.viewed && onView) {
      onView(currentAnnouncement.id);
    }
  }, [currentAnnouncement, onView]);

  const handleDismiss = async (e, announcementId) => {
    e.stopPropagation();
    await markAsViewed(announcementId);
    setDismissed(prev => new Set([...prev, announcementId]));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeAnnouncements.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
  };

  // Filter out dismissed announcements
  const visibleAnnouncements = activeAnnouncements.filter(a => !dismissed.has(a.id));

  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return {
          background: '#fff3cd',
          borderColor: '#ffeeba',
          color: '#856404',
          icon: '⚠️',
        };
      case 'success':
        return {
          background: '#d4edda',
          borderColor: '#c3e6cb',
          color: '#155724',
          icon: '✅',
        };
      case 'maintenance':
        return {
          background: '#e2e3e5',
          borderColor: '#d6d8db',
          color: '#383d41',
          icon: '🔧',
        };
      case 'info':
      default:
        return {
          background: '#d1ecf1',
          borderColor: '#bee5eb',
          color: '#0c5460',
          icon: 'ℹ️',
        };
    }
  };

  const styles = getTypeStyles(currentAnnouncement?.type);

  return (
    <div style={bannerStyles.container}>
      {/* Navigation arrows (if multiple) */}
      {visibleAnnouncements.length > 1 && (
        <button onClick={handlePrev} style={bannerStyles.navButton}>←</button>
      )}

      {/* Announcement content */}
      <div style={{
        ...bannerStyles.banner,
        backgroundColor: styles.background,
        borderColor: styles.borderColor,
        color: styles.color,
      }}>
        <div style={bannerStyles.icon}>{styles.icon}</div>
        
        <div style={bannerStyles.content}>
          <h4 style={bannerStyles.title}>{currentAnnouncement?.title}</h4>
          <p style={bannerStyles.message}>{currentAnnouncement?.content}</p>
        </div>

        <button
          onClick={(e) => handleDismiss(e, currentAnnouncement?.id)}
          style={bannerStyles.dismissButton}
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Next navigation */}
      {visibleAnnouncements.length > 1 && (
        <button onClick={handleNext} style={bannerStyles.navButton}>→</button>
      )}

      {/* Progress indicators */}
      {visibleAnnouncements.length > 1 && (
        <div style={bannerStyles.progressContainer}>
          {visibleAnnouncements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                ...bannerStyles.progressDot,
                backgroundColor: index === currentIndex ? styles.color : '#ccc',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const bannerStyles = {
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
    width: '100%',
  },
  banner: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    padding: '15px 20px',
    borderRadius: '8px',
    border: '1px solid',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    position: 'relative',
  },
  icon: {
    fontSize: '24px',
    lineHeight: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    margin: '0 0 5px 0',
    fontSize: '16px',
    fontWeight: '600',
  },
  message: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.5',
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: 'inherit',
    opacity: 0.6,
    padding: '5px',
    '&:hover': {
      opacity: 1,
    },
  },
  navButton: {
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#666',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  progressContainer: {
    position: 'absolute',
    bottom: '-15px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
  },
  progressDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
};

export default AnnouncementBanner;
