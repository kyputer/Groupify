import { NextResponse } from 'next/server';
import { mockVotes } from '@/lib/mockData';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function POST(request: Request) {
  try {
    const { UserID, SpotifyID } = await request.json();

    if (!UserID || !SpotifyID) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (isDevelopment) {
      // In development, just return success
      return NextResponse.json({ 
        success: true,
        message: 'Mock upvote successful'
      });
    }

    // In production, send vote to the backend
    const response = await fetch('http://localhost:3000/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: UserID,
        spotify_id: SpotifyID,
        vote_type: 'upvote'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to process vote');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing upvote:', error);
    return NextResponse.json(
      { error: 'Failed to process upvote' },
      { status: 500 }
    );
  }
} 