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
        return NextResponse.json({ success: true, message: 'Login successful' });
      }else if (!user || bcrypt.compareSync(password, user.password_hash) === false) { 
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    } else if (type === 'register') {
      const user = await register(username, password);

      // Convert BigInt values to strings
      const sanitizedUser = {
        ...user,
        id: user.id.toString(), // Ensure BigInt is converted to string
      };

      return NextResponse.json({ success: true, message: 'Registration successful', user: sanitizedUser });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in auth route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
