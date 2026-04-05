// src/components/community/PostAnalytics.jsx
import React, { useState, useEffect } from 'react';

const PostAnalytics = ({ postId, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [postId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/analytics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError('Failed to load analytics');
      }
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📊 Post Analytics</h3>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      {/* Overview Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{analytics?.views || 0}</span>
          <span style={styles.statLabel}>Views</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{analytics?.uniqueViews || 0}</span>
          <span style={styles.statLabel}>Unique Views</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{analytics?.avgViewTime || 0}s</span>
          <span style={styles.statLabel}>Avg. View Time</span>
        </div>
      </div>

      {/* Engagement Stats - Unified Support */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Engagement</h4>
        <div style={styles.engagementGrid}>
          <div style={styles.engagementItem}>
            <span style={styles.engagementIcon}>🙏</span>
            <div>
              <div style={styles.engagementValue}>{analytics?.supportCount || 0}</div>
              <div style={styles.engagementLabel}>Support</div>
            </div>
          </div>
          <div style={styles.engagementItem}>
            <span style={styles.engagementIcon}>💬</span>
            <div>
              <div style={styles.engagementValue}>{analytics?.commentCount || 0}</div>
              <div style={styles.engagementLabel}>Comments</div>
            </div>
          </div>
          <div style={styles.engagementItem}>
            <span style={styles.engagementIcon}>🔖</span>
            <div>
              <div style={styles.engagementValue}>{analytics?.bookmarkCount || 0}</div>
              <div style={styles.engagementLabel}>Bookmarks</div>
            </div>
          </div>
          <div style={styles.engagementItem}>
            <span style={styles.engagementIcon}>📤</span>
            <div>
              <div style={styles.engagementValue}>{analytics?.shareCount || 0}</div>
              <div style={styles.engagementLabel}>Shares</div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Over Time (simplified chart) */}
      {analytics?.supportOverTime && analytics.supportOverTime.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Support Over Time</h4>
          <div style={styles.chartContainer}>
            {analytics.supportOverTime.slice(-7).map((day, i) => {
              const maxCount = Math.max(...analytics.supportOverTime.map(d => d.count), 1);
              const heightPercent = (day.count / maxCount) * 100;
              return (
                <div key={i} style={styles.chartBar}>
                  <div style={{ ...styles.bar, height: `${heightPercent}%` }} />
                  <div style={styles.barLabel}>{day.date.slice(5)}</div>
                  <div style={styles.barValue}>{day.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Donation Stats (if applicable) */}
      {analytics?.donation && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Donation Campaign</h4>
          <div style={styles.donationStats}>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${analytics.donation.percentage}%` }} />
            </div>
            <div style={styles.donationInfo}>
              <span>Raised: KSh {analytics.donation.currentAmount?.toLocaleString()}</span>
              <span>Goal: KSh {analytics.donation.goalAmount?.toLocaleString()}</span>
              <span>{analytics.donation.percentage}% Complete</span>
            </div>
            <div style={styles.donationDonors}>
              👥 {analytics.donation.donorCount || 0} donors
            </div>
          </div>
        </div>
      )}

      {/* Top Supporters */}
      {analytics?.topSupporters && analytics.topSupporters.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Top Supporters 🙏</h4>
          <div style={styles.supportersList}>
            {analytics.topSupporters.slice(0, 5).map((supporter, index) => (
              <div key={supporter.userId} style={styles.supporterItem}>
                <div style={styles.supporterRank}>{index + 1}</div>
                <div style={styles.supporterAvatar}>
                  {supporter.userName?.charAt(0) || '?'}
                </div>
                <div style={styles.supporterInfo}>
                  <div style={styles.supporterName}>{supporter.userName}</div>
                  {supporter.comment && (
                    <div style={styles.supporterComment}>"{supporter.comment.substring(0, 50)}"</div>
                  )}
                </div>
                <div style={styles.supporterDate}>
                  {new Date(supporter.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Views Over Time (if no support data) */}
      {(!analytics?.supportOverTime || analytics.supportOverTime.length === 0) && analytics?.viewsOverTime && analytics.viewsOverTime.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Views Over Time</h4>
          <div style={styles.chartContainer}>
            {analytics.viewsOverTime.slice(-7).map((day, i) => {
              const maxCount = Math.max(...analytics.viewsOverTime.map(d => d.count), 1);
              const heightPercent = (day.count / maxCount) * 100;
              return (
                <div key={i} style={styles.chartBar}>
                  <div style={{ ...styles.bar, height: `${heightPercent}%` }} />
                  <div style={styles.barLabel}>{day.date.slice(5)}</div>
                  <div style={styles.barValue}>{day.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post Performance Metrics */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Performance Metrics</h4>
        <div style={styles.metricsGrid}>
          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>Engagement Rate</span>
            <span style={styles.metricValue}>
              {analytics?.views ? ((analytics.supportCount / analytics.views) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>Comments per Support</span>
            <span style={styles.metricValue}>
              {analytics?.supportCount ? (analytics.commentCount / analytics.supportCount).toFixed(1) : 0}
            </span>
          </div>
          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>Avg Response Time</span>
            <span style={styles.metricValue}>
              {analytics?.avgResponseTime ? `${analytics.avgResponseTime}h` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    minWidth: '300px',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#999',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  error: {
    textAlign: 'center',
    padding: '20px',
    color: '#c33',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  engagementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  engagementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  engagementIcon: {
    fontSize: '28px',
  },
  engagementValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
  },
  engagementLabel: {
    fontSize: '11px',
    color: '#666',
  },
  donationStats: {
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    transition: 'width 0.3s',
  },
  donationInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  donationDonors: {
    fontSize: '11px',
    color: '#666',
  },
  chartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    height: '160px',
  },
  chartBar: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    height: '100%',
  },
  bar: {
    width: '100%',
    backgroundColor: '#667eea',
    borderRadius: '4px',
    transition: 'height 0.3s',
    minHeight: '4px',
  },
  barLabel: {
    fontSize: '9px',
    color: '#666',
  },
  barValue: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#333',
  },
  supportersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  supporterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  supporterRank: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  supporterAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#e0e7ff',
    color: '#667eea',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  supporterInfo: {
    flex: 1,
  },
  supporterName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
  },
  supporterComment: {
    fontSize: '11px',
    color: '#666',
    fontStyle: 'italic',
    marginTop: '2px',
  },
  supporterDate: {
    fontSize: '10px',
    color: '#999',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  metricItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  metricLabel: {
    fontSize: '11px',
    color: '#666',
  },
  metricValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
};

export default PostAnalytics;