import { NextResponse, NextRequest } from 'next/server';
import playlists from '@/db/playlists';

export async function POST(request: NextRequest) {    
    try {
        const { PartyCode } = await request.json();
        const session = request.cookies.get('session')?.value;

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        
        if (!PartyCode) {
            return NextResponse.json(
                { error: 'Party code is required' },
                { status: 400 }
            );
        }

        const PlaylistID = await playlists.joinPlaylist(PartyCode, session);
        
        if (!PlaylistID) {
            return NextResponse.json(
                { error: 'Invalid party code' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Joined party successfully",
            playlistID: PlaylistID
        });
    } catch (error) {
        console.error('Error in joining party code route:', error);
        return NextResponse.json(
            { error: 'Failed to join party code' },
            { status: 500 }
        );
    }
}
