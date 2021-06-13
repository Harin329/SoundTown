import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store/index';

interface AuthorizationState {
  loggedIn: boolean;
  accessToken: string;
  tokenExpiryDate: string;
}

const initialState: AuthorizationState = {
  loggedIn: false,
  accessToken: '',
  tokenExpiryDate: '',
};

export const authSlice = createSlice({
  name: 'authorization',
  initialState,
  reducers: {
    setLoggedIn: (state: AuthorizationState, action: PayloadAction<boolean>) => {
      state.loggedIn = action.payload;
    },
    setAccessToken: (state: AuthorizationState, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    setTokenExpiryDate: (state: AuthorizationState, action: PayloadAction<number>) => {
      const date = new Date()
      date.setSeconds(date.getSeconds() + action.payload);
      state.tokenExpiryDate = date.toISOString();
    },
  },
});

export const { setLoggedIn, setAccessToken, setTokenExpiryDate } = authSlice.actions;

export const selectIsLoggedIn = (state: RootState) => state.authorization.loggedIn;
export const selectAccessToken = (state: RootState) => state.authorization.accessToken;
export const selectTokenExpiryDate = (state: RootState) => state.authorization.tokenExpiryDate;

export default authSlice.reducer;