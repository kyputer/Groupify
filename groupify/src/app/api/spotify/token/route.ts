import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = (await executeQuery(
      'SELECT spotify_access_token FROM users WHERE id = ?',
      [parseInt(session, 10)]
    )) as { spotify_access_token: string }[];

    if (users.length === 0 || !users[0].spotify_access_token) {
      return NextResponse.json(
        { error: 'No Spotify token available' },
        { status: 404 }
      );
    }

    return NextResponse.json({ access_token: users[0].spotify_access_token });
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
  }
}
