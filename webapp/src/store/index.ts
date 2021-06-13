import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import authSlice from '../reducer/authReducer';

export const store = configureStore({
  reducer: {
    authorization: authSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;