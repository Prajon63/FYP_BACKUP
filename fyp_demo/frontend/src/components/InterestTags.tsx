import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles } from 'lucide-react';

interface InterestTagsProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  editable?: boolean;
  maxTags?: number;
  suggestions?: string[];
  colorScheme?: 'pink' | 'purple' | 'blue' | 'gradient';
}

const InterestTags: React.FC<InterestTagsProps> = ({
  tags,
  onTagsChange,
  editable = false,
  maxTags = 10,
  suggestions = [],
  colorScheme = 'gradient',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const colorClasses = {
    pink: {
      bg: 'bg-pink-100',
      text: 'text-pink-700',
      hover: 'hover:bg-pink-200',
      border: 'border-pink-200',
      button: 'bg-pink-500 hover:bg-pink-600',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      hover: 'hover:bg-purple-200',
      border: 'border-purple-200',
      button: 'bg-purple-500 hover:bg-purple-600',
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-200',
      border: 'border-blue-200',
      button: 'bg-blue-500 hover:bg-blue-600',
    },
    gradient: {
      bg: 'bg-gradient-to-r from-pink-100 to-purple-100',
      text: 'text-transparent bg-gradient-to-r from-pink-700 to-purple-700 bg-clip-text',
      hover: 'hover:from-pink-200 hover:to-purple-200',
      border: 'border-pink-200',
      button: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-lg',
    },
  };

  const colors = colorClasses[colorScheme];

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = suggestions.filter(
    s => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Tag Display */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        <AnimatePresence>
          {tags.map((tag, index) => (
            <motion.div
              key={tag}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.text} ${
                editable ? colors.hover : ''
              } transition-all`}
            >
              <span className="text-sm font-medium">{tag}</span>
              {editable && (
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:bg-white/50 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Tag Input */}
        {editable && tags.length < maxTags && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(inputValue.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Add interest..."
              className={`px-3 py-1.5 border-2 ${colors.border} border-dashed rounded-full text-sm focus:outline-none focus:border-solid transition-all min-w-[120px]`}
            />
            
            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[200px] z-10"
                >
                  {filteredSuggestions.slice(0, 5).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => addTag(suggestion)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                      {suggestion}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Tag Count & Limit */}
      {editable && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{tags.length} / {maxTags} interests added</span>
          {tags.length >= maxTags && (
            <span className="text-orange-600">Maximum reached</span>
          )}
        </div>
      )}
    </div>
  );
};

export default InterestTags;