import { NextRequest, NextResponse } from 'next/server';
import { toggleFavorite } from '@/lib/db';

// POST /api/restaurants/:id/favorite - Toggle favorite status
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid restaurant ID' },
        { status: 400 }
      );
    }

    const updated = await toggleFavorite(id);

    if (!updated) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
