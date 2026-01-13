import { NextRequest, NextResponse } from 'next/server';
import { getPhotoUrl } from '@/lib/google-places';

// GET /api/places/photo - Get photo URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoName = searchParams.get('photoName');
    const maxWidth = parseInt(searchParams.get('maxWidth') || '800', 10);
    const maxHeight = parseInt(searchParams.get('maxHeight') || '600', 10);

    if (!photoName) {
      return NextResponse.json(
        { error: 'photoName parameter is required' },
        { status: 400 }
      );
    }

    const url = getPhotoUrl(photoName, maxWidth, maxHeight);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error getting photo URL:', error);
    return NextResponse.json(
      { error: 'Failed to get photo URL' },
      { status: 500 }
    );
  }
}
