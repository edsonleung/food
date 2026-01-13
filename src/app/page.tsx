'use client';

import { useState, useEffect, useCallback } from 'react';
import MultiSelect from '@/components/MultiSelect';
import Toast from '@/components/Toast';
import AddRestaurantModal from '@/components/AddRestaurantModal';
import ResultModal from '@/components/ResultModal';
import { Restaurant, COUNTIES, PRICE_OPTIONS } from '@/lib/types';

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  // Filter state
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);

  // Filter options
  const [areaOptions, setAreaOptions] = useState<{ value: string; label: string }[]>([]);
  const [cuisineOptions, setCuisineOptions] = useState<{ value: string; label: string }[]>([]);

  // UI state
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load restaurants on mount
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const response = await fetch('/api/restaurants');
        if (response.ok) {
          const data = await response.json();
          setRestaurants(data);
        }
      } catch (error) {
        console.error('Failed to load restaurants:', error);
        setToast({ message: 'Failed to load restaurants', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  // Update area options when counties change
  useEffect(() => {
    let filtered = restaurants;
    if (selectedCounties.length > 0) {
      filtered = filtered.filter((r) => selectedCounties.includes(r.county));
    }

    const areas = [...new Set(filtered.map((r) => r.area))].sort();
    setAreaOptions(areas.map((a) => ({ value: a, label: a })));

    // Clear invalid area selections
    setSelectedAreas((prev) => prev.filter((a) => areas.includes(a)));
  }, [selectedCounties, restaurants]);

  // Update cuisine options when counties or areas change
  useEffect(() => {
    let filtered = restaurants;
    if (selectedCounties.length > 0) {
      filtered = filtered.filter((r) => selectedCounties.includes(r.county));
    }
    if (selectedAreas.length > 0) {
      filtered = filtered.filter((r) => selectedAreas.includes(r.area));
    }

    const cuisines = [...new Set(filtered.map((r) => r.cuisine))].sort();
    setCuisineOptions(cuisines.map((c) => ({ value: c, label: c })));

    // Clear invalid cuisine selections
    setSelectedCuisines((prev) => prev.filter((c) => cuisines.includes(c)));
  }, [selectedCounties, selectedAreas, restaurants]);

  // Get filtered restaurants
  const getFilteredRestaurants = useCallback(() => {
    let filtered = restaurants;
    if (selectedCounties.length > 0) {
      filtered = filtered.filter((r) => selectedCounties.includes(r.county));
    }
    if (selectedAreas.length > 0) {
      filtered = filtered.filter((r) => selectedAreas.includes(r.area));
    }
    if (selectedCuisines.length > 0) {
      filtered = filtered.filter((r) => selectedCuisines.includes(r.cuisine));
    }
    if (selectedPrices.length > 0) {
      filtered = filtered.filter((r) => selectedPrices.includes(r.price));
    }
    return filtered;
  }, [restaurants, selectedCounties, selectedAreas, selectedCuisines, selectedPrices]);

  const handleRandomize = () => {
    const filtered = getFilteredRestaurants();

    if (filtered.length === 0) {
      setToast({ message: 'No restaurants match your filters', type: 'error' });
      return;
    }

    setIsSpinning(true);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      setSelectedRestaurant(filtered[randomIndex]);
      setIsSpinning(false);
    }, 500);
  };

  const handleAddRestaurant = async (restaurant: {
    name: string;
    county: string;
    area: string;
    cuisine: string;
    price: string;
    google_maps_url?: string;
  }) => {
    try {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurant),
      });

      if (!response.ok) {
        throw new Error('Failed to add restaurant');
      }

      const newRestaurant = await response.json();
      setRestaurants((prev) => [...prev, newRestaurant]);
      setShowAddModal(false);
      setToast({ message: `${restaurant.name} added!`, type: 'success' });
    } catch (error) {
      console.error('Error adding restaurant:', error);
      setToast({ message: 'Failed to add restaurant', type: 'error' });
    }
  };

  const filteredCount = getFilteredRestaurants().length;

  return (
    <div className="relative z-10 max-w-[900px] mx-auto p-8">
      {/* Header */}
      <header className="text-center mb-12 py-8">
        <h1 className="logo">Bon Appe-Pick</h1>
        <p className="text-text-secondary text-lg">Spin. Pick. Eat.</p>
      </header>

      {/* Filters Card */}
      <div className="filters-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* County Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-burgundy mb-3">
              County
            </label>
            <MultiSelect
              options={COUNTIES}
              value={selectedCounties}
              onChange={setSelectedCounties}
              placeholder="All Counties"
            />
          </div>

          {/* Area Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-burgundy mb-3">
              Area
            </label>
            <MultiSelect
              options={areaOptions}
              value={selectedAreas}
              onChange={setSelectedAreas}
              placeholder="All Areas"
            />
          </div>

          {/* Cuisine Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-burgundy mb-3">
              Cuisine
            </label>
            <MultiSelect
              options={cuisineOptions}
              value={selectedCuisines}
              onChange={setSelectedCuisines}
              placeholder="All Cuisines"
            />
          </div>

          {/* Price Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-burgundy mb-3">
              Price Point
            </label>
            <MultiSelect
              options={PRICE_OPTIONS}
              value={selectedPrices}
              onChange={setSelectedPrices}
              placeholder="Any Price"
            />
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex gap-4 items-center flex-wrap">
          <button
            className={`randomize-btn ${isSpinning ? 'spinning' : ''}`}
            onClick={handleRandomize}
            disabled={isLoading || isSpinning}
          >
            <span className="dice-icon text-2xl">&#127922;</span>
            Pick My Restaurant!
          </button>

          <div className="stats">
            <div className="text-center">
              <div className="stat-value">{restaurants.length}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="text-center">
              <div className="stat-value">{filteredCount}</div>
              <div className="stat-label">Matching</div>
            </div>
          </div>

          <button className="add-restaurant-btn" onClick={() => setShowAddModal(true)}>
            <span>&#10133;</span> Add
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Result Modal */}
      {selectedRestaurant && (
        <ResultModal
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          onTryAgain={() => {
            setSelectedRestaurant(null);
            setTimeout(handleRandomize, 300);
          }}
        />
      )}

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <AddRestaurantModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddRestaurant}
        />
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
