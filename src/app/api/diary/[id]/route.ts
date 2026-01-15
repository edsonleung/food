import { NextRequest, NextResponse } from 'next/server';
import { deleteDiaryEntry } from '@/lib/db';

// DELETE /api/diary/:id - Delete diary entry
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid diary entry ID' },
        { status: 400 }
      );
    }

    const deleted = await deleteDiaryEntry(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Diary entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete diary entry' },
      { status: 500 }
    );
  }
}
