import { NextResponse } from 'next/server';
import { clearUser } from '@/lib/features/userSlice';
import { clearPartyCode } from '@/lib/features/partySlice';
import { useDispatch } from 'react-redux';
export async function POST() {
  try {
    const dispatch = useDispatch();
    // Clear session or authentication cookies
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', '', { maxAge: 0 }); // Clear session cookie
    dispatch(clearPartyCode());
    dispatch(clearUser());
    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}