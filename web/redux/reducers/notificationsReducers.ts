import { createReducer } from '@reduxjs/toolkit';
import { ADD_NOTIFICATION, REMOVE_NOTIFICATION } from '../actions';

export type AppNotification = {
  id: number;
  message: string;
  visibility?: 'public' | 'prive';
};

interface NotificationState {
  notifications: AppNotification[];
}

const initialState: NotificationState = {
  notifications: [],
};


const notificationsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(ADD_NOTIFICATION, (state, action) => {
      state.notifications.push(action.payload);
    })
    .addCase(REMOVE_NOTIFICATION, (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    });
});




export default notificationsReducer;
