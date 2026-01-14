import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

// GET /api/places/photo - Proxy photo from Google Places
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoName = searchParams.get('photoName');
    const maxWidth = searchParams.get('maxWidth') || '800';
    const maxHeight = searchParams.get('maxHeight') || '600';

    if (!photoName) {
      return NextResponse.json(
        { error: 'photoName parameter is required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      );
    }

    // Fetch the photo from Google
    const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxHeight}&maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;

    const response = await fetch(photoUrl);

    if (!response.ok) {
      console.error('Photo fetch failed:', response.status, await response.text());
      return NextResponse.json(
        { error: 'Failed to fetch photo' },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error proxying photo:', error);
    return NextResponse.json(
      { error: 'Failed to proxy photo' },
      { status: 500 }
    );
  }
}
