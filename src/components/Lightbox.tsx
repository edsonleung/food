'use client';

import { useEffect, useCallback } from 'react';

interface LightboxProps {
  photos: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: number) => void;
}

export default function Lightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onNavigate(-1);
      } else if (e.key === 'ArrowRight') {
        onNavigate(1);
      }
    },
    [onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>
        &times;
      </button>

      <button
        className="lightbox-nav prev"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(-1);
        }}
      >
        &#8249;
      </button>

      <img
        src={photos[currentIndex]}
        alt="Restaurant photo"
        className="lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />

      <button
        className="lightbox-nav next"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(1);
        }}
      >
        &#8250;
      </button>
    </div>
  );
}
