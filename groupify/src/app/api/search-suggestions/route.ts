import { NextResponse } from 'next/server';
import { SongInterface } from '@/interfaces/Song';
import { mockSongs } from '@/lib/mockData';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Filter mock songs based on the query
    const suggestions = mockSongs.filter(song => {
      const searchTerm = query.toLowerCase();
      const songName = song.name.toLowerCase();
      const artistNames = song.artists.map(artist => artist.name.toLowerCase()).join(' ');
      
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