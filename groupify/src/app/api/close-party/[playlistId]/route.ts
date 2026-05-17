import { NextResponse, NextRequest } from 'next/server';
import playlists from '@/db/playlists';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const { playlistId } = await params;
    const session = request.cookies.get('session')?.value;

    console.log('Close Party API called with id:', playlistId);
    console.log('Session:', session);

    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // The id parameter is now a code instead of the actual playlist ID
    await playlists.closePlaylist(playlistId, session);
    console.log('Closed party successfully');
    return NextResponse.json({
      success: true,
      message: 'Closed party successfully',
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
