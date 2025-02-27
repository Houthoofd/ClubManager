// redux/reducers/settingsReducer.ts
import { createReducer } from '@reduxjs/toolkit';
import { OPEN_LEFT_NAVBAR, OPEN_RIGHT_NAVBAR, OPEN_RIGHT_HEADER_PANEL } from '../actions';

interface NavigationState {
  left_navbar: boolean;
  right_navbar: boolean;
  header_right_panel: boolean;
}

const initialState: NavigationState = {
  left_navbar: false,
  right_navbar: false,
  header_right_panel: false
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
});

export default navigationReducer;
