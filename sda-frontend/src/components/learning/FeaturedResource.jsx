// src/pages/members/learning/FeaturedResource.jsx
import React from 'react';

const FeaturedResource = ({ resource }) => {
  const handleClick = () => {
    window.open(resource.url, '_blank', 'noopener noreferrer');
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border-2 border-primary-200 overflow-hidden"
    >
      <div className="flex p-5 gap-5">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center text-3xl">
            {resource.icon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-gray-800 text-lg font-semibold mb-2">{resource.title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-2.5">{resource.description}</p>
          {resource.author && (
            <div className="text-gray-400 text-xs mb-2">{resource.author}</div>
          )}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
          <div className="text-primary-500 text-sm font-medium">Explore →</div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedResource;