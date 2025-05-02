import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PartyState {
  partyCode: { code: string; isOwner: boolean; isJoined: boolean, timestamp: Date }[];
  selectedPartyCode: string;
}

const initialState: PartyState = {
  partyCode: [],
  selectedPartyCode: '',
};

export const partySlice = createSlice({
  name: 'party',
  initialState,
  reducers: {
    setPartyCodeOwner: (state, action: PayloadAction<string>) => {
      if (state.partyCode.length === 0) {
        state.partyCode = [{ code: action.payload, isOwner: true, isJoined: true, timestamp: new Date() }];
      } else {
        state.partyCode = [...state.partyCode, { code: action.payload, isOwner: true, isJoined: true, timestamp: new Date() }];
      }
      state.selectedPartyCode = action.payload;
    },
    setPartyCode: (state, action: PayloadAction<string>) => {
      if (state.partyCode.length === 0) {
        state.partyCode = [{ code: action.payload, isOwner: false, isJoined: true, timestamp: new Date() }];
      } else {
        state.partyCode = [...state.partyCode, { code: action.payload, isOwner: false, isJoined: true, timestamp: new Date() }];
      }
      state.selectedPartyCode = action.payload;
    },
    selectPartyCode: (state, action: PayloadAction<string>) => {
      state.selectedPartyCode = action.payload;
    },
    clearPartyCode: (state, action: PayloadAction<string>) => {
      if (state.partyCode.length > 1) {
        state.partyCode = state.partyCode.filter((party) => party.code !== action.payload);
      } else {
        state.partyCode = [];
      }
      state.selectedPartyCode = '';
    },
    clearAllPartyCode: () => {
      return initialState;
    }
  },
});

export const { setPartyCodeOwner, setPartyCode, selectPartyCode, clearPartyCode, clearAllPartyCode } = partySlice.actions;
export default partySlice.reducer; 