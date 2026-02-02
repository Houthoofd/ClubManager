// redux/reducers/settingsReducer.ts
import { createReducer } from '@reduxjs/toolkit';
import { TOGGLE_DARK_MODE } from '../actions';

interface SettingsState {
  darkMode: boolean;
  navbar: boolean
}

const initialState: SettingsState = {
  darkMode: false,
  navbar: false
};

const settingsReducer = createReducer(initialState, (builder) => {
  builder.addCase(TOGGLE_DARK_MODE, (state) => {
    state.darkMode = !state.darkMode;
  });
});


export default settingsReducer;