import React, { useState } from 'react';
import { useReports } from '../../hooks/useReports';
import { REPORT_CATEGORIES } from '../../constants/constants';
import { reportCommunityPost } from '../../services/api';

// Heroicons SVG Components
const Icons = {
  X: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Flag: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M3 21h18M5 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M9 10V7a3 3 0 013-3h4a3 3 0 013 3v3" />
    </svg>
  ),
  ShieldExclamation: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  ChatAlt: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  UserRemove: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
    </svg>
  ),
  Ban: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  InformationCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ExclamationTriangle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  EyeOff: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
  DocumentSearch: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
    </svg>
  )
};

// Map category values to icons
const categoryIcons = {
  spam: Icons.Ban,
  harassment: Icons.UserRemove,
  inappropriate: Icons.EyeOff,
  misinformation: Icons.InformationCircle,
  other: Icons.ChatAlt,
  // Add more mappings as needed based on your REPORT_CATEGORIES
};

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
      <div 
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-white/95 rounded-3xl max-w-md w-full p-8 shadow-2xl ring-1 ring-white/50 animate-in zoom-in-95 duration-200 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
            <Icons.CheckCircle />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You for Reporting</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your report has been submitted successfully. Our moderation team will review it as soon as possible.
          </p>
          
          <button 
            className="w-full px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-all duration-200 hover:shadow-md"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Report form
  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white/95 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl ring-1 ring-white/50 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 text-red-600">
              <Icons.Flag />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Report {getContentTypeLabel()}</h2>
              <p className="text-xs text-gray-500">Help keep our community safe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            aria-label="Close report modal"
          >
            <Icons.X />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Reason for reporting <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_CATEGORIES.map((cat) => {
                  const CategoryIcon = categoryIcons[cat.value] || Icons.ShieldExclamation;
                  const isSelected = formData.category === cat.value;
                  
                  return (
                    <label
                      key={cat.value}
                      className={`
                        group flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                        ${isSelected
                          ? 'border-red-500 bg-red-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.value}
                        checked={isSelected}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'} transition-colors`}>
                        <CategoryIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`block font-semibold ${isSelected ? 'text-red-900' : 'text-gray-800'}`}>
                          {cat.label}
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {cat.description}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Icons.ChatAlt />
                Additional details <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Please provide any additional context that might help our review..."
                rows="4"
                className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all duration-200"
              />
              <p className="text-xs text-gray-400">
                {formData.description.length} characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-in slide-in-from-top-2">
                <div className="flex-shrink-0 mt-0.5">
                  <Icons.ExclamationTriangle />
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Info Note */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex-shrink-0 text-blue-600">
                <Icons.InformationCircle />
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                Your report will be anonymous. The content you're reporting will remain visible until reviewed.
                {isCommunityPost() && ' Community posts with multiple reports will be automatically flagged for review.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2"
              >
                {loading || isSubmitting ? (
                  <>
                    <Icons.Spinner />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Icons.Flag />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        .animate-in {
          animation-duration: 0.2s;
          animation-fill-mode: both;
        }
        .fade-in { animation-name: fadeIn; }
        .zoom-in-95 { animation-name: zoomIn95; }
        .slide-in-from-top-2 { animation-name: slideInFromTop2; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn95 {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInFromTop2 {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ReportModal;