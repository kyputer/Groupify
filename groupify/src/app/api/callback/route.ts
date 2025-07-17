import { NextResponse } from 'next/server';
import { saveSpotifyTokensForUser } from '@/lib/spotifyTokens';
import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';

dotenv.config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Get cookies from request
  const cookies = request.headers.get('cookie');
  console.log('Callback cookies:', cookies); // Add this line

  let userId: string | null = null;
  let storedState: string | null = null;
  if (cookies) {
    const userCookie = cookies.split(';').map(c => c.trim()).find(c => c.startsWith('spotifyAuthUser='));
    userId = userCookie ? userCookie.split('=')[1] : null;
    const stateCookie = cookies.split(';').map(c => c.trim()).find(c => c.startsWith('spotifyAuthState='));
    storedState = stateCookie ? stateCookie.split('=')[1] : null;
  }

  if (!code || !state || !userId || !storedState) {
    return NextResponse.json({ error: 'Missing code, state, or userId' }, { status: 400 });
  }

  if (state !== storedState) {
    console.error('State mismatch during Spotify callback');
    return NextResponse.json({ error: 'State mismatch' }, { status: 400 });
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];
    const expiresIn = data.body['expires_in'];

    // Save tokens for the user
    await saveSpotifyTokensForUser(userId, accessToken, refreshToken, expiresIn);

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    const origin = url.origin;
    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (err) {
    console.error('Error during authorization code grant:', err);
    return NextResponse.json({ error: 'Authorization failed' }, { status: 500 });
  }
}
