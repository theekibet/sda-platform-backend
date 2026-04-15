// src/pages/members/MyContent.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMyPosts,
  getMyPrayerRequests,
  getMyTestimonies,
  getMyVerseSubmissions,
  getMyComments,
  deleteMyContent,
} from '../../services/api';
import Avatar from '../../components/common/Avatar';
import { Link } from 'react-router-dom';

// Icons
const Icons = {
  Post: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  Prayer: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Testimony: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Bible: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Comment: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
};

const TAB_CONFIG = [
  { id: 'posts', label: 'My Posts', icon: 'Post', color: 'blue' },
  { id: 'prayers', label: 'Prayer Requests', icon: 'Prayer', color: 'purple' },
  { id: 'testimonies', label: 'Testimonies', icon: 'Testimony', color: 'green' },
  { id: 'verses', label: 'Bible Verses', icon: 'Bible', color: 'orange' },
  { id: 'comments', label: 'Comments', icon: 'Comment', color: 'gray' },
];

function MyContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'posts':
          response = await getMyPosts();
          setContent(response.data || []);
          break;
        case 'prayers':
          response = await getMyPrayerRequests();
          setContent(response.data || []);
          break;
        case 'testimonies':
          response = await getMyTestimonies();
          setContent(response.data || []);
          break;
        case 'verses':
          response = await getMyVerseSubmissions();
          setContent(response.data || []);
          break;
        case 'comments':
          response = await getMyComments();
          setContent(response.data || []);
          break;
        default:
          setContent([]);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this? This action cannot be undone.')) {
      return;
    }

    setDeleting(id);
    try {
      await deleteMyContent(activeTab.slice(0, -1), id); // Remove 's' from tab name
      setContent(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const getEditUrl = (item) => {
    switch (activeTab) {
      case 'posts':
        return `/community/post/${item.id}`;
      case 'prayers':
        return `/prayer-wall?edit=${item.id}`;
      case 'testimonies':
        return `/prayer-wall?testimony=${item.id}`;
      case 'verses':
        return `/bible/queue?edit=${item.id}`;
      default:
        return '#';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderContentCard = (item) => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar user={item.author || user} size="medium" />
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title || 'Untitled'}</h3>
                  <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to={getEditUrl(item)}
                  className="p-1.5 text-gray-400 hover:text-primary-500 transition rounded-md"
                >
                  <Icons.Edit />
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-md"
                >
                  {deleting === item.id ? <Icons.Spinner /> : <Icons.Trash />}
                </button>
              </div>
            </div>
            <p className="text-gray-700 text-sm line-clamp-3">{item.description || item.content}</p>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span>💬 {item.stats?.comments || 0} comments</span>
              <span>❤️ {item.stats?.reactions || 0} reactions</span>
            </div>
          </div>
        );

      case 'prayers':
        return (
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">{formatDate(item.createdAt)}</p>
                <p className="text-gray-700">{item.content}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-md"
                >
                  {deleting === item.id ? <Icons.Spinner /> : <Icons.Trash />}
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">🙏 {item.prayedCount || 0} prayers</div>
          </div>
        );

      case 'testimonies':
        return (
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-md"
                >
                  {deleting === item.id ? <Icons.Spinner /> : <Icons.Trash />}
                </button>
              </div>
            </div>
            <p className="text-gray-700 text-sm line-clamp-3">{item.content}</p>
            <div className="text-xs text-gray-500 mt-2">✨ {item.encouragedCount || 0} encouragements</div>
          </div>
        );

      case 'verses':
        return (
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-primary-600">{item.reference}</p>
                <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-md"
                >
                  {deleting === item.id ? <Icons.Spinner /> : <Icons.Trash />}
                </button>
              </div>
            </div>
            <p className="text-gray-700 text-sm italic">"{item.text?.substring(0, 150)}"</p>
            <div className="text-xs text-gray-500 mt-2">
              Status: <span className={`font-medium ${
                item.status === 'approved' ? 'text-green-600' :
                item.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
              }`}>{item.status || 'pending'}</span>
            </div>
          </div>
        );

      case 'comments':
        return (
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500">On: {item.post?.title || 'a post'}</p>
                <p className="text-gray-700 text-sm mt-1">{item.content}</p>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deleting === item.id}
                className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-md"
              >
                {deleting === item.id ? <Icons.Spinner /> : <Icons.Trash />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">{formatDate(item.createdAt)}</p>
          </div>
        );

      default:
        return null;
    }
  };

  const getIconComponent = (iconName) => {
    const Icon = Icons[iconName];
    return Icon ? <Icon /> : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            📋 My Content
          </h1>
          <p className="text-gray-500">Manage all your contributions in one place</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-1 rounded-xl">
          {TAB_CONFIG.map(tab => {
            const IconComponent = getIconComponent(tab.icon);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                <span className={`text-${tab.color}-500`}>{IconComponent}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-3">Loading your content...</p>
          </div>
        ) : content.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No content found</h3>
            <p className="text-gray-600">
              You haven't created any {TAB_CONFIG.find(t => t.id === activeTab)?.label.toLowerCase()} yet.
            </p>
            {activeTab === 'posts' && (
              <button
                onClick={() => window.location.href = '/community/create'}
                className="mt-4 px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
              >
                Create your first post
              </button>
            )}
            {activeTab === 'prayers' && (
              <button
                onClick={() => window.location.href = '/prayer-wall'}
                className="mt-4 px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
              >
                Share a prayer request
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {content.map(item => (
              <div key={item.id}>
                {renderContentCard(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyContent;