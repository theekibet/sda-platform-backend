// src/pages/admin/announcements/AnnouncementBanner.jsx
import React, { useState, useEffect } from 'react';
import { useAnnouncements } from '../../../hooks/useAnnouncements';

const AnnouncementBanner = ({ onView }) => {
  const { activeAnnouncements, markAsViewed, loading, initialLoading } = useAnnouncements({ 
    autoFetch: true, 
    fetchActive: true 
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(new Set());

  // Filter out dismissed announcements
  const visibleAnnouncements = activeAnnouncements.filter(a => !dismissed.has(a.id));
  const currentVisibleAnnouncement = visibleAnnouncements[currentIndex % visibleAnnouncements.length];

  // ✅ FIXED: All useEffect hooks moved BEFORE any early returns

  // Auto-cycle through announcements
  useEffect(() => {
    if (visibleAnnouncements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visibleAnnouncements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [visibleAnnouncements.length]);

  // Handle view tracking
  useEffect(() => {
    if (currentVisibleAnnouncement && !currentVisibleAnnouncement.viewed && onView) {
      onView(currentVisibleAnnouncement.id);
      markAsViewed(currentVisibleAnnouncement.id);
    }
  }, [currentVisibleAnnouncement, onView, markAsViewed]);

  // Don't show anything while initially loading
  if (initialLoading) {
    return (
      <div className="relative flex items-center justify-center gap-3 mb-6 w-full">
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: '⚠️',
          hoverBg: 'hover:bg-yellow-100',
          dotColor: '#d97706',
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: '✅',
          hoverBg: 'hover:bg-green-100',
          dotColor: '#059669',
        };
      case 'maintenance':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: '🔧',
          hoverBg: 'hover:bg-gray-100',
          dotColor: '#4b5563',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'ℹ️',
          hoverBg: 'hover:bg-blue-100',
          dotColor: '#2563eb',
        };
    }
  };

  const styles = getTypeStyles(currentVisibleAnnouncement?.type);

  const handleDismiss = async (e, announcementId) => {
    e.stopPropagation();
    await markAsViewed(announcementId);
    setDismissed(prev => new Set([...prev, announcementId]));
    
    // If we dismissed the current one, move to next
    if (visibleAnnouncements.length > 1) {
      const newIndex = Math.min(currentIndex, visibleAnnouncements.length - 2);
      setCurrentIndex(Math.max(0, newIndex));
    }
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % visibleAnnouncements.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + visibleAnnouncements.length) % visibleAnnouncements.length);
  };

  return (
    <div className="relative flex items-center justify-center gap-3 mb-6 w-full">
      {/* Navigation arrows */}
      {visibleAnnouncements.length > 1 && (
        <button 
          onClick={handlePrev} 
          className="bg-white border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-shrink-0"
          aria-label="Previous announcement"
        >
          ←
        </button>
      )}

      {/* Announcement content */}
      <div className={`flex-1 flex items-start gap-4 p-4 rounded-xl shadow-md transition-all duration-300 border ${styles.bg} ${styles.border} ${styles.text} ${styles.hoverBg}`}>
        <div className="text-2xl leading-none flex-shrink-0">{styles.icon}</div>
        
        <div className="flex-1 min-w-0">
          <h4 className="m-0 mb-1 text-base font-semibold">{currentVisibleAnnouncement?.title}</h4>
          <p className="m-0 text-sm leading-relaxed line-clamp-2">{currentVisibleAnnouncement?.content}</p>
        </div>

        <button
          onClick={(e) => handleDismiss(e, currentVisibleAnnouncement?.id)}
          className="bg-transparent border-none text-lg cursor-pointer opacity-60 hover:opacity-100 p-1 transition-opacity duration-200 focus:outline-none focus:opacity-100 flex-shrink-0"
          title="Dismiss"
          aria-label="Dismiss announcement"
        >
          ✕
        </button>
      </div>

      {/* Next navigation */}
      {visibleAnnouncements.length > 1 && (
        <button 
          onClick={handleNext} 
          className="bg-white border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-shrink-0"
          aria-label="Next announcement"
        >
          →
        </button>
      )}

      {/* Progress indicators */}
      {visibleAnnouncements.length > 1 && (
        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2">
          {visibleAnnouncements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="w-2 h-2 rounded-full border-none p-0 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: index === currentIndex % visibleAnnouncements.length ? styles.dotColor : '#cbd5e1',
                width: index === currentIndex % visibleAnnouncements.length ? '10px' : '8px',
                height: index === currentIndex % visibleAnnouncements.length ? '10px' : '8px',
              }}
              aria-label={`Go to announcement ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner;