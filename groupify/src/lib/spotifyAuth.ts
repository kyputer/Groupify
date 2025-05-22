import SpotifyWebApi from 'spotify-web-api-node';
import { NextResponse } from 'next/server';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export function generateAuthorizeURL(state: string): string {
  const scopes = ['user-read-email', 'user-read-private', 'playlist-modify-public', 'playlist-modify-private'];
  return spotifyApi.createAuthorizeURL(scopes, state);
}

export async function handleCallback(code: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const data = await spotifyApi.authorizationCodeGrant(code);
  return {
    accessToken: data.body['access_token'],
    refreshToken: data.body['refresh_token'],
    expiresIn: data.body['expires_in'],
  };
}

export function setAuthCookies(response: NextResponse, state: string): void {
  response.cookies.set('spotifyAuthState', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

export function validateState(requestState: string, storedState: string): boolean {
  return requestState === storedState;
}
