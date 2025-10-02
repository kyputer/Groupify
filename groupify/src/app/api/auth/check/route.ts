import { NextResponse } from 'next/server';
import { findById } from '@/db/users';
import SpotifyWebApi from 'spotify-web-api-node';
import { logger } from '@/lib/logger';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export async function GET(request: Request) {
  try {
  const cookies = request.headers.get('cookie');
    logger.log('Raw cookies:', cookies);

    if (!cookies) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const sessionCookie = cookies.split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('session='));
    
    logger.log('Session cookie:', sessionCookie);

    if (!sessionCookie) {
      logger.log('No session cookie found');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = sessionCookie.split('=')[1];
    const userId = session ? parseInt(session, 10) : null;
    logger.log('Session value:', session);

    if (!session) {
      logger.log('Empty session value');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Check if the user exists in our database
    const user = await findById(session);
    logger.log('Database lookup result:', user);
    
    if (!user) {
      logger.log('User not found in database');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    logger.log('User authenticated:', user.id);
    
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    logger.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}