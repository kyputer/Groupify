import { NextResponse } from 'next/server';
import playlists from '@/db/playlists';

export async function POST(request: Request) {    
    try {
        const { UserID, PartyCode } = await request.json();
        const PlaylistID = await playlists.joinPlaylist(PartyCode, UserID);
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
