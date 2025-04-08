// redux/actions/settingsActions.ts
import { createAction } from '@reduxjs/toolkit';

export const OPEN_LEFT_NAVBAR = createAction('OPEN_LEFT_NAVBAR');
export const OPEN_RIGHT_NAVBAR = createAction<boolean>('OPEN_RIGHT_NAVBAR');
export const OPEN_RIGHT_HEADER_PANEL = createAction('OPEN_RIGHT_HEADER_PANEL');
export const MAIN_OPEN_RIGHT_SIDE_PANEL = createAction('MAIN_OPEN_RIGHT_SIDE_PANEL');
export const SELECT = createAction<any>('SELECT');  // Add payload type


export const TOGGLE_RIGHT_SIDEBAR = createAction<boolean>('TOGGLE_RIGHT_SIDEBAR');
export const SET_RIGHT_SIDEBAR_ITEMS = createAction<{
  menuId: string;
  items: { label: string; link?: string }[];
}>("SET_RIGHT_SIDEBAR_ITEMS");
