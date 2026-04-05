import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { communityService } from '../../services/communityService';
import { updateLocation } from '../../services/api';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import GuidelinesBanner from '../common/GuidelinesBanner';
import PostFilters from '../../components/community/PostFilters';
import TrendingPosts from '../../components/community/TrendingPosts';

function CommunityBoard() {
  const { user, setUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showTrending, setShowTrending] = useState(true);

  // Filter states
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'nearby'
  const [radius, setRadius] = useState(50);
  const [sortBy, setSortBy] = useState('newest');
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  // Location states
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState({ type: '', text: '' });
  const [showLocationInfo, setShowLocationInfo] = useState(false);

  // Fetch posts (supports pagination and local filtering)
  const fetchPosts = async (reset = true, pageToFetch = 1) => {
    try {
      if (reset) {
        setLoading(true);
        setPosts([]);
        setPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        type: selectedType !== 'all' ? selectedType : undefined,
        search: searchQuery || undefined,
        page: pageToFetch,
        limit: 20,
        local: viewMode === 'nearby' ? true : undefined,
        radius: viewMode === 'nearby' ? radius : undefined,
      };

      const response = await communityService.getPosts(params);
      const newPosts = response.data || [];
      const pagination = response.pagination;

      if (reset) {
        setPosts(newPosts);
        setPage(pageToFetch);
        setHasMore(pagination?.page < pagination?.totalPages);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(pageToFetch);
        setHasMore(pagination?.page < pagination?.totalPages);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (!reset) {
        setLocationMessage({ type: 'error', text: 'Failed to load more posts' });
        setTimeout(() => setLocationMessage({ type: '', text: '' }), 3000);
      }
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Load more posts
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(false, page + 1);
    }
  };

  // Detect changes in filters and refetch from scratch
  useEffect(() => {
    fetchPosts(true, 1);
  }, [selectedType, searchQuery, viewMode, radius]);

  // Detect current location
  const detectMyLocation = async () => {
    setDetectingLocation(true);
    setLocationMessage({ type: '', text: '' });

    if (!navigator.geolocation) {
      setLocationMessage({
        type: 'error',
        text: 'Geolocation is not supported by your browser',
      });
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            {
              headers: {
                'User-Agent': 'YouthMinistryPlatform/1.0',
              },
            }
          );
          const data = await response.json();

          const address = data.address;
          const city = address.city || address.town || address.village || address.county || '';
          const country = address.country || 'Kenya';
          const locationName = city ? `${city}, ${country}` : country;

          const locationData = {
            locationName,
            latitude,
            longitude,
          };

          await updateLocation(locationData);
          setUser({ ...user, ...locationData });

          setLocationMessage({
            type: 'success',
            text: `📍 Location updated: ${locationName}`,
          });

          // If currently in nearby mode, refetch posts with new location
          if (viewMode === 'nearby') {
            fetchPosts(true, 1);
          }

          setTimeout(() => setLocationMessage({ type: '', text: '' }), 3000);
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setLocationMessage({
            type: 'error',
            text: 'Could not determine your exact location. Please try again.',
          });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setDetectingLocation(false);

        let errorMessage = 'Could not detect your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please set your location in profile.';
        }

        setLocationMessage({ type: 'error', text: errorMessage });
        setTimeout(() => setLocationMessage({ type: '', text: '' }), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handle post deletion
  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setFilteredPosts(prev => prev.filter(p => p.id !== postId));
  };

  // Handle post update
  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    setFilteredPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  // Filter and process posts (client-side filtering)
  useEffect(() => {
    let filtered = [...posts];

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(post => post.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title?.toLowerCase().includes(query) ||
        post.description?.toLowerCase().includes(query) ||
        post.author?.name?.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(post => new Date(post.createdAt) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      filtered = filtered.filter(post => new Date(post.createdAt) <= endDate);
    }

    // Sort posts
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.stats?.total || 0) - (a.stats?.total || 0));
        break;
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredPosts(filtered);
  }, [posts, selectedType, searchQuery, sortBy, dateRange]);

  const getUserDisplayLocation = () => {
    if (!user) return '';
    if (user.locationName) {
      return user.locationName.split(',')[0].trim();
    }
    return null;
  };

  const displayLocation = getUserDisplayLocation();

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    switch (key) {
      case 'type':
        setSelectedType(value);
        break;
      case 'search':
        setSearchQuery(value);
        break;
      case 'sortBy':
        setSortBy(value);
        break;
      case 'radius':
        setRadius(value);
        if (viewMode === 'nearby') {
          fetchPosts(true, 1);
        }
        break;
      case 'dateRange':
        setDateRange(value);
        break;
      default:
        break;
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    // Fetch will be triggered by useEffect that depends on viewMode
  };

  const handleClearFilters = () => {
    setSelectedType('all');
    setSearchQuery('');
    setSortBy('newest');
    setDateRange({ start: null, end: null });
    setViewMode('all');
    // fetchPosts will be triggered by useEffect
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-white py-12">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin-slow mx-auto mb-4"></div>
          <p>Loading community posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Board</h1>
          <p className="text-lg opacity-90">Connect, share, and support each other</p>
        </div>

        {/* Guidelines Banner */}
        <GuidelinesBanner />

        {/* Location Status Bar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📍</span>
            {displayLocation ? (
              <span className="text-white">
                Current location: <strong>{displayLocation}</strong>
              </span>
            ) : (
              <span className="text-yellow-300">Location not set</span>
            )}
            <button
              onClick={() => setShowLocationInfo(!showLocationInfo)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm transition"
              title="Location information"
            >
              ℹ️
            </button>
          </div>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition ${
              detectingLocation
                ? 'bg-gray-500 text-white cursor-not-allowed'
                : 'bg-white text-primary-500 hover:bg-primary-100'
            }`}
            onClick={detectMyLocation}
            disabled={detectingLocation}
          >
            {detectingLocation ? '🔄 Detecting...' : '📍 Update Location'}
          </button>
        </div>

        {/* Info Tooltip */}
        {showLocationInfo && (
          <div className="bg-white rounded-xl p-4 mb-6 shadow-lg border border-primary-100">
            <p className="font-semibold text-gray-800 mb-2">📍 How location works:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-3">
              <li>Your location helps you see posts from your area</li>
              <li>Click "Update Location" to detect your current city</li>
              <li>You can also set your location in your profile</li>
              <li>Choose "Near Me" to see posts within your selected radius</li>
              <li>Your exact location is never shared publicly</li>
            </ul>
            <button
              onClick={() => setShowLocationInfo(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
            >
              Got it
            </button>
          </div>
        )}

        {/* Location Message */}
        {locationMessage.text && (
          <div
            className={`p-3 rounded-lg mb-4 ${
              locationMessage.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {locationMessage.text}
          </div>
        )}

        {/* Filters Component */}
        <PostFilters
          filters={{
            type: selectedType,
            search: searchQuery,
            sortBy: sortBy,
            radius: radius,
            dateRange: dateRange,
          }}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />

        {/* Trending Section */}
        {showTrending && viewMode === 'all' && (
          <div className="mb-8">
            <TrendingPosts
              limit={5}
              onPostClick={(postId) => (window.location.href = `/community/post/${postId}`)}
            />
          </div>
        )}

        {/* Create Post Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-white text-primary-500 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            + Create Post
          </button>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 shadow-xl text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No posts found</h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Try adjusting your search'
                : viewMode === 'nearby'
                ? `No posts found near ${displayLocation || 'your area'}. Try increasing the radius or viewing all posts.`
                : 'Be the first to create a post!'}
            </p>
            {viewMode === 'nearby' && (
              <button
                onClick={() => {
                  setViewMode('all');
                  // fetch will be triggered by useEffect
                }}
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
              >
                View all posts
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  formatDistance={(distance) => {
                    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
                    return `${distance.toFixed(1)}km away`;
                  }}
                  onPostDeleted={handlePostDeleted}
                  onPostUpdated={handlePostUpdated}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Create Post Modal */}
        {showCreateModal && (
          <CreatePostModal
            onClose={() => setShowCreateModal(false)}
            onPostCreated={() => {
              setShowCreateModal(false);
              fetchPosts(true, 1);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default CommunityBoard;