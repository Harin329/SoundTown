import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store/index';

interface AuthorizationState {
  loggedIn: boolean;
  accessToken: string;
  tokenExpiryDate: string;
  displayName: string;
  uid: string;
  image_uri: string;
}

const initialState: AuthorizationState = {
  loggedIn: false,
  accessToken: '',
  tokenExpiryDate: '',
  displayName: '',
  uid: '',
  image_uri: '',
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
    setDisplayName: (state: AuthorizationState, action: PayloadAction<string>) => {
      state.displayName = action.payload;
    },
    setUID: (state: AuthorizationState, action: PayloadAction<string>) => {
      state.uid = action.payload;
    },
    setImageURI: (state: AuthorizationState, action: PayloadAction<string>) => {
      state.image_uri = action.payload;
    },
  },
});

export const { setLoggedIn, setAccessToken, setTokenExpiryDate, setDisplayName, setUID, setImageURI } = authSlice.actions;

export const selectIsLoggedIn = (state: RootState) => state.authorization.loggedIn;
export const selectAccessToken = (state: RootState) => state.authorization.accessToken;
export const selectTokenExpiryDate = (state: RootState) => state.authorization.tokenExpiryDate;
export const selectDisplayName = (state: RootState) => state.authorization.displayName;
export const selectUID = (state: RootState) => state.authorization.uid;
export const selectImageURI = (state: RootState) => state.authorization.image_uri;


export default authSlice.reducer;