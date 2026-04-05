// src/pages/members/SearchResults.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { searchService } from '../../services/searchService';
import DiscussionCard from '../../components/discussions/DiscussionCard';
import GroupCard from "../../components/groups/GroupCard";
import TagList from '../../components/tags/TagList';

function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('all'); // all, discussions, groups, tags
  const [results, setResults] = useState({ discussions: [], groups: [], tags: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query) {
      performSearch();
    } else {
      setLoading(false);
    }
  }, [query, activeTab]);

  const performSearch = async () => {
    setLoading(true);
    setError('');
    try {
      // Use authenticated search if user is logged in
      const response = user
        ? await searchService.searchAuthenticated(query, activeTab, 1, 20)
        : await searchService.search(query, activeTab, 1, 20);
      setResults(response.results || { discussions: [], groups: [], tags: [] });
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to load search results. Please try again.');
    } finally {
      setLoading(false);
    }
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

  if (!query) {
    return (
      <div className="max-w-4xl mx-auto p-5 text-center">
        <p className="text-gray-500">Enter a search term to get started.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-5">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Search Results</h1>
        <p className="text-gray-500">Showing results for "{query}"</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-1 text-sm font-medium border-b-2 transition ${
            activeTab === 'all'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('discussions')}
          className={`py-2 px-1 text-sm font-medium border-b-2 transition ${
            activeTab === 'discussions'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Discussions ({results.discussions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`py-2 px-1 text-sm font-medium border-b-2 transition ${
            activeTab === 'groups'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Groups ({results.groups?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`py-2 px-1 text-sm font-medium border-b-2 transition ${
            activeTab === 'tags'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tags ({results.tags?.length || 0})
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Searching...</p>
        </div>
      )}

      {/* Error */}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      {/* Results */}
      {!loading && !error && (
        <>
          {/* Discussions */}
          {(activeTab === 'all' || activeTab === 'discussions') && results.discussions?.length > 0 && (
            <div className="space-y-4">
              {activeTab === 'all' && (
                <h2 className="text-lg font-semibold text-gray-800">Discussions</h2>
              )}
              {results.discussions.map((discussion) => (
                <DiscussionCard
                  key={discussion.id}
                  discussion={discussion}
                  onClick={() => navigate(`/discussions/${discussion.id}`)}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </div>
          )}

          {/* Groups */}
          {(activeTab === 'all' || activeTab === 'groups') && results.groups?.length > 0 && (
            <div className="mt-6 space-y-4">
              {activeTab === 'all' && (
                <h2 className="text-lg font-semibold text-gray-800">Groups</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onView={() => navigate(`/groups/${group.id}`)}
                    isMember={group.userMembership?.status === 'approved'}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tags - Using TagList component */}
          {(activeTab === 'all' || activeTab === 'tags') && results.tags?.length > 0 && (
            <div className="mt-6">
              {activeTab === 'all' && (
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Tags</h2>
              )}
              <TagList 
                tags={results.tags} 
                interactive={true} 
                size="md"
                onTagClick={(tag) => navigate(`/discussions?tag=${tag.id}`)}
              />
            </div>
          )}

          {/* No results */}
          {((activeTab === 'all' && results.discussions?.length === 0 && results.groups?.length === 0 && results.tags?.length === 0) ||
            (activeTab === 'discussions' && results.discussions?.length === 0) ||
            (activeTab === 'groups' && results.groups?.length === 0) ||
            (activeTab === 'tags' && results.tags?.length === 0)) && (
            <div className="text-center py-12 text-gray-500">
              No results found for "{query}"
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchResults;