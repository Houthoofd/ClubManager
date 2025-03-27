// redux/reducers/navigationReducer.ts
import { createReducer } from '@reduxjs/toolkit';
import { OPEN_LEFT_NAVBAR, OPEN_RIGHT_NAVBAR, OPEN_RIGHT_HEADER_PANEL, SELECT, MAIN_OPEN_RIGHT_SIDE_PANEL } from '../actions';

interface NavigationState {
  left_navbar: boolean;
  right_navbar: boolean;
  header_right_panel: boolean;
  main_content_right_panel: boolean
  select: string | null; 
}

const initialState: NavigationState = {
  left_navbar: false,
  right_navbar: false,
  header_right_panel: false,
  main_content_right_panel: false,
  select: null,
};

const navigationReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(OPEN_LEFT_NAVBAR, (state) => {
      state.left_navbar = !state.left_navbar;
    })
    .addCase(OPEN_RIGHT_NAVBAR, (state, action) => {
      // Utilise le payload de l'action pour définir la valeur boolean
      state.right_navbar = action.payload;
    })
    .addCase(OPEN_RIGHT_HEADER_PANEL, (state) => {
      state.header_right_panel = !state.header_right_panel;
    })
    .addCase(MAIN_OPEN_RIGHT_SIDE_PANEL, (state) => {
      state.main_content_right_panel = !state.main_content_right_panel;
    })
    .addCase(SELECT, (state, action) => {
      state.select = action.payload;  // Assurez-vous que le payload correspond au type attendu
    });
});

export default navigationReducer;
