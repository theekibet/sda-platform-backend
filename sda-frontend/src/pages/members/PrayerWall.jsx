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

  const handlePray = async (requestId) => {
    const alreadyPrayedLocally = prayedSet.has(requestId);
    if (!alreadyPrayedLocally) {
      setPrayedSet(prev => new Set(prev).add(requestId));
      setPrayerRequests(prev => prev.map(req => req.id === requestId ? { ...req, prayedCount: (req.prayedCount || 0) + 1 } : req));
      setTrendingPrayers(prev => prev.map(req => req.id === requestId ? { ...req, prayedCount: (req.prayedCount || 0) + 1 } : req));
    }
    try {
      const response = await prayForRequest(requestId);
      if (response.data?.alreadyPrayed) {
        if (!alreadyPrayedLocally) {
          setPrayedSet(prev => { const next = new Set(prev); next.delete(requestId); return next; });
          setPrayerRequests(prev => prev.map(req => req.id === requestId ? { ...req, prayedCount: Math.max(0, (req.prayedCount || 0) - 1) } : req));
          setTrendingPrayers(prev => prev.map(req => req.id === requestId ? { ...req, prayedCount: Math.max(0, (req.prayedCount || 0) - 1) } : req));
        }
        setPrayedSet(prev => new Set(prev).add(requestId));
      }
    } catch (error) {
      if (!alreadyPrayedLocally) {
        setPrayedSet(prev => { const next = new Set(prev); next.delete(requestId); return next; });
        setPrayerRequests(prev => prev.map(req => req.id === requestId ? { ...req, prayedCount: Math.max(0, (req.prayedCount || 0) - 1) } : req));
        setTrendingPrayers(prev => prev.map(req => req.id === requestId ? { ...req, prayedCount: Math.max(0, (req.prayedCount || 0) - 1) } : req));
      }
      console.error('Error praying for request:', error);
    }
  };

  const handleEncourage = async (testimonyId) => {
    const alreadyEncouragedLocally = encouragedSet.has(testimonyId);
    if (!alreadyEncouragedLocally) {
      setEncouragedSet(prev => new Set(prev).add(testimonyId));
      setTestimonies(prev => prev.map(t => t.id === testimonyId ? { ...t, encouragedCount: (t.encouragedCount || 0) + 1 } : t));
    }
    try {
      const response = await encourageTestimony(testimonyId);
      if (response.data?.alreadyEncouraged) {
        if (!alreadyEncouragedLocally) {
          setEncouragedSet(prev => { const next = new Set(prev); next.delete(testimonyId); return next; });
          setTestimonies(prev => prev.map(t => t.id === testimonyId ? { ...t, encouragedCount: Math.max(0, (t.encouragedCount || 0) - 1) } : t));
        }
        setEncouragedSet(prev => new Set(prev).add(testimonyId));
      }
    } catch (error) {
      if (!alreadyEncouragedLocally) {
        setEncouragedSet(prev => { const next = new Set(prev); next.delete(testimonyId); return next; });
        setTestimonies(prev => prev.map(t => t.id === testimonyId ? { ...t, encouragedCount: Math.max(0, (t.encouragedCount || 0) - 1) } : t));
      }
      console.error('Error encouraging testimony:', error);
    }
  };

  // Edit and delete functions (unchanged, but included for completeness)
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // --- Render (same as before, just using the updated handlers) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">🙏 Prayer Wall</h1>
          <p className="text-lg opacity-90">Share your prayers and testimonies with the community</p>
        </div>
        <div className="bg-blue-100 border-l-4 border-blue-500 rounded-lg p-4 mb-6 shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">How to use the Prayer Wall</p>
              <p className="text-sm text-blue-700">Prayer requests stay here where the community can pray for you. For events, donations, or announcements, please visit the <a href="/community" className="font-semibold underline ml-1 hover:text-blue-900">Community Board →</a></p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 mb-8 bg-white/10 backdrop-blur-lg p-2 rounded-xl">
          <button onClick={() => setActiveTab('prayer')} className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'prayer' ? 'bg-white text-primary-500 shadow-lg' : 'text-white hover:bg-white/10'}`}>🙏 Prayer Requests</button>
          <button onClick={() => setActiveTab('testimonies')} className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'testimonies' ? 'bg-white text-primary-500 shadow-lg' : 'text-white hover:bg-white/10'}`}>✨ Testimonies</button>
        </div>
        {loading ? (
          <div className="text-center py-12 text-white"><div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div><p>Loading...</p></div>
        ) : (
          <>
            {activeTab === 'prayer' && (
              <div className="space-y-8">
                <div className="flex gap-4"><button onClick={() => setShowNewPrayerModal(true)} className="flex-1 bg-white text-primary-500 py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">✝️ Share a Prayer Request</button></div>
                {trendingPrayers.length > 0 && (
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-semibold text-primary-700 mb-4">🔥 Trending Prayers</h3>
                    <div className="space-y-4">
                      {trendingPrayers.map(prayer => (
                        <div key={prayer.id} className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              {prayer.isAnonymous ? <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">?</div> : <Avatar user={normalizeUserForAvatar(prayer.author)} size="medium" />}
                              <div><span className="font-semibold text-gray-900">{prayer.isAnonymous ? 'Anonymous' : prayer.author?.name || 'Unknown'}</span><span className="text-sm text-gray-500 ml-2">{formatDate(prayer.createdAt)}</span></div>
                            </div>
                            {prayer.authorId === user?.id && editingPrayerId !== prayer.id && (<div className="flex gap-2"><button onClick={() => startEditPrayer(prayer)} className="text-gray-500 hover:text-primary-500">✏️</button><button onClick={() => deletePrayer(prayer.id)} className="text-gray-500 hover:text-red-500">🗑️</button></div>)}
                          </div>
                          {editingPrayerId === prayer.id ? (
                            <div className="space-y-3"><textarea value={editingPrayerContent} onChange={(e) => setEditingPrayerContent(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" rows="4" maxLength="2000" /><div className="flex gap-2"><button onClick={() => saveEditPrayer(prayer.id)} className="px-4 py-2 bg-primary-500 text-white rounded-lg">Save</button><button onClick={cancelEditPrayer} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button></div></div>
                          ) : (<p className="text-gray-700 mb-4">{prayer.content}</p>)}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <button onClick={() => handlePray(prayer.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${prayedSet.has(prayer.id) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-primary-50'}`}><span>{prayedSet.has(prayer.id) ? '🙏' : '🤲'}</span><span>{prayedSet.has(prayer.id) ? 'Prayed' : 'Pray'}</span></button>
                            <span className="text-sm text-gray-600">{prayer.prayedCount || 0} {(prayer.prayedCount || 0) === 1 ? 'prayer' : 'prayers'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xl font-semibold text-primary-700 mb-4">All Prayer Requests</h3>
                  <div className="space-y-4">
                    {prayerRequests.length === 0 ? <p className="text-center text-gray-500 py-8">No prayer requests yet. Be the first to share!</p> : prayerRequests.map(prayer => (
                      <div key={prayer.id} className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {prayer.isAnonymous ? <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">?</div> : <Avatar user={normalizeUserForAvatar(prayer.author)} size="medium" />}
                            <div><span className="font-semibold text-gray-900">{prayer.isAnonymous ? 'Anonymous' : prayer.author?.name || 'Unknown'}</span><span className="text-sm text-gray-500 ml-2">{formatDate(prayer.createdAt)}</span></div>
                          </div>
                          {prayer.authorId === user?.id && editingPrayerId !== prayer.id && (<div className="flex gap-2"><button onClick={() => startEditPrayer(prayer)} className="text-gray-500 hover:text-primary-500">✏️</button><button onClick={() => deletePrayer(prayer.id)} className="text-gray-500 hover:text-red-500">🗑️</button></div>)}
                        </div>
                        {editingPrayerId === prayer.id ? (
                          <div className="space-y-3"><textarea value={editingPrayerContent} onChange={(e) => setEditingPrayerContent(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" rows="4" maxLength="2000" /><div className="flex gap-2"><button onClick={() => saveEditPrayer(prayer.id)} className="px-4 py-2 bg-primary-500 text-white rounded-lg">Save</button><button onClick={cancelEditPrayer} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button></div></div>
                        ) : (<p className="text-gray-700 mb-4">{prayer.content}</p>)}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <button onClick={() => handlePray(prayer.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${prayedSet.has(prayer.id) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-primary-50'}`}><span>{prayedSet.has(prayer.id) ? '🙏' : '🤲'}</span><span>{prayedSet.has(prayer.id) ? 'Prayed' : 'Pray'}</span></button>
                          <span className="text-sm text-gray-600">{prayer.prayedCount || 0} {(prayer.prayedCount || 0) === 1 ? 'prayer' : 'prayers'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'testimonies' && (
              <div className="space-y-8">
                <div className="flex gap-4"><button onClick={() => setShowTestimonyModal(true)} className="flex-1 bg-white text-primary-500 py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">✨ Share Testimony</button></div>
                {testimonies.length === 0 ? <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 shadow-xl text-center"><p className="text-gray-500">No testimonies yet. Be the first to share how God has worked in your life!</p></div> : (
                  <div className="space-y-4">
                    {testimonies.map(testimony => (
                      <div key={testimony.id} className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3"><Avatar user={normalizeUserForAvatar(testimony.author)} size="medium" /><div><span className="font-semibold text-gray-900 block">{testimony.author?.name || 'Unknown'}</span><span className="text-sm text-gray-500">{formatDate(testimony.createdAt)}</span></div></div>
                          {testimony.authorId === user?.id && editingTestimonyId !== testimony.id && (<div className="flex gap-2"><button onClick={() => startEditTestimony(testimony)} className="text-gray-500 hover:text-primary-500">✏️</button><button onClick={() => deleteTestimonyFunc(testimony.id)} className="text-gray-500 hover:text-red-500">🗑️</button></div>)}
                        </div>
                        {editingTestimonyId === testimony.id ? (
                          <div className="space-y-4">
                            <input type="text" value={editingTestimonyData.title} onChange={(e) => setEditingTestimonyData(prev => ({ ...prev, title: e.target.value }))} placeholder="Title" maxLength={100} className="w-full p-3 border border-gray-300 rounded-lg" />
                            <textarea value={editingTestimonyData.content} onChange={(e) => setEditingTestimonyData(prev => ({ ...prev, content: e.target.value }))} rows="5" maxLength={5000} className="w-full p-3 border border-gray-300 rounded-lg" />
                            <select value={editingTestimonyData.prayerRequestId} onChange={(e) => setEditingTestimonyData(prev => ({ ...prev, prayerRequestId: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg"><option value="">-- No linked prayer request --</option>{myPrayerRequests.map(req => (<option key={req.id} value={req.id}>{req.content.substring(0, 50)}{req.content.length > 50 ? '...' : ''}</option>))}</select>
                            <div className="flex gap-2"><button onClick={() => saveEditTestimony(testimony.id)} className="px-4 py-2 bg-primary-500 text-white rounded-lg">Save</button><button onClick={cancelEditTestimony} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button></div>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-xl font-bold text-gray-900 mb-3">{testimony.title}</h4>
                            <p className="text-gray-700 mb-4 leading-relaxed">{testimony.content}</p>
                            {testimony.prayerRequest && (<div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-r-lg mb-4"><span className="text-xs font-semibold text-primary-700 uppercase tracking-wide">In response to:</span><p className="text-gray-700 mt-1 italic">"{testimony.prayerRequest.content}"</p></div>)}
                          </>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <button onClick={() => handleEncourage(testimony.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${encouragedSet.has(testimony.id) ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-red-50'}`}><span className="text-xl">{encouragedSet.has(testimony.id) ? '❤️' : '🤍'}</span><span>{encouragedSet.has(testimony.id) ? 'Encouraged' : 'Encourage'}</span></button>
                          <span className="text-sm text-gray-600">{testimony.encouragedCount || 0} {(testimony.encouragedCount || 0) === 1 ? 'encouragement' : 'encouragements'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {/* Modals (same as before) */}
        {showNewPrayerModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowNewPrayerModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-gray-200"><h3 className="text-2xl font-bold text-gray-900">🙏 Share a Prayer Request</h3><button onClick={() => setShowNewPrayerModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button></div>
              <form onSubmit={handleCreatePrayer} className="p-6 space-y-4">
                <textarea value={newPrayer.content} onChange={(e) => setNewPrayer({ ...newPrayer, content: e.target.value })} placeholder="What would you like prayer for? We're here for you..." required className="w-full p-4 border border-gray-300 rounded-xl resize-none" rows="6" maxLength="2000" />
                <div className="text-right text-sm text-gray-500">{newPrayer.content.length}/2000</div>
                <div className="flex items-center justify-between pt-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newPrayer.isAnonymous} onChange={(e) => setNewPrayer({ ...newPrayer, isAnonymous: e.target.checked })} className="w-5 h-5 text-primary-500 rounded" /><span className="text-gray-700 font-medium">Post anonymously</span></label>
                  <div className="flex gap-3"><button type="button" onClick={() => setShowNewPrayerModal(false)} className="px-6 py-2 bg-gray-200 rounded-lg">Cancel</button><button type="submit" className="px-6 py-2 bg-primary-500 text-white rounded-lg">Share Request</button></div>
                </div>
              </form>
            </div>
          </div>
        )}
        {showTestimonyModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowTestimonyModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10"><h3 className="text-2xl font-bold text-gray-900">✨ Share Your Testimony</h3><button onClick={() => setShowTestimonyModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button></div>
              <form onSubmit={handleCreateTestimony} className="p-6 space-y-4">
                <input type="text" value={newTestimony.title} onChange={(e) => setNewTestimony({ ...newTestimony, title: e.target.value })} placeholder="Title (e.g., God Healed My Mom)" required className="w-full p-4 border border-gray-300 rounded-xl" maxLength="100" />
                <textarea value={newTestimony.content} onChange={(e) => setNewTestimony({ ...newTestimony, content: e.target.value })} placeholder="Share what God has done in your life..." required className="w-full p-4 border border-gray-300 rounded-xl resize-none" rows="8" maxLength="5000" />
                <div className="text-right text-sm text-gray-500">{newTestimony.content.length}/5000</div>
                <div className="space-y-2"><label className="block text-sm font-semibold text-gray-700">Link to a Prayer Request (Optional)</label><select value={newTestimony.prayerRequestId} onChange={(e) => setNewTestimony({ ...newTestimony, prayerRequestId: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg" disabled={fetchingMyPrayerRequests}><option value="">-- No linked prayer request --</option>{myPrayerRequests.map(req => (<option key={req.id} value={req.id}>{req.content.substring(0, 50)}{req.content.length > 50 ? '...' : ''}</option>))}</select>{fetchingMyPrayerRequests && <small className="text-gray-500">Loading your prayer requests...</small>}</div>
                <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowTestimonyModal(false)} className="px-6 py-2 bg-gray-200 rounded-lg">Cancel</button><button type="submit" className="px-6 py-2 bg-primary-500 text-white rounded-lg">Share Testimony</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PrayerWall;