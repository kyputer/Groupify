import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

type AuthUserRow = {
  id: number;
  username: string;
  email: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || '';
    console.log('Raw cookies:', cookies);

    const sessionMatch = cookies.match(/session=([^;]+)/);
    const sessionValue = sessionMatch?.[1];

    console.log('Session cookie:', sessionMatch?.[0]);
    console.log('Session value:', sessionValue);

    if (!sessionValue) {
      console.log('No session cookie found');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Use executeQuery for automatic connection management
    const users = await executeQuery<AuthUserRow>(
      'SELECT * FROM users WHERE id = ?',
      [parseInt(sessionValue, 10)]
    );

    console.log('Database lookup result:', users[0] || null);

    if (users.length === 0) {
      console.log('User not found in database');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = users[0];
    console.log('User authenticated:', user.id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error in auth check:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
