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
    return await refreshAccessToken();
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
    explicit: track.explicit
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

export default spotifyApi; 