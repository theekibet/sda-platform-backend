// src/components/tags/TagSelector.jsx
import { useState, useRef, useEffect } from 'react';

function TagSelector({ availableTags = [], selectedTags = [], onChange, maxTags = 5 }) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = availableTags.filter(tag => 
        tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.includes(tag.name)
      );
      setFilteredSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, availableTags, selectedTags]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const addTag = (tagName) => {
    const normalizedTag = tagName.toLowerCase().trim().replace(/\s+/g, '-');
    
    if (selectedTags.length >= maxTags) {
      return;
    }
    
    if (!selectedTags.includes(normalizedTag)) {
      const newTags = [...selectedTags, normalizedTag];
      onChange(newTags);
    }
    
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onChange(newTags);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const handleSuggestionClick = (tag) => {
    addTag(tag.name);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white">
        {selectedTags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-primary-500 hover:text-primary-700 font-bold"
            >
              ×
            </button>
          </span>
        ))}
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? 'Add tags...' : ''}
          disabled={selectedTags.length >= maxTags}
          className="flex-1 min-w-[80px] outline-none text-sm bg-transparent"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {filteredSuggestions.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleSuggestionClick(tag)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition text-sm"
            >
              <span className="text-primary-600">#{tag.name}</span>
              {tag.description && (
                <span className="text-gray-400 text-xs ml-2">- {tag.description}</span>
              )}
              <span className="text-gray-400 text-xs ml-2">({tag.usageCount || 0} uses)</span>
            </button>
          ))}
        </div>
      )}

      {/* Create New Tag Option */}
      {showSuggestions && inputValue.trim() && !filteredSuggestions.some(t => t.name === inputValue.toLowerCase().trim()) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            className="w-full text-left px-3 py-2 hover:bg-gray-50 transition text-sm text-primary-600"
          >
            + Create tag "#{inputValue.toLowerCase().trim().replace(/\s+/g, '-')}"
          </button>
        </div>
      )}

      {/* Max Tags Warning */}
      {selectedTags.length >= maxTags && (
        <p className="text-xs text-amber-600 mt-1">
          Maximum {maxTags} tags allowed
        </p>
      )}

      {/* Tag Count */}
      <p className="text-xs text-gray-400 mt-1">
        {selectedTags.length}/{maxTags} tags
      </p>
    </div>
  );
}

// Simple version for display only (no editing)
export function TagList({ tags = [], onTagClick, interactive = false }) {
  const navigate = useNavigate();

  const handleClick = (tag) => {
    if (onTagClick) {
      onTagClick(tag);
    } else if (interactive) {
      navigate(`/discussions?tag=${tag.id}`);
    }
  };

  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <span
          key={tag.id || tag}
          onClick={() => handleClick(tag)}
          className={`px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs ${
            interactive || onTagClick ? 'cursor-pointer hover:bg-primary-200' : ''
          }`}
        >
          #{typeof tag === 'string' ? tag : tag.name}
        </span>
      ))}
    </div>
  );
}

// Trending tags sidebar component
export function TrendingTagsSidebar({ limit = 10 }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingTags();
  }, []);

  const fetchTrendingTags = async () => {
    try {
      const response = await tagsService.getTrendingTags(limit);
      setTags(response.data || []);
    } catch (error) {
      console.error('Error fetching trending tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tag) => {
    navigate(`/discussions?tag=${tag.id}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔥 Trending Tags</h3>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🔥 Trending Tags</h3>
      {tags.length === 0 ? (
        <p className="text-sm text-gray-500">No tags yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-primary-100 hover:text-primary-700 transition"
            >
              #{tag.name}
              <span className="text-gray-400 text-xs ml-1">({tag.usageCount || 0})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TagSelector;