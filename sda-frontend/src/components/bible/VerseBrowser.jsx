// src/components/bible/VerseBrowser.jsx
import React, { useState } from 'react';
import { bibleService } from '../../services/bibleService';
import VerseCard from './VerseCard';

const VerseBrowser = ({ onSelectVerse }) => {
  const [reference, setReference] = useState('');
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [translations, setTranslations] = useState([]);
  const [selectedTranslation, setSelectedTranslation] = useState('kjv');

  useState(() => {
    bibleService.getTranslations().then(res => {
      setTranslations(res.data.data || []);
    });
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setLoading(true);
    setError('');
    setVerse(null);

    try {
      const response = await bibleService.getVerse(reference, selectedTranslation);
      setVerse(response.data.data);
    } catch (err) {
      setError('Verse not found. Please check the reference.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-5">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📖 Browse Bible Verses</h2>

      <form onSubmit={handleSearch} className="mb-5">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g., John 3:16"
            className="flex-1 min-w-[200px] p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          
          <select
            value={selectedTranslation}
            onChange={(e) => setSelectedTranslation(e.target.value)}
            className="flex-1 min-w-[150px] p-2.5 border border-gray-300 rounded-lg bg-white"
          >
            {translations.map(t => (
              <option key={t.code} value={t.code}>{t.name}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg mb-4">{error}</div>}

      {verse && (
        <div className="mt-5">
          <VerseCard verse={verse} />
          {onSelectVerse && (
            <button
              onClick={() => onSelectVerse(verse)}
              className="w-full mt-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
            >
              Select This Verse
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VerseBrowser;