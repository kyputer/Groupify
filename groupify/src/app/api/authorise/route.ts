import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export async function GET(request: Request) {
  const cookies = request.headers.get('cookie');
  const sessionCookie = cookies
    ?.split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('session='));
  const session = sessionCookie?.split('=')[1];

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const scopes = [
    'user-read-email',
    'user-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
  ];
  const state = new Date().getTime().toString();
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

  const response = NextResponse.redirect(authorizeURL);
  response.cookies.set('spotifyAuthState', state, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  });
  response.cookies.set('spotifyAuthUser', session, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  });
  return response;
}
