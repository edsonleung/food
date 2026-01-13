import { NextRequest, NextResponse } from 'next/server';
import { getAllRestaurants, addRestaurant, getFilteredRestaurants } from '@/lib/db';

// GET /api/restaurants - Get all restaurants or filtered
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const counties = searchParams.get('counties')?.split(',').filter(Boolean) || [];
    const areas = searchParams.get('areas')?.split(',').filter(Boolean) || [];
    const cuisines = searchParams.get('cuisines')?.split(',').filter(Boolean) || [];
    const prices = searchParams.get('prices')?.split(',').filter(Boolean) || [];

    const hasFilters = counties.length > 0 || areas.length > 0 || cuisines.length > 0 || prices.length > 0;

    const restaurants = hasFilters
      ? await getFilteredRestaurants({ counties, areas, cuisines, prices })
      : await getAllRestaurants();

    return NextResponse.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}

// POST /api/restaurants - Add new restaurant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, county, area, cuisine, price, place_id, google_maps_url } = body;

    if (!name || !county || !area || !cuisine) {
      return NextResponse.json(
        { error: 'Missing required fields: name, county, area, cuisine' },
        { status: 400 }
      );
    }

    const newRestaurant = await addRestaurant({
      name,
      county,
      area,
      cuisine,
      price: price || '$$',
      place_id,
      google_maps_url,
    });

    return NextResponse.json(newRestaurant, { status: 201 });
  } catch (error) {
    console.error('Error adding restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to add restaurant' },
      { status: 500 }
    );
  }
}
