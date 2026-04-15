// src/pages/members/groups/GroupsList.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { groupsService } from '../../services/groupsService';
import { discussionsService } from '../../services/discussionsService';
import { tagsService } from '../../services/tagsService';
import CreateGroup from './CreateGroup';
import GroupCard from '../../components/groups/GroupCard';
import DiscussionCard from '../../components/discussions/DiscussionCard';

function GroupsList({ onViewGroup = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [discoverSections, setDiscoverSections] = useState({
    forYou: [],
    trending: [],
    newGroups: [],
  });
  const [discussions, setDiscussions] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [discussionsHasMore, setDiscussionsHasMore] = useState(true);
  const [discussionsPage, setDiscussionsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    tag: '',
    search: '',
    sort: 'popular',
  });
  const [selectedTag, setSelectedTag] = useState('');
  const [popularTags, setPopularTags] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  // Fetch bookmarks for discussion cards
  useEffect(() => {
    if (user) {
      fetchUserBookmarks();
    }
  }, [user]);

  const fetchUserBookmarks = async () => {
    try {
      const response = await discussionsService.getUserBookmarks(1, 100);
      const bookmarks = response.discussions || [];
      setBookmarkedIds(new Set(bookmarks.map(b => b.id)));
    } catch (error) {
      console.debug('Bookmarks not available');
    }
  };

  // Fetch discussions for the Discussions tab
  const fetchDiscussions = async (reset = false) => {
    if (reset) {
      setDiscussionsPage(1);
      setDiscussions([]);
      setDiscussionsHasMore(true);
    }
    if (!user) return;
    setDiscussionsLoading(true);
    try {
      const response = await discussionsService.getHomeFeed(reset ? 1 : discussionsPage, 20);
      const newDiscussions = response.data?.discussions || [];
      if (reset || discussionsPage === 1) {
        setDiscussions(newDiscussions);
      } else {
        setDiscussions(prev => [...prev, ...newDiscussions]);
      }
      setDiscussionsHasMore(newDiscussions.length === 20);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setDiscussionsLoading(false);
    }
  };

  const loadMoreDiscussions = () => {
    if (!discussionsLoading && discussionsHasMore) {
      setDiscussionsPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (activeTab === 'discussions' && user) {
      fetchDiscussions(true);
    }
  }, [activeTab, user]);

  // Existing group fetching functions (unchanged)
  useEffect(() => {
    fetchMyGroups();
    if (activeTab === 'discover') {
      fetchDiscoverGroups();
      fetchPopularTags();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchGroups();
    }
  }, [filters, activeTab]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (params.tag) {
        params.tagNames = [params.tag];
        delete params.tag;
      }
      const response = await groupsService.getGroups(params);
      const groupsData = response.data?.data || response.data || [];
      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const response = await groupsService.getMyGroups();
      const groupsData = response.data?.data || response.data || [];
      setMyGroups(groupsData);
    } catch (error) {
      console.error('Error fetching my groups:', error);
    }
  };

  const fetchDiscoverGroups = async () => {
    try {
      const response = await groupsService.getDiscoverGroups();
      const data = response.data?.data || response.data || {
        forYou: [],
        trending: [],
        newGroups: [],
      };
      setDiscoverSections(data);
    } catch (error) {
      console.error('Error fetching discover groups:', error);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const response = await tagsService.getTrendingTags(10);
      setPopularTags(response.data || []);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      setPopularTags([
        { id: 'bible-study', name: 'Bible Study', usageCount: 15 },
        { id: 'prayer', name: 'Prayer', usageCount: 12 },
        { id: 'worship', name: 'Worship', usageCount: 10 },
        { id: 'fellowship', name: 'Fellowship', usageCount: 8 },
        { id: 'outreach', name: 'Outreach', usageCount: 6 },
      ]);
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!groupId) return;
    try {
      await groupsService.joinGroup(groupId);
      alert('Request sent! The group admin will review your request.');
      fetchGroups();
      fetchMyGroups();
      fetchDiscoverGroups();
    } catch (error) {
      alert(error.response?.data?.message || 'Error joining group');
    }
  };

  const handleViewGroup = (groupId) => {
    if (!groupId) return;
    setTimeout(() => {
      if (onViewGroup) onViewGroup(groupId);
      else navigate(`/groups/${groupId}`);
    }, 0);
  };

  const handleCreateDiscussion = () => {
    if (myGroups.length === 0) {
      alert('You need to join or create a group before posting a discussion.');
      setActiveTab('discover');
      return;
    }
    // If there are groups, navigate to create discussion with no group preselected
    // or show a group selection modal? For simplicity, we'll just go to create page.
    navigate('/discussions/create');
  };

  const handleBookmarkChange = useCallback(async (discussionId, newBookmarked) => {
    setBookmarkedIds(prev => {
      const newSet = new Set(prev);
      if (newBookmarked) newSet.add(discussionId);
      else newSet.delete(discussionId);
      return newSet;
    });
    try {
      await discussionsService.toggleBookmark(discussionId);
    } catch (error) {
      setBookmarkedIds(prev => {
        const newSet = new Set(prev);
        if (newBookmarked) newSet.delete(discussionId);
        else newSet.add(discussionId);
        return newSet;
      });
    }
  }, []);

  const formatTimeAgo = (timestamp) => {
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 2880) return 'Yesterday';
    return new Date(timestamp).toLocaleDateString();
  };

  const generalGroup = myGroups.find(g => g.name === 'General Discussion' || g.isDefault);
  const otherMyGroups = myGroups.filter(g => !(g.name === 'General Discussion' || g.isDefault));

  // Loading skeleton for discover tab
  if (loading && activeTab === 'discover' && groups.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Fellowship Circles
          </h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Group
          </button>
        </div>

        {/* Create Group Modal */}
        {showCreateForm && (
          <CreateGroup
            onClose={() => setShowCreateForm(false)}
            onGroupCreated={() => {
              setShowCreateForm(false);
              fetchGroups();
              fetchMyGroups();
              fetchDiscoverGroups();
            }}
          />
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('discover')}
              className={`pb-3 px-1 text-sm font-medium transition-all ${
                activeTab === 'discover'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Discover Groups
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('my-groups');
                fetchMyGroups();
              }}
              className={`pb-3 px-1 text-sm font-medium transition-all ${
                activeTab === 'my-groups'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                My Groups
              </span>
            </button>
            {/* New Discussions Tab */}
            <button
              onClick={() => setActiveTab('discussions')}
              className={`pb-3 px-1 text-sm font-medium transition-all ${
                activeTab === 'discussions'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Discussions
              </span>
            </button>
          </div>
        </div>

        {/* Discover Tab Content */}
        {activeTab === 'discover' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={filters.tag}
                onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">All Tags</option>
                {popularTags.map(tag => (
                  <option key={tag.id || tag.name} value={tag.name}>
                    #{tag.name} ({tag.usageCount || tag.count || 0})
                  </option>
                ))}
              </select>

              <select
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="popular">⭐ Most Popular</option>
                <option value="new">🆕 Newest</option>
                <option value="active">🔥 Most Active</option>
              </select>

              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Popular Tags Quick Filters */}
            {popularTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                <button
                  onClick={() => {
                    setSelectedTag('');
                    setFilters({ ...filters, tag: '' });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    !selectedTag
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {popularTags.slice(0, 8).map(tag => (
                  <button
                    key={tag.id || tag.name}
                    onClick={() => {
                      setSelectedTag(tag.name);
                      setFilters({ ...filters, tag: tag.name });
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedTag === tag.name
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            )}

            {/* Discover Sections */}
            <div className="space-y-10">
              {discoverSections.forYou && discoverSections.forYou.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    For You
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">Based on your interests</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {discoverSections.forYou.map(group => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        isMember={false}
                        onJoin={() => handleJoinGroup(group.id)}
                        onView={() => handleViewGroup(group.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {discoverSections.trending && discoverSections.trending.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Trending Now
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">Most active groups this week</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {discoverSections.trending.map(group => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        isMember={false}
                        onJoin={() => handleJoinGroup(group.id)}
                        onView={() => handleViewGroup(group.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {discoverSections.newGroups && discoverSections.newGroups.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Groups
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">Recently created, still growing</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {discoverSections.newGroups.map(group => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        isMember={false}
                        onJoin={() => handleJoinGroup(group.id)}
                        onView={() => handleViewGroup(group.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(filters.search || filters.tag) && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Results
                  </h2>
                  {groups.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <div className="text-5xl mb-4">🔍</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No groups found</h3>
                      <p className="text-gray-600">Try different filters or create a new group</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groups.map(group => (
                        <GroupCard
                          key={group.id}
                          group={group}
                          isMember={false}
                          onJoin={() => handleJoinGroup(group.id)}
                          onView={() => handleViewGroup(group.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!discoverSections.forYou?.length &&
                !discoverSections.trending?.length &&
                !discoverSections.newGroups?.length &&
                !filters.search && !filters.tag && (
                  <div className="glass-card p-12 text-center">
                    <div className="text-6xl mb-4">🏠</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No groups yet</h3>
                    <p className="text-gray-600 mb-6">Be the first to create a community!</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Group
                    </button>
                  </div>
                )}
            </div>
          </>
        )}

        {/* My Groups Tab Content */}
        {activeTab === 'my-groups' && (
          <div className="space-y-10">
            {generalGroup && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Community Hub
                </h2>
                <GroupCard
                  group={generalGroup}
                  isMember={true}
                  onView={() => handleViewGroup(generalGroup.id)}
                />
              </div>
            )}

            {otherMyGroups.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Your Groups
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherMyGroups.map(group => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember={true}
                      onView={() => handleViewGroup(group.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!generalGroup && otherMyGroups.length === 0 && (
              <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No groups yet</h3>
                <p className="text-gray-600 mb-6">Join some groups to see them here</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Discover Groups
                </button>
              </div>
            )}
          </div>
        )}

        {/* Discussions Tab Content */}
        {activeTab === 'discussions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Recent Discussions from Your Groups
              </h2>
              {myGroups.length > 0 && (
                <button
                  onClick={handleCreateDiscussion}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Discussion
                </button>
              )}
            </div>

            {!user ? (
              <div className="glass-card p-12 text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Sign in to see discussions</h3>
                <p className="text-gray-600">Join groups and participate in conversations.</p>
              </div>
            ) : discussionsLoading && discussions.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
                <p className="text-gray-500 mt-3">Loading discussions...</p>
              </div>
            ) : discussions.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No discussions yet</h3>
                <p className="text-gray-600 mb-6">
                  {myGroups.length === 0
                    ? 'Join or create a group to start seeing discussions.'
                    : 'Be the first to start a discussion in one of your groups!'}
                </p>
                {myGroups.length === 0 ? (
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Discover Groups
                  </button>
                ) : (
                  <button
                    onClick={handleCreateDiscussion}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Start a Discussion
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {discussions.map(discussion => (
                  <DiscussionCard
                    key={discussion.id}
                    discussion={discussion}
                    onClick={() => navigate(`/discussions/${discussion.id}`)}
                    formatTimeAgo={formatTimeAgo}
                    isBookmarked={bookmarkedIds.has(discussion.id)}
                    onBookmarkChange={handleBookmarkChange}
                  />
                ))}
                {discussionsHasMore && (
                  <div className="text-center py-4">
                    <button
                      onClick={loadMoreDiscussions}
                      disabled={discussionsLoading}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition disabled:opacity-50 text-sm font-medium"
                    >
                      {discussionsLoading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupsList;