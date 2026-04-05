import React, { useState, useEffect } from 'react';

const GuidelinesBanner = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    // Check localStorage for dismissal status
    return localStorage.getItem('communityGuidelinesDismissed') === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('communityGuidelinesDismissed', 'true');
  };

  const handleReset = () => {
    setIsDismissed(false);
    localStorage.removeItem('communityGuidelinesDismissed');
  };

  // Auto-expand on first visit
  useEffect(() => {
    const hasSeen = localStorage.getItem('communityGuidelinesSeen');
    if (!hasSeen && !isDismissed) {
      setIsExpanded(true);
      localStorage.setItem('communityGuidelinesSeen', 'true');
    }
  }, [isDismissed]);

  if (isDismissed) return null;

  return (
    <div className="guidelines-banner">
      <div 
        className="guidelines-banner-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="guidelines-header-left">
          <span className="guidelines-icon">📋</span>
          <span className="guidelines-title">Community Guidelines</span>
          <span className="guidelines-badge">Read before posting</span>
        </div>
        <div className="guidelines-header-actions">
          <button 
            className="guidelines-toggle" 
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsExpanded(!isExpanded); 
            }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          <button 
            className="guidelines-dismiss" 
            onClick={(e) => { 
              e.stopPropagation(); 
              handleDismiss(); 
            }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="guidelines-content">
          <div className="guidelines-grid">
            <div className="guidelines-section">
              <div className="guidelines-section-header">
                <span className="section-icon">📅</span>
                <h4>Events</h4>
              </div>
              <p>Include date, time, and location. <strong>Past dates are not allowed.</strong></p>
              <ul className="guidelines-tips">
                <li>✓ Add venue details</li>
                <li>✓ Specify if online or in-person</li>
                <li>✓ Include contact for questions</li>
              </ul>
            </div>

            <div className="guidelines-section">
              <div className="guidelines-section-header">
                <span className="section-icon">🙏</span>
                <h4>Support</h4>
              </div>
              <p>For prayer requests and emotional support only. <strong>No financial requests.</strong></p>
              <ul className="guidelines-tips">
                <li>✓ Share prayer needs</li>
                <li>✓ Request encouragement</li>
                <li>✓ Offer to pray for others</li>
              </ul>
            </div>

            <div className="guidelines-section">
              <div className="guidelines-section-header">
                <span className="section-icon">🎁</span>
                <h4>Donations</h4>
              </div>
              <p><strong>Must include contact number.</strong> Please verify before giving.</p>
              <ul className="guidelines-tips">
                <li>⚠️ Verify the organizer</li>
                <li>✓ Include clear purpose</li>
                <li>✓ Update progress regularly</li>
              </ul>
            </div>

            <div className="guidelines-section">
              <div className="guidelines-section-header">
                <span className="section-icon">📢</span>
                <h4>Announcements</h4>
              </div>
              <p>Official church announcements have a <span className="verified-badge">✓ Verified</span> badge.</p>
              <ul className="guidelines-tips">
                <li>✓ Keep it factual and clear</li>
                <li>✓ Include dates and deadlines</li>
                <li>✓ Link to official sources when possible</li>
              </ul>
            </div>

            <div className="guidelines-section">
              <div className="guidelines-section-header">
                <span className="section-icon">📌</span>
                <h4>General</h4>
              </div>
              <p>Keep discussions respectful and church-related.</p>
              <ul className="guidelines-tips">
                <li>✓ Ask questions</li>
                <li>✓ Share resources</li>
                <li>✓ Encourage one another</li>
              </ul>
            </div>
          </div>

          <div className="guidelines-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <strong>Safety Tips:</strong>
              <ul>
                <li>Never share sensitive personal information (passwords, ID numbers, bank details)</li>
                <li>Verify donation requests before contributing - ask questions in comments</li>
                <li>Report suspicious posts using the 🚩 report button</li>
                <li>Meet in public places if arranging to meet in person</li>
              </ul>
            </div>
          </div>

          <div className="guidelines-footer">
            <button className="guidelines-acknowledge" onClick={handleDismiss}>
              I Understand ✓
            </button>
            <button className="guidelines-reset" onClick={handleReset}>
              Reset Banner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidelinesBanner;