'use client';

import { useState, useEffect, useRef } from 'react';
import { DiaryEntry} from '@/lib/types';
import Toast from '@/components/Toast';

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [restaurantName, setRestaurantName] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      // For now, we'll use the base64 preview as the photo URL
      // In production, you'd upload to a cloud storage service
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
        throw new Error('Failed to add diary entry');
      }

      const newEntry = await response.json();
      setEntries((prev) => [newEntry, ...prev]);

      // Reset form
      setRestaurantName('');
      setComment('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setVisitDate(new Date().toISOString().split('T')[0]);

      setToast({ message: 'Memory saved!', type: 'success' });
    } catch (error) {
      console.error('Error adding diary entry:', error);
      setToast({ message: 'Failed to save memory', type: 'error' });
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
              className={`photo-upload-area ${photoPreview ? 'has-image' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="photo-preview mx-auto" />
              ) : (
                <div className="text-text-muted">
                  <span className="text-4xl block mb-2">&#128247;</span>
                  <span>Click to upload or take a photo</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
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
              disabled={isSubmitting}
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
