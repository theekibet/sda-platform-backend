// src/components/discussions/VoteButton.jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
      button: 'w-6 h-6 text-xs',
      count: 'text-xs',
    },
    md: {
      container: orientation === 'vertical' ? 'flex-col gap-1' : 'flex-row gap-2 items-center',
      button: 'w-8 h-8 text-sm',
      count: 'text-sm font-semibold',
    },
    lg: {
      container: orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row gap-3 items-center',
      button: 'w-10 h-10 text-base',
      count: 'text-base font-bold',
    },
  };

  const hasVoted = userVote === 1;

  return (
    <div className={`flex items-center ${sizeClasses[size].container}`}>
      {/* Upvote Button */}
      <button
        onClick={handleVote}
        disabled={isVoting}
        className={`
          flex items-center justify-center rounded-md transition-all
          ${sizeClasses[size].button}
          ${hasVoted 
            ? 'bg-primary-500 text-white hover:bg-primary-600' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
          }
          ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={hasVoted ? 'Remove upvote' : 'Upvote'}
      >
        {isVoting ? (
          <span className="animate-pulse">•</span>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-4 h-4"
          >
            <path 
              fillRule="evenodd" 
              d="M11.47 2.47a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06l-6.22-6.22V21a.75.75 0 01-1.5 0V4.81l-6.22 6.22a.75.75 0 11-1.06-1.06l7.5-7.5z" 
              clipRule="evenodd" 
            />
          </svg>
        )}
      </button>

      {/* Vote Count */}
      {showCount && (
        <span 
          className={`
            ${sizeClasses[size].count}
            ${hasVoted ? 'text-primary-600' : 'text-gray-600'}
          `}
        >
          {upvotes.toLocaleString()}
        </span>
      )}
    </div>
  );
}

// Compact version for comments
export function VoteButtonCompact({ upvotes = 0, onUpvote }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    onUpvote();
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 text-gray-500 hover:text-primary-500 transition text-sm"
      title="Upvote"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 20 20" 
        fill="currentColor" 
        className="w-4 h-4"
      >
        <path 
          fillRule="evenodd" 
          d="M9.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06L10.5 4.31V16.5a.75.75 0 01-1.5 0V4.31L6.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5z" 
          clipRule="evenodd" 
        />
      </svg>
      <span>{upvotes || 0}</span>
    </button>
  );
}

// Score display with up/down (for future use if downvotes are added)
export function ScoreDisplay({ score = 0, upvotes = 0, downvotes = 0 }) {
  const percent = upvotes + downvotes > 0 
    ? Math.round((upvotes / (upvotes + downvotes)) * 100) 
    : 0;

  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold text-gray-800">
        {score > 0 ? '+' : ''}{score}
      </span>
      {upvotes + downvotes > 0 && (
        <span className="text-xs text-gray-500">
          {percent}% liked
        </span>
      )}
    </div>
  );
}

export default VoteButton;