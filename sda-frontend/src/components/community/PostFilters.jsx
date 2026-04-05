import React, { useState } from 'react';

const PostFilters = ({ filters, onFilterChange, onClearFilters, viewMode, onViewModeChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const postTypes = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'event', label: 'Events', icon: '📅' },
    { value: 'support', label: 'Support', icon: '🙏' },
    { value: 'donation', label: 'Donations', icon: '🎁' },
    { value: 'announcement', label: 'Announcements', icon: '📢' },
    { value: 'general', label: 'General', icon: '💬' },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: '🕒' },
    { value: 'oldest', label: 'Oldest First', icon: '📅' },
    { value: 'popular', label: 'Most Popular', icon: '🔥' },
    { value: 'nearest', label: 'Nearest First', icon: '📍' },
  ];

  const radiusOptions = [5, 10, 25, 50, 100];

  return (
    <div className="mb-5">
      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
        {['all', 'nearby', 'myPosts'].map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
              viewMode === mode
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mode === 'all' && '🌍 All Posts'}
            {mode === 'nearby' && '📍 Near Me'}
            {mode === 'myPosts' && '👤 My Posts'}
          </button>
        ))}
      </div>

      {/* Basic Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => onFilterChange('type', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {postTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>

        {/* Sort By */}
        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </option>
          ))}
        </select>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search posts..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-gray-200 transition"
        >
          {showAdvanced ? '▼ Less Filters' : '▶ More Filters'}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-4 items-end p-4 bg-gray-50 rounded-lg mb-4">
          {/* Radius Filter (only for nearby mode) */}
          {viewMode === 'nearby' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Radius (km):</label>
              <select
                value={filters.radius}
                onChange={(e) => onFilterChange('radius', parseInt(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
              >
                {radiusOptions.map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">From Date:</label>
            <input
              type="date"
              value={filters.dateRange.start || ''}
              onChange={(e) =>
                onFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })
              }
              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">To Date:</label>
            <input
              type="date"
              value={filters.dateRange.end || ''}
              onChange={(e) =>
                onFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })
              }
              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={onClearFilters}
            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100 transition ml-auto"
          >
            🗑️ Clear All Filters
          </button>
        </div>
      )}

      {/* Active Filters Display */}
      {(filters.type !== 'all' || filters.search || viewMode === 'nearby') && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-indigo-50 rounded-lg">
          <span className="text-xs text-gray-500">Active filters:</span>
          {filters.type !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
              {postTypes.find((t) => t.value === filters.type)?.icon} {filters.type}
              <button
                onClick={() => onFilterChange('type', 'all')}
                className="ml-1 text-indigo-500 hover:text-indigo-700"
              >
                ✕
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
              🔍 "{filters.search}"
              <button
                onClick={() => onFilterChange('search', '')}
                className="ml-1 text-indigo-500 hover:text-indigo-700"
              >
                ✕
              </button>
            </span>
          )}
          {viewMode === 'nearby' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
              📍 Within {filters.radius}km
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PostFilters;