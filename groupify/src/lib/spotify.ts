import SpotifyWebApi from 'spotify-web-api-node';
import { SpotifyTrack } from '@/interfaces/SpotifyTrack';

let accessToken: string | null = null;
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
  spotify_user_id: string
): Promise<any> {
  if (!await ensureValidToken()) {
    throw new Error('Failed to initialize Spotify API');
  }

  const access_token = spotifyApi.getAccessToken();
  if (!access_token) {
    throw new Error('No access token available');
  }

  try {
    // Ensure the user-specific token is set
    // const userAccessToken = await spotifyApi.getAccessToken(); // Implement this function to fetch the user's token
    // spotifyApi.setAccessToken(userAccessToken);

    const response = await spotifyApi.createPlaylist(name, {
      description,
      public: isPublic,
    });

    return response.body; // Return the created playlist details
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
    const data = await spotifyApi.authorizationCodeGrant(code);
    accessToken = data.body['access_token'];
    tokenExpirationTime = Date.now() + data.body['expires_in'] * 1000;
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(data.body['refresh_token']);
  } catch (error) {
    console.error('Error handling authorization callback:', error);
    throw error;
  }
}

export async function refreshUserAccessToken(): Promise<void> {
  try {
    const data = await spotifyApi.refreshAccessToken();
    accessToken = data.body['access_token'];
    tokenExpirationTime = Date.now() + data.body['expires_in'] * 1000;
    spotifyApi.setAccessToken(accessToken);
  } catch (error) {
    console.error('Error refreshing user access token:', error);
    throw error;
  }
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