import { createReducer } from '@reduxjs/toolkit';
import { 
  OPEN_LEFT_NAVBAR, 
  OPEN_RIGHT_NAVBAR, 
  OPEN_RIGHT_HEADER_PANEL, 
  SELECT, MAIN_OPEN_RIGHT_SIDE_PANEL, 
  TOGGLE_RIGHT_SIDEBAR, 
  SET_RIGHT_SIDEBAR_ITEMS, 
  SET_RIGHT_SIDEBAR_USERS,
  SELECT_USER
} from '../actions';

interface SidebarItem {
  label: string;
  link?: string;
}

interface UserItem {
  id: string;
  prenom: string;
  nom: string;
}

interface User {
  id: string;
  prenom: string;
  nom: string;
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
  right_sidebar_users: UserItem[];
  select: string | null;
  selecte_chat_user: User | null;  // Modifié pour accepter un utilisateur ou null
}

const initialState: NavigationState = {
  left_navbar: false,
  right_navbar: false,
  header_right_panel: false,
  main_content_right_panel: false,
  right_sidebar_open: false,
  right_sidebar_items: {},
  right_sidebar_users: [],
  select: null,
  selecte_chat_user: null,  // Initialisé à null
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
      state.right_sidebar_items = {
        [menuId]: items,
      };
    })
    .addCase(SET_RIGHT_SIDEBAR_USERS, (state, action) => {
      state.right_sidebar_users = action.payload;
    })
    .addCase(SELECT_USER, (state, action) => {
      state.selecte_chat_user = action.payload;  // Met à jour l'utilisateur sélectionné
    });
});

export default navigationReducer;
