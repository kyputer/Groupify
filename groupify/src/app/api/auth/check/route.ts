import { NextResponse } from 'next/server';
import { findById } from '@/db/users';

export async function GET(request: Request) {
  try {
  const cookies = request.headers.get('cookie');
    console.log('Raw cookies:', cookies);

    if (!cookies) {
      console.log('No cookies found in request');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const sessionCookie = cookies.split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('session='));
    
    console.log('Session cookie:', sessionCookie);

    if (!sessionCookie) {
      console.log('No session cookie found');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = sessionCookie.split('=')[1];
    console.log('Session value:', session);

    if (!session) {
      console.log('Empty session value');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Check if the user exists in our database
    const user = await findById(session);
    console.log('Database lookup result:', user);
    
    if (!user) {
      console.log('User not found in database');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    console.log('User authenticated:', user.id);
    
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}