import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Only allow reset in development environment
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Reset only allowed in development environment' },
        { status: 403 }
      );
    }

    // Force database reinitialization
    await initializeDatabase(true);

    // Clear session cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Database reset successful' 
    });
    
    response.cookies.set('session', '', { maxAge: 0 });
    
    return response;
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { error: 'Failed to reset database' },
      { status: 500 }
    );
  }
} 