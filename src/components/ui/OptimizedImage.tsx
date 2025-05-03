'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  onLoad,
  objectFit = 'cover'
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setIsLoading(false);
    // Definir uma imagem de fallback
    setImgSrc('/images/placeholder.jpg');
  };

  return (
    <div className={cn('relative', className)} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        width={width || 0}
        height={height || 0}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        style={{ 
          objectFit, 
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.2s ease-in-out'
        }}
        className={cn('w-full h-full')}
      />
    </div>
  );
} 