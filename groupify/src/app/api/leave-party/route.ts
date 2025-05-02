import { NextResponse } from 'next/server';


export async function POST(request: Request) {
    const { code } = await request.json();
    
    if (!code) {
        return NextResponse.json({ error: 'Party code is required' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
}