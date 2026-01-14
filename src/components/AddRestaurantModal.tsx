'use client';

import { useState } from 'react';
import { COUNTIES, PRICE_OPTIONS } from '@/lib/types';

interface AddRestaurantModalProps {
  onClose: () => void;
  onAdd: (restaurant: {
    name: string;
    county: string;
    area: string;
    cuisine: string;
    price: string;
    google_maps_url?: string;
  }) => void;
}

export default function AddRestaurantModal({ onClose, onAdd }: AddRestaurantModalProps) {
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [caption, setCaption] = useState('');
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [name, setName] = useState('');
  const [county, setCounty] = useState('LA');
  const [area, setArea] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [price, setPrice] = useState('$$');
  const [extractMessage, setExtractMessage] = useState('');

  const isInstagramOrTikTok = googleMapsLink.includes('instagram.com') || googleMapsLink.includes('tiktok.com');

  const handleParseLink = async () => {
    if (!googleMapsLink) return;

    setIsExtracting(true);
    setExtractMessage('');

    try {
      const response = await fetch('/api/places/parse-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: googleMapsLink, caption: caption || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract info');
      }

      // Check if we need caption input
      if (data.needsCaption) {
        setShowCaptionInput(true);
        setExtractMessage('Please paste the caption/description from the post below:');
        return;
      }

      if (data.requiresManualEntry) {
        setExtractMessage(data.message || 'Please enter restaurant details manually.');
        if (data.name) setName(data.name);
        if (data.extractedRestaurants && data.extractedRestaurants.length > 0) {
          setExtractMessage(`Found: ${data.extractedRestaurants.join(', ')}. Please verify and complete details.`);
        }
        return;
      }

      // Fill in the form fields
      setName(data.name || '');
      if (data.county) setCounty(data.county);
      if (data.area) setArea(data.area);
      if (data.cuisine) setCuisine(data.cuisine);
      if (data.price) setPrice(data.price);
      setShowCaptionInput(false);

      setExtractMessage('Restaurant info extracted! Please review and adjust if needed.');
    } catch (error) {
      setExtractMessage(error instanceof Error ? error.message : 'Failed to extract info');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = () => {
    if (!name || !county || !area || !cuisine) return;

    onAdd({
      name,
      county,
      area,
      cuisine,
      price,
      google_maps_url: googleMapsLink || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Restaurant</h3>
          <button className="text-burgundy text-2xl hover:text-hot-pink" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="google-link-section">
            <div className="google-link-title">
              <span>&#128279;</span> Quick Add from Link
            </div>
            <p className="google-link-desc">
              Paste a Google Maps, TikTok, or Instagram link to extract restaurant info
            </p>
            <input
              type="text"
              className="form-input"
              placeholder="https://maps.google.com/... or TikTok/Instagram link"
              value={googleMapsLink}
              onChange={(e) => setGoogleMapsLink(e.target.value)}
            />
            {(showCaptionInput || isInstagramOrTikTok) && (
              <textarea
                className="form-input mt-3"
                placeholder="Paste the caption/description from the Instagram/TikTok post here..."
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            )}
            <button
              className="btn btn-secondary w-full mt-3"
              onClick={handleParseLink}
              disabled={isExtracting || !googleMapsLink}
            >
              {isExtracting ? 'Extracting...' : 'Extract Info'}
            </button>
            {extractMessage && (
              <p className="text-sm mt-2 text-text-secondary">{extractMessage}</p>
            )}
          </div>

          <div className="or-divider">or enter manually</div>

          <div className="form-group">
            <label className="form-label">Restaurant Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Bestia"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">County *</label>
              <select
                className="form-select"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
              >
                {COUNTIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Area *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Arts District"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Cuisine *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Italian"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price *</label>
              <select
                className="form-select"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              >
                {PRICE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!name || !county || !area || !cuisine}
          >
            Add Restaurant
          </button>
        </div>
      </div>
    </div>
  );
}
