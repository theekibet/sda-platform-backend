// src/pages/members/learning/ResourceCard.jsx
import React from 'react';

const ResourceCard = ({ resource }) => {
  const getTypeIcon = (type) => {
    switch(type) {
      case 'website': return '🌐';
      case 'article': return '📄';
      case 'downloads': return '📥';
      case 'store': return '🛒';
      case 'program': return '📋';
      case 'seminars': return '🎓';
      case 'videos': return '📹';
      case 'app': return '📱';
      case 'paper': return '📑';
      default: return '🔗';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'website': return '#4299e1';
      case 'article': return '#48bb78';
      case 'downloads': return '#ed8936';
      case 'store': return '#9f7aea';
      case 'program': return '#f56565';
      case 'seminars': return '#38b2ac';
      case 'videos': return '#d53f8c';
      case 'app': return '#805ad5';
      case 'paper': return '#718096';
      default: return '#667eea';
    }
  };

  const handleClick = () => {
    window.open(resource.url, '_blank', 'noopener noreferrer');
  };

  const typeColor = getTypeColor(resource.type);
  const badgeStyle = {
    backgroundColor: `${typeColor}20`,
    color: typeColor,
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Card Header */}
      <div className="flex justify-between items-center mb-4 p-5 pb-0">
        <div>
          <span
            className="inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize"
            style={badgeStyle}
          >
            {getTypeIcon(resource.type)} {resource.type}
          </span>
        </div>
        <div className="text-3xl">{resource.icon}</div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5">
        <h3 className="text-gray-800 text-lg font-semibold leading-tight mb-2.5">
          {resource.title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-4">
          {resource.description}
        </p>

        {/* Author */}
        {resource.author && (
          <div className="text-sm mb-2.5">
            <span className="text-gray-400 mr-1">By:</span>
            <span className="text-primary-500 font-medium">{resource.author}</span>
          </div>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 px-5 pb-5">
        <span className="text-primary-500 text-sm font-medium">Visit Resource →</span>
      </div>
    </div>
  );
};

export default ResourceCard;