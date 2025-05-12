import { NextResponse } from 'next/server';
import playlists from '@/db/playlists';

export async function POST(request: Request) {
    try {
        const { UserID, PartyCode } = await request.json();
        
    if (!UserID || !PartyCode) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // TODO: Implement leave party
     await playlists.leavePlaylist(PartyCode, UserID);
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