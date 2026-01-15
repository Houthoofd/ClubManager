import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './reducers/settingsReducers';
import notificationsReducer from './reducers/notificationsReducers';
import navigationReducer from './reducers/navigationReducers';
import messageReducer from './reducers/messageReducers';
import panierReducer from './slices/panierSlice';
import authReducer from './reducers/authReducer';
import messagesReducer from './slices/messagesSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    notifications: notificationsReducer,
    navigation: navigationReducer,
    message: messageReducer,
    panier: panierReducer,
    auth: authReducer,
    messages: messagesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
