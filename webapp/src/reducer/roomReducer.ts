import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store/index';
import { Request, Room, User } from '../types';

interface RoomState {
  roomID: string;
  roomObj: Room | undefined;
  paused: boolean;
  nowPlaying: SpotifyApi.TrackObjectFull | undefined;
  nowRequest: Request | undefined;
  listeners: User[];
}

const initialState: RoomState = {
  roomID: "",
  roomObj: undefined,
  paused: true,
  nowPlaying: undefined,
  nowRequest: undefined,
  listeners: [],
};

export const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoomID: (state: RoomState, action: PayloadAction<string>) => {
      state.roomID = action.payload;
    },
    setRoomObj: (state: RoomState, action: PayloadAction<Room | undefined>) => {
      state.roomObj = action.payload;
    },
    setPaused: (state: RoomState, action: PayloadAction<boolean>) => {
      state.paused = action.payload;
    },
    setNowPlaying: (state: RoomState, action: PayloadAction<SpotifyApi.TrackObjectFull | undefined>) => {
      state.nowPlaying = action.payload;
    },
    setNowRequest: (state: RoomState, action: PayloadAction<Request | undefined>) => {
      state.nowRequest = action.payload;
    },
    setListeners: (state: RoomState, action: PayloadAction<User[]>) => {
      state.listeners = action.payload;
    },
  },
});

export const { setRoomID, setRoomObj, setPaused, setNowPlaying, setNowRequest, setListeners } = roomSlice.actions;

export const selectRoomID = (state: RootState) => state.room.roomID;
export const selectRoomObj = (state: RootState) => state.room.roomObj;
export const isRoomPaused = (state: RootState) => state.room.paused;
export const selectNowPlaying = (state: RootState) => state.room.nowPlaying;
export const selectNowRequest = (state: RootState) => state.room.nowRequest;
export const selectRoomListeners = (state: RootState) => state.room.listeners;

export default roomSlice.reducer;