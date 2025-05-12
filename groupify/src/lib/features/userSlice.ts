import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAll } from '../actions';

interface UserState {
  userId: string;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  userId: '',
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.userId = '';
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAll, () => initialState);
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer; 