import { NextResponse } from 'next/server';

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
        return code;
      };
    
    const code = generateCode();

    // const { UserID } = await request.json();

    // try {
    //     const response = await fetch('https://api.groupify.com/api/v1/party/create', {
    //         method: 'POST',
    //         body: JSON.stringify({ code: code, UserID: UserID }),
    //     });
    // } catch (error) {
    //     console.error('Error in generating party code route:', error);
    //     return NextResponse.json(
    //         { error: 'Failed to generate party code' },
    //         { status: 500 }
    //     );
    // }

    return NextResponse.json({
    success: true,
    code: code,
    message: "Party code generated successfully"
    });
    
}
