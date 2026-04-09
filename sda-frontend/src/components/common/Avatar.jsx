// src/components/common/Avatar.jsx
import React from 'react';

const Avatar = ({ user, size = 'medium', className = '' }) => {
  // Map size to Tailwind width/height classes and corresponding text size
  const sizeConfig = {
    small: { box: 'w-8 h-8', text: 'text-xs' },
    medium: { box: 'w-12 h-12', text: 'text-sm' },
    large: { box: 'w-16 h-16', text: 'text-base' },
    xlarge: { box: 'w-24 h-24', text: 'text-lg' },
  };
  const { box: sizeClass, text: textSizeClass } = sizeConfig[size] || sizeConfig.medium;

  // Get the API base URL from environment or default
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fallback to initials
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (user?.avatarUrl) {
    // Construct the full URL - add base URL if it's a relative path
    const imageUrl = user.avatarUrl.startsWith('http')
      ? user.avatarUrl
      : `${API_BASE_URL}${user.avatarUrl}`;

    return (
      <div className={`rounded-full overflow-hidden flex items-center justify-center bg-transparent ${sizeClass} ${className}`}>
        <img
          src={imageUrl}
          alt={user.name || 'User'}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Failed to load image:', imageUrl);
            // Fallback to initials on error
            e.target.style.display = 'none';
            e.target.parentElement.classList.remove('bg-transparent');
            e.target.parentElement.classList.add('bg-primary-500');
            // Add the text size class and set inner text
            e.target.parentElement.classList.add(textSizeClass);
            e.target.parentElement.innerText = initials || '?';
          }}
        />
      </div>
    );
  }

  // No image, show initials
  return (
    <div
      className={`rounded-full flex items-center justify-center bg-primary-500 text-white font-bold ${sizeClass} ${textSizeClass} ${className}`}
    >
      {initials || '?'}
    </div>
  );
};

export default Avatar;