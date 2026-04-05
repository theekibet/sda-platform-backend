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
  const [sort, setSort] = useState('new'); // 'new', 'popular', 'trending', 'hot'
  const [canPost, setCanPost] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  // Fetch user's bookmarks when logged in (optional - won't break if endpoint doesn't exist)
  useEffect(() => {
    if (user) {
      fetchUserBookmarks();
    }
  }, [user]);

  const fetchUserBookmarks = async () => {
    try {
      // Try to fetch bookmarks, but don't break if it fails
      const response = await discussionsService.getUserBookmarks(1, 100);
      // The service returns { discussions: [], total, page, totalPages }
      const bookmarks = response.discussions || [];
      const ids = new Set(bookmarks.map(b => b.id));
      setBookmarkedIds(ids);
    } catch (error) {
      // Silently fail - bookmarks are optional
      console.debug('Bookmarks feature not available yet');
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
      fetchDiscussions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, sort, page]);

  const fetchGroupDetails = async () => {
    try {
      const response = await groupsService.getGroupById(groupId);
      // Handle different response structures
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

      // The service returns { discussions: [], total, page, totalPages }
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
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    fetchDiscussions(true);
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

    // Actually toggle on server
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

  // Check if there are any discussions
  const hasDiscussions = discussions.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl shadow-sm p-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            💬 Group Discussions
          </h3>
          <p className="text-sm text-gray-500">
            {discussions.length} {discussions.length === 1 ? 'discussion' : 'discussions'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
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
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition text-sm"
            >
              + New Discussion
            </button>
          ) : (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-md">
              Join to post
            </span>
          )}
        </div>
      </div>

      {/* Discussions List */}
      {loading && discussions.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading discussions...</p>
        </div>
      ) : !hasDiscussions ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500 mb-2">No discussions yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Start the first conversation in this group!
          </p>
          {canPost && (
            <button
              onClick={handleCreateDiscussion}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
            >
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
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition disabled:opacity-50 text-sm"
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