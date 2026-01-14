import { NextRequest, NextResponse } from 'next/server';
import { searchPlace } from '@/lib/google-places';

// GET /api/reviews - Get reviews for a restaurant from Google Places
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const area = searchParams.get('area');
    const county = searchParams.get('county');

    if (!name) {
      return NextResponse.json(
        { error: 'Restaurant name is required' },
        { status: 400 }
      );
    }

    // Build search query
    let location = '';
    if (county === 'LA') {
      location = `${area || ''} Los Angeles, CA`;
    } else if (county === 'OC') {
      location = `${area || ''} Orange County, CA`;
    } else if (county === 'VAN') {
      location = `${area || ''} Vancouver, BC`;
    }

    const searchQuery = `${name} restaurant ${location}`.trim();

    // Fetch from Google Places
    const googlePlace = await searchPlace(searchQuery);

    const reviews: {
      source: string;
      author: string;
      authorPhoto?: string;
      rating: number;
      text: string;
      date: string;
    }[] = [];

    // Add Google reviews
    if (googlePlace?.reviews) {
      for (const review of googlePlace.reviews.slice(0, 5)) {
        reviews.push({
          source: 'google',
          author: review.authorAttribution?.displayName || 'Anonymous',
          authorPhoto: review.authorAttribution?.photoUri,
          rating: review.rating,
          text: review.text?.text || '',
          date: review.relativePublishTimeDescription || '',
        });
      }
    }

    return NextResponse.json({
      reviews,
      google: googlePlace ? {
        rating: googlePlace.rating,
        reviewCount: googlePlace.userRatingCount,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
