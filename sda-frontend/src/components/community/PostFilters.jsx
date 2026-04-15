import React, { useState } from 'react';

// Heroicons SVG Components
const Icons = {
  Globe: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Location: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  User: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Clipboard: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Heart: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Gift: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  Speaker: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  Chat: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Fire: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  X: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Filter: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  )
};

const PostFilters = ({ filters, onFilterChange, onClearFilters, viewMode, onViewModeChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const postTypes = [
    { value: 'all', label: 'All', icon: Icons.Clipboard },
    { value: 'event', label: 'Events', icon: Icons.Calendar },
    { value: 'support', label: 'Support', icon: Icons.Heart },
    { value: 'donation', label: 'Donations', icon: Icons.Gift },
    { value: 'announcement', label: 'Announcements', icon: Icons.Speaker },
    { value: 'general', label: 'General', icon: Icons.Chat },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: Icons.Clock },
    { value: 'oldest', label: 'Oldest First', icon: Icons.Calendar },
    { value: 'popular', label: 'Most Popular', icon: Icons.Fire },
    { value: 'nearest', label: 'Nearest First', icon: Icons.Location },
  ];

  const radiusOptions = [5, 10, 25, 50, 100];

  const viewModeConfig = {
    all: { label: 'All Posts', icon: Icons.Globe },
    nearby: { label: 'Near Me', icon: Icons.Location },
    myPosts: { label: 'My Posts', icon: Icons.User },
  };

  return (
    <div className="mb-5">
      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
        {['all', 'nearby', 'myPosts'].map((mode) => {
          const ModeIcon = viewModeConfig[mode].icon;
          const isActive = viewMode === mode;
          
          return (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2
                ${isActive
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-transparent text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <ModeIcon />
              {viewModeConfig[mode].label}
            </button>
          );
        })}
      </div>

      {/* Basic Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Type Filter */}
        <div className="relative">
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
          >
            {postTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {React.createElement(postTypes.find(t => t.value === filters.type)?.icon || Icons.Clipboard)}
          </div>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icons.ChevronDown />
          </div>
        </div>

        {/* Sort By */}
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {React.createElement(sortOptions.find(s => s.value === filters.sortBy)?.icon || Icons.Clock)}
          </div>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icons.ChevronDown />
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="Search posts..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icons.Search />
          </div>
        </div>

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
        >
          <Icons.Filter />
          {showAdvanced ? 'Less Filters' : 'More Filters'}
          <span className={`transform transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>
            <Icons.ChevronDown />
          </span>
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-4 items-end p-4 bg-gray-50 rounded-xl mb-4 border border-gray-100 animate-in slide-in-from-top-2">
          {/* Radius Filter (only for nearby mode) */}
          {viewMode === 'nearby' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <Icons.Location />
                Radius (km):
              </label>
              <select
                value={filters.radius}
                onChange={(e) => onFilterChange('radius', parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">From Date:</label>
            <input
              type="date"
              value={filters.dateRange.start || ''}
              onChange={(e) =>
                onFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">To Date:</label>
            <input
              type="date"
              value={filters.dateRange.end || ''}
              onChange={(e) =>
                onFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-all duration-200 flex items-center gap-2 ml-auto"
          >
            <Icons.Trash />
            Clear All Filters
          </button>
        </div>
      )}

      {/* Active Filters Display */}
      {(filters.type !== 'all' || filters.search || viewMode === 'nearby') && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-primary-50 rounded-xl border border-primary-100">
          <span className="text-xs font-semibold text-gray-500">Active filters:</span>
          {filters.type !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-primary-700 rounded-full text-xs font-medium shadow-sm border border-primary-200">
              {React.createElement(postTypes.find((t) => t.value === filters.type)?.icon, { className: "w-3 h-3" })}
              {filters.type}
              <button
                onClick={() => onFilterChange('type', 'all')}
                className="ml-1 p-0.5 rounded-full hover:bg-primary-100 text-primary-500 hover:text-primary-700 transition-colors"
              >
                <Icons.X />
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-primary-700 rounded-full text-xs font-medium shadow-sm border border-primary-200">
              <Icons.Search />
              "{filters.search}"
              <button
                onClick={() => onFilterChange('search', '')}
                className="ml-1 p-0.5 rounded-full hover:bg-primary-100 text-primary-500 hover:text-primary-700 transition-colors"
              >
                <Icons.X />
              </button>
            </span>
          )}
          {viewMode === 'nearby' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-primary-700 rounded-full text-xs font-medium shadow-sm border border-primary-200">
              <Icons.Location />
              Within {filters.radius}km
            </span>
          )}
        </div>
      )}

      {/* Animation Styles */}
      <style jsx>{`
        .animate-in {
          animation-duration: 0.2s;
          animation-fill-mode: both;
        }
        .slide-in-from-top-2 { animation-name: slideInFromTop2; }
        @keyframes slideInFromTop2 {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PostFilters;