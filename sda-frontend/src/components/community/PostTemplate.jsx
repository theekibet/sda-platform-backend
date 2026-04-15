// src/components/community/PostTemplate.jsx
import React, { useState } from 'react';

// Heroicons matching CreatePostModal style
const Icons = {
  X: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Gift: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  Speaker: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  Heart: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Lightbulb: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
};

const PostTemplate = ({ onSelectTemplate, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  const templates = [
    {
      id: 'event',
      name: 'Event Template',
      description: 'Promote an upcoming event or meeting with date and location',
      fields: {
        title: 'Youth Gathering - [Date]',
        description: 'Join us for an evening of fellowship and worship...',
        type: 'event',
        location: 'Church Hall',
      },
      icon: Icons.Calendar,
      color: 'blue',
    },
    {
      id: 'donation',
      name: 'Donation Drive',
      description: 'Raise funds for a cause with goal tracking',
      fields: {
        title: 'Donation Drive: [Purpose]',
        description: 'We are raising funds for...',
        type: 'donation',
        goalAmount: 0,
        itemsNeeded: '',
      },
      icon: Icons.Gift,
      color: 'emerald',
    },
    {
      id: 'announcement',
      name: 'Announcement',
      description: 'Make an important announcement to the community',
      fields: {
        title: 'Important Announcement: [Title]',
        description: 'Please be advised that...',
        type: 'announcement',
      },
      icon: Icons.Speaker,
      color: 'amber',
    },
    {
      id: 'support',
      name: 'Support Needed',
      description: 'Request prayer, emotional support, or practical help',
      fields: {
        title: 'Support Needed: [Type of Support]',
        description: 'I need assistance with...',
        type: 'support',
        itemsNeeded: '',
      },
      icon: Icons.Heart,
      color: 'rose',
    },
  ];

  const handleSelect = (template) => {
    setSelectedTemplate(template.id);
  };

  const handleUse = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      onSelectTemplate(template.fields);
    }
  };

  const handleKeyDown = (e, template) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(template);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white/95 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl ring-1 ring-white/50 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100 text-primary-600">
              <Icons.Lightbulb />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Post Templates</h3>
              <p className="text-xs text-gray-500">Choose a starting point</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            aria-label="Close templates"
          >
            <Icons.X />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
          <div className="space-y-3 mb-6">
            {templates.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate === template.id;
              const isHovered = hoveredTemplate === template.id;
              
              return (
                <div
                  key={template.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(template)}
                  onKeyDown={(e) => handleKeyDown(e, template)}
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  className={`
                    group relative flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer
                    transition-all duration-200 ease-out
                    ${isSelected 
                      ? `border-${template.color}-500 bg-${template.color}-50 shadow-md` 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                    }
                    ${isHovered && !isSelected ? 'scale-[1.02]' : 'scale-100'}
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  `}
                >
                  {/* Icon Container */}
                  <div className={`
                    flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                    transition-colors duration-200
                    ${isSelected 
                      ? `bg-${template.color}-100 text-${template.color}-600` 
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                    }
                  `}>
                    <Icon />
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`
                      font-semibold text-sm mb-1 transition-colors duration-200
                      ${isSelected ? `text-${template.color}-900` : 'text-gray-900'}
                    `}>
                      {template.name}
                    </h4>
                    <p className={`
                      text-xs leading-relaxed transition-colors duration-200
                      ${isSelected ? `text-${template.color}-700` : 'text-gray-500'}
                    `}>
                      {template.description}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  <div className={`
                    flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                    transition-all duration-200
                    ${isSelected 
                      ? `bg-${template.color}-500 border-${template.color}-500 text-white scale-110` 
                      : 'border-gray-300 group-hover:border-gray-400'
                    }
                  `}>
                    {isSelected && <Icons.Check />}
                  </div>

                  {/* Hover Glow Effect */}
                  {isHovered && !isSelected && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50 pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4">
            <div className="flex-shrink-0 mt-0.5 text-blue-600">
              <Icons.Lightbulb />
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              Templates help you get started quickly. You can edit all fields after selection to customize your post.
            </p>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={handleUse}
              disabled={!selectedTemplate}
              className={`
                flex-1 px-6 py-2.5 rounded-full font-medium transition-all duration-200
                flex items-center justify-center gap-2
                ${selectedTemplate 
                  ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {selectedTemplate ? (
                <>
                  <span>Use Template</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </>
              ) : (
                'Select a template'
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
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
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn95 {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PostTemplate;