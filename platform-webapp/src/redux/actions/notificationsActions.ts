// redux/actions/notificationActions.ts
import { createAction } from '@reduxjs/toolkit';
import type { AppNotification } from '../reducers/notificationsReducers';

export const ADD_NOTIFICATION = createAction <AppNotification>('ADD_NOTIFICATION');
export const REMOVE_NOTIFICATION = createAction<number>('REMOVE_NOTIFICATION');
