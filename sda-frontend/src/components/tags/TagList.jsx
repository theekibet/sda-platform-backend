// src/components/tags/TagList.jsx
import { useNavigate } from 'react-router-dom';

function TagList({ tags = [], onTagClick, interactive = false, size = 'md' }) {
  const navigate = useNavigate();

  const handleClick = (tag) => {
    if (onTagClick) {
      onTagClick(tag);
    } else if (interactive) {
      const tagId = typeof tag === 'string' ? tag : tag.id;
      navigate(`/discussions?tag=${tagId}`);
    }
  };

  if (!tags || tags.length === 0) return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        const tagId = typeof tag === 'string' ? tag : tag.id;
        const usageCount = typeof tag === 'string' ? null : tag.usageCount;

        return (
          <span
            key={tagId || `${tagName}-${index}`}
            onClick={() => handleClick(tag)}
            className={`
              inline-flex items-center gap-1 rounded-full font-medium
              bg-primary-100 text-primary-700
              ${sizeClasses[size]}
              ${interactive || onTagClick 
                ? 'cursor-pointer hover:bg-primary-200 transition' 
                : ''
              }
            `}
          >
            #{tagName}
            {usageCount !== null && usageCount !== undefined && (
              <span className="text-primary-500 text-xs">({usageCount})</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// Compact inline version for small spaces
export function TagListInline({ tags = [], maxDisplay = 3 }) {
  if (!tags || tags.length === 0) return null;

  const displayTags = tags.slice(0, maxDisplay);
  const remaining = tags.length - maxDisplay;

  return (
    <div className="flex items-center gap-1 text-sm">
      {displayTags.map((tag, index) => (
        <span key={typeof tag === 'string' ? tag : tag.id || index} className="text-primary-600">
          #{typeof tag === 'string' ? tag : tag.name}
          {index < displayTags.length - 1 && <span className="text-gray-400">, </span>}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-gray-500">+{remaining} more</span>
      )}
    </div>
  );
}

// Selectable tag list with checkboxes
export function TagListSelectable({ 
  availableTags = [], 
  selectedTags = [], 
  onChange, 
  maxSelection = 5 
}) {
  const toggleTag = (tag) => {
    const tagName = typeof tag === 'string' ? tag : tag.name;
    
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter(t => t !== tagName));
    } else if (selectedTags.length < maxSelection) {
      onChange([...selectedTags, tagName]);
    }
  };

  if (!availableTags || availableTags.length === 0) {
    return <p className="text-sm text-gray-500">No tags available</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {availableTags.map(tag => {
          const tagName = typeof tag === 'string' ? tag : tag.name;
          const tagId = typeof tag === 'string' ? tag : tag.id;
          const isSelected = selectedTags.includes(tagName);

          return (
            <button
              key={tagId || tagName}
              type="button"
              onClick={() => toggleTag(tag)}
              disabled={!isSelected && selectedTags.length >= maxSelection}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition
                ${isSelected
                  ? 'bg-primary-500 text-white'
                  : selectedTags.length >= maxSelection
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {isSelected && '✓ '}
              #{tagName}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500">
        {selectedTags.length}/{maxSelection} selected
      </p>
    </div>
  );
}

// Trending tags list
export function TrendingTagsList({ tags = [], onTagClick }) {
  const navigate = useNavigate();

  const handleClick = (tag) => {
    if (onTagClick) {
      onTagClick(tag);
    } else {
      navigate(`/discussions?tag=${tag.id}`);
    }
  };

  if (!tags || tags.length === 0) return null;

  return (
    <div className="space-y-2">
      {tags.map((tag, index) => (
        <div
          key={tag.id}
          onClick={() => handleClick(tag)}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-400 w-6">
              {index + 1}
            </span>
            <span className="font-medium text-gray-700">
              #{tag.name}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {tag.usageCount || 0} posts
          </div>
        </div>
      ))}
    </div>
  );
}

export default TagList;