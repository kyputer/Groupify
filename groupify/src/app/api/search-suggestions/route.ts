import { NextResponse } from 'next/server';
import { searchTracks } from '@/lib/spotify';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }
    
    console.log('Query: ', query)
    // In production, send search request to the backend
    const response = await searchTracks(query);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search suggestions' },
      { status: 500 }
    );
  }
}