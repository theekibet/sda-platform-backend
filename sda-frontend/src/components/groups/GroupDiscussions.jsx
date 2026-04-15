// src/components/groups/GroupDiscussions.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import { discussionsService } from "../../services/discussionsService";
import { groupsService } from "../../services/groupsService";
import DiscussionCard from "../discussions/DiscussionCard";

function GroupDiscussions({ groupId }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [discussions, setDiscussions] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState('new');
  const [canPost, setCanPost] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  useEffect(() => {
    if (user) fetchUserBookmarks();
  }, [user]);

  const fetchUserBookmarks = async () => {
    try {
      const response = await discussionsService.getUserBookmarks(1, 100);
      const bookmarks = response.discussions || [];
      const ids = new Set(bookmarks.map(b => b.id));
      setBookmarkedIds(ids);
    } catch (error) {
      console.debug('Bookmarks feature not available yet');
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
      fetchDiscussions();
    }
  }, [groupId, sort, page]);

  const fetchGroupDetails = async () => {
    try {
      const response = await groupsService.getGroupById(groupId);
      const groupData = response.data?.data || response.data;
      setGroup(groupData);
      setCanPost(groupData?.canPost || groupData?.userMembership?.status === 'approved');
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const fetchDiscussions = async (reset = false) => {
    if (reset) {
      setPage(1);
      setDiscussions([]);
    }
    setLoading(true);
    try {
      const response = await discussionsService.getDiscussions({
        groupId,
        page: reset ? 1 : page,
        limit: 20,
        sort,
      });
      const newDiscussions = response.discussions || [];
      if (reset || page === 1) {
        setDiscussions(newDiscussions);
      } else {
        setDiscussions(prev => [...prev, ...newDiscussions]);
      }
      setHasMore(newDiscussions.length === 20);
    } catch (error) {
      console.error('Error fetching group discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = () => {
    navigate(`/discussions/create?groupId=${groupId}`);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) setPage(prev => prev + 1);
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    fetchDiscussions(true);
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

  const hasDiscussions = discussions.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Group Discussions
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {discussions.length} {discussions.length === 1 ? 'discussion' : 'discussions'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
          >
            <option value="new">🆕 Newest</option>
            <option value="popular">🔥 Most Popular</option>
            <option value="trending">📈 Trending</option>
            <option value="hot">🔥 Hot</option>
          </select>

          {/* Create Button */}
          {canPost ? (
            <button
              onClick={handleCreateDiscussion}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-all hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Discussion
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Join to post
            </span>
          )}
        </div>
      </div>

      {/* Discussions List */}
      {loading && discussions.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-3">Loading discussions...</p>
        </div>
      ) : !hasDiscussions ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No discussions yet</h3>
          <p className="text-gray-500 mb-6">Start the first conversation in this group!</p>
          {canPost && (
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
          
          {/* Load More */}
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GroupDiscussions;