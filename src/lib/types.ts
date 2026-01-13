export interface Restaurant {
  id: number;
  name: string;
  county: string;
  area: string;
  cuisine: string;
  price: string;
  place_id: string | null;
  google_maps_url: string | null;
  created_at: Date;
}

export interface FilterState {
  county: string[];
  area: string[];
  cuisine: string[];
  price: string[];
}

export interface PlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

export interface PlaceDetails {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  photos?: PlacePhoto[];
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
}

export interface Review {
  id: number;
  restaurant_id: number;
  source: 'google' | 'yelp';
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

export const COUNTIES = [
  { value: 'LA', label: 'Los Angeles' },
  { value: 'OC', label: 'Orange County' },
  { value: 'VAN', label: 'Vancouver' },
];

export const PRICE_OPTIONS = [
  { value: '$', label: '$ - Budget Friendly' },
  { value: '$$', label: '$$ - Moderate' },
  { value: '$$$', label: '$$$ - Upscale' },
  { value: '$$$$', label: '$$$$ - Fine Dining' },
];
