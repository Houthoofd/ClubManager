// redux/actions/settingsActions.ts
import { createAction } from '@reduxjs/toolkit';

export const OPEN_LEFT_NAVBAR = createAction('OPEN_LEFT_NAVBAR');
export const OPEN_RIGHT_NAVBAR = createAction<boolean>('OPEN_RIGHT_NAVBAR');
export const OPEN_RIGHT_HEADER_PANEL = createAction('OPEN_RIGHT_HEADER_PANEL');
export const SELECT = createAction<any>('SELECT');  // Add payload type
