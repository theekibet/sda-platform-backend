// src/pages/members/learning/CategoryFilter.jsx
import React from 'react';

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="mb-8 overflow-x-auto py-1">
      <div className="flex flex-wrap justify-center gap-2.5">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            style={{
              borderColor: category.color,
              ...(selectedCategory === category.id && { backgroundColor: category.color })
            }}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-full 
              border-2 transition-all whitespace-nowrap text-sm font-medium
              ${selectedCategory === category.id 
                ? 'text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-base">{category.icon}</span>
            <span className="text-sm">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;