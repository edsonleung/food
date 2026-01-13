import { NextRequest, NextResponse } from 'next/server';
import { getRandomRestaurant } from '@/lib/db';

// GET /api/restaurants/random - Get random restaurant with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const counties = searchParams.get('counties')?.split(',').filter(Boolean) || [];
    const areas = searchParams.get('areas')?.split(',').filter(Boolean) || [];
    const cuisines = searchParams.get('cuisines')?.split(',').filter(Boolean) || [];
    const prices = searchParams.get('prices')?.split(',').filter(Boolean) || [];

    const restaurant = await getRandomRestaurant({
      counties,
      areas,
      cuisines,
      prices,
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'No restaurants match your filters' },
        { status: 404 }
      );
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error('Error fetching random restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random restaurant' },
      { status: 500 }
    );
  }
}
