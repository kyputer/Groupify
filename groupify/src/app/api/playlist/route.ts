import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch('http://localhost:3000/api/addTrackToPlaylist', {
      method: 'POST',
      body: JSON.stringify({ TrackID: body.TrackID, PlaylistID: body.PlaylistID }),
    });
     
    const data = await res.json();

    return NextResponse.json({
        success: true,
        message: 'Track added to playlist',
        data: data
    });
    
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    return NextResponse.json(
      { error: 'Failed to add track to playlist' },
      { status: 500 }
    );
  }
}