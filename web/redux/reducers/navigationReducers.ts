// navigationReducer.ts
import { createReducer } from '@reduxjs/toolkit';
import { OPEN_LEFT_NAVBAR, OPEN_RIGHT_NAVBAR, OPEN_RIGHT_HEADER_PANEL, SELECT, MAIN_OPEN_RIGHT_SIDE_PANEL, TOGGLE_RIGHT_SIDEBAR, SET_RIGHT_SIDEBAR_ITEMS } from '../actions';

interface SidebarItem {
  label: string;
  link?: string;
}

interface NavigationState {
  left_navbar: boolean;
  right_navbar: boolean;
  header_right_panel: boolean;
  main_content_right_panel: boolean;
  right_sidebar_open: boolean;
  right_sidebar_items: {
    [menuId: string]: SidebarItem[];
  };
  select: string | null;
}

const initialState: NavigationState = {
  left_navbar: false,
  right_navbar: false,
  header_right_panel: false,
  main_content_right_panel: false,
  right_sidebar_open: false,
  right_sidebar_items: {},
  select: null,
};

const navigationReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(OPEN_LEFT_NAVBAR, (state) => {
      state.left_navbar = !state.left_navbar;
    })
    .addCase(OPEN_RIGHT_NAVBAR, (state, action) => {
      state.right_navbar = action.payload;
    })
    .addCase(OPEN_RIGHT_HEADER_PANEL, (state) => {
      state.header_right_panel = !state.header_right_panel;
    })
    .addCase(MAIN_OPEN_RIGHT_SIDE_PANEL, (state) => {
      state.main_content_right_panel = !state.main_content_right_panel;
    })
    .addCase(SELECT, (state, action) => {
      state.select = action.payload;
    })
    .addCase(TOGGLE_RIGHT_SIDEBAR, (state, action) => {
      state.right_sidebar_open = action.payload;
    })
    .addCase(SET_RIGHT_SIDEBAR_ITEMS, (state, action) => {
      const { menuId, items } = action.payload;
    
      // Remplace les items du menuId actuel par les nouveaux éléments
      state.right_sidebar_items = {
        [menuId]: items,
      };
    });
    
    
    
});

export default navigationReducer;
