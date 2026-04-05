// src/components/bible/VerseCard.jsx
import React from 'react';

const VerseCard = ({ 
  verse, 
  showShare = false, 
  showSharedBy = true,
  onShare, 
  className = '' 
}) => {
  if (!verse) return null;

  const verseData = verse.verse || verse;
  
  const reference = verseData?.reference || 
    (verseData?.book && verseData?.chapter && verseData?.verse 
      ? `${verseData.book} ${verseData.chapter}:${verseData.verse}` 
      : 'Unknown Reference');
  
  const text = verseData?.text || '';
  const translation = verseData?.translation || 'KJV';
  const sharedBy = verse?.user?.name;

  if (!text) return null;

  return (
    <div className={`relative bg-white rounded-xl p-6 ${className}`}>
      {showShare && onShare && (
        <button
          onClick={onShare}
          className="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm hover:bg-primary-600 transition"
        >
          📤 Share
        </button>
      )}

      <div className="text-xl font-bold text-primary-500 mb-3 tracking-tight">{reference}</div>
      <div className="text-lg leading-relaxed text-gray-800 mb-3 italic whitespace-pre-wrap break-words font-serif">"{text.trim()}"</div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{translation}</div>
      
      {showSharedBy && sharedBy && (
        <div className="pt-4 mt-3 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <span className="text-sm">🌹</span>
            <span className="text-sm">
              Shared by: <span className="text-primary-500 font-bold text-base font-['Satisfy']">{sharedBy}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Ensure Satisfy font is loaded
if (typeof document !== 'undefined') {
  const link = document.querySelector('link[href*="Satisfy"]');
  if (!link) {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Satisfy&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  }
}

export default VerseCard;