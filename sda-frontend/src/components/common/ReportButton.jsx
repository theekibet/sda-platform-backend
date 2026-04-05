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
          className={`${size === 'small' ? 'p-1' : 'p-2'} rounded transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50 ${className}`}
          title={`Report this ${getContentTypeLabel()}`}
        >
          🚩
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
          inline-flex items-center gap-1
          border border-gray-300 rounded
          transition-colors
          ${size === 'small' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
          text-gray-600 hover:border-red-500 hover:bg-red-50 hover:text-red-500
          ${className}
        `}
      >
        <span>🚩</span>
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