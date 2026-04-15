// src/components/common/ReportButton.jsx
import React, { useState } from 'react';
import ReportModal from './ReportModal';
import { CONTENT_TYPES } from '../../constants/constants';

const ReportButton = ({
  contentType,
  contentId,
  authorId,
  size = 'small',
  variant = 'icon',
  onReportSubmitted,
  className = '',
}) => {
  const [showModal, setShowModal] = useState(false);

  if (!contentId) return null;

  const handleOpenModal = (e) => {
    e?.stopPropagation();
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleReportSubmitted = (result) => {
    setShowModal(false);
    if (onReportSubmitted) onReportSubmitted(result);
  };

  const getContentTypeLabel = () => {
    switch (contentType) {
      case CONTENT_TYPES.FORUM_POST: return 'post';
      case CONTENT_TYPES.FORUM_REPLY: return 'reply';
      case CONTENT_TYPES.PRAYER_REQUEST: return 'prayer request';
      case CONTENT_TYPES.TESTIMONY: return 'testimony';
      case CONTENT_TYPES.GROUP_DISCUSSION: return 'discussion';
      case CONTENT_TYPES.USER: return 'user';
      case 'communityPost': return 'community post';
      case 'event': return 'event';
      case 'donation': return 'donation post';
      case 'support': return 'support request';
      case 'announcement': return 'announcement';
      case 'general': return 'post';
      default: return 'content';
    }
  };

  // Icon button variant (default)
  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleOpenModal}
          className={`${size === 'small' ? 'p-1.5' : 'p-2'} rounded-lg transition-all duration-200 text-gray-400 hover:text-red-500 hover:bg-red-50 ${className}`}
          title={`Report this ${getContentTypeLabel()}`}
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" 
            />
          </svg>
        </button>

        {showModal && (
          <ReportModal
            contentType={contentType}
            contentId={contentId}
            authorId={authorId}
            onClose={handleCloseModal}
            onSubmit={handleReportSubmitted}
          />
        )}
      </>
    );
  }

  // Text button variant
  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`
          inline-flex items-center gap-1.5
          border border-gray-300 rounded-full
          transition-all duration-200
          ${size === 'small' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
          text-gray-600 hover:border-red-500 hover:bg-red-50 hover:text-red-500
          ${className}
        `}
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" 
          />
        </svg>
        {size !== 'small' && <span>Report</span>}
      </button>

      {showModal && (
        <ReportModal
          contentType={contentType}
          contentId={contentId}
          authorId={authorId}
          onClose={handleCloseModal}
          onSubmit={handleReportSubmitted}
        />
      )}
    </>
  );
};

export default ReportButton;