import { NextRequest, NextResponse } from 'next/server';
import { searchPlace } from '@/lib/google-places';

const YELP_API_KEY = process.env.YELP_API_KEY || '';

interface YelpBusiness {
  id: string;
  name: string;
  rating: number;
  review_count: number;
}

interface YelpReview {
  id: string;
  rating: number;
  text: string;
  time_created: string;
  user: {
    name: string;
    image_url: string;
  };
}

// Search Yelp for a business
async function searchYelp(name: string, location: string): Promise<YelpBusiness | null> {
  if (!YELP_API_KEY) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      term: name,
      location: location,
      limit: '1',
    });

    const response = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('Yelp search failed:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.businesses?.[0] || null;
  } catch (error) {
    console.error('Error searching Yelp:', error);
    return null;
  }
}

// Get Yelp reviews for a business
async function getYelpReviews(businessId: string): Promise<YelpReview[]> {
  if (!YELP_API_KEY) {
    return [];
  }

  try {
    const response = await fetch(`https://api.yelp.com/v3/businesses/${businessId}/reviews?limit=3&sort_by=yelp_sort`, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('Yelp reviews fetch failed:', await response.text());
      return [];
    }

    const data = await response.json();
    return data.reviews || [];
  } catch (error) {
    console.error('Error fetching Yelp reviews:', error);
    return [];
  }
}

// GET /api/reviews - Get reviews for a restaurant
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

    const searchQuery = `${name} ${location}`.trim();

    // Fetch reviews from both sources in parallel
    const [googlePlace, yelpBusiness] = await Promise.all([
      searchPlace(searchQuery),
      searchYelp(name, location),
    ]);

    const reviews: {
      source: string;
      author: string;
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
          rating: review.rating,
          text: review.text?.text || '',
          date: review.relativePublishTimeDescription || '',
        });
      }
    }

    // Add Yelp reviews
    if (yelpBusiness) {
      const yelpReviews = await getYelpReviews(yelpBusiness.id);
      for (const review of yelpReviews) {
        reviews.push({
          source: 'yelp',
          author: review.user?.name || 'Anonymous',
          rating: review.rating,
          text: review.text || '',
          date: review.time_created || '',
        });
      }
    }

    return NextResponse.json({
      reviews,
      google: googlePlace ? {
        rating: googlePlace.rating,
        reviewCount: googlePlace.userRatingCount,
      } : null,
      yelp: yelpBusiness ? {
        rating: yelpBusiness.rating,
        reviewCount: yelpBusiness.review_count,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
