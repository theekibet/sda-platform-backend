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
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⏳', label: 'Pending' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '✅', label: 'Approved' },
      scheduled: { bg: 'bg-green-100', text: 'text-green-700', icon: '📅', label: 'Scheduled' },
      published: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '✨', label: 'Published' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: '❌', label: 'Rejected' },
    };
    return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📄', label: status };
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
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedSubmission(sub);
                setAction('approve');
                setScheduledDate('');
                setShowModal(true);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </button>
            <button
              onClick={() => {
                setSelectedSubmission(sub);
                setAction('reject');
                setShowModal(true);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </div>
        );
      
      case 'approved':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedSubmission(sub);
                setAction('schedule');
                setScheduledDate(new Date().toISOString().split('T')[0]);
                setShowModal(true);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule
            </button>
            <button
              onClick={() => handlePublishNow(sub.id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
              title="Schedule for today"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Publish Now
            </button>
            <button
              onClick={() => {
                setSelectedSubmission(sub);
                setAction('reject');
                setShowModal(true);
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
              title="Reject"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      
      case 'scheduled':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedSubmission(sub);
                setAction('schedule');
                setScheduledDate(sub.scheduledFor?.split('T')[0] || '');
                setShowModal(true);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reschedule
            </button>
            {isToday(sub.scheduledFor) && (
              <button
                onClick={() => handlePublishNow(sub.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Publish Now
              </button>
            )}
          </div>
        );
      
      case 'published':
        return (
          <button
            onClick={() => window.open(`/bible/read/${sub.verse?.book}/${sub.verse?.chapter}`, '_blank')}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Verse
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
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reinstate
          </button>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-3">Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      {stats && (
        <div className="glass-card p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div 
              onClick={() => setFilter('pending')}
              className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all ${filter === 'pending' ? 'bg-primary-50 ring-2 ring-primary-500' : 'hover:bg-gray-50'}`}
            >
              <span className="text-xs text-gray-500 mb-1">Pending</span>
              <span className="text-2xl font-bold text-gray-800">{stats.counts.pending}</span>
            </div>
            <div 
              onClick={() => setFilter('approved')}
              className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all ${filter === 'approved' ? 'bg-primary-50 ring-2 ring-primary-500' : 'hover:bg-gray-50'}`}
            >
              <span className="text-xs text-gray-500 mb-1">Approved</span>
              <span className="text-2xl font-bold text-gray-800">{stats.counts.approved}</span>
            </div>
            <div 
              onClick={() => setFilter('scheduled')}
              className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all ${filter === 'scheduled' ? 'bg-primary-50 ring-2 ring-primary-500' : 'hover:bg-gray-50'}`}
            >
              <span className="text-xs text-gray-500 mb-1">Scheduled</span>
              <span className="text-2xl font-bold text-gray-800">{stats.counts.scheduled}</span>
            </div>
            <div 
              onClick={() => setFilter('published')}
              className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all ${filter === 'published' ? 'bg-primary-50 ring-2 ring-primary-500' : 'hover:bg-gray-50'}`}
            >
              <span className="text-xs text-gray-500 mb-1">Published</span>
              <span className="text-2xl font-bold text-gray-800">{stats.counts.published}</span>
            </div>
            <div 
              onClick={() => setFilter('rejected')}
              className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all ${filter === 'rejected' ? 'bg-primary-50 ring-2 ring-primary-500' : 'hover:bg-gray-50'}`}
            >
              <span className="text-xs text-gray-500 mb-1">Rejected</span>
              <span className="text-2xl font-bold text-gray-800">{stats.counts.rejected}</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500 mb-1">Next Date</span>
              <span className="text-sm font-semibold text-gray-800">{formatDate(stats.nextAvailableDate)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Verse Moderation
          </h2>
          <button 
            onClick={() => setShowActivity(!showActivity)} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {showActivity ? 'Hide Activity' : 'Show Activity'}
          </button>
        </div>
        <div className="flex gap-2">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
          {filter === 'approved' && submissions.length > 0 && (
            <button onClick={handleBatchSchedule} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule All
            </button>
          )}
          {stats?.counts.scheduled > 0 && (
            <button onClick={handlePublishTodayScheduled} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Publish Today's
            </button>
          )}
        </div>
      </div>

      {/* Activity Panel */}
      {showActivity && (
        <div className="glass-card p-5 max-h-48 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Activity
          </h3>
          <div className="space-y-2">
            {activity.length === 0 ? (
              <p className="text-gray-400 text-center py-2 text-sm">No recent activity</p>
            ) : (
              activity.map(item => (
                <div key={item.id} className="text-sm py-2 border-b border-gray-100 last:border-0">
                  <span className="font-semibold text-gray-700 mr-2">{item.action}</span>
                  <span className="text-gray-400 text-xs mr-2">{formatDateTime(item.createdAt)}</span>
                  {item.reason && <span className="text-gray-500 italic">"{item.reason}"</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Submissions Grid */}
      {submissions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">No submissions found</h4>
          <p className="text-gray-500">No {filter} submissions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {submissions.map(sub => {
            const badge = getStatusBadge(sub.status);
            return (
              <div key={sub.id} className="glass-card p-5 hover:shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                    <span>{badge.icon}</span> {badge.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-md font-bold text-primary-600 mb-2">{sub.verse?.reference}</h4>
                  <p className="text-gray-600 italic text-sm leading-relaxed">"{sub.verse?.text}"</p>
                </div>

                {sub.comment && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <strong className="text-xs text-gray-700">User's reflection:</strong>
                    <p className="text-sm text-gray-600 mt-1">{sub.comment}</p>
                  </div>
                )}

                <div className="mb-4 text-sm text-gray-500 space-y-0.5">
                  <p><strong>Submitted by:</strong> {sub.user?.name}</p>
                  <p><strong>Email:</strong> {sub.user?.email}</p>
                </div>

                {sub.queuePosition && sub.status === 'pending' && (
                  <div className="mb-4 p-2 bg-blue-50 rounded-lg text-sm">
                    <strong>Queue position:</strong> #{sub.queuePosition}
                  </div>
                )}

                {sub.scheduledFor && (
                  <div className="mb-4 p-2 bg-blue-50 rounded-lg text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Scheduled for: {formatDate(sub.scheduledFor)}</span>
                    {isToday(sub.scheduledFor) && (
                      <span className="ml-auto bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">Today!</span>
                    )}
                  </div>
                )}

                {sub.reviewNotes && (
                  <div className="mb-4 p-2 bg-yellow-50 rounded-lg text-sm">
                    <strong>Admin notes:</strong> {sub.reviewNotes}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  {getActionButton(sub)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card max-w-lg w-full max-h-[90vh] overflow-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {action === 'approve' && 'Approve Verse'}
                {action === 'schedule' && 'Schedule Verse'}
                {action === 'reject' && 'Reject Verse'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5">
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <strong className="text-primary-600">{selectedSubmission.verse?.reference}</strong>
                <p className="text-gray-600 mt-1">{selectedSubmission.verse?.text}</p>
              </div>

              {(action === 'approve' || action === 'schedule') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule for:</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                    min={new Date().toISOString().split('T')[0]}
                    required={action === 'schedule'}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {action === 'schedule' 
                      ? 'Select a date to publish this verse'
                      : 'Leave empty to approve without scheduling'}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {action === 'reject' ? 'Reason for rejection:' : 'Admin notes (optional):'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  rows="3"
                  placeholder={action === 'reject' 
                    ? 'Explain why this verse was rejected...' 
                    : 'Add any notes about this submission...'}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition font-medium">
                  Cancel
                </button>
                <button
                  onClick={
                    action === 'approve' ? handleApprove :
                    action === 'schedule' ? handleSchedule :
                    handleReject
                  }
                  className={`px-5 py-2 rounded-full transition font-medium text-white ${
                    action === 'reject' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } ${action === 'schedule' && !scheduledDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={action === 'schedule' && !scheduledDate}
                >
                  {action === 'approve' && 'Approve'}
                  {action === 'schedule' && 'Schedule'}
                  {action === 'reject' && 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVerseQueue;