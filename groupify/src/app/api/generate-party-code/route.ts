import { NextResponse } from 'next/server';
import playlists from '@/db/playlists';
import { generateCode } from '@/lib/utils';
import { sanitizeInput } from '@/lib/utils';

export async function POST(request: Request) {
    try {
        const { UserID, isPublic, Name, Description } = await request.json();
        const sanitizedName = sanitizeInput(Name);
        const sanitizedDescription = sanitizeInput(Description);
        const code = generateCode();
        const playlistID = await playlists.createPlaylist(sanitizedName, UserID, isPublic, code, sanitizedDescription);
        await playlists.joinPlaylist(code, UserID);
        return NextResponse.json({
            success: true,
            code: code,
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
