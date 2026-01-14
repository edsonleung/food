import { NextRequest, NextResponse } from 'next/server';
import { parseGoogleMapsLink, parseTikTokLink, parseInstagramLink, searchPlace, mapGoogleTypeToCuisine, mapPriceLevel } from '@/lib/google-places';

// POST /api/places/parse-link - Parse a link (Google Maps, TikTok, Instagram)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { link } = body;

    if (!link) {
      return NextResponse.json(
        { error: 'Link is required' },
        { status: 400 }
      );
    }

    // Detect link type and parse accordingly
    let result = null;
    let linkType = 'unknown';

    // Try Google Maps first
    if (link.includes('google.com/maps') || link.includes('goo.gl/maps') || link.includes('maps.app.goo.gl') || link.includes('maps.google.com')) {
      linkType = 'google';
      result = await parseGoogleMapsLink(link);

      if (result) {
        // Add derived fields
        const cuisine = mapGoogleTypeToCuisine(result.types);
        const price = mapPriceLevel(result.priceLevel);

        // Extract area from address
        let area = '';
        let county = 'LA'; // Default

        if (result.address) {
          const addressLower = result.address.toLowerCase();
          const addressParts = result.address.split(',');

          // Detect county from address
          if (addressLower.includes('vancouver') || addressLower.includes(', bc') || addressLower.includes('british columbia')) {
            county = 'VAN';
          } else if (addressLower.includes('irvine') || addressLower.includes('tustin') || addressLower.includes('costa mesa') || addressLower.includes('westminster') || addressLower.includes('garden grove') || addressLower.includes('orange county')) {
            county = 'OC';
          } else {
            county = 'LA';
          }

          // Try to extract area/neighborhood
          if (addressParts.length >= 3) {
            // Usually: "Street Address, City, State ZIP"
            area = addressParts[addressParts.length - 3]?.trim() || addressParts[1]?.trim() || '';
          } else if (addressParts.length >= 2) {
            area = addressParts[1]?.trim() || '';
          }
        }

        return NextResponse.json({
          source: linkType,
          name: result.name,
          address: result.address,
          area,
          county,
          cuisine,
          price,
          priceLevel: result.priceLevel,
          types: result.types,
          placeId: result.placeId,
        });
      }
    }

    // Try TikTok
    if (link.includes('tiktok.com')) {
      linkType = 'tiktok';
      const tiktokResult = await parseTikTokLink(link);

      if (tiktokResult && tiktokResult.extractedRestaurants.length > 0) {
        // Try to search Google Places for the extracted restaurants
        for (const restaurantName of tiktokResult.extractedRestaurants.slice(0, 3)) {
          try {
            const place = await searchPlace(restaurantName + ' restaurant');

            if (place && place.displayName?.text) {
              const cuisine = mapGoogleTypeToCuisine(place.types || []);
              const price = mapPriceLevel(place.priceLevel || 'PRICE_LEVEL_MODERATE');

              let area = '';
              let county = 'LA';
              const address = place.formattedAddress || '';

              if (address) {
                const addressLower = address.toLowerCase();
                const addressParts = address.split(',');

                if (addressLower.includes('vancouver') || addressLower.includes(', bc')) {
                  county = 'VAN';
                } else if (addressLower.includes('irvine') || addressLower.includes('tustin') || addressLower.includes('costa mesa') || addressLower.includes('orange county')) {
                  county = 'OC';
                }

                if (addressParts.length >= 3) {
                  area = addressParts[addressParts.length - 3]?.trim() || addressParts[1]?.trim() || '';
                } else if (addressParts.length >= 2) {
                  area = addressParts[1]?.trim() || '';
                }
              }

              return NextResponse.json({
                source: 'tiktok',
                name: place.displayName.text,
                address,
                area,
                county,
                cuisine,
                price,
                priceLevel: place.priceLevel,
                types: place.types,
                placeId: place.id,
                tiktokDescription: tiktokResult.description,
                extractedFrom: restaurantName,
              });
            }
          } catch (e) {
            console.log('Failed to find restaurant:', restaurantName);
          }
        }

        // If no Google match found, return extracted info for manual entry
        return NextResponse.json({
          source: linkType,
          name: tiktokResult.name,
          description: tiktokResult.description,
          extractedRestaurants: tiktokResult.extractedRestaurants,
          requiresManualEntry: true,
          message: 'Found potential restaurants in video title. Please verify and complete details.',
        });
      }

      return NextResponse.json({
        source: linkType,
        description: tiktokResult?.description || '',
        message: 'TikTok link detected but no restaurant found. Please enter details manually.',
        requiresManualEntry: true,
      });
    }

    // Try Instagram
    if (link.includes('instagram.com')) {
      linkType = 'instagram';
      const igResult = await parseInstagramLink(link);

      if (igResult && igResult.extractedRestaurants.length > 0) {
        // Try to search Google Places for the extracted restaurants
        for (const restaurantName of igResult.extractedRestaurants.slice(0, 3)) {
          try {
            const place = await searchPlace(restaurantName + ' restaurant');

            if (place && place.displayName?.text) {
              const cuisine = mapGoogleTypeToCuisine(place.types || []);
              const price = mapPriceLevel(place.priceLevel || 'PRICE_LEVEL_MODERATE');

              // Extract area from address
              let area = '';
              let county = 'LA';
              const address = place.formattedAddress || '';

              if (address) {
                const addressLower = address.toLowerCase();
                const addressParts = address.split(',');

                if (addressLower.includes('vancouver') || addressLower.includes(', bc')) {
                  county = 'VAN';
                } else if (addressLower.includes('irvine') || addressLower.includes('tustin') || addressLower.includes('costa mesa') || addressLower.includes('orange county')) {
                  county = 'OC';
                }

                if (addressParts.length >= 3) {
                  area = addressParts[addressParts.length - 3]?.trim() || addressParts[1]?.trim() || '';
                } else if (addressParts.length >= 2) {
                  area = addressParts[1]?.trim() || '';
                }
              }

              return NextResponse.json({
                source: 'instagram',
                name: place.displayName.text,
                address,
                area,
                county,
                cuisine,
                price,
                priceLevel: place.priceLevel,
                types: place.types,
                placeId: place.id,
                instagramCaption: igResult.caption,
                extractedFrom: restaurantName,
              });
            }
          } catch (e) {
            // Continue trying other extracted names
            console.log('Failed to find restaurant:', restaurantName);
          }
        }

        // If no Google match found, return extracted info for manual entry
        return NextResponse.json({
          source: linkType,
          name: igResult.name,
          caption: igResult.caption,
          extractedRestaurants: igResult.extractedRestaurants,
          requiresManualEntry: true,
          message: 'Found potential restaurants in caption. Please verify and complete details.',
        });
      }

      return NextResponse.json({
        source: linkType,
        caption: igResult?.caption || '',
        message: 'Instagram link detected but no restaurant found in caption. Please enter details manually.',
        requiresManualEntry: true,
      });
    }

    // Unknown link type
    return NextResponse.json(
      { error: 'Could not extract place information from link. Supported formats: Google Maps, TikTok, Instagram' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error parsing link:', error);
    return NextResponse.json(
      { error: 'Failed to parse link' },
      { status: 500 }
    );
  }
}
