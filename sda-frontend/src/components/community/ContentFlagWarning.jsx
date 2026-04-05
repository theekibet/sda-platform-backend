import React, { useState } from 'react';

const ContentFlagWarning = ({ content, onDismiss, onEdit, onReport }) => {
  const [expanded, setExpanded] = useState(false);

  if (!content.isFlagged && !content.warning) return null;

  const flagLevel = content.flagLevel || 'medium';
  const flagColors = {
    low: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    medium: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    high: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  };
  const colors = flagColors[flagLevel];

  const getFlagMessage = () => {
    switch (flagLevel) {
      case 'low':
        return 'This content has been flagged for review. It may contain potential issues.';
      case 'medium':
        return '⚠️ This content has been flagged and is under review. Proceed with caution.';
      case 'high':
        return '🚨 This content has been flagged for serious violations. It may be removed soon.';
      default:
        return 'This content has been flagged for review.';
    }
  };

  return (
    <div
      className="p-3 border-l-4 rounded-lg mb-3"
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <span className="text-lg">
          {flagLevel === 'high' ? '🚨' : flagLevel === 'medium' ? '⚠️' : '📌'}
        </span>
        <span className="flex-1 text-sm font-medium" style={{ color: colors.text }}>
          {content.warning || getFlagMessage()}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="bg-transparent border-none cursor-pointer text-xs text-gray-500 hover:text-gray-700"
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-3">
            This content was flagged by the community moderation system. 
            If you believe this is a mistake, you can report it for review.
          </p>

          <div className="flex gap-2.5 mb-2.5">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 bg-primary-500 text-white rounded text-xs font-medium hover:bg-primary-600 transition"
            >
              ✏️ Edit My Content
            </button>
            <button
              onClick={onReport}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition"
            >
              🚩 Report for Review
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 bg-gray-400 text-white rounded text-xs font-medium hover:bg-gray-500 transition"
            >
              Dismiss
            </button>
          </div>

          <div className="text-xs text-gray-400 italic">
            <small>Note: Multiple flags may result in content removal or account restrictions.</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentFlagWarning;