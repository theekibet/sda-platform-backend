// src/pages/members/Bookmarks.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import InteractiveVerseCard from '../../components/bible/InteractiveVerseCard';
import PostCard from '../../components/community/PostCard';
import DiscussionCard from '../../components/discussions/DiscussionCard';
import { communityService } from '../../services/communityService';
import { discussionsService } from '../../services/discussionsService';
import API from '../../services/api';

function Bookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'verses', 'posts', 'discussions'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllBookmarks();
  }, []);

  const fetchAllBookmarks = async () => {
    setLoading(true);
    try {
      // Fetch verse bookmarks
      const versesResponse = await API.get('/bible/verse/bookmarks');
      const versesData = versesResponse.data;

      // Fetch community post bookmarks
      const postsResponse = await communityService.getBookmarks();

      // Fetch discussion bookmarks
      let discussionsData = { discussions: [] };
      try {
        const discussionsResponse = await discussionsService.getUserBookmarks(1, 100);
        discussionsData = discussionsResponse.data || { discussions: [] };
      } catch (err) {
        console.error('Error fetching discussion bookmarks:', err);
      }

      const combinedBookmarks = [
        ...(versesData.bookmarks || []).map(b => ({
          ...b,
          type: 'verse',
          data: b.verse || b,
        })),
        ...(postsResponse.data || []).map(p => ({
          ...p,
          type: 'post',
          data: p.post || p,
        })),
        ...(discussionsData.discussions || []).map(d => ({
          id: d.id,
          type: 'discussion',
          data: d,
          createdAt: d.createdAt,
        })),
      ];

      combinedBookmarks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setBookmarks(combinedBookmarks);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkRemoved = (bookmarkId, type) => {
    setBookmarks(prev => prev.filter(b => !(b.id === bookmarkId && b.type === type)));
  };

  const handleDiscussionBookmarkRemoved = (discussionId) => {
    setBookmarks(prev => prev.filter(b => !(b.type === 'discussion' && b.data.id === discussionId)));
  };

  const filteredBookmarks = () => {
    if (activeTab === 'verses') {
      return bookmarks.filter(b => b.type === 'verse');
    }
    if (activeTab === 'posts') {
      return bookmarks.filter(b => b.type === 'post');
    }
    if (activeTab === 'discussions') {
      return bookmarks.filter(b => b.type === 'discussion');
    }
    return bookmarks;
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-5 text-gray-600">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-5"></div>
        <p className="text-base">Loading your bookmarks...</p>
      </div>
    );
  }

  const displayBookmarks = filteredBookmarks();

  return (
    <div className="max-w-3xl mx-auto p-5 pb-16">
      {/* Header */}
      <div className="mb-5 border-b-2 border-primary-500 pb-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">
          🔖 My Bookmarks
        </h2>
        <p className="text-gray-500 text-base m-0">
          {bookmarks.length} {bookmarks.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2.5 mb-6 border-b border-gray-200 pb-2.5 flex-wrap">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-transparent text-gray-500 hover:text-primary-500'
          }`}
        >
          All ({bookmarks.length})
        </button>
        <button
          onClick={() => setActiveTab('verses')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'verses'
              ? 'bg-primary-500 text-white'
              : 'bg-transparent text-gray-500 hover:text-primary-500'
          }`}
        >
          📖 Verses ({bookmarks.filter(b => b.type === 'verse').length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'posts'
              ? 'bg-primary-500 text-white'
              : 'bg-transparent text-gray-500 hover:text-primary-500'
          }`}
        >
          📢 Community Posts ({bookmarks.filter(b => b.type === 'post').length})
        </button>
        <button
          onClick={() => setActiveTab('discussions')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'discussions'
              ? 'bg-primary-500 text-white'
              : 'bg-transparent text-gray-500 hover:text-primary-500'
          }`}
        >
          💬 Discussions ({bookmarks.filter(b => b.type === 'discussion').length})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-red-50 text-red-700 rounded-lg mb-6 text-sm">
          <span className="text-xl">⚠️</span>
          {error}
        </div>
      )}

      {/* Empty State */}
      {displayBookmarks.length === 0 ? (
        <div className="text-center py-20 px-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-5 opacity-80">📖</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">No Bookmarks Yet</h3>
          <p className="text-gray-500 text-base max-w-md mx-auto mb-8 leading-relaxed">
            {activeTab === 'verses'
              ? "You haven't saved any Bible verses yet. When you bookmark verses while reading, they'll appear here."
              : activeTab === 'posts'
              ? "You haven't saved any community posts yet. Click the bookmark icon on any post to save it here."
              : activeTab === 'discussions'
              ? "You haven't saved any discussions yet. Click the bookmark icon on any discussion to save it here."
              : "Start building your collection! Bookmark Bible verses, community posts, and discussions you want to remember."}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => (window.location.href = '/bible/verse-of-day')}
              className="px-7 py-3.5 bg-primary-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              ✨ Today's Verse
            </button>
            <button
              onClick={() => (window.location.href = '/community')}
              className="px-7 py-3.5 bg-white text-primary-500 font-semibold rounded-lg border-2 border-primary-500 hover:bg-primary-50 transition-all"
            >
              📢 Browse Community
            </button>
            <button
              onClick={() => (window.location.href = '/discussions')}
              className="px-7 py-3.5 bg-white text-primary-500 font-semibold rounded-lg border-2 border-primary-500 hover:bg-primary-50 transition-all"
            >
              💬 Browse Discussions
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {displayBookmarks.map(bookmark => {
            if (bookmark.type === 'verse') {
              const verseData = bookmark.data;
              return (
                <div key={`verse-${bookmark.id}`} className="relative">
                  <div className="flex justify-between items-center mb-2.5 pl-1 flex-wrap gap-2">
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                      📅 Saved{' '}
                      {new Date(bookmark.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full font-medium">
                      📖 Bible Verse
                    </span>
                  </div>
                  <InteractiveVerseCard
                    verse={verseData}
                    showReadButton={true}
                    showSharedBy={false}
                    onBookmarkChange={() => handleBookmarkRemoved(bookmark.id, 'verse')}
                  />
                </div>
              );
            } else if (bookmark.type === 'post') {
              const postData = bookmark.data;
              return (
                <div key={`post-${bookmark.id}`} className="relative">
                  <div className="flex justify-between items-center mb-2.5 pl-1 flex-wrap gap-2">
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                      📅 Saved{' '}
                      {new Date(bookmark.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full font-medium">
                      📢 Community Post
                    </span>
                  </div>
                  <PostCard
                    post={postData}
                    currentUser={user}
                    onPostDeleted={() => handleBookmarkRemoved(bookmark.id, 'post')}
                    onPostUpdated={updated => {
                      setBookmarks(prev =>
                        prev.map(b =>
                          b.id === bookmark.id && b.type === 'post'
                            ? { ...b, data: updated }
                            : b
                        )
                      );
                    }}
                  />
                </div>
              );
            } else {
              // Discussion
              const discussionData = bookmark.data;
              return (
                <div key={`discussion-${discussionData.id}`} className="relative">
                  <div className="flex justify-between items-center mb-2.5 pl-1 flex-wrap gap-2">
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                      📅 Saved{' '}
                      {new Date(bookmark.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full font-medium">
                      💬 Discussion
                    </span>
                  </div>
                  <DiscussionCard
                    discussion={discussionData}
                    formatTimeAgo={formatTimeAgo}
                    isBookmarked={true}
                    onBookmarkChange={(discussionId, newBookmarked) => {
                      if (!newBookmarked) {
                        handleDiscussionBookmarkRemoved(discussionId);
                      }
                    }}
                  />
                </div>
              );
            }
          })}
        </div>
      )}

      {/* Tips Section */}
      {bookmarks.length > 0 && (
        <div className="mt-12 p-6 bg-primary-50 rounded-xl border border-primary-100">
          <h3 className="text-primary-600 text-lg font-semibold mb-4 flex items-center gap-2">
            💡 Tips
          </h3>
          <ul className="list-disc pl-6 text-gray-600 space-y-1">
            <li>
              Click the 🔖 bookmark icon on any verse, post, or discussion to remove it from your collection
            </li>
            <li>
              Use the 💬 comment section on verses to add your personal reflections
            </li>
            <li>
              Share meaningful content with the community using the ❤️ like button
            </li>
            <li>
              Use the tabs above to filter between Bible verses, community posts, and discussions
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Bookmarks;