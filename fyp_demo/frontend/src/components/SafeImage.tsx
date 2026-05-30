import React, { useState, useCallback } from 'react';
import { normalizeImageUrl, dicebearAvatar } from '../utils/imageUrl';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Used for dicebear fallback when the image fails to load */
  fallbackSeed?: string;
}

/**
 * Image with Unsplash URL normalization and avatar fallback on error.
 * Prevents broken UI when seed URLs 404 or fail cross-origin checks.
 */
const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSeed = 'user',
  onError,
  alt = '',
  ...props
}) => {
  const normalized = normalizeImageUrl(src);
  const [useFallback, setUseFallback] = useState(false);

  const displaySrc =
    useFallback || !normalized ? dicebearAvatar(fallbackSeed) : normalized;

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (!useFallback) setUseFallback(true);
      else onError?.(e);
    },
    [useFallback, onError]
  );

  return (
    <img
      {...props}
      src={displaySrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
};

export default SafeImage;
