import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Upload, X } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  aspectRatio?: 'square' | 'cover' | 'portrait';
  helperText?: string;
  error?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value,
  onChange,
  aspectRatio = 'square',
  helperText,
  error,
}) => {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [imageError, setImageError] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aspectRatioClasses = {
    square: 'aspect-square max-h-64',
    cover: 'aspect-video max-h-64',
    portrait: 'aspect-[3/4] max-h-64',
  };

  // Debounce preview update to prevent flickering while typing
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only show preview if URL looks valid (starts with http/https)
    if (value.trim() && (value.startsWith('http://') || value.startsWith('https://'))) {
      debounceTimerRef.current = setTimeout(() => {
        setPreview(value.trim());
        setImageError(false);
      }, 500); // Wait 500ms after user stops typing
    } else {
      setPreview(null);
      setImageError(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value]);

  const handleUrlChange = (url: string) => {
    onChange(url);
    // Don't update preview here - let useEffect handle it with debounce
  };

  const handleRemove = () => {
    onChange('');
    setPreview(null);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setPreview(null);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        {label}
      </label>

      {/* Image Preview */}
      {preview && !imageError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative group"
        >
          <div className={`${aspectRatioClasses[aspectRatio]} rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 w-full`}>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* URL Input */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="url"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Enter image URL (e.g., https://images.unsplash.com/...)"
            className={`
              w-full px-4 py-3 border rounded-xl
              focus:ring-2 focus:ring-pink-500 focus:border-transparent
              outline-none transition-all
              ${error ? 'border-red-500' : 'border-gray-300'}
              ${preview ? 'pr-12' : ''}
            `}
          />
          {preview && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}

        {/* Upload Hint */}
        {!preview && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <Upload className="w-4 h-4 text-pink-500" />
            <span>Paste an image URL or use a service like Unsplash</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;

