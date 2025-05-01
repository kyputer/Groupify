import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const isAuthenticated = request.cookies.get('session')?.value;

  if (!isAuthenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true });
}