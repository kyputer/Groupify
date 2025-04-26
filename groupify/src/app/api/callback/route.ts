import { NextResponse } from 'next/server';
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

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  try {
    console.log('Received state:', state); // Debugging
    // Simulate session state validation (replace with actual session logic)
    const storedState = state; // Replace with session-stored state
    if (state !== storedState) {
      console.error('State mismatch during Spotify callback');
      return NextResponse.json({ error: 'State mismatch' }, { status: 400 });
    }

    const data = await spotifyApi.authorizationCodeGrant(code);

    // Extract access and refresh tokens
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];
    const expiresIn = data.body['expires_in'];

    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    console.log('Expires In:', expiresIn);

    // Set tokens on the Spotify API instance
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    // Simulate storing tokens in a session or database
    const session = {
      spotifyAccessToken: accessToken,
      spotifyRefreshToken: refreshToken,
      spotifyAccessTokenExpiresAt: Date.now() + expiresIn * 1000,
    };
    console.log('Session updated:', session);

    const origin = new URL(request.url).origin; // Get the origin from the request URL
    return NextResponse.redirect(`${origin}/dashboard`); // Redirect to the absolute URL of the dashboard
  } catch (err) {
    console.error('Error during authorization code grant:', err);
    return NextResponse.json({ error: 'Authorization failed' }, { status: 500 });
  }
}
