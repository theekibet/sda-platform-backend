import React, { useState, useEffect } from 'react';
import { useAnnouncements } from '../../../hooks/useAnnouncements'; 
import AnnouncementForm from './AnnouncementForm';
import { ANNOUNCEMENT_TYPES } from '../../../constants/constants';

const AnnouncementList = () => {
  const {
    announcements,
    loading,
    initialLoading,
    error,
    pagination,
    deleteExistingAnnouncement,
    selectAnnouncement,
    selectedAnnouncement,
    clearSelectedAnnouncement,
    fetchAnnouncements,
    setPage,
  } = useAnnouncements({ autoFetch: true, fetchActive: false });

  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchAnnouncements({}, true);
  };

  // Fetch on mount and when refresh key changes
  useEffect(() => {
    fetchAnnouncements({}, true);
  }, [refreshKey]);

  const handleEdit = (announcement) => {
    selectAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (deleteConfirm === id) {
      await deleteExistingAnnouncement(id);
      setDeleteConfirm(null);
      handleRefresh();
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
    handleRefresh();
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
    if (!dateString) return 'Not set';
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

  // Show loading state
  if ((initialLoading || loading) && announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800">📢 Announcements</h2>
        <div className="flex gap-3">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={() => setShowForm(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="text-lg">+</span> New Announcement
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={handleRefresh} className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm">
            Retry
          </button>
        </div>
      )}

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-3 bg-gray-100 rounded-lg text-xs font-mono">
          <p><strong>Debug:</strong> {announcements.length} announcements loaded | Page {pagination.page} of {pagination.totalPages} | Total: {pagination.total}</p>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 && !loading ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">📢</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Announcements</h3>
          <p className="text-gray-500 mb-4">Create your first announcement to communicate with users.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Create Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(announcement => {
            const badge = getTypeBadge(announcement.type);
            const active = isActive(announcement);

            return (
              <div key={announcement.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Status bar */}
                <div className={`h-1 ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
                
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3 flex-wrap gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-800">{announcement.title}</h3>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${badge.color}20`,
                          color: badge.color,
                        }}
                      >
                        {badge.icon} {badge.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {active ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          deleteConfirm === announcement.id 
                            ? 'text-red-700 bg-red-100' 
                            : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={deleteConfirm === announcement.id ? 'Click again to confirm' : 'Delete'}
                      >
                        {deleteConfirm === announcement.id ? '⚠️ Confirm' : '🗑️'}
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-600 mb-4 line-clamp-3">{announcement.content}</p>

                  {/* Meta Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Created</p>
                      <p className="text-gray-600 font-medium">{formatDate(announcement.createdAt)}</p>
                    </div>
                    {announcement.scheduledAt && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Scheduled</p>
                        <p className="text-gray-600 font-medium">{formatDate(announcement.scheduledAt)}</p>
                      </div>
                    )}
                    {announcement.expiresAt && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Expires</p>
                        <p className="text-gray-600 font-medium">{formatDate(announcement.expiresAt)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Target</p>
                      <p className="text-gray-600 font-medium capitalize">{announcement.targetRole || 'All Users'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Views</p>
                      <p className="text-gray-600 font-medium">{announcement.viewCount || 0}</p>
                    </div>
                  </div>

                  {/* Created By Info */}
                  {announcement.createdBy && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                      Created by: {announcement.createdBy.name || announcement.createdBy.email || 'Unknown'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
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

export default AnnouncementList;