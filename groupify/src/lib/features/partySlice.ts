import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAll } from '../actions';

interface PartyState {
  selectedPartyCode: string;
  isOwner: boolean; 
  isJoined: boolean; 
  timestamp: number | null;
  playlistID: string;
}

const initialState: PartyState = {
  selectedPartyCode: '',
  isOwner: false,
  isJoined: false,
  timestamp: null,
  playlistID: ''
};

export const partySlice = createSlice({
  name: 'party',
  initialState,
  reducers: {
    setPartyCodeOwner: (state, action: PayloadAction<string>) => {
      state.selectedPartyCode = action.payload;
      state.isOwner = true;
      state.isJoined = true;
      state.timestamp = Date.now();
    },
    setPartyCode: (state, action: PayloadAction<string>) => {
      state.selectedPartyCode = action.payload;
      state.isJoined = true;
      state.timestamp = Date.now();
    },
    setPlaylistID: (state, action: PayloadAction<string>) => {
      state.playlistID = action.payload;
    },
    selectPartyCode: (state, action) => {
      state.selectedPartyCode = action.payload.code;
      state.isOwner = action.payload.isOwner;
      state.isJoined = true;
      state.timestamp = Date.now();
    },
    clearPartyCode: (state) => {
      state.selectedPartyCode = '';
      state.isJoined = false;
      state.timestamp = null;
    },
    clearAllPartyCode: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAll, () => initialState);
  },
});

export const { setPartyCodeOwner, setPartyCode, setPlaylistID, selectPartyCode, clearPartyCode, clearAllPartyCode } = partySlice.actions;
export default partySlice.reducer; 