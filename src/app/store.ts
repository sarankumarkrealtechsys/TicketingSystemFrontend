import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";

// Generic UI slice
interface UiState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
}

const initialUiState: UiState = {
  theme: "light",
  sidebarOpen: true,
};

const uiSlice = createSlice({
  name: "ui",
  initialState: initialUiState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { toggleTheme, toggleSidebar } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
