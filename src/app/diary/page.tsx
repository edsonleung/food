'use client';

import { useState, useEffect, useRef } from 'react';
import { DiaryEntry } from '@/lib/types';
import Toast from '@/components/Toast';

// Max dimensions for compressed images
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const JPEG_QUALITY = 0.7;

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [restaurantName, setRestaurantName] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load entries
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const response = await fetch('/api/diary');
        if (response.ok) {
          const data = await response.json();
          setEntries(data);
        }
      } catch (error) {
        console.error('Failed to load diary entries:', error);
        setToast({ message: 'Failed to load diary entries', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, []);

  // Convert HEIC to JPEG
  const convertHeicToJpeg = async (file: File): Promise<Blob> => {
    // Dynamically import heic2any only when needed
    const heic2any = (await import('heic2any')).default;

    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: JPEG_QUALITY,
    });

    // heic2any can return an array or single blob
    return Array.isArray(result) ? result[0] : result;
  };

  // Compress and resize image using canvas
  const compressImage = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Calculate new dimensions
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 JPEG
        const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve(base64);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setPhotoPreview(null);

    try {
      let processedFile: Blob = file;

      // Check if it's a HEIC/HEIF file
      const isHeic = file.type === 'image/heic' ||
                     file.type === 'image/heif' ||
                     file.name.toLowerCase().endsWith('.heic') ||
                     file.name.toLowerCase().endsWith('.heif');

      if (isHeic) {
        setToast({ message: 'Converting iPhone photo...', type: 'success' });
        processedFile = await convertHeicToJpeg(file);
      }

      // Compress the image
      const compressedBase64 = await compressImage(processedFile);
      setPhotoPreview(compressedBase64);

      // Show size reduction info
      const originalSize = (file.size / 1024).toFixed(0);
      const newSize = (compressedBase64.length * 0.75 / 1024).toFixed(0); // Base64 is ~33% larger
      setToast({
        message: `Photo ready! (${originalSize}KB → ${newSize}KB)`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error processing image:', error);
      setToast({ message: 'Failed to process image. Please try another photo.', type: 'error' });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurantName || !visitDate || !photoPreview) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_name: restaurantName,
          visit_date: visitDate,
          comment,
          photo_url: photoPreview,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add diary entry');
      }

      const newEntry = await response.json();
      setEntries((prev) => [newEntry, ...prev]);

      // Reset form
      setRestaurantName('');
      setComment('');
      setPhotoPreview(null);
      setVisitDate(new Date().toISOString().split('T')[0]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setToast({ message: 'Memory saved!', type: 'success' });
    } catch (error) {
      console.error('Error adding diary entry:', error);
      setToast({ message: error instanceof Error ? error.message : 'Failed to save memory', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this memory?')) return;

    try {
      const response = await fetch(`/api/diary/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        setToast({ message: 'Memory deleted', type: 'success' });
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      setToast({ message: 'Failed to delete memory', type: 'error' });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="diary-container">
      {/* Header */}
      <header className="text-center mb-8">
        <a href="/" className="text-hot-pink hover:text-burgundy mb-4 inline-block">
          &larr; Back to Randomizer
        </a>
        <h1 className="logo">Food Diary</h1>
        <p className="text-text-secondary">Your delicious memories</p>
      </header>

      {/* Add Entry Form */}
      <form className="diary-form" onSubmit={handleSubmit}>
        <h2 className="diary-form-title">Add a Memory</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Photo Upload */}
          <div>
            <label className="form-label">Photo *</label>
            <div
              className={`photo-upload-area ${photoPreview ? 'has-image' : ''} ${isProcessingImage ? 'processing' : ''}`}
              onClick={() => !isProcessingImage && fileInputRef.current?.click()}
            >
              {isProcessingImage ? (
                <div className="text-text-muted">
                  <div className="loading-spinner mx-auto mb-2" />
                  <span>Processing photo...</span>
                </div>
              ) : photoPreview ? (
                <img src={photoPreview} alt="Preview" className="photo-preview mx-auto" />
              ) : (
                <div className="text-text-muted">
                  <span className="text-4xl block mb-2">&#128247;</span>
                  <span>Click to upload or take a photo</span>
                  <span className="block text-xs mt-1">(iPhone photos supported)</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={isProcessingImage}
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Restaurant Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Where did you eat?"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                placeholder="What did you think? What did you order?"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSubmitting || isProcessingImage || !photoPreview}
            >
              {isSubmitting ? 'Saving...' : 'Save Memory'}
            </button>
          </div>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Diary Grid */}
      {!isLoading && entries.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <span className="text-6xl block mb-4">&#128247;</span>
          <p>No memories yet. Add your first food photo!</p>
        </div>
      ) : (
        <div className="diary-grid">
          {entries.map((entry) => (
            <div key={entry.id} className="polaroid">
              <button
                className="polaroid-delete"
                onClick={() => handleDelete(entry.id)}
              >
                Delete
              </button>
              <img
                src={entry.photo_url}
                alt={entry.restaurant_name}
                className="polaroid-image"
              />
              <div className="polaroid-content">
                <div className="polaroid-restaurant">{entry.restaurant_name}</div>
                <div className="polaroid-date">{formatDate(entry.visit_date)}</div>
                {entry.comment && (
                  <div className="polaroid-comment">{entry.comment}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
