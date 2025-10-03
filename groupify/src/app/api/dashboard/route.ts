import { NextResponse, NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { Song } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value;

    logger.log('Session:', session);
    if (!session) {
      logger.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return empty dashboard if no ID is provided

    logger.log('No ID provided');
    return NextResponse.json({
      PlayedJson: [] as Song[],
      HotJson: [] as Song[],
      HotVotes: [] as Vote[],
      UserID: session,
    });
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
