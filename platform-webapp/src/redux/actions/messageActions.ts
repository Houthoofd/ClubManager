// redux/actions/notificationActions.ts
import { createAction } from '@reduxjs/toolkit';
import type { AppNotificationMessage } from '../reducers';

export const ADD_MESSAGE_NOTIFICATION = createAction <AppNotificationMessage>('ADD_MESSAGE_NOTIFICATION');
export const REMOVE_MESSAGE_NOTIFICATION = createAction<number>('REMOVE_MESSAGE_NOTIFICATION');