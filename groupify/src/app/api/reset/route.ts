import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.log('Reset database requested by session:', session);

    // Force database re-initialization (drops and recreates all tables)
    await initializeDatabase(true);

    logger.log('Database reset completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database reset successfully',
    });
  } catch (error) {
    logger.error('Error resetting database:', error);
    return NextResponse.json(
      { error: 'Failed to reset database' },
      { status: 500 }
    );
  }
}
