import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findByUsername, register } from '@/db/users';

export async function POST(request: Request) {
  try {
    const { type, username, password } = await request.json();

    if (!type || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'login') {
      const user = await findByUsername(username);
      console.log("USER: ", user)
      if (user && bcrypt.compareSync(password, user.password_hash)) {
        const response = NextResponse.json({ success: true, message: 'Login successful' });
        response.cookies.set('session', user.id.toString(), { httpOnly: true, path: '/' });
        return response;
      } else if (user) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Error in auth route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
