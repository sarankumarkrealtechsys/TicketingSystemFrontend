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

const STORAGE_KEY_AUTH_SESSION = "rts_auth_session";

const loadInitialSession = (): AuthState => {
  if (typeof window === "undefined") {
    return {
      user: null,
      permissions: {},
      status: "loading",
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.user && parsed.user.id) {
        return {
          user: parsed.user,
          permissions: parsed.permissions || {},
          status: "authenticated",
        };
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return {
    user: null,
    permissions: {},
    status: "loading",
  };
};

const initialState: AuthState = loadInitialSession();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthData>) => {
      state.user = action.payload.user;
      state.permissions = action.payload.permissions || {};
      state.status = "authenticated";
      try {
        localStorage.setItem(
          STORAGE_KEY_AUTH_SESSION,
          JSON.stringify({
            user: action.payload.user,
            permissions: action.payload.permissions || {},
          }),
        );
      } catch {
        // Ignore quota errors
      }
    },
    clearSession: (state) => {
      state.user = null;
      state.permissions = {};
      state.status = "unauthenticated";
      try {
        localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
      } catch {
        // Ignore errors
      }
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
export const useCan = (permissionKey: string | string[]): boolean => {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const keys = Array.isArray(permissionKey) ? permissionKey : [permissionKey];
  return keys.some((key) => {
    const scopes = permissions[key];
    if (!scopes) return false;
    if (scopes.includes("GLOBAL")) return true;
    return scopes.length > 0;
  });
};

/**
 * Hook to check if the active user possesses a permission at a specific scope.
 * Returns true only if the key exists with that exact scope string.
 */
export const useCanAtScope = (permissionKey: string | string[], scope: string): boolean => {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const keys = Array.isArray(permissionKey) ? permissionKey : [permissionKey];
  return keys.some((key) => {
    const scopes = permissions[key];
    return Array.isArray(scopes) && scopes.includes(scope);
  });
};

export default authSlice.reducer;
