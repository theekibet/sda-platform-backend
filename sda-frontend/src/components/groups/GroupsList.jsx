// src/pages/members/groups/GroupsList.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { groupsService } from '../../services/groupsService';
import { tagsService } from '../../services/tagsService';
import CreateGroup from './CreateGroup';
import { useNavigate } from 'react-router-dom';

function GroupsList({ onViewGroup = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [discoverSections, setDiscoverSections] = useState({
    forYou: [],
    popularInYourCountry: [],
    trending: [],
    newGroups: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    tag: '',
    search: '',
    location: '',
    meetingType: '',
    sort: 'popular',
  });
  const [selectedTag, setSelectedTag] = useState('');
  const [popularTags, setPopularTags] = useState([]);

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
      // Convert tag filter to tagNames array for the API
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
        popularInYourCountry: [],
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
      // Fallback tags
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
    if (!groupId) {
      console.error('Cannot join group: No group ID provided');
      return;
    }
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
    if (!groupId) {
      console.error('Cannot view group: Group ID is undefined');
      return;
    }
    setTimeout(() => {
      if (onViewGroup) {
        onViewGroup(groupId);
      } else {
        navigate(`/groups/${groupId}`);
      }
    }, 0);
  };

  // Separate General Discussion from other groups
  const generalGroup = myGroups.find(g => g.name === 'General Discussion' || g.isDefault);
  const otherMyGroups = myGroups.filter(g => !(g.name === 'General Discussion' || g.isDefault));

  if (loading && activeTab === 'discover' && groups.length === 0) {
    return <div className="text-center py-8 text-gray-500">Loading groups...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🤝 Fellowship Circles</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
        >
          + Create Group
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
      <div className="flex gap-4 border-b border-gray-200 mb-5">
        <button
          onClick={() => setActiveTab('discover')}
          className={`py-2 px-1 text-sm font-medium border-b-2 transition ${
            activeTab === 'discover'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🔍 Discover Groups
        </button>
        <button
          onClick={() => {
            setActiveTab('my-groups');
            fetchMyGroups();
          }}
          className={`py-2 px-1 text-sm font-medium border-b-2 transition ${
            activeTab === 'my-groups'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 My Groups
        </button>
      </div>

      {/* Filters - Only show on Discover tab */}
      {activeTab === 'discover' && (
        <div className="flex flex-wrap gap-3 mb-5">
          <select
            value={filters.tag}
            onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Tags</option>
            {popularTags.map(tag => (
              <option key={tag.id || tag.name} value={tag.name}>
                #{tag.name} ({tag.usageCount || tag.count || 0})
              </option>
            ))}
          </select>

          <select
            value={filters.meetingType}
            onChange={(e) => setFilters({ ...filters, meetingType: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Meeting Types</option>
            <option value="online">💻 Online Only</option>
            <option value="in-person">🤝 In-Person Only</option>
            <option value="hybrid">🔄 Hybrid</option>
          </select>

          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="popular">⭐ Most Popular</option>
            <option value="new">🆕 Newest</option>
            <option value="active">🔥 Most Active</option>
          </select>

          <input
            type="text"
            placeholder="Search groups..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />

          <input
            type="text"
            placeholder="Location (optional)"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Popular Tags Quick Filters */}
      {activeTab === 'discover' && popularTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => {
              setSelectedTag('');
              setFilters({ ...filters, tag: '' });
            }}
            className={`px-3 py-1.5 rounded-full text-sm transition ${
              !selectedTag
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {popularTags.slice(0, 6).map(tag => (
            <button
              key={tag.id || tag.name}
              onClick={() => {
                setSelectedTag(tag.name);
                setFilters({ ...filters, tag: tag.name });
              }}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                selectedTag === tag.name
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Groups Grid */}
      <div className="space-y-8">
        {activeTab === 'my-groups' ? (
          <>
            {/* General Discussion (always first) */}
            {generalGroup && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📢 Community Hub</h3>
                <GroupCard
                  group={generalGroup}
                  isMember={true}
                  onView={() => handleViewGroup(generalGroup.id)}
                />
              </div>
            )}

            {/* Other Groups */}
            {otherMyGroups.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">👥 Your Groups</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">You haven't joined any groups yet.</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
                >
                  🔍 Discover Groups
                </button>
              </div>
            )}
          </>
        ) : (
          /* Discover Tab - Smart Recommendations */
          <>
            {/* FOR YOU Section */}
            {discoverSections.forYou && discoverSections.forYou.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">✨ For You</h3>
                <p className="text-sm text-gray-500 mb-3">Based on your interests</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

            {/* POPULAR IN YOUR COUNTRY Section */}
            {discoverSections.popularInYourCountry && discoverSections.popularInYourCountry.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">🇰🇪 Popular in Kenya</h3>
                <p className="text-sm text-gray-500 mb-3">Groups other Kenyans love</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {discoverSections.popularInYourCountry.map(group => (
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

            {/* TRENDING Section */}
            {discoverSections.trending && discoverSections.trending.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">🔥 Trending Now</h3>
                <p className="text-sm text-gray-500 mb-3">Most active groups this week</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

            {/* NEW GROUPS Section */}
            {discoverSections.newGroups && discoverSections.newGroups.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">🆕 New Groups</h3>
                <p className="text-sm text-gray-500 mb-3">Recently created, still growing</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

            {/* All Groups (filtered) */}
            {(filters.search || filters.tag || filters.location || filters.meetingType) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 Search Results</h3>
                {groups.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No groups found matching your filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

            {/* Empty state when no recommendations */}
            {!discoverSections.forYou?.length &&
              !discoverSections.popularInYourCountry?.length &&
              !discoverSections.trending?.length &&
              !discoverSections.newGroups?.length &&
              !filters.search && !filters.tag && !filters.location && !filters.meetingType && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No groups available yet. Be the first to create one!</p>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}

// GroupCard component with tags support
const GroupCard = ({ group, isMember, onJoin, onView }) => {
  if (!group || !group.id) {
    console.error('GroupCard: Invalid group object', group);
    return null;
  }

  const userMembership = group.userMembership;

  const handleViewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onView && group.id) onView();
  };

  const handleJoinClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onJoin && group.id) onJoin();
  };

  const getMeetingTypeBadge = () => {
    if (!group.meetingType) return null;
    const badges = {
      online: '💻 Online',
      'in-person': '🤝 In-Person',
      hybrid: '🔄 Hybrid',
    };
    return badges[group.meetingType] || null;
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
      onClick={handleViewClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-1">
            {group.tags && group.tags.slice(0, 2).map(tag => (
              <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                #{tag.name}
              </span>
            ))}
          </div>
          {group.isPrivate && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">🔒 Private</span>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-2">
          {group.name}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {group.description?.length > 100
            ? group.description.substring(0, 100) + '...'
            : group.description}
        </p>

        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
          <span>👥 {group.memberCount || 0} members</span>
          {getMeetingTypeBadge() && <span>{getMeetingTypeBadge()}</span>}
          {group.location && group.meetingType !== 'online' && <span>📍 {group.location}</span>}
          <span>📝 {group.discussionCount || 0} discussions</span>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">Created by {group.createdBy?.name}</span>
          {isMember ? (
            <button
              onClick={handleViewClick}
              className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 transition"
            >
              View Group
            </button>
          ) : userMembership ? (
            userMembership.status === 'pending' ? (
              <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-md">⏳ Pending</span>
            ) : (
              <button onClick={handleViewClick} className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 transition">
                View Group
              </button>
            )
          ) : (
            <button
              onClick={handleJoinClick}
              className="px-3 py-1.5 border border-primary-500 text-primary-500 text-sm rounded-md hover:bg-primary-50 transition"
            >
              Join Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsList;