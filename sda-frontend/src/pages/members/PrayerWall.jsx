// src/pages/members/PrayerWall.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPrayerRequests,
  getTrendingPrayers,
  createPrayerRequest,
  prayForRequest,
  getTestimonies,
  createTestimony,
  encourageTestimony,
  getMyPrayerRequests,
  updatePrayerRequest,
  deletePrayerRequest,
  updateTestimony,
  deleteTestimony,
} from '../../services/api';
import Avatar from '../../components/common/Avatar';

function PrayerWall() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('prayer');
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [trendingPrayers, setTrendingPrayers] = useState([]);
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPrayerModal, setShowNewPrayerModal] = useState(false);
  const [showTestimonyModal, setShowTestimonyModal] = useState(false);

  const [prayedSet, setPrayedSet] = useState(new Set());
  const [encouragedSet, setEncouragedSet] = useState(new Set());

  const [editingPrayerId, setEditingPrayerId] = useState(null);
  const [editingPrayerContent, setEditingPrayerContent] = useState('');
  const [editingTestimonyId, setEditingTestimonyId] = useState(null);
  const [editingTestimonyData, setEditingTestimonyData] = useState({ title: '', content: '', prayerRequestId: '' });

  const [myPrayerRequests, setMyPrayerRequests] = useState([]);
  const [fetchingMyPrayerRequests, setFetchingMyPrayerRequests] = useState(false);

  const [newPrayer, setNewPrayer] = useState({ content: '', isAnonymous: false });
  const [newTestimony, setNewTestimony] = useState({ title: '', content: '', prayerRequestId: '' });

  const normalizeUserForAvatar = (authorData) => {
    if (!authorData) return null;
    return { name: authorData.name || 'Unknown', avatarUrl: authorData.avatarUrl || null };
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  useEffect(() => {
    if (showTestimonyModal && user) fetchMyPrayerRequests();
  }, [showTestimonyModal, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'prayer') {
        const [requestsRes, trendingRes] = await Promise.all([
          getPrayerRequests(user?.locationName),
          getTrendingPrayers(),
        ]);
        const requests = requestsRes.data.requests || [];
        const trending = trendingRes.data || [];
        setPrayerRequests(requests);
        setTrendingPrayers(trending);
        const prayedIds = new Set();
        [...requests, ...trending].forEach(item => { if (item.hasPrayed) prayedIds.add(item.id); });
        setPrayedSet(prayedIds);
      } else {
        const testimoniesRes = await getTestimonies();
        const list = testimoniesRes.data.testimonies || [];
        setTestimonies(list);
        const encouragedIds = new Set();
        list.forEach(t => { if (t.hasEncouraged) encouragedIds.add(t.id); });
        setEncouragedSet(encouragedIds);
      }
    } catch (error) {
      console.error('Error fetching prayer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPrayerRequests = async () => {
    setFetchingMyPrayerRequests(true);
    try {
      const response = await getMyPrayerRequests();
      setMyPrayerRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching my prayer requests:', error);
    } finally {
      setFetchingMyPrayerRequests(false);
    }
  };

  const handleCreatePrayer = async (e) => {
    e.preventDefault();
    try {
      await createPrayerRequest(newPrayer);
      setNewPrayer({ content: '', isAnonymous: false });
      setShowNewPrayerModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating prayer request:', error);
      alert('Error creating prayer request');
    }
  };

  const handleCreateTestimony = async (e) => {
    e.preventDefault();
    try {
      await createTestimony(newTestimony);
      setNewTestimony({ title: '', content: '', prayerRequestId: '' });
      setShowTestimonyModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating testimony:', error);
      alert('Error creating testimony');
    }
  };

  // ✅ FIXED: Simplified optimistic update for praying
  const handlePray = async (requestId) => {
    // If already prayed locally, don't send request
    if (prayedSet.has(requestId)) {
      return;
    }

    // Optimistic update
    setPrayedSet(prev => new Set(prev).add(requestId));
    setPrayerRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, prayedCount: (req.prayedCount || 0) + 1 } : req
    ));
    setTrendingPrayers(prev => prev.map(req =>
      req.id === requestId ? { ...req, prayedCount: (req.prayedCount || 0) + 1 } : req
    ));

    try {
      const response = await prayForRequest(requestId);
      // If server says already prayed (shouldn't happen due to local check, but handle gracefully)
      if (response.data?.alreadyPrayed) {
        // Rollback optimistic update
        setPrayedSet(prev => { const next = new Set(prev); next.delete(requestId); return next; });
        setPrayerRequests(prev => prev.map(req =>
          req.id === requestId ? { ...req, prayedCount: Math.max(0, (req.prayedCount || 0) - 1) } : req
        ));
        setTrendingPrayers(prev => prev.map(req =>
          req.id === requestId ? { ...req, prayedCount: Math.max(0, (req.prayedCount || 0) - 1) } : req
        ));
      }
    } catch (error) {
      // Rollback on error
      setPrayedSet(prev => { const next = new Set(prev); next.delete(requestId); return next; });
      setPrayerRequests(prev => prev.map(req =>
        req.id === requestId ? { ...req, prayedCount: Math.max(0, (req.prayedCount || 0) - 1) } : req
      ));
      setTrendingPrayers(prev => prev.map(req =>
        req.id === requestId ? { ...req, prayedCount: Math.max(0, (req.prayedCount || 0) - 1) } : req
      ));
      console.error('Error praying for request:', error);
    }
  };

  // ✅ FIXED: Simplified optimistic update for encouraging
  const handleEncourage = async (testimonyId) => {
    // If already encouraged locally, don't send request
    if (encouragedSet.has(testimonyId)) {
      return;
    }

    // Optimistic update
    setEncouragedSet(prev => new Set(prev).add(testimonyId));
    setTestimonies(prev => prev.map(t =>
      t.id === testimonyId ? { ...t, encouragedCount: (t.encouragedCount || 0) + 1 } : t
    ));

    try {
      const response = await encourageTestimony(testimonyId);
      if (response.data?.alreadyEncouraged) {
        // Rollback
        setEncouragedSet(prev => { const next = new Set(prev); next.delete(testimonyId); return next; });
        setTestimonies(prev => prev.map(t =>
          t.id === testimonyId ? { ...t, encouragedCount: Math.max(0, (t.encouragedCount || 0) - 1) } : t
        ));
      }
    } catch (error) {
      // Rollback on error
      setEncouragedSet(prev => { const next = new Set(prev); next.delete(testimonyId); return next; });
      setTestimonies(prev => prev.map(t =>
        t.id === testimonyId ? { ...t, encouragedCount: Math.max(0, (t.encouragedCount || 0) - 1) } : t
      ));
      console.error('Error encouraging testimony:', error);
    }
  };

  const startEditPrayer = (prayer) => { setEditingPrayerId(prayer.id); setEditingPrayerContent(prayer.content); };
  const cancelEditPrayer = () => { setEditingPrayerId(null); setEditingPrayerContent(''); };
  const saveEditPrayer = async (prayerId) => {
    try { await updatePrayerRequest(prayerId, { content: editingPrayerContent }); setEditingPrayerId(null); fetchData(); } catch (error) { alert('Failed to update'); }
  };
  const deletePrayer = async (prayerId) => {
    if (!window.confirm('Delete this prayer request?')) return;
    try { await deletePrayerRequest(prayerId); fetchData(); } catch (error) { alert('Failed to delete'); }
  };

  const startEditTestimony = (testimony) => { setEditingTestimonyId(testimony.id); setEditingTestimonyData({ title: testimony.title, content: testimony.content, prayerRequestId: testimony.prayerRequestId || '' }); };
  const cancelEditTestimony = () => { setEditingTestimonyId(null); setEditingTestimonyData({ title: '', content: '', prayerRequestId: '' }); };
  const saveEditTestimony = async (testimonyId) => {
    try { await updateTestimony(testimonyId, editingTestimonyData); setEditingTestimonyId(null); fetchData(); } catch (error) { alert('Failed to update'); }
  };
  const deleteTestimonyFunc = async (testimonyId) => {
    if (!window.confirm('Delete this testimony?')) return;
    try { await deleteTestimony(testimonyId); fetchData(); } catch (error) { alert('Failed to delete'); }
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 2880) return 'Yesterday';
    if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Prayer Wall
          </h1>
          <p className="text-gray-500">Share your prayers and testimonies with the community</p>
        </div>

        {/* Info Banner */}
        <div className="glass-card p-4 mb-6 bg-primary-50 border border-primary-100">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-primary-800 mb-0.5">How to use the Prayer Wall</p>
              <p className="text-sm text-primary-700">
                Prayer requests stay here where the community can pray for you. For events, donations, or announcements, please visit the 
                <a href="/community" className="font-semibold underline ml-1 hover:text-primary-900 transition">Community Board →</a>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('prayer')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'prayer'
                ? 'bg-white text-primary-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Prayer Requests
          </button>
          <button
            onClick={() => setActiveTab('testimonies')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'testimonies'
                ? 'bg-white text-primary-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Testimonies
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-3">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'prayer' && (
              <div className="space-y-8">
                {/* Create Button */}
                <button
                  onClick={() => setShowNewPrayerModal(true)}
                  className="w-full glass-card p-4 flex items-center justify-center gap-2 text-primary-600 font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Share a Prayer Request
                </button>

                {/* Trending Prayers */}
                {trendingPrayers.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      🔥 Trending Prayers
                    </h3>
                    <div className="space-y-4">
                      {trendingPrayers.map(prayer => (
                        <PrayerCard
                          key={prayer.id}
                          prayer={prayer}
                          isEditing={editingPrayerId === prayer.id}
                          editContent={editingPrayerContent}
                          onEditChange={setEditingPrayerContent}
                          onSaveEdit={() => saveEditPrayer(prayer.id)}
                          onCancelEdit={cancelEditPrayer}
                          onStartEdit={() => startEditPrayer(prayer)}
                          onDelete={() => deletePrayer(prayer.id)}
                          onPray={() => handlePray(prayer.id)}
                          hasPrayed={prayedSet.has(prayer.id)}
                          formatTimeAgo={formatTimeAgo}
                          currentUserId={user?.id}
                          normalizeAvatar={normalizeUserForAvatar}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Prayer Requests */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    All Prayer Requests
                  </h3>
                  {prayerRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">🙏</div>
                      <p className="text-gray-500">No prayer requests yet. Be the first to share!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {prayerRequests.map(prayer => (
                        <PrayerCard
                          key={prayer.id}
                          prayer={prayer}
                          isEditing={editingPrayerId === prayer.id}
                          editContent={editingPrayerContent}
                          onEditChange={setEditingPrayerContent}
                          onSaveEdit={() => saveEditPrayer(prayer.id)}
                          onCancelEdit={cancelEditPrayer}
                          onStartEdit={() => startEditPrayer(prayer)}
                          onDelete={() => deletePrayer(prayer.id)}
                          onPray={() => handlePray(prayer.id)}
                          hasPrayed={prayedSet.has(prayer.id)}
                          formatTimeAgo={formatTimeAgo}
                          currentUserId={user?.id}
                          normalizeAvatar={normalizeUserForAvatar}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'testimonies' && (
              <div className="space-y-8">
                {/* Create Button */}
                <button
                  onClick={() => setShowTestimonyModal(true)}
                  className="w-full glass-card p-4 flex items-center justify-center gap-2 text-primary-600 font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Share Testimony
                </button>

                {testimonies.length === 0 ? (
                  <div className="glass-card p-12 text-center">
                    <div className="text-5xl mb-4">✨</div>
                    <p className="text-gray-500">No testimonies yet. Be the first to share how God has worked in your life!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testimonies.map(testimony => (
                      <TestimonyCard
                        key={testimony.id}
                        testimony={testimony}
                        isEditing={editingTestimonyId === testimony.id}
                        editData={editingTestimonyData}
                        onEditChange={setEditingTestimonyData}
                        onSaveEdit={() => saveEditTestimony(testimony.id)}
                        onCancelEdit={cancelEditTestimony}
                        onStartEdit={() => startEditTestimony(testimony)}
                        onDelete={() => deleteTestimonyFunc(testimony.id)}
                        onEncourage={() => handleEncourage(testimony.id)}
                        hasEncouraged={encouragedSet.has(testimony.id)}
                        formatTimeAgo={formatTimeAgo}
                        currentUserId={user?.id}
                        myPrayerRequests={myPrayerRequests}
                        normalizeAvatar={normalizeUserForAvatar}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* New Prayer Modal */}
        {showNewPrayerModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowNewPrayerModal(false)}>
            <div className="glass-card w-full max-w-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Share a Prayer Request
                </h3>
                <button onClick={() => setShowNewPrayerModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreatePrayer} className="p-6 space-y-4">
                <textarea
                  value={newPrayer.content}
                  onChange={(e) => setNewPrayer({ ...newPrayer, content: e.target.value })}
                  placeholder="What would you like prayer for? We're here for you..."
                  required
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-gray-50 focus:bg-white transition"
                  rows={6}
                  maxLength={2000}
                />
                <div className="text-right text-xs text-gray-400">{newPrayer.content.length}/2000</div>
                <div className="flex items-center justify-between pt-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={newPrayer.isAnonymous}
                      onChange={(e) => setNewPrayer({ ...newPrayer, isAnonymous: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-primary-600 transition">Post anonymously</span>
                  </label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowNewPrayerModal(false)} className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition shadow-sm hover:shadow-md">
                      Share Request
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* New Testimony Modal */}
        {showTestimonyModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowTestimonyModal(false)}>
            <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white/80 backdrop-blur-sm flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Share Your Testimony
                </h3>
                <button onClick={() => setShowTestimonyModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateTestimony} className="p-6 space-y-4">
                <input
                  type="text"
                  value={newTestimony.title}
                  onChange={(e) => setNewTestimony({ ...newTestimony, title: e.target.value })}
                  placeholder="Title (e.g., God Healed My Mom)"
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 focus:bg-white transition"
                />
                <textarea
                  value={newTestimony.content}
                  onChange={(e) => setNewTestimony({ ...newTestimony, content: e.target.value })}
                  placeholder="Share what God has done in your life..."
                  required
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-gray-50 focus:bg-white transition"
                  rows={8}
                  maxLength={5000}
                />
                <div className="text-right text-xs text-gray-400">{newTestimony.content.length}/5000</div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Link to a Prayer Request (Optional)</label>
                  <select
                    value={newTestimony.prayerRequestId}
                    onChange={(e) => setNewTestimony({ ...newTestimony, prayerRequestId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white transition"
                    disabled={fetchingMyPrayerRequests}
                  >
                    <option value="">-- No linked prayer request --</option>
                    {myPrayerRequests.map(req => (
                      <option key={req.id} value={req.id}>
                        {req.content.substring(0, 50)}{req.content.length > 50 ? '...' : ''}
                      </option>
                    ))}
                  </select>
                  {fetchingMyPrayerRequests && <p className="text-xs text-gray-400">Loading your prayer requests...</p>}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowTestimonyModal(false)} className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition shadow-sm hover:shadow-md">
                    Share Testimony
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Prayer Card Component
function PrayerCard({ prayer, isEditing, editContent, onEditChange, onSaveEdit, onCancelEdit, onStartEdit, onDelete, onPray, hasPrayed, formatTimeAgo, currentUserId, normalizeAvatar }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          {prayer.isAnonymous ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">?</div>
          ) : (
            <Avatar user={normalizeAvatar(prayer.author)} size="medium" />
          )}
          <div>
            <span className="font-semibold text-gray-900">{prayer.isAnonymous ? 'Anonymous' : prayer.author?.name || 'Unknown'}</span>
            <span className="text-xs text-gray-500 ml-2">{formatTimeAgo(prayer.createdAt)}</span>
          </div>
        </div>
        {prayer.authorId === currentUserId && !isEditing && (
          <div className="flex gap-1">
            <button onClick={() => onStartEdit(prayer)} className="p-1 text-gray-400 hover:text-primary-500 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => onEditChange(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
            rows={4}
            maxLength={2000}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={onCancelEdit} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-full transition">Cancel</button>
            <button onClick={onSaveEdit} className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-full hover:bg-primary-700 transition">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">{prayer.content}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button
          onClick={onPray}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            hasPrayed
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{hasPrayed ? 'Prayed' : 'Pray'}</span>
        </button>
        <span className="text-sm text-gray-500">{prayer.prayedCount || 0} {(prayer.prayedCount || 0) === 1 ? 'prayer' : 'prayers'}</span>
      </div>
    </div>
  );
}

// Testimony Card Component
function TestimonyCard({ testimony, isEditing, editData, onEditChange, onSaveEdit, onCancelEdit, onStartEdit, onDelete, onEncourage, hasEncouraged, formatTimeAgo, currentUserId, myPrayerRequests, normalizeAvatar }) {
  return (
    <div className="glass-card p-6 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <Avatar user={normalizeAvatar(testimony.author)} size="medium" />
          <div>
            <span className="font-semibold text-gray-900 block">{testimony.author?.name || 'Unknown'}</span>
            <span className="text-xs text-gray-500">{formatTimeAgo(testimony.createdAt)}</span>
          </div>
        </div>
        {testimony.authorId === currentUserId && !isEditing && (
          <div className="flex gap-1">
            <button onClick={() => onStartEdit(testimony)} className="p-1 text-gray-400 hover:text-primary-500 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => onEditChange(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Title"
            maxLength={100}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
          />
          <textarea
            value={editData.content}
            onChange={(e) => onEditChange(prev => ({ ...prev, content: e.target.value }))}
            rows={5}
            maxLength={5000}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <select
            value={editData.prayerRequestId}
            onChange={(e) => onEditChange(prev => ({ ...prev, prayerRequestId: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- No linked prayer request --</option>
            {myPrayerRequests.map(req => (
              <option key={req.id} value={req.id}>
                {req.content.substring(0, 50)}{req.content.length > 50 ? '...' : ''}
              </option>
            ))}
          </select>
          <div className="flex gap-2 justify-end">
            <button onClick={onCancelEdit} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-full transition">Cancel</button>
            <button onClick={onSaveEdit} className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-full hover:bg-primary-700 transition">Save</button>
          </div>
        </div>
      ) : (
        <>
          <h4 className="text-xl font-bold text-gray-900 mb-3">{testimony.title}</h4>
          <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">{testimony.content}</p>
          {testimony.prayerRequest && (
            <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-r-lg mb-4">
              <span className="text-xs font-semibold text-primary-700 uppercase tracking-wide">In response to:</span>
              <p className="text-gray-700 mt-1 italic">"{testimony.prayerRequest.content}"</p>
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={onEncourage}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            hasEncouraged
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <svg className="w-4 h-4" fill={hasEncouraged ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{hasEncouraged ? 'Encouraged' : 'Encourage'}</span>
        </button>
        <span className="text-sm text-gray-500">{testimony.encouragedCount || 0} {(testimony.encouragedCount || 0) === 1 ? 'encouragement' : 'encouragements'}</span>
      </div>
    </div>
  );
}

export default PrayerWall;