import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  status: string;
  role: string;
  genres?: any;
  grades?: any;
  abonnement?: any;
  dateOfBirth?: string;
}

interface AuthState {
  authentifie: boolean;
  user: User | null;
}

const initialState: AuthState = {
  authentifie: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.authentifie = true;
      state.user = action.payload;
    },
    logout: (state) => {
      state.authentifie = false;
      state.user = null;
    },
    // AJOUTÉ: Alias pour compatibilité si nécessaire
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.authentifie = true;
      state.user = action.payload;
    },
  },
});

// CORRIGÉ: Export des actions incluant loginSuccess pour compatibilité
export const { setUser, logout, loginSuccess } = authSlice.actions;
export default authSlice.reducer;