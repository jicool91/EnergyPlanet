/**
 * OptimizedImage Component
 * Handles lazy loading, WebP support, and fallback images
 */

import React, { ImgHTMLAttributes } from 'react';

export interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Image URL (will be used for WebP with fallback)
   */
  src: string;

  /**
   * Alt text (required for accessibility)
   */
  alt: string;

  /**
   * Whether to use WebP format with fallback
   */
  useWebP?: boolean;

  /**
   * Placeholder color while loading (optional)
   */
  placeholder?: string;
}

/**
 * OptimizedImage: Lazy-loads images with WebP support
 *
 * Features:
 * - loading="lazy" for native browser lazy loading
 * - width/height for layout shift prevention
 * - WebP format with JPEG/PNG fallback
 * - Proper alt text for accessibility
 *
 * @example
 * <OptimizedImage
 *   src="image.jpg"
 *   alt="Description"
 *   width={72}
 *   height={72}
 *   className="rounded-xl"
 * />
 */
export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    { src, alt, width = 72, height = 72, className = '', useWebP = true, placeholder, ...props },
    ref
  ) => {
    // Convert URL to WebP if useWebP is enabled
    const getWebPUrl = (imageUrl: string): string => {
      // If already WebP, return as-is
      if (imageUrl.endsWith('.webp')) {
        return imageUrl;
      }

      // Remove query params and extension
      const baseUrl = imageUrl.split('?')[0];
      const withoutExt = baseUrl.replace(/\.(jpg|jpeg|png|gif)$/i, '');

      // Return WebP version
      return `${withoutExt}.webp`;
    };

    const srcSet = useWebP
      ? `${getWebPUrl(src)} 1x, ${getWebPUrl(src).replace('.webp', '@2x.webp')} 2x`
      : undefined;

    return (
      <img
        ref={ref}
        src={src}
        srcSet={srcSet}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={className}
        style={{
          backgroundColor: placeholder || 'transparent',
          aspectRatio: `${width} / ${height}`,
        }}
        {...props}
      />
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';
