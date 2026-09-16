import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import { AuthUser, PermissionsMap, AuthData } from "./types";

export type AuthStatus =
  "idle" | "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  user: AuthUser | null;
  permissions: PermissionsMap;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  permissions: {},
  status: "loading",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthData>) => {
      state.user = action.payload.user;
      state.permissions = action.payload.permissions || {};
      state.status = "authenticated";
    },
    clearSession: (state) => {
      state.user = null;
      state.permissions = {};
      state.status = "unauthenticated";
    },
    setAuthStatus: (state, action: PayloadAction<AuthStatus>) => {
      state.status = action.payload;
    },
  },
});

export const { setSession, clearSession, setAuthStatus } = authSlice.actions;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Hook to check if the active user possesses a permission.
 * Returns true if the key exists with 'GLOBAL' or at least one scope.
 */
export const useCan = (permissionKey: string): boolean => {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const scopes = permissions[permissionKey];
  if (!scopes) return false;
  if (scopes.includes("GLOBAL")) return true;
  return scopes.length > 0;
};

export default authSlice.reducer;
