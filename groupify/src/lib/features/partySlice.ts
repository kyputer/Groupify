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
    setPartyCodeOwner: (state, action) => {
      state.selectedPartyCode = action.payload;
      state.isOwner = true;
      state.isJoined = true;
      state.timestamp = Date.now();
      state.playlistID = action.payload.playlistID;
    },
    setPartyCode: (state, action) => {
      state.selectedPartyCode = action.payload.code;
      state.isJoined = true;
      state.timestamp = Date.now();
      state.playlistID = action.payload.playlistID;
    },
    selectPartyCode: (state, action) => {
      state.selectedPartyCode = action.payload.code;
      state.isOwner = action.payload.isOwner;
      state.isJoined = true;
      state.timestamp = Date.now();
      state.playlistID = action.payload.playlistID;
    },
    clearPartyCode: () => {
      return initialState;
    },
    clearAllPartyCode: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAll, () => initialState);
  },
});

export const { setPartyCodeOwner, setPartyCode, selectPartyCode, clearPartyCode, clearAllPartyCode } = partySlice.actions;
export default partySlice.reducer; 