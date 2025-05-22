import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findByUsername, register } from '@/db/users';
import { refreshUserAccessToken } from '@/lib/spotify'; // Ensure this function is imported

export async function POST(request: Request) {
  try {
    const { type, username, password } = await request.json();
    console.log('Auth request:', { type, username });

    if (!type || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'login') {
      const user = await findByUsername(username);
      console.log("Found user:", user);
      
      if (user && bcrypt.compareSync(password, user.password_hash)) {
        // Refresh and set Spotify access token
        await refreshUserAccessToken(); // Ensure this function refreshes the token

        const response = NextResponse.json({ 
          success: true, 
          message: 'Login successful', 
          user: user.id.toString() 
        });
        
        // Set the session cookie with proper options
        response.cookies.set('session', user.id.toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        
        console.log('Session cookie set for user:', user.id);
        return response;
      } else if (user) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    } else if (type === 'register') {
      const user = await register(username, password);
      const response = NextResponse.json({ 
        success: true, 
        message: 'Registration successful', 
        user: user.id.toString() 
      });
      
      // Set the session cookie with proper options
      response.cookies.set('session', user.id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      
      console.log('Session cookie set for new user:', user.id);
      return response;
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Error in auth route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
