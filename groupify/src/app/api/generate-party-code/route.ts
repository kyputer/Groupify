import { NextRequest, NextResponse } from 'next/server';
import playlists from '@/db/playlists';
import { generateCode } from '@/lib/utils';
import { sanitizeInput } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const { isPublic, Name, Description } = await request.json();
        const session = request.cookies.get('session')?.value;
        if (!session) {
            console.log('No session found');
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
        }
        const sanitizedName = sanitizeInput(Name);
        const sanitizedDescription = sanitizeInput(Description);
        
        const playlistID = await playlists.createPlaylist(sanitizedName, session, isPublic, sanitizedDescription);
        await playlists.joinPlaylist(playlistID.code, session);
        return NextResponse.json({
            success: true,
            code: playlistID.code,
            playlistID: playlistID,
            message: "Party code generated successfully"
        });
    } catch (error) {
        console.error('Error in generating party code route:', error);
        return NextResponse.json(
            { error: 'Failed to generate party code' },
            { status: 500 }
        );
    }
}
