import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export async function GET() {
  const scopes = ['user-read-email', 'user-read-private', 'playlist-modify-public', 'playlist-modify-private'];
  const state = new Date().getTime().toString(); // Generate a unique state
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

  // Store state in cookies for validation
  const headers = new Headers();
  headers.append('Set-Cookie', `spotifyAuthState=${state}; HttpOnly; Path=/; SameSite=Strict`);
  console.log('Generated state:', state); // Debugging

  return NextResponse.redirect(authorizeURL, { headers });
}
