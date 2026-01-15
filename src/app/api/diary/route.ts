import { NextRequest, NextResponse } from 'next/server';
import { getDiaryEntries, addDiaryEntry } from '@/lib/db';

// GET /api/diary - Get all diary entries
export async function GET() {
  try {
    const entries = await getDiaryEntries();
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching diary entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diary entries' },
      { status: 500 }
    );
  }
}

// POST /api/diary - Add new diary entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurant_id, restaurant_name, photo_url, comment, visit_date } = body;

    if (!restaurant_name || !photo_url || !visit_date) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurant_name, photo_url, visit_date' },
        { status: 400 }
      );
    }

    const newEntry = await addDiaryEntry({
      restaurant_id,
      restaurant_name,
      photo_url,
      comment,
      visit_date,
    });

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error adding diary entry:', error);
    return NextResponse.json(
      { error: 'Failed to add diary entry' },
      { status: 500 }
    );
  }
}
