// src/pages/members/CommunityBoard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { communityService } from '../../services/communityService';
import { updateLocation } from '../../services/api';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import GuidelinesBanner from '../common/GuidelinesBanner';
import PostFilters from '../../components/community/PostFilters';
import TrendingPosts from '../../components/community/TrendingPosts';

// Heroicons SVG Components
const Icons = {
  Building: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Location: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Question: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Information: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Exclamation: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Inbox: () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
};

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
  const [viewMode, setViewMode] = useState('all');
  const [radius, setRadius] = useState(50);
  const [sortBy, setSortBy] = useState('newest');
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  // Location states
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState({ type: '', text: '' });
  const [showLocationInfo, setShowLocationInfo] = useState(false);

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

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(false, page + 1);
    }
  };

  useEffect(() => {
    fetchPosts(true, 1);
  }, [selectedType, searchQuery, viewMode, radius]);

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
            text: `Location updated: ${locationName}`,
          });

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

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setFilteredPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    setFilteredPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  useEffect(() => {
    let filtered = [...posts];

    if (selectedType !== 'all') {
      filtered = filtered.filter(post => post.type === selectedType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title?.toLowerCase().includes(query) ||
        post.description?.toLowerCase().includes(query) ||
        post.author?.name?.toLowerCase().includes(query)
      );
    }

    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(post => new Date(post.createdAt) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      filtered = filtered.filter(post => new Date(post.createdAt) <= endDate);
    }

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
  };

  const handleClearFilters = () => {
    setSelectedType('all');
    setSearchQuery('');
    setSortBy('newest');
    setDateRange({ start: null, end: null });
    setViewMode('all');
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-3">Loading community posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <span className="text-primary-600">
              <Icons.Building />
            </span>
            Community Board
          </h1>
          <p className="text-gray-500">Connect, share, and support each other</p>
        </div>

        {/* Guidelines Banner */}
        <GuidelinesBanner />

        {/* Location Status Bar */}
        <div className="glass-card p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-500">
              <Icons.Location />
            </span>
            {displayLocation ? (
              <span className="text-gray-700">
                Current location: <strong>{displayLocation}</strong>
              </span>
            ) : (
              <span className="text-yellow-600 flex items-center gap-2">
                <Icons.Exclamation />
                Location not set
              </span>
            )}
            <button
              onClick={() => setShowLocationInfo(!showLocationInfo)}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs transition"
              title="Location information"
            >
              ?
            </button>
          </div>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              detectingLocation
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
            }`}
            onClick={detectMyLocation}
            disabled={detectingLocation}
          >
            {detectingLocation ? (
              <span className="flex items-center gap-2">
                <Icons.Spinner />
                Detecting...
              </span>
            ) : (
              'Update Location'
            )}
          </button>
        </div>

        {/* Info Tooltip */}
        {showLocationInfo && (
          <div className="glass-card p-5 mb-6 border border-primary-100">
            <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-primary-600">
                <Icons.Location />
              </span>
              How location works:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-3 ml-2">
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
            className={`p-3 rounded-xl mb-4 flex items-center gap-2 ${
              locationMessage.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {locationMessage.type === 'success' ? (
              <span className="text-green-600"><Icons.Check /></span>
            ) : (
              <span className="text-red-600"><Icons.Exclamation /></span>
            )}
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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all hover:shadow-md"
          >
            <Icons.Plus />
            Create Post
          </button>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 text-gray-400 mb-4">
              <Icons.Inbox />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No posts found</h3>
            <p className="text-gray-600 mb-4">
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
                }}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
              >
                <Icons.Search />
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
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition disabled:opacity-50"
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