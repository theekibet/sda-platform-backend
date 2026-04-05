// src/pages/admin/moderation/ModerationQueue.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getContentModerationQueue, moderateContent } from '../../../services/api';
import ModerationActionModal from "./ModerationActionModal";
import { MODERATION_ACTIONS, CONTENT_TYPES } from '../../../constants/constants';

const ModerationQueue = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: 'pending',
    priority: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchQueue();
  }, [filters, pagination.page]);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getContentModerationQueue({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      setItems(response.data.items || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load moderation queue');
      console.error('Error fetching moderation queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = (item) => {
    setSelectedItem(item);
    setShowActionModal(true);
  };

  const handleActionComplete = async (action, actionData) => {
    if (!selectedItem) return;
    
    try {
      await moderateContent(selectedItem.id, {
        action,
        reason: actionData.reason,
        contentType: selectedItem.contentType,
        notifyUser: actionData.notifyUser,
        suspensionDuration: actionData.suspensionDuration,
        warningMessage: actionData.warningMessage,
        postStatus: actionData.postStatus,
      });
      
      // Remove item from queue or update status
      setItems(prev => prev.filter(item => item.id !== selectedItem.id));
      setShowActionModal(false);
      setSelectedItem(null);
      
      // Show success message
      const actionMessages = {
        approve: 'Content approved successfully',
        remove: 'Content removed successfully',
        warn: 'Warning sent to user',
        flag: 'Content flagged for review',
        dismiss: 'Report dismissed',
        pin: 'Post pinned successfully',
        archive: 'Post archived successfully',
        feature: 'Post featured successfully',
        mark_spam: 'Content marked as spam',
      };
      alert(actionMessages[action] || 'Action completed successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to moderate content');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchQueue();
  };

  const getContentTypeLabel = (type) => {
    switch (type) {
      case CONTENT_TYPES.FORUM_POST: return 'Forum Post';
      case CONTENT_TYPES.FORUM_REPLY: return 'Forum Reply';
      case CONTENT_TYPES.PRAYER_REQUEST: return 'Prayer Request';
      case CONTENT_TYPES.TESTIMONY: return 'Testimony';
      case CONTENT_TYPES.GROUP_DISCUSSION: return 'Group Discussion';
      case CONTENT_TYPES.USER: return 'User Profile';
      case 'communityPost': return 'Community Post';
      case 'event': return 'Event';
      case 'donation': return 'Donation Post';
      case 'support': return 'Support Request';
      case 'announcement': return 'Announcement';
      case 'general': return 'General Post';
      default: return type;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#e74c3c';
      case 'high': return '#f39c12';
      case 'medium': return '#3498db';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading && items.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading moderation queue...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>📝 Content Moderation Queue</h2>
        <div style={styles.stats}>
          <span style={styles.stat}>
            <strong>{pagination.total}</strong> items pending
          </span>
          <span style={styles.stat}>
            🔥 <strong>{items.filter(i => i.priority === 'high' || i.priority === 'critical').length}</strong> high priority
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Content Types</option>
          <option value={CONTENT_TYPES.FORUM_POST}>Forum Posts</option>
          <option value={CONTENT_TYPES.FORUM_REPLY}>Forum Replies</option>
          <option value={CONTENT_TYPES.PRAYER_REQUEST}>Prayer Requests</option>
          <option value={CONTENT_TYPES.TESTIMONY}>Testimonies</option>
          <option value={CONTENT_TYPES.GROUP_DISCUSSION}>Group Discussions</option>
          <option value={CONTENT_TYPES.USER}>User Profiles</option>
          <option value="communityPost">Community Posts</option>
          <option value="event">Events</option>
          <option value="donation">Donations</option>
          <option value="announcement">Announcements</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          style={styles.filterSelect}
        >
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            placeholder="Search reports..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>🔍</button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={fetchQueue} style={styles.retryButton}>Retry</button>
        </div>
      )}

      {/* Queue Items */}
      {items.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>✅</div>
          <h3 style={styles.emptyTitle}>All Clear!</h3>
          <p style={styles.emptyText}>No items pending moderation at the moment.</p>
        </div>
      ) : (
        <div style={styles.queueList}>
          {items.map(item => (
            <div key={item.id} style={styles.queueItem}>
              {/* Priority Indicator */}
              <div style={{
                ...styles.priorityIndicator,
                backgroundColor: getPriorityColor(item.priority),
              }} />

              {/* Item Content */}
              <div style={styles.itemContent}>
                <div style={styles.itemHeader}>
                  <div style={styles.itemType}>
                    <span style={styles.typeBadge}>
                      {getContentTypeLabel(item.contentType)}
                    </span>
                    {item.type && (
                      <span style={styles.subTypeBadge}>
                        {item.type}
                      </span>
                    )}
                    <span style={styles.reportCount}>
                      🚩 {item.reportCount || 1} report{item.reportCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span style={styles.itemDate}>{formatDate(item.createdAt)}</span>
                </div>

                {/* Reported By */}
                {item.reportedBy && (
                  <div style={styles.reportedBy}>
                    <strong>Reported by:</strong> {item.reportedBy.name}
                  </div>
                )}

                {/* Content Preview */}
                <div style={styles.contentSnippet}>
                  <strong>{item.title || 'Untitled'}</strong>
                  <p>{item.contentSnippet || item.description || 'No content preview available'}</p>
                </div>

                {/* Reason */}
                {item.reason && (
                  <div style={styles.reason}>
                    <strong>Reason:</strong> {item.reason}
                  </div>
                )}

                {/* Author Info (for community posts) */}
                {item.author && (
                  <div style={styles.authorInfo}>
                    <span>👤 Author: {item.author.name}</span>
                    {item.author.locationName && (
                      <span>📍 {item.author.locationName.split(',')[0]}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={styles.itemActions}>
                  <button
                    onClick={() => {
                      const url = item.contentType === 'communityPost' 
                        ? `/community/post/${item.contentId}`
                        : `/${item.contentType}/${item.contentId}`;
                      window.open(url, '_blank');
                    }}
                    style={styles.viewButton}
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={() => handleModerate(item)}
                    style={styles.moderateButton}
                  >
                    ⚖️ Moderate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            style={styles.pageButton}
          >
            ← Previous
          </button>
          <span style={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            style={styles.pageButton}
          >
            Next →
          </button>
        </div>
      )}

      {/* Moderation Action Modal */}
      {showActionModal && selectedItem && (
        <ModerationActionModal
          item={selectedItem}
          onClose={() => {
            setShowActionModal(false);
            setSelectedItem(null);
          }}
          onAction={handleActionComplete}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    color: '#666',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '24px',
  },
  stats: {
    display: 'flex',
    gap: '15px',
  },
  stat: {
    padding: '6px 12px',
    backgroundColor: '#f0f4ff',
    borderRadius: '20px',
    color: '#667eea',
    fontSize: '14px',
  },
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '150px',
    backgroundColor: 'white',
  },
  searchForm: {
    display: 'flex',
    flex: 1,
    minWidth: '200px',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '5px 0 0 5px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  searchButton: {
    padding: '8px 12px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '0 5px 5px 0',
    cursor: 'pointer',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  retryButton: {
    marginLeft: 'auto',
    padding: '5px 10px',
    backgroundColor: '#c33',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  emptyTitle: {
    margin: '0 0 10px 0',
    color: '#27ae60',
    fontSize: '20px',
  },
  emptyText: {
    margin: 0,
    color: '#999',
  },
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  queueItem: {
    display: 'flex',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  priorityIndicator: {
    width: '4px',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    padding: '20px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  itemType: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  typeBadge: {
    padding: '4px 8px',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  subTypeBadge: {
    padding: '4px 8px',
    backgroundColor: '#9b59b6',
    color: 'white',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
  },
  reportCount: {
    fontSize: '12px',
    color: '#e74c3c',
  },
  itemDate: {
    fontSize: '12px',
    color: '#999',
  },
  reportedBy: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '10px',
  },
  contentSnippet: {
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
    marginBottom: '10px',
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5',
  },
  reason: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '10px',
  },
  authorInfo: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '15px',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  itemActions: {
    display: 'flex',
    gap: '10px',
  },
  viewButton: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  moderateButton: {
    padding: '6px 12px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    marginTop: '30px',
  },
  pageButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  pageInfo: {
    fontSize: '14px',
    color: '#666',
  },
};

// Add keyframe animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default ModerationQueue;