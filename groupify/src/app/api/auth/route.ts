import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';
import bcrypt from 'bcryptjs';
import { findByUsername, register } from '@/db/users'; // Adjust the import path as needed

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export async function POST(request: Request) {
  try {
    const { type, username, password } = await request.json();

    if (!type || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'login') {
      // Handle login
      const user = await findByUsername(username);
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      // Generate a unique state for Spotify authentication
      const state = new Date().getTime().toString();
      const authorizeURL = spotifyApi.createAuthorizeURL(['user-read-email', 'user-read-private'], state);

      console.log('Storing state for login:', state);
      return NextResponse.json({ redirect: authorizeURL });
    } else if (type === 'register') {
      // Handle registration
      const user = await register(username, password);
      if (!user) {
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
      }

      // Generate a unique state for Spotify authentication
      const state = new Date().getTime().toString();
      const authorizeURL = spotifyApi.createAuthorizeURL(['user-read-email', 'user-read-private'], state);

      console.log('Storing state for registration:', state);
      return NextResponse.json({ redirect: authorizeURL });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in auth route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
