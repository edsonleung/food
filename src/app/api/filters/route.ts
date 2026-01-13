import { NextRequest, NextResponse } from 'next/server';
import { getFilterOptions, getAreasByCounties, getCuisinesByFilters } from '@/lib/db';

// GET /api/filters - Get filter options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const counties = searchParams.get('counties')?.split(',').filter(Boolean) || [];
    const areas = searchParams.get('areas')?.split(',').filter(Boolean) || [];

    if (type === 'areas') {
      const areasList = await getAreasByCounties(counties);
      return NextResponse.json({ areas: areasList });
    }

    if (type === 'cuisines') {
      const cuisinesList = await getCuisinesByFilters(counties, areas);
      return NextResponse.json({ cuisines: cuisinesList });
    }

    // Return all filter options
    const filters = await getFilterOptions();
    return NextResponse.json(filters);
  } catch (error) {
    console.error('Error fetching filters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filters' },
      { status: 500 }
    );
  }
}
