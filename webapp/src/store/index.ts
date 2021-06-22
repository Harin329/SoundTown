import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import authSlice from '../reducer/authReducer';
import roomSlice from '../reducer/roomReducer';

export const store = configureStore({
  reducer: {
    authorization: authSlice,
    room: roomSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;