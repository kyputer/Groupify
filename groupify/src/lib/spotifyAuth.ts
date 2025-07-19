// import SpotifyWebApi from 'spotify-web-api-node';
// import { NextResponse } from 'next/server';

// const spotifyApi = new SpotifyWebApi({
//   clientId: process.env.SPOTIFY_CLIENT_ID,
//   clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
//   redirectUri: process.env.SPOTIFY_REDIRECT_URI,
// });

// export function generateAuthorizeURL(state: string): string {
//   const scopes = ['user-read-email', 'user-read-private', 'playlist-modify-public', 'playlist-modify-private'];
//   return spotifyApi.createAuthorizeURL(scopes, state);
// }

// export async function handleCallback(code: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
//   const data = await spotifyApi.authorizationCodeGrant(code);
//   return {
//     accessToken: data.body['access_token'],
//     refreshToken: data.body['refresh_token'],
//     expiresIn: data.body['expires_in'],
//   };
// }

// export function setAuthCookies(response: NextResponse, state: string): void {
//   response.cookies.set('spotifyAuthState', state, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'strict',
//     path: '/',
//   });
// }

// export function validateState(requestState: string, storedState: string): boolean {
//   return requestState === storedState;
// }
import SpotifyWebApi from 'spotify-web-api-node';
import { SpotifyTrack } from '@/interfaces/SpotifyTrack';
import { getSpotifyTokensForUser, saveSpotifyTokensForUser } from '@/lib/spotifyTokens';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpirationTime: number = 0;

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

async function refreshAccessToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    accessToken = data.body['access_token'];
    tokenExpirationTime = Date.now() + (data.body['expires_in'] * 1000);
    spotifyApi.setAccessToken(accessToken);
    return true;
  } catch (error) {
    console.error('Failed to refresh Spotify access token:', error);
    return false;
  }
}

async function ensureValidToken() {
  if (!accessToken || Date.now() >= tokenExpirationTime) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.error('Failed to refresh Spotify access token');
      return false;
    }
  }
  return true;
}

export async function initializeSpotify() {
  return await refreshAccessToken();
}

function mapTrackToSpotifyTrack(track: any): SpotifyTrack {
  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist: any) => ({
      id: artist.id,
      name: artist.name
    })),
    album: {
      id: track.album.id,
      name: track.album.name,
      images: track.album.images.map((image: any) => ({
        url: image.url,
        height: image.height,
        width: image.width
      }))
    },
    external_urls: {
      spotify: track.external_urls.spotify
    },
    preview_url: track.preview_url,
    duration_ms: track.duration_ms,
    popularity: track.popularity,
    explicit: track.explicit,
    queued: false,
    queue_at: null,
    played: false,
    played_at: null,
    blacklist: false
  };
}

export async function searchTracks(query: string): Promise<SpotifyTrack[]> {
  if (!await ensureValidToken()) {
    throw new Error('Failed to initialize Spotify API');
  }

  try {
    const response = await spotifyApi.searchTracks(query, { 
      limit: 10,
      market: 'US'
    });
    return response.body.tracks?.items.map(mapTrackToSpotifyTrack) || [];
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
}

export async function getTrackDetails(trackId: string): Promise<SpotifyTrack | null> {
  if (!await ensureValidToken()) {
    throw new Error('Failed to initialize Spotify API');
  }

  try {
    const response = await spotifyApi.getTrack(trackId, { market: 'US' });
    return mapTrackToSpotifyTrack(response.body);
  } catch (error) {
    console.error('Error getting track details:', error);
    return null;
  }
}

export async function createSpotifyPlaylist(
  name: string,
  description: string,
  isPublic: boolean,
  userId: string // <-- pass your local user ID here
): Promise<any> {
  // Get the user's Spotify tokens from DB
  const { accessToken } = await getSpotifyTokensForUser(Number(userId));
  if (!accessToken) {
    throw new Error('No Spotify access token available for user');
  }

  // Set the user's access token
  spotifyApi.setAccessToken(accessToken);

  try {
    console.log("SPOTIFY PLAYLIST CREATION TRY!");
    const response = await spotifyApi.createPlaylist(name, {
      description,
      public: isPublic,
    });
    return response.body;
  } catch (error) {
    console.error('Error creating Spotify playlist:', error);
    throw error;
  }
}

export async function getMultipleTrackDetails(trackIds: string[]): Promise<SpotifyTrack[]> {
  if (!await ensureValidToken()) {
    throw new Error('Failed to initialize Spotify API');
  }

  try {
    const response = await spotifyApi.getTracks(trackIds, { market: 'US' });
    return response.body.tracks.map(mapTrackToSpotifyTrack);
  } catch (error) {
    console.error('Error getting multiple track details:', error);
    return [];
  }
}

export function getAuthorizationUrl(): string {
  return spotifyApi.createAuthorizeURL(
    ['user-read-private', 'user-read-email'], // Scopes
    'state' // Optional state parameter
  );
}

export async function handleAuthorizationCallback(code: string): Promise<void> {
  try {
    console.log("HANDLING AUTHRORIZATION CALLBACK");
    const data = await spotifyApi.authorizationCodeGrant(code);
    accessToken = data.body['access_token'];
    refreshToken = data.body['refresh_token'];
    tokenExpirationTime = Date.now() + data.body['expires_in'] * 1000;
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);
  } catch (error) {
    console.error('Error handling authorization callback:', error);
    throw error;
  }
}

export async function refreshUserAccessToken(userId: number) {
  const { refreshToken } = await getSpotifyTokensForUser(userId);
  if (!refreshToken) throw new Error('No refresh token available for refresh');
  spotifyApi.setRefreshToken(refreshToken);
  const data = await spotifyApi.refreshAccessToken();
  await saveSpotifyTokensForUser(
    userId.toString(),
    data.body['access_token'],
    data.body['refresh_token'] || refreshToken,
    data.body['expires_in']
  );
  return data.body['access_token'];
}

export async function getSpotifyUserId(): Promise<string> {
  if (!await ensureValidToken()) {
    throw new Error('Failed to initialize Spotify API');
  }

  const accessToken = spotifyApi.getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }

  try {
    spotifyApi.setAccessToken(accessToken); // Ensure the token is set
    const response = await spotifyApi.getMe();
    return response.body.id; // Returns the Spotify user ID
  } catch (error) {
    console.error('Error fetching Spotify user ID:', error);
    throw error;
  }
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default spotifyApi;