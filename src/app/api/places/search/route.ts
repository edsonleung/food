import { NextRequest, NextResponse } from 'next/server';
import { searchPlace } from '@/lib/google-places';

// GET /api/places/search - Search for a place
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const place = await searchPlace(query);

    if (!place) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(place);
  } catch (error) {
    console.error('Error searching place:', error);
    return NextResponse.json(
      { error: 'Failed to search for place' },
      { status: 500 }
    );
  }
}
