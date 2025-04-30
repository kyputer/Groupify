import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Clear session or authentication cookies
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', '', { maxAge: 0 }); // Clear session cookie
        return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}