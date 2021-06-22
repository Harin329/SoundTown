import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store/index';

interface RoomState {
  roomID: string;
}

const initialState: RoomState = {
  roomID: "",
};

export const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoomID: (state: RoomState, action: PayloadAction<string>) => {
      state.roomID = action.payload;
    },
  },
});

export const { setRoomID } = roomSlice.actions;

export const selectRoomID = (state: RootState) => state.room.roomID;

export default roomSlice.reducer;