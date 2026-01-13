const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

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
  priceLevel?: string;
  types?: string[];
  reviews?: PlaceReview[];
}

export interface PlaceReview {
  name: string;
  relativePublishTimeDescription: string;
  rating: number;
  text: { text: string };
  authorAttribution: {
    displayName: string;
    uri: string;
    photoUri: string;
  };
}

// Search for a place and get its details including photos
export async function searchPlace(query: string): Promise<PlaceDetails | null> {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Places API key not configured');
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.photos,places.googleMapsUri,places.rating,places.userRatingCount,places.priceLevel,places.types,places.reviews',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Places API error:', error);
    throw new Error('Places API request failed');
  }

  const data = await response.json();

  if (!data.places || data.places.length === 0) {
    return null;
  }

  return data.places[0];
}

// Get photo URL
export function getPhotoUrl(photoName: string, maxWidth = 800, maxHeight = 600): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxHeight}&maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
}

// Parse Google Maps link and extract restaurant details
export async function parseGoogleMapsLink(link: string): Promise<{
  name: string;
  address: string;
  priceLevel: string;
  types: string[];
  placeId?: string;
} | null> {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Places API key not configured');
  }

  // Extract place ID or name from various Google Maps URL formats
  let placeId: string | null = null;
  let placeName: string | null = null;

  // Handle shortened URLs (goo.gl/maps, maps.app.goo.gl)
  if (link.includes('goo.gl/maps') || link.includes('maps.app.goo.gl')) {
    // Follow the redirect to get the full URL
    try {
      const response = await fetch(link, {
        method: 'HEAD',
        redirect: 'follow',
      });
      link = response.url;
    } catch {
      // If redirect fails, try to work with original link
    }
  }

  // Format 1: Place ID in data parameter - /place/Name/data=...!1s<PLACE_ID>
  const placeIdMatch = link.match(/!1s([A-Za-z0-9_-]+)(?:!|$)/);
  if (placeIdMatch) {
    placeId = placeIdMatch[1];
  }

  // Format 2: Place ID as ?place_id= parameter
  const placeIdParam = link.match(/[?&]place_id=([^&]+)/);
  if (placeIdParam) {
    placeId = decodeURIComponent(placeIdParam[1]);
  }

  // Format 3: CID (Customer ID) format - !1s0x<HEX>:0x<HEX>
  const cidMatch = link.match(/!1s(0x[a-f0-9]+:0x[a-f0-9]+)/i);
  if (cidMatch && !placeId) {
    placeId = cidMatch[1];
  }

  // Format 4: /place/Name/@lat,lng - extract name
  if (!placeId) {
    const nameMatch = link.match(/\/place\/([^/@?]+)/);
    if (nameMatch) {
      placeName = decodeURIComponent(nameMatch[1].replace(/\+/g, ' '));
    }
  }

  // Format 5: search query parameter
  if (!placeId && !placeName) {
    const searchMatch = link.match(/[?&]q=([^&]+)/);
    if (searchMatch) {
      placeName = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
    }
  }

  if (!placeId && !placeName) {
    return null;
  }

  try {
    if (placeId) {
      // Use place ID to get details
      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,types,priceLevel,rating',
        },
      });

      if (response.ok) {
        const place = await response.json();
        return {
          name: place.displayName?.text || '',
          address: place.formattedAddress || '',
          priceLevel: place.priceLevel || 'PRICE_LEVEL_MODERATE',
          types: place.types || [],
          placeId,
        };
      }
    }

    // Use text search with place name
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types,places.priceLevel,places.rating',
      },
      body: JSON.stringify({
        textQuery: placeName,
        maxResultCount: 1,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to search for place');
    }

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      return null;
    }

    const place = data.places[0];
    return {
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      priceLevel: place.priceLevel || 'PRICE_LEVEL_MODERATE',
      types: place.types || [],
      placeId: place.id,
    };
  } catch (error) {
    console.error('Error parsing Google Maps link:', error);
    return null;
  }
}

// Parse TikTok link to extract restaurant name
export async function parseTikTokLink(link: string): Promise<{ name: string; description: string } | null> {
  // TikTok links typically need to be processed differently
  // We'll try to extract any restaurant name from the link structure

  try {
    // Check if it's a TikTok link
    if (!link.includes('tiktok.com')) {
      return null;
    }

    // For now, return null as TikTok requires more complex scraping
    // In production, you'd use TikTok's API or a scraping service
    console.log('TikTok link parsing not fully implemented:', link);
    return null;
  } catch (error) {
    console.error('Error parsing TikTok link:', error);
    return null;
  }
}

// Parse Instagram link to extract restaurant info
export async function parseInstagramLink(link: string): Promise<{ name: string; caption: string } | null> {
  try {
    // Check if it's an Instagram link
    if (!link.includes('instagram.com')) {
      return null;
    }

    // For now, return null as Instagram requires OAuth
    // In production, you'd use Instagram's Basic Display API
    console.log('Instagram link parsing not fully implemented:', link);
    return null;
  } catch (error) {
    console.error('Error parsing Instagram link:', error);
    return null;
  }
}

// Map cuisine types from Google to our categories
export function mapGoogleTypeToCuisine(types: string[]): string {
  const cuisineMap: Record<string, string> = {
    'chinese_restaurant': 'Chinese',
    'japanese_restaurant': 'Japanese',
    'korean_restaurant': 'Korean',
    'italian_restaurant': 'Western',
    'french_restaurant': 'French',
    'mexican_restaurant': 'Mexican',
    'thai_restaurant': 'Thai',
    'vietnamese_restaurant': 'Vietnamese',
    'indian_restaurant': 'SEA',
    'american_restaurant': 'Western',
    'seafood_restaurant': 'Western',
    'sushi_restaurant': 'Japanese',
    'ramen_restaurant': 'Japanese',
    'pizza_restaurant': 'Western',
    'steak_house': 'Western',
    'breakfast_restaurant': 'Brunch',
    'brunch_restaurant': 'Brunch',
    'cafe': 'Brunch',
    'mediterranean_restaurant': 'Mediterranean',
    'spanish_restaurant': 'Spanish',
    'brazilian_restaurant': 'Brazilian',
    'peruvian_restaurant': 'Peruvian',
    'taiwanese_restaurant': 'Taiwanese',
    'filipino_restaurant': 'Filipino',
    'cuban_restaurant': 'Cuban',
    'argentinian_restaurant': 'Argentinean',
    'asian_restaurant': 'Fusion',
    'fusion_restaurant': 'Fusion',
  };

  for (const type of types) {
    if (cuisineMap[type]) {
      return cuisineMap[type];
    }
  }

  return 'Western'; // Default
}

// Map price level to our format
export function mapPriceLevel(priceLevel: string): string {
  const priceMap: Record<string, string> = {
    'PRICE_LEVEL_FREE': '$',
    'PRICE_LEVEL_INEXPENSIVE': '$',
    'PRICE_LEVEL_MODERATE': '$$',
    'PRICE_LEVEL_EXPENSIVE': '$$$',
    'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$',
  };

  return priceMap[priceLevel] || '$$';
}
