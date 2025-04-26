import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch('http://localhost:3000/api/addTrackToPlaylist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ TrackID: body.TrackID, PlaylistID: body.PlaylistID }),
    });

    if (!res.ok) {
      console.error('Error response from /api/addTrackToPlaylist:', res.status, await res.text());
      return NextResponse.json(
        { error: 'Failed to add track to playlist' },
        { status: res.status }
      );
    }

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