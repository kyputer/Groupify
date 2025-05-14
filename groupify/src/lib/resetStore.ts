import { store } from './store';
import { clearUser } from './features/userSlice';
import { clearAllPartyCode } from './features/partySlice';

export async function resetStore() {
  try {
    // Call the reset API endpoint
    const response = await fetch('/api/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to reset database');
    }

    // Clear Redux store
    store.dispatch(clearUser());
    store.dispatch(clearAllPartyCode());

    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Error resetting store:', error);
    throw error;
  }
} 