// src/components/discussions/VoteButton.jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Fire Icon Components
const FireIcon = ({ filled = false, className = "w-5 h-5" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? "0" : "2"}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Fire outline path */}
    <path 
      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a6 6 0 0 1-11 0c0-1.1.9-2 2-2h1.5"
      fill={filled ? "currentColor" : "none"}
    />
    {/* Inner flame detail for filled state */}
    {filled && (
      <path 
        d="M12 18c-1.5 0-2-1-2-2s.5-2 2-2 2 1 2 2-.5 2-2 2z"
        fill="currentColor"
        opacity="0.3"
      />
    )}
  </svg>
);

// Alternative simpler fire icon using Heroicons style
const FireIconSimple = ({ filled = false, className = "w-5 h-5" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    className={className}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? "0" : "1.5"}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" 
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" 
    />
  </svg>
);

function VoteButton({ 
  upvotes = 0, 
  userVote = null, 
  onVote, 
  size = 'md',
  orientation = 'vertical',
  showCount = true 
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    
    try {
      // Toggle vote: if already voted (1), remove vote (0), else add vote (1)
      const newValue = userVote === 1 ? 0 : 1;
      await onVote(newValue);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const sizeClasses = {
    sm: {
      container: 'gap-1',
      button: 'w-7 h-7',
      icon: 'w-4 h-4',
      count: 'text-xs',
    },
    md: {
      container: orientation === 'vertical' ? 'flex-col gap-1' : 'flex-row gap-2 items-center',
      button: 'w-9 h-9',
      icon: 'w-5 h-5',
      count: 'text-sm font-semibold',
    },
    lg: {
      container: orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row gap-3 items-center',
      button: 'w-11 h-11',
      icon: 'w-6 h-6',
      count: 'text-base font-bold',
    },
  };

  const hasVoted = userVote === 1;

  return (
    <div className={`flex items-center ${sizeClasses[size].container}`}>
      {/* Fire Vote Button */}
      <button
        onClick={handleVote}
        disabled={isVoting}
        className={`
          flex items-center justify-center rounded-full transition-all duration-200
          ${sizeClasses[size].button}
          ${hasVoted 
            ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg scale-105' 
            : 'bg-gray-100 text-gray-400 hover:bg-orange-50 hover:text-orange-400 hover:scale-105'
          }
          ${isVoting ? 'opacity-50 cursor-not-allowed scale-100' : ''}
        `}
        title={hasVoted ? 'Remove fire' : 'Give fire'}
      >
        {isVoting ? (
          <span className="animate-pulse">•</span>
        ) : (
          <FireIconSimple 
            filled={hasVoted} 
            className={sizeClasses[size].icon}
          />
        )}
      </button>

      {/* Vote Count */}
      {showCount && (
        <span 
          className={`
            ${sizeClasses[size].count}
            ${hasVoted ? 'text-orange-600' : 'text-gray-600'}
            transition-colors duration-200
          `}
        >
          {upvotes.toLocaleString()}
        </span>
      )}
    </div>
  );
}

// Compact version for comments
export function VoteButtonCompact({ upvotes = 0, userVote = null, onVote }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVoting, setIsVoting] = useState(false);

  const handleClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isVoting) return;

    setIsVoting(true);
    try {
      const newValue = userVote === 1 ? 0 : 1;
      await onVote(newValue);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const hasVoted = userVote === 1;

  return (
    <button
      onClick={handleClick}
      disabled={isVoting}
      className={`
        flex items-center gap-1.5 transition-all duration-200
        ${hasVoted 
          ? 'text-orange-500 hover:text-orange-600' 
          : 'text-gray-400 hover:text-orange-400'
        }
        ${isVoting ? 'opacity-50' : ''}
      `}
      title={hasVoted ? 'Remove fire' : 'Give fire'}
    >
      <FireIconSimple 
        filled={hasVoted} 
        className="w-4 h-4"
      />
      <span className="text-sm font-medium">
        {upvotes > 0 ? upvotes.toLocaleString() : 'Fire'}
      </span>
    </button>
  );
}

// Score display with fire count (for future use if downvotes are added)
export function ScoreDisplay({ score = 0, upvotes = 0, downvotes = 0 }) {
  const percent = upvotes + downvotes > 0 
    ? Math.round((upvotes / (upvotes + downvotes)) * 100) 
    : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        <FireIconSimple filled={true} className="w-5 h-5 text-orange-500" />
        <span className="text-lg font-bold text-gray-800">
          {score > 0 ? '+' : ''}{score}
        </span>
      </div>
      {upvotes + downvotes > 0 && (
        <span className="text-xs text-gray-500">
          {percent}% fired up
        </span>
      )}
    </div>
  );
}

export default VoteButton;