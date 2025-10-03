import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, recreatePool } from '@/lib/db';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    logger.log('Development database reset requested');

    // Force database re-initialization (drops and recreates all tables)
    await initializeDatabase(true);

    // Recreate connection pool
    recreatePool();

    // CLEAR ALL CACHE - This is the missing piece!
    cache.clear();
    logger.log('All cache cleared');

    logger.log('Database and connection pool reset completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database, connection pool, and cache reset successfully',
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error resetting database:', errorMessage);

    return NextResponse.json(
      {
        error: 'Failed to reset database',
        details: errorMessage,
        success: false,
      },
      { status: 500 }
    );
  }
}
