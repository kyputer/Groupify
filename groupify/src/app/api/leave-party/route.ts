import { NextResponse } from 'next/server';
import party from '@/db/party';


export async function POST(request: Request) {
    try {
        const { body } = await request.json();
        
    if (!body.code || !body.userID || !body.partyID) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    await party.leaveParty(body.partyID, body.code, body.userID);

    return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error leaving party:', error);
        return NextResponse.json({ error: 'Failed to leave party' }, { status: 500 });
    }
}