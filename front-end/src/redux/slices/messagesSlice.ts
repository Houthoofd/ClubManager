import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  id: number;
  title: string;
  content: string;
  sender: string;
  date_envoi: string;
  lu: boolean;
  is_active: boolean;
}

interface MessagesState {
  messages: Message[];
  unreadMessages: Message[];
  nombreMessagesNonLus: number;
  loading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  messages: [],
  unreadMessages: [],
  nombreMessagesNonLus: 0,
  loading: false,
  error: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
      state.unreadMessages = action.payload.filter(msg => !msg.lu);
      state.nombreMessagesNonLus = state.unreadMessages.length;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.nombreMessagesNonLus = action.payload;
    },
    setNombreMessagesNonLus: (state, action: PayloadAction<number>) => {
      state.nombreMessagesNonLus = action.payload;
    },
    decrementMessagesNonLus: (state) => {
      if (state.nombreMessagesNonLus > 0) {
        state.nombreMessagesNonLus -= 1;
      }
    },
    incrementMessagesNonLus: (state) => {
      state.nombreMessagesNonLus += 1;
    },
    markMessageAsRead: (state, action: PayloadAction<number>) => {
      const messageIndex = state.messages.findIndex(msg => msg.id === action.payload);
      if (messageIndex !== -1) {
        state.messages[messageIndex].lu = true;
        state.unreadMessages = state.messages.filter(msg => !msg.lu);
        state.nombreMessagesNonLus = state.unreadMessages.length;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setLoadingMessages: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { 
  setMessages, 
  setUnreadCount, 
  setNombreMessagesNonLus,
  decrementMessagesNonLus,
  incrementMessagesNonLus,
  markMessageAsRead, 
  setLoading, 
  setLoadingMessages,
  setError 
} = messagesSlice.actions;

export default messagesSlice.reducer;
