import { createReducer } from '@reduxjs/toolkit';
import { ADD_MESSAGE_NOTIFICATION, REMOVE_MESSAGE_NOTIFICATION } from '../actions';

export type AppNotificationMessage = {
  id: number;
  message: string;
  visibility?: 'public' | 'prive';
};

interface MessageNotificationState {
  notifications: AppNotificationMessage[];
}

const initialState: MessageNotificationState = {
  notifications: [],
};

const MessagesnotificationsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(ADD_MESSAGE_NOTIFICATION, (state, action) => {
      state.notifications.push(action.payload);
    })
    .addCase(REMOVE_MESSAGE_NOTIFICATION, (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    });
});

export default MessagesnotificationsReducer;
