// src/pages/admin/bible/AdminVerseQueue.jsx
import { useState, useEffect } from 'react';
import { useAuth } from "../../../contexts/AuthContext";

function AdminVerseQueue() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [filter, setFilter] = useState('pending');
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchStats();
    fetchActivity();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/admin/bible/submissions?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setSubmissions(data.data?.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/admin/bible/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/admin/bible/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setActivity(data.data || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/admin/bible/submissions/${selectedSubmission.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          scheduledFor: scheduledDate || undefined,
          notes: reason 
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        setReason('');
        setScheduledDate('');
        fetchSubmissions();
        fetchStats();
        fetchActivity();
      }
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledDate) {
      alert('Please select a date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/admin/bible/submissions/${selectedSubmission.id}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          scheduledFor: scheduledDate,
          notes: reason || 'Scheduled from admin panel'
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        setReason('');
        setScheduledDate('');
        fetchSubmissions();
        fetchStats();
        fetchActivity();
      }
    } catch (error) {
      console.error('Error scheduling:', error);
    }
  };

  const handleReject = async () => {
    if (!reason && action === 'reject') {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/admin/bible/submissions/${selectedSubmission.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        setReason('');
        fetchSubmissions();
        fetchStats();
        fetchActivity();
      }
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const handlePublishNow = async (submissionId) => {
    if (!window.confirm('Publish this verse as today\'s verse? This will make it the Verse of the Day.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`http://localhost:3000/admin/bible/submissions/${submissionId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          scheduledFor: today,
          notes: 'Published immediately'
        })
      });
      const data = await response.json();
      
      if (data.success) {
        fetchSubmissions();
        fetchStats();
        fetchActivity();
        alert('Verse scheduled for today! It will be published at midnight.');
      }
    } catch (error) {
      console.error('Error publishing:', error);
    }
  };

  const handleBatchSchedule = async () => {
    if (!window.confirm('Schedule all approved verses automatically? They will be scheduled for the next available dates.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/admin/bible/schedule', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        fetchSubmissions();
        fetchStats();
        fetchActivity();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error batch scheduling:', error);
    }
  };

  const handlePublishTodayScheduled = async () => {
    if (!window.confirm('Publish today\'s scheduled verse now?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/admin/bible/publish-today', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        fetchSubmissions();
        fetchStats();
        fetchActivity();
        alert('Verse published successfully!');
      } else {
        alert(data.message || 'No verse scheduled for today');
      }
    } catch (error) {
      console.error('Error publishing today:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#f39c12', text: '⏳ Pending', icon: '⏳' },
      approved: { color: '#3498db', text: '✅ Approved', icon: '✅' },
      scheduled: { color: '#27ae60', text: '📅 Scheduled', icon: '📅' },
      published: { color: '#27ae60', text: '✨ Published', icon: '✨' },
      rejected: { color: '#e74c3c', text: '❌ Rejected', icon: '❌' },
    };
    return badges[status] || { color: '#95a5a6', text: status, icon: '📄' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date().toISOString().split('T')[0];
    const date = new Date(dateString).toISOString().split('T')[0];
    return date === today;
  };

  const getActionButton = (sub) => {
    switch(sub.status) {
      case 'pending':
        return (
          <>
            <button
              onClick={() => {
                setSelectedSubmission(sub);
                setAction('approve');
                setScheduledDate('');
                setShowModal(true);
              }}
              style={styles.approveButton}
            >
              ✅ Approve
            </button>
            <button
              onClick={() => {
                setSelectedSubmission(sub);
                setAction('reject');
                setShowModal(true);
              }}
              style={styles.rejectButton}
            >
              ❌ Reject
            </button>
          </>
        );
      
      case 'approved':
        return (
          <>
            <button
              onClick={() => {
                setSelectedSubmission(sub);
                setAction('schedule');
                setScheduledDate(new Date().toISOString().split('T')[0]);
                setShowModal(true);
              }}
              style={styles.scheduleButton}
            >
              📅 Schedule
            </button>
            <button
              onClick={() => handlePublishNow(sub.id)}
              style={styles.publishNowButton}
              title="Schedule for today"
            >
              ✨ Publish Now
            </button>
            <button
              onClick={() => {
                setSelectedSubmission(sub);
                setAction('reject');
                setShowModal(true);
              }}
              style={styles.rejectSmallButton}
              title="Reject"
            >
              ❌
            </button>
          </>
        );
      
      case 'scheduled':
        return (
          <>
            <button
              onClick={() => {
                setSelectedSubmission(sub);
                setAction('schedule');
                setScheduledDate(sub.scheduledFor?.split('T')[0] || '');
                setShowModal(true);
              }}
              style={styles.rescheduleButton}
            >
              📅 Reschedule
            </button>
            {isToday(sub.scheduledFor) && (
              <button
                onClick={() => handlePublishNow(sub.id)}
                style={styles.publishNowButton}
              >
                ✨ Publish Now
              </button>
            )}
          </>
        );
      
      case 'published':
        return (
          <button
            onClick={() => window.open(`/bible/read/${sub.verse?.book}/${sub.verse?.chapter}`, '_blank')}
            style={styles.viewButton}
          >
            👁️ View Verse
          </button>
        );
      
      case 'rejected':
        return (
          <button
            onClick={() => {
              setSelectedSubmission(sub);
              setAction('approve');
              setScheduledDate('');
              setShowModal(true);
            }}
            style={styles.reinstateButton}
          >
            🔄 Reinstate
          </button>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading submissions...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Stats Bar */}
      {stats && (
        <div style={styles.statsBar}>
          <div style={styles.statItem} onClick={() => setFilter('pending')} className={filter === 'pending' ? styles.activeStat : ''}>
            <span style={styles.statLabel}>Pending</span>
            <span style={styles.statValue}>{stats.counts.pending}</span>
          </div>
          <div style={styles.statItem} onClick={() => setFilter('approved')} className={filter === 'approved' ? styles.activeStat : ''}>
            <span style={styles.statLabel}>Approved</span>
            <span style={styles.statValue}>{stats.counts.approved}</span>
          </div>
          <div style={styles.statItem} onClick={() => setFilter('scheduled')} className={filter === 'scheduled' ? styles.activeStat : ''}>
            <span style={styles.statLabel}>Scheduled</span>
            <span style={styles.statValue}>{stats.counts.scheduled}</span>
          </div>
          <div style={styles.statItem} onClick={() => setFilter('published')} className={filter === 'published' ? styles.activeStat : ''}>
            <span style={styles.statLabel}>Published</span>
            <span style={styles.statValue}>{stats.counts.published}</span>
          </div>
          <div style={styles.statItem} onClick={() => setFilter('rejected')} className={filter === 'rejected' ? styles.activeStat : ''}>
            <span style={styles.statLabel}>Rejected</span>
            <span style={styles.statValue}>{stats.counts.rejected}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Next Date</span>
            <span style={styles.statValue}>{formatDate(stats.nextAvailableDate)}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>📖 Verse Moderation</h2>
          <button 
            onClick={() => setShowActivity(!showActivity)} 
            style={styles.activityToggle}
          >
            {showActivity ? '📋 Hide Activity' : '📋 Show Activity'}
          </button>
        </div>
        <div style={styles.headerActions}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
          {filter === 'approved' && submissions.length > 0 && (
            <button onClick={handleBatchSchedule} style={styles.batchButton}>
              📅 Schedule All
            </button>
          )}
          {stats?.counts.scheduled > 0 && (
            <button onClick={handlePublishTodayScheduled} style={styles.publishTodayButton}>
              ✨ Publish Today's
            </button>
          )}
        </div>
      </div>

      {/* Activity Panel */}
      {showActivity && (
        <div style={styles.activityPanel}>
          <h3 style={styles.activityTitle}>Recent Activity</h3>
          <div style={styles.activityList}>
            {activity.length === 0 ? (
              <p style={styles.noActivity}>No recent activity</p>
            ) : (
              activity.map(item => (
                <div key={item.id} style={styles.activityItem}>
                  <span style={styles.activityAction}>{item.action}</span>
                  <span style={styles.activityTime}>{formatDateTime(item.createdAt)}</span>
                  {item.reason && <span style={styles.activityReason}>"{item.reason}"</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Submissions Grid */}
      {submissions.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No {filter} submissions found</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {submissions.map(sub => {
            const badge = getStatusBadge(sub.status);
            return (
              <div key={sub.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={{...styles.statusBadge, backgroundColor: badge.color}}>
                    {badge.text}
                  </span>
                  <span style={styles.date}>
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={styles.verseContent}>
                  <h4 style={styles.reference}>{sub.verse?.reference}</h4>
                  <p style={styles.verseText}>"{sub.verse?.text}"</p>
                </div>

                {sub.comment && (
                  <div style={styles.comment}>
                    <strong>User's reflection:</strong>
                    <p>{sub.comment}</p>
                  </div>
                )}

                <div style={styles.userInfo}>
                  <p><strong>Submitted by:</strong> {sub.user?.name}</p>
                  <p><strong>Email:</strong> {sub.user?.email}</p>
                </div>

                {sub.queuePosition && sub.status === 'pending' && (
                  <div style={styles.queueInfo}>
                    <strong>Queue position:</strong> #{sub.queuePosition}
                  </div>
                )}

                {sub.scheduledFor && (
                  <div style={styles.scheduledInfo}>
                    📅 Scheduled for: {formatDate(sub.scheduledFor)}
                    {isToday(sub.scheduledFor) && (
                      <span style={styles.todayTag}> Today!</span>
                    )}
                  </div>
                )}

                {sub.reviewNotes && (
                  <div style={styles.reviewNotes}>
                    <strong>Admin notes:</strong> {sub.reviewNotes}
                  </div>
                )}

                {/* Action buttons */}
                <div style={styles.actions}>
                  {getActionButton(sub)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedSubmission && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>
              {action === 'approve' && 'Approve Verse'}
              {action === 'schedule' && 'Schedule Verse'}
              {action === 'reject' && 'Reject Verse'}
            </h3>
            
            <div style={styles.modalVerse}>
              <strong>{selectedSubmission.verse?.reference}</strong>
              <p>{selectedSubmission.verse?.text}</p>
            </div>

            {(action === 'approve' || action === 'schedule') && (
              <div style={styles.formGroup}>
                <label>Schedule for:</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  style={styles.input}
                  min={new Date().toISOString().split('T')[0]}
                  required={action === 'schedule'}
                />
                <p style={styles.helpText}>
                  {action === 'schedule' 
                    ? 'Select a date to publish this verse'
                    : 'Leave empty to approve without scheduling'}
                </p>
              </div>
            )}

            <div style={styles.formGroup}>
              <label>
                {action === 'reject' ? 'Reason for rejection:' : 'Admin notes (optional):'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={styles.textarea}
                rows="3"
                placeholder={action === 'reject' 
                  ? 'Explain why this verse was rejected...' 
                  : 'Add any notes about this submission...'}
              />
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setShowModal(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button
                onClick={
                  action === 'approve' ? handleApprove :
                  action === 'schedule' ? handleSchedule :
                  handleReject
                }
                style={
                  action === 'reject' 
                    ? styles.confirmRejectButton 
                    : styles.confirmApproveButton
                }
                disabled={action === 'schedule' && !scheduledDate}
              >
                {action === 'approve' && 'Approve'}
                {action === 'schedule' && 'Schedule'}
                {action === 'reject' && 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  statsBar: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    flexWrap: 'wrap',
    cursor: 'pointer',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '80px',
    padding: '8px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#e9ecef',
    },
  },
  activeStat: {
    backgroundColor: '#e9ecef',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  title: {
    margin: 0,
    color: '#333',
  },
  activityToggle: {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  filterSelect: {
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  batchButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  publishTodayButton: {
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    color: '#999',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
  },
  date: {
    fontSize: '12px',
    color: '#999',
  },
  verseContent: {
    marginBottom: '15px',
  },
  reference: {
    margin: '0 0 10px 0',
    color: '#667eea',
  },
  verseText: {
    color: '#666',
    fontStyle: 'italic',
    lineHeight: '1.6',
    margin: 0,
  },
  comment: {
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
  },
  userInfo: {
    marginBottom: '15px',
    fontSize: '13px',
    color: '#666',
  },
  queueInfo: {
    marginBottom: '15px',
    padding: '8px',
    backgroundColor: '#f0f4ff',
    borderRadius: '5px',
    fontSize: '13px',
  },
  scheduledInfo: {
    marginBottom: '15px',
    padding: '8px',
    backgroundColor: '#e8f4fd',
    borderRadius: '5px',
    fontSize: '13px',
  },
  todayTag: {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '3px',
    marginLeft: '8px',
    fontSize: '11px',
  },
  reviewNotes: {
    marginBottom: '15px',
    padding: '8px',
    backgroundColor: '#fff3cd',
    borderRadius: '5px',
    fontSize: '13px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '15px',
    flexWrap: 'wrap',
  },
  approveButton: {
    flex: 2,
    padding: '8px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  rejectButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  scheduleButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  publishNowButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  rescheduleButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  viewButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  reinstateButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  rejectSmallButton: {
    width: '32px',
    padding: '8px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  activityPanel: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  activityTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    color: '#333',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  activityItem: {
    fontSize: '13px',
    padding: '5px 0',
    borderBottom: '1px solid #e9ecef',
  },
  activityAction: {
    fontWeight: 'bold',
    color: '#495057',
    marginRight: '10px',
  },
  activityTime: {
    color: '#868e96',
    marginRight: '10px',
  },
  activityReason: {
    color: '#495057',
    fontStyle: 'italic',
  },
  noActivity: {
    color: '#adb5bd',
    textAlign: 'center',
    padding: '10px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalVerse: {
    margin: '20px 0',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    marginTop: '5px',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    marginTop: '5px',
    fontFamily: 'inherit',
  },
  helpText: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
    marginBottom: 0,
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  confirmApproveButton: {
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  confirmRejectButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default AdminVerseQueue;
