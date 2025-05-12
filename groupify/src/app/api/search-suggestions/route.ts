import { NextResponse } from 'next/server';
import { Song } from '@/interfaces/Song';
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

    // const suggestionObject = respon
    // const suggestions = suggestionObject.filter((song: Song) => {
    //   const searchTerm = query.toLowerCase();
    //   const songName = song.name.toLowerCase();
    //   const artistNames = song.artists.map((artist) => artist.name.toLowerCase()).join(' ');
      
    //   return songName.includes(searchTerm) || artistNames.includes(searchTerm);
    // });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search suggestions' },
      { status: 500 }
    );
  }
}