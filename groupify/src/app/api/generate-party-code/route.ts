import { NextResponse } from 'next/server';
import playlists from '@/db/playlists';
import tracks from '@/db/tracks';
export async function POST(request: Request) {

    const generateCode = (): string => {
        const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        const numberChars = "0123456789";
        const symbolChars = "!@#$%^&*()_+[]{}|;:,.<>?";
      
        let allChars = uppercaseChars + lowercaseChars + numberChars + symbolChars;
        
        let code = "";
        for (let i = 0; i < 8; i++) {
          const randomIndex = Math.floor(Math.random() * allChars.length);
          code += allChars[randomIndex];
        }
        console.log("Generated code:", code); // Debugging
        return code;
      };
    
    
    try {
        const { UserID, isPublic } = await request.json();
        const code = generateCode();
        const playlistID = await playlists.createPlaylist(UserID + code, UserID, isPublic, code);
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
