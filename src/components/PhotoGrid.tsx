'use client';

import { useState } from 'react';

interface PhotoGridProps {
  photos: string[];
  onPhotoClick: (index: number) => void;
  rating?: number;
  reviewCount?: number;
  isLoading: boolean;
}

export default function PhotoGrid({
  photos,
  onPhotoClick,
  rating,
  reviewCount,
  isLoading,
}: PhotoGridProps) {
  const [loadedPhotos, setLoadedPhotos] = useState<Set<number>>(new Set());
  const [errorPhotos, setErrorPhotos] = useState<Set<number>>(new Set());

  const handleImageLoad = (index: number) => {
    setLoadedPhotos((prev) => new Set(prev).add(index));
  };

  const handleImageError = (index: number) => {
    setErrorPhotos((prev) => new Set(prev).add(index));
  };

  if (isLoading) {
    return (
      <div className="photo-container">
        <div className="flex items-center justify-center min-h-[283px]">
          <div className="loading-spinner" />
        </div>
        <div className="result-badge">
          <span>&#127919;</span> Today&apos;s Pick
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="photo-container">
        <div className="flex flex-col items-center justify-center min-h-[283px] bg-gradient-to-br from-rose-quartz to-[#f5e6e6]">
          <div className="text-5xl mb-2">&#128205;</div>
          <div className="text-sm text-text-muted">No photos available</div>
        </div>
        <div className="result-badge">
          <span>&#127919;</span> Today&apos;s Pick
        </div>
      </div>
    );
  }

  const validPhotos = photos.filter((_, i) => !errorPhotos.has(i));

  return (
    <div className="photo-container">
      <div className="photo-grid">
        {/* Main large photo */}
        {validPhotos[0] && (
          <img
            src={validPhotos[0]}
            alt="Restaurant photo"
            className="photo-item"
            onClick={() => onPhotoClick(0)}
            onLoad={() => handleImageLoad(0)}
            onError={() => handleImageError(0)}
          />
        )}

        {/* Right side smaller photos */}
        {validPhotos.length > 1 && (
          <div className="photo-grid-right">
            {validPhotos.slice(1, 5).map((photo, index) => (
              <img
                key={index + 1}
                src={photo}
                alt="Restaurant photo"
                className="photo-item"
                onClick={() => onPhotoClick(index + 1)}
                onLoad={() => handleImageLoad(index + 1)}
                onError={() => handleImageError(index + 1)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="result-badge">
        <span>&#127919;</span> Today&apos;s Pick
      </div>

      {rating && (
        <div className="rating-badge">
          <span>&#11088;</span>
          <span>{rating.toFixed(1)}</span>
          {reviewCount && <span>({reviewCount})</span>}
        </div>
      )}
    </div>
  );
}
