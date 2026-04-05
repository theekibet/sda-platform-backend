// src/components/common/Avatar.jsx
import React from 'react';

const Avatar = ({ user, size = 'medium', className = '' }) => {
  // Map size to Tailwind width/height classes
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24',
  };
  const sizeClass = sizeClasses[size] || sizeClasses.medium;

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
            e.target.parentElement.innerText = initials || '?';
          }}
        />
      </div>
    );
  }

  // No image, show initials
  return (
    <div
      className={`rounded-full flex items-center justify-center bg-primary-500 text-white font-bold ${sizeClass} ${className}`}
      style={{ fontSize: `calc(${parseInt(sizeClass.match(/w-(\d+)/)?.[1] || 12)}px * 0.4)` }}
    >
      {initials || '?'}
    </div>
  );
};

export default Avatar;