import React, { useState } from 'react';
import { useAnnouncements } from '../../../hooks/useAnnouncements'; 
import AnnouncementForm from './AnnouncementForm';
import { ANNOUNCEMENT_TYPES } from '../../../constants/constants';

const AnnouncementList = () => {
  const {
    announcements,
    loading,
    error,
    pagination,
    deleteExistingAnnouncement,
    selectAnnouncement,
    selectedAnnouncement,
    clearSelectedAnnouncement,
    fetchAnnouncements,
    setPage,
  } = useAnnouncements({ autoFetch: true });

  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleEdit = (announcement) => {
    selectAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (deleteConfirm === id) {
      await deleteExistingAnnouncement(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    clearSelectedAnnouncement();
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    clearSelectedAnnouncement();
    fetchAnnouncements();
  };

  const getTypeBadge = (type) => {
    const typeInfo = ANNOUNCEMENT_TYPES.find(t => t.value === type) || ANNOUNCEMENT_TYPES[0];
    return {
      label: typeInfo.label,
      icon: typeInfo.icon,
      color: typeInfo.color,
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isActive = (announcement) => {
    const now = new Date();
    const scheduled = announcement.scheduledAt ? new Date(announcement.scheduledAt) <= now : true;
    const expires = announcement.expiresAt ? new Date(announcement.expiresAt) >= now : true;
    return announcement.isActive && scheduled && expires;
  };

  if (loading && announcements.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading announcements...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>📢 Announcements</h2>
        <button onClick={() => setShowForm(true)} style={styles.createButton}>
          + New Announcement
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => fetchAnnouncements()} style={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📢</div>
          <h3 style={styles.emptyTitle}>No Announcements</h3>
          <p style={styles.emptyText}>Create your first announcement to communicate with users.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {announcements.map(announcement => {
            const badge = getTypeBadge(announcement.type);
            const active = isActive(announcement);

            return (
              <div key={announcement.id} style={styles.card}>
                {/* Status Indicator */}
                <div style={{
                  ...styles.statusIndicator,
                  backgroundColor: active ? '#27ae60' : '#95a5a6',
                }} />

                <div style={styles.cardContent}>
                  {/* Header */}
                  <div style={styles.cardHeader}>
                    <div style={styles.titleSection}>
                      <h3 style={styles.cardTitle}>{announcement.title}</h3>
                      <span style={{
                        ...styles.typeBadge,
                        backgroundColor: `${badge.color}20`,
                        color: badge.color,
                      }}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>
                    <div style={styles.cardActions}>
                      <button
                        onClick={() => handleEdit(announcement)}
                        style={styles.editButton}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        style={{
                          ...styles.deleteButton,
                          ...(deleteConfirm === announcement.id ? styles.deleteButtonConfirm : {}),
                        }}
                        title={deleteConfirm === announcement.id ? 'Click again to confirm' : 'Delete'}
                      >
                        {deleteConfirm === announcement.id ? '⚠️' : '🗑️'}
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p style={styles.cardContent}>{announcement.content}</p>

                  {/* Meta Info */}
                  <div style={styles.metaInfo}>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Created:</span>
                      <span>{formatDate(announcement.createdAt)}</span>
                    </div>
                    {announcement.scheduledAt && (
                      <div style={styles.metaItem}>
                        <span style={styles.metaLabel}>Scheduled:</span>
                        <span>{formatDate(announcement.scheduledAt)}</span>
                      </div>
                    )}
                    {announcement.expiresAt && (
                      <div style={styles.metaItem}>
                        <span style={styles.metaLabel}>Expires:</span>
                        <span>{formatDate(announcement.expiresAt)}</span>
                      </div>
                    )}
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Target:</span>
                      <span>{announcement.targetRole || 'All Users'}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Views:</span>
                      <span>{announcement.viewCount || 0}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div style={styles.statusBadge}>
                    {active ? '🟢 Active' : '⚪ Inactive'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            style={styles.pageButton}
          >
            ← Previous
          </button>
          <span style={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            style={styles.pageButton}
          >
            Next →
          </button>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <AnnouncementForm
          announcement={selectedAnnouncement}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
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
    marginBottom: '30px',
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '24px',
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
    '&:hover': {
      backgroundColor: '#5a6fd8',
    },
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
    color: '#333',
    fontSize: '20px',
  },
  emptyText: {
    margin: 0,
    color: '#999',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  card: {
    display: 'flex',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  statusIndicator: {
    width: '4px',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  cardTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
  },
  typeBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardActions: {
    display: 'flex',
    gap: '5px',
  },
  editButton: {
    padding: '5px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    '&:hover': {
      opacity: 1,
    },
  },
  deleteButton: {
    padding: '5px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    opacity: 0.6,
    transition: 'all 0.2s',
    '&:hover': {
      opacity: 1,
    },
  },
  deleteButtonConfirm: {
    opacity: 1,
    color: '#e74c3c',
  },
  metaInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '12px',
  },
  metaLabel: {
    color: '#999',
    fontSize: '11px',
    textTransform: 'uppercase',
  },
  statusBadge: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#666',
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

export default AnnouncementList;
