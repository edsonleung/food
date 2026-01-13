'use client';

import { useState, useEffect, useCallback } from 'react';
import { Restaurant } from '@/lib/types';
import PhotoGrid from './PhotoGrid';
import Lightbox from './Lightbox';

interface Review {
  source: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

interface ResultModalProps {
  restaurant: Restaurant;
  onClose: () => void;
  onTryAgain: () => void;
}

export default function ResultModal({ restaurant, onClose, onTryAgain }: ResultModalProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [rating, setRating] = useState<number | undefined>();
  const [reviewCount, setReviewCount] = useState<number | undefined>();
  const [googleMapsUri, setGoogleMapsUri] = useState<string | undefined>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const getLocationQuery = useCallback(() => {
    let location = '';
    if (restaurant.county === 'LA') {
      location = 'Los Angeles, CA';
    } else if (restaurant.county === 'OC') {
      location = 'Orange County, CA';
    } else if (restaurant.county === 'VAN') {
      location = 'Vancouver, BC';
    }
    return `${restaurant.name} ${restaurant.area} ${location}`;
  }, [restaurant]);

  const getCountyName = () => {
    if (restaurant.county === 'LA') return 'Los Angeles';
    if (restaurant.county === 'OC') return 'Orange County';
    if (restaurant.county === 'VAN') return 'Vancouver';
    return restaurant.county;
  };

  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoadingPhotos(true);
      setPhotos([]);
      setRating(undefined);
      setReviewCount(undefined);

      try {
        const query = getLocationQuery();
        const response = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
          throw new Error('Failed to fetch place');
        }

        const place = await response.json();

        if (place.rating) {
          setRating(place.rating);
        }
        if (place.userRatingCount) {
          setReviewCount(place.userRatingCount);
        }
        if (place.googleMapsUri) {
          setGoogleMapsUri(place.googleMapsUri);
        }

        if (place.photos && place.photos.length > 0) {
          const photoUrls = await Promise.all(
            place.photos.slice(0, 5).map(async (photo: { name: string }) => {
              const photoResponse = await fetch(
                `/api/places/photo?photoName=${encodeURIComponent(photo.name)}&maxWidth=800&maxHeight=600`
              );
              if (photoResponse.ok) {
                const data = await photoResponse.json();
                return data.url;
              }
              return null;
            })
          );

          setPhotos(photoUrls.filter((url): url is string => url !== null));
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setIsLoadingPhotos(false);
      }
    };

    fetchPhotos();
  }, [restaurant, getLocationQuery]);

  const fetchReviews = async () => {
    if (reviews.length > 0 || isLoadingReviews) return;

    setIsLoadingReviews(true);
    try {
      const response = await fetch(
        `/api/reviews?name=${encodeURIComponent(restaurant.name)}&area=${encodeURIComponent(restaurant.area)}&county=${encodeURIComponent(restaurant.county)}`
      );

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleShowReviews = () => {
    setShowReviews(!showReviews);
    if (!showReviews) {
      fetchReviews();
    }
  };

  const getMapsUrl = () => {
    if (googleMapsUri) return googleMapsUri;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getLocationQuery())}`;
  };

  const handleLightboxNavigate = (direction: number) => {
    if (lightboxIndex === null) return;
    const newIndex = (lightboxIndex + direction + photos.length) % photos.length;
    setLightboxIndex(newIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxIndex === null) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, onClose]);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>

          <PhotoGrid
            photos={photos}
            onPhotoClick={setLightboxIndex}
            rating={rating}
            reviewCount={reviewCount}
            isLoading={isLoadingPhotos}
          />

          <div className="result-content">
            <h2 className="result-name">{restaurant.name}</h2>
            <p className="result-cuisine">{restaurant.cuisine} Cuisine</p>

            <div className="result-meta">
              <span className="meta-item">
                <span>&#128205;</span>
                <span>{restaurant.area}, {getCountyName()}</span>
              </span>
              <span className="meta-item">
                <span className="text-desert-sun font-semibold">{restaurant.price || '$$'}</span>
              </span>
            </div>

            <div className="flex gap-4 flex-wrap">
              <a
                className="action-btn primary"
                href={getMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>&#128506;</span> Open in Maps
              </a>
              <button className="action-btn secondary" onClick={onTryAgain}>
                <span>&#128260;</span> Try Another
              </button>
            </div>

            {/* Reviews Section */}
            <div className="mt-4">
              <button
                className="btn btn-secondary w-full"
                onClick={handleShowReviews}
              >
                {showReviews ? 'Hide Reviews' : 'Show Reviews'}
              </button>

              {showReviews && (
                <div className="reviews-section">
                  <h3 className="reviews-title">What People Are Saying</h3>

                  {isLoadingReviews ? (
                    <div className="flex justify-center py-4">
                      <div className="loading-spinner" />
                    </div>
                  ) : reviews.length === 0 ? (
                    <p className="text-text-muted text-sm">No reviews available</p>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((review, index) => (
                        <div key={index} className="review-item">
                          <div className="review-header">
                            <span className="review-author">{review.author}</span>
                            <span className="review-source">
                              {review.source === 'google' ? 'Google' : 'Yelp'}
                            </span>
                          </div>
                          <div className="review-rating">
                            {'★'.repeat(Math.round(review.rating))}
                            {'☆'.repeat(5 - Math.round(review.rating))}
                          </div>
                          <p className="review-text">{review.text}</p>
                          {review.date && (
                            <p className="review-date">{review.date}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={handleLightboxNavigate}
        />
      )}
    </>
  );
}
