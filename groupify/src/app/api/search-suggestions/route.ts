import { NextResponse } from 'next/server';
import { SongInterface } from '@/interfaces/Song';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // In production, send search request to the backend
    const response = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch search suggestions');
    }

    const suggestionObject = await response.json();
    const suggestions = suggestionObject.filter((song: SongInterface) => {
      const searchTerm = query.toLowerCase();
      const songName = song.name.toLowerCase();
      const artistNames = song.artists.map((artist) => artist.name.toLowerCase()).join(' ');
      
      return songName.includes(searchTerm) || artistNames.includes(searchTerm);
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search suggestions' },
      { status: 500 }
    );
  }
}