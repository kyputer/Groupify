import { configureStore } from '@reduxjs/toolkit';
import partyReducer from './features/partySlice';
import userReducer from './features/userSlice';

export const store = configureStore({
  reducer: {
    party: partyReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;