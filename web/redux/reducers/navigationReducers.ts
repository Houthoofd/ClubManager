// redux/reducers/navigationReducer.ts
import { createReducer } from '@reduxjs/toolkit';
import { OPEN_LEFT_NAVBAR, OPEN_RIGHT_NAVBAR, OPEN_RIGHT_HEADER_PANEL, SELECT } from '../actions';

interface NavigationState {
  left_navbar: boolean;
  right_navbar: boolean;
  header_right_panel: boolean;
  select: any; // Adjust the type based on what you're selecting, e.g., string or object
}

const initialState: NavigationState = {
  left_navbar: false,
  right_navbar: false,
  header_right_panel: false,
  select: null
};

const navigationReducer = createReducer(initialState, (builder) => {
  builder.addCase(OPEN_LEFT_NAVBAR, (state) => {
    state.left_navbar = !state.left_navbar;
  });
  builder.addCase(OPEN_RIGHT_NAVBAR, (state) => {
    state.right_navbar = !state.right_navbar;
  });
  builder.addCase(OPEN_RIGHT_HEADER_PANEL, (state) => {
    state.header_right_panel = !state.header_right_panel;
  });
  builder.addCase(SELECT, (state, action) => {
    state.select = action.payload;  // Use the payload here
  });
  
});

export default navigationReducer;
