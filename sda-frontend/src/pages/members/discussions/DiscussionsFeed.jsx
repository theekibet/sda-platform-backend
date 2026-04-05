// src/pages/members/discussions/DiscussionsFeed.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { discussionsService } from '../../../services/discussionsService';
import { tagsService } from '../../../services/tagsService';
import DiscussionCard from "../../../components/discussions/DiscussionCard";

function DiscussionsFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [discussions, setDiscussions] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'feed');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  // Fetch user's bookmarks when logged in
  useEffect(() => {
    if (user) {
      fetchUserBookmarks();
    }
  }, [user]);

  const fetchUserBookmarks = async () => {
    try {
      const response = await discussionsService.getUserBookmarks(1, 100); // fetch first 100 bookmarks
      const bookmarks = response.data?.discussions || [];
      const ids = new Set(bookmarks.map(b => b.id));
      setBookmarkedIds(ids);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const fetchTrendingTags = async () => {
    try {
      const response = await tagsService.getTrendingTags(10);
      setTrendingTags(response.data || []);
    } catch (error) {
      console.error('Error fetching trending tags:', error);
    }
  };

  const fetchDiscussions = async (reset = false) => {
    if (reset) {
      setPage(1);
      setDiscussions([]);
    }
    
    setLoading(true);
    try {
      let response;
      let newDiscussions = [];
      
      switch (activeTab) {
        case 'hot':
          // Hot sort: use getDiscussions with sort='hot' and pagination
          const hotResult = await discussionsService.getDiscussions({
            sort: 'hot',
            page: reset ? 1 : page,
            limit: 20,
          });
          newDiscussions = hotResult.data?.discussions || [];
          setHasMore(newDiscussions.length === 20);
          setDiscussions(prev => reset ? newDiscussions : [...prev, ...newDiscussions]);
          break;

        case 'trending':
          response = await discussionsService.getTrendingNow(20);
          newDiscussions = response.data || [];
          setDiscussions(newDiscussions);
          setHasMore(false);
          break;

        case 'recommended':
          if (user) {
            response = await discussionsService.getRecommended(20);
            newDiscussions = response.data || [];
          } else {
            response = await discussionsService.getTrendingNow(20);
            newDiscussions = response.data || [];
          }
          setDiscussions(newDiscussions);
          setHasMore(false);
          break;

        case 'feed':
        default:
          response = await discussionsService.getHomeFeed(reset ? 1 : page, 20);
          newDiscussions = response.data?.discussions || [];
          if (reset || page === 1) {
            setDiscussions(newDiscussions);
          } else {
            setDiscussions(prev => [...prev, ...newDiscussions]);
          }
          setHasMore(newDiscussions.length === 20);
          break;
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setPage(1);
    setHasMore(true);
    fetchDiscussions(true);
  };

  const handleTagClick = (tag) => {
    if (selectedTag === tag.id) {
      setSelectedTag('');
      setSearchParams({ tab: activeTab });
    } else {
      setSelectedTag(tag.id);
      setSearchParams({ tab: activeTab, tag: tag.id });
    }
    setPage(1);
    fetchDiscussions(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && (activeTab === 'feed' || activeTab === 'hot')) {
      setPage(prev => prev + 1);
    }
  };

  const handleCreateDiscussion = () => {
    navigate('/discussions/create');
  };

  const handleBookmarkChange = useCallback(async (discussionId, newBookmarked) => {
    // Optimistic update
    setBookmarkedIds(prev => {
      const newSet = new Set(prev);
      if (newBookmarked) {
        newSet.add(discussionId);
      } else {
        newSet.delete(discussionId);
      }
      return newSet;
    });

    // Actually toggle on server (discussionsService.toggleBookmark already handles toggle)
    try {
      await discussionsService.toggleBookmark(discussionId);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert optimistic update on error
      setBookmarkedIds(prev => {
        const newSet = new Set(prev);
        if (newBookmarked) {
          newSet.delete(discussionId);
        } else {
          newSet.add(discussionId);
        }
        return newSet;
      });
    }
  }, []);

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    if (diffMinutes < 2880) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Effect to fetch discussions when page changes (for tabs that support pagination)
  useEffect(() => {
    if (activeTab === 'feed' || activeTab === 'hot') {
      if (page > 1) fetchDiscussions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Initial fetch when tab or tag changes
  useEffect(() => {
    fetchTrendingTags();
    fetchDiscussions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedTag]);

  return (
    <div className="max-w-6xl mx-auto p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💬 Discussions</h1>
          <p className="text-sm text-gray-500">Join the conversation with the community</p>
        </div>
        <button
          onClick={handleCreateDiscussion}
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
        >
          + New Discussion
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-5 overflow-x-auto">
        <button
          onClick={() => handleTabChange('feed')}
          className={`py-2 px-1 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'feed'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📰 Home Feed
        </button>
        <button
          onClick={() => handleTabChange('hot')}
          className={`py-2 px-1 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'hot'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🔥 Hot
        </button>
        <button
          onClick={() => handleTabChange('trending')}
          className={`py-2 px-1 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'trending'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📈 Trending
        </button>
        {user && (
          <button
            onClick={() => handleTabChange('recommended')}
            className={`py-2 px-1 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'recommended'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ✨ For You
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Selected Tag Filter */}
          {selectedTag && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-primary-50 rounded-lg">
              <span className="text-sm text-primary-700">Filtered by tag:</span>
              <span className="px-3 py-1 bg-primary-500 text-white text-sm rounded-full">
                {trendingTags.find(t => t.id === selectedTag)?.name || 'Tag'}
              </span>
              <button
                onClick={() => handleTagClick({ id: '' })}
                className="text-primary-500 hover:text-primary-700"
              >
                ✕ Clear
              </button>
            </div>
          )}

          {/* Discussions List */}
          {loading && discussions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading discussions...</p>
            </div>
          ) : discussions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No discussions found</p>
              <button
                onClick={handleCreateDiscussion}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
              >
                Start the first discussion
              </button>
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
              
              {/* Load More */}
              {(activeTab === 'feed' || activeTab === 'hot') && hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Trending Tags */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔥 Trending Tags</h3>
            {trendingTags.length === 0 ? (
              <p className="text-sm text-gray-500">No tags yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trendingTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      selectedTag === tag.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Community Stats */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Community</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active discussions</span>
                <span className="font-semibold text-gray-800">{discussions.length}+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Topics</span>
                <span className="font-semibold text-gray-800">{trendingTags.length}</span>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Posting Guidelines</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Be respectful and kind</li>
              <li>• Stay on topic</li>
              <li>• No spam or self-promotion</li>
              <li>• Use tags to help others find your post</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscussionsFeed;