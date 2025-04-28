import { NextResponse } from 'next/server';

export async function POST(request: Request) {

  try {

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
    

    return NextResponse.json({
      success: true,
      code: generateCode(),
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
