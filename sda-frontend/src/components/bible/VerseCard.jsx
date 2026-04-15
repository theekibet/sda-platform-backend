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
    <div className={`relative glass-card p-6 ${className}`}>
      {showShare && onShare && (
        <button
          onClick={onShare}
          className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-full text-sm font-medium shadow-sm hover:bg-primary-700 transition-all hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      )}

      {/* Reference */}
      <div className="text-xl font-bold text-primary-600 mb-3 tracking-tight flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        {reference}
      </div>

      {/* Verse Text */}
      <div className="text-lg leading-relaxed text-gray-700 mb-3 italic whitespace-pre-wrap break-words font-serif">
        "{text.trim()}"
      </div>

      {/* Translation */}
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {translation}
      </div>
      
      {/* Shared By */}
      {showSharedBy && sharedBy && (
        <div className="pt-4 mt-3 border-t border-gray-100">
          <div className="flex items-center justify-end gap-2 text-gray-500">
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm text-gray-500">
              Shared by: <span className="text-primary-600 font-medium">{sharedBy}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerseCard;