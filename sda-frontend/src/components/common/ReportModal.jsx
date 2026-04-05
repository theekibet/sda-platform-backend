import React, { useState } from 'react';
import { useReports } from '../../hooks/useReports';
import { REPORT_CATEGORIES } from '../../constants/constants';
import { reportCommunityPost } from '../../services/api';

const ReportModal = ({
  contentType,
  contentId,
  authorId,
  onClose,
  onSubmit,
}) => {
  const { submitReport, loading } = useReports();
  const [formData, setFormData] = useState({
    category: '',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCommunityPost = () => {
    const communityTypes = ['communityPost', 'event', 'donation', 'support', 'announcement', 'general'];
    return communityTypes.includes(contentType);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleCommunityReportSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      setError('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await reportCommunityPost(contentId, {
        reason: formData.category,
        description: formData.description.trim() || undefined,
      });

      if (response.data.success) {
        setSubmitted(true);
        if (onSubmit) onSubmit({ success: true, data: response.data });
      } else {
        setError(response.data.message || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Error submitting community report:', err);
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegularReportSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      setError('Please select a reason for reporting');
      return;
    }

    const result = await submitReport({
      contentType,
      contentId,
      category: formData.category,
      description: formData.description.trim() || undefined,
    });

    if (result.success) {
      setSubmitted(true);
      if (onSubmit) onSubmit(result);
    } else {
      setError(result.error);
    }
  };

  const handleSubmit = isCommunityPost() ? handleCommunityReportSubmit : handleRegularReportSubmit;

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'prayerRequest': return 'prayer request';
      case 'testimony': return 'testimony';
      case 'groupDiscussion': return 'discussion';
      case 'user': return 'user';
      case 'communityPost': return 'community post';
      case 'event': return 'event';
      case 'donation': return 'donation post';
      case 'support': return 'support request';
      case 'announcement': return 'announcement';
      case 'general': return 'post';
      default: return 'content';
    }
  };

  // Success view
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-5" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-auto relative p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl" onClick={onClose}>
            ✕
          </button>
          <div className="text-center py-5">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-semibold text-green-600 mb-2">Thank You for Reporting</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Your report has been submitted successfully. Our moderation team will review it as soon as possible.
            </p>
            <button className="px-6 py-2 bg-green-500 text-white rounded-md font-medium hover:bg-green-600 transition" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Report form
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-5" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-auto relative p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl" onClick={onClose}>
          ✕
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Report {getContentTypeLabel()}</h2>
          <p className="text-gray-500 text-sm">
            Help us keep the community safe. Your report will be reviewed by our moderation team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for reporting <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${formData.category === cat.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={formData.category === cat.value}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex-1">
                    <strong className="block text-gray-800">{cat.label}</strong>
                    <span className="text-xs text-gray-500">{cat.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Additional details (optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please provide any additional context that might help our review..."
              rows="4"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none resize-y"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md font-medium hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="px-4 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading || isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center italic">
            Note: Your report will be anonymous. The content you're reporting will remain visible until reviewed.
            {isCommunityPost() && ' Community posts with multiple reports will be automatically flagged for review.'}
          </p>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;