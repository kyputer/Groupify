import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PartyState {
  partyCode: string;
  isOwner: boolean;
  isJoined: boolean;
}

const initialState: PartyState = {
  partyCode: '',
  isOwner: false,
  isJoined: false,
};

export const partySlice = createSlice({
  name: 'party',
  initialState,
  reducers: {
    setPartyCodeOwner: (state, action: PayloadAction<string>) => {
      state.partyCode = action.payload;
      state.isOwner = true;
      state.isJoined = true;
    },
    setPartyCode: (state, action: PayloadAction<string>) => {
      state.partyCode = action.payload;
      state.isOwner = false;
      state.isJoined = true;
    },
    clearPartyCode: (state) => {
      state.partyCode = '';
      state.isOwner = false;
      state.isJoined = false;
    },
  },
});

export const { setPartyCodeOwner, setPartyCode, clearPartyCode } = partySlice.actions;
export default partySlice.reducer; 