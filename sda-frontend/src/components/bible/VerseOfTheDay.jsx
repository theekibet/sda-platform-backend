// src/components/bible/VerseOfTheDay.jsx
import React, { useEffect } from 'react';
import { useBible } from '../../hooks/useBible';
import InteractiveVerseCard from './InteractiveVerseCard';

const VerseOfTheDay = ({ className = '' }) => {
  const { todaysVerse, loading, error, fetchTodaysVerse } = useBible();

  useEffect(() => {
    fetchTodaysVerse();
  }, []);

  if (loading) {
    return (
      <div className={`text-center ${className}`}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">✨ Verse of the Day</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-500">Loading today's verse...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center ${className}`}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">✨ Verse of the Day</h2>
        <div className="p-6 bg-red-50 rounded-lg">
          <p className="text-red-600 mb-3">Unable to load today's verse. Please try again later.</p>
          <button
            onClick={fetchTodaysVerse}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!todaysVerse) return null;

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">✨ Verse of the Day</h2>
      <InteractiveVerseCard
        verse={todaysVerse}
        showReadButton={true}
        showSharedBy={true}
      />
      {todaysVerse.isRandom && (
        <p className="text-center text-gray-400 text-sm mt-4 italic p-3 bg-gray-50 rounded-lg">
          💡 No scheduled verse today. Enjoy this random verse from Scripture!
        </p>
      )}
    </div>
  );
};

export default VerseOfTheDay;