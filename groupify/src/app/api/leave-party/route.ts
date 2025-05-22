import { NextRequest, NextResponse } from 'next/server';
import playlists from '@/db/playlists';

export async function POST(request: NextRequest) {
    try {
        const { PartyCode } = await request.json();
        const session = request.cookies.get('session')?.value;
        
        if (!session) {
            console.log('No session found');
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
        }
        if (!PartyCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // TODO: Implement leave party
        await playlists.leavePlaylist(PartyCode, session);
        return NextResponse.json({
            success: true,
            message: "Successfully left party",
            status: 200
        });
    } catch (error) {
        console.error('Error leaving party:', error);
        return NextResponse.json({ error: 'Failed to leave party' }, { status: 500 });
    }
}
