import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  authentifie: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      state.authentifie = true;
      state.user = action.payload; // Store user data here
    },
    logout(state) {
      state.authentifie = false;
      state.user = null;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;