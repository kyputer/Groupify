import { NextApiRequest, NextApiResponse } from 'next';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const scopes = ['user-read-email', 'user-read-private', 'playlist-modify-public', 'playlist-modify-private'];
    const state = new Date().getTime().toString(); // Generate a unique state
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

    // Store state in cookies for validation
    res.setHeader('Set-Cookie', `spotifyAuthState=${state}; HttpOnly; Path=/; SameSite=Strict`);
    console.log('Generated state:', state); // Debugging
    res.redirect(authorizeURL);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
