import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { api, setTokens, clearTokens, getToken } from "../../shared/utils/api";

// ── Types ──────────────────────────────────────────────────────────
interface UserResponse {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string | null;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  authModal: "login" | "signup" | null;
}

// ── Thunks ─────────────────────────────────────────────────────────
export const register = createAsyncThunk(
  "auth/register",
  async (payload: { email: string; password: string; first_name: string; last_name: string }) => {
    const tokens = await api.post<TokenResponse>("/api/auth/register", payload);
    setTokens(tokens.access_token, tokens.refresh_token);
    const user = await api.get<UserResponse>("/api/auth/me");
    return { token: tokens.access_token, user };
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { email: string; password: string }) => {
    const tokens = await api.post<TokenResponse>("/api/auth/login", payload);
    setTokens(tokens.access_token, tokens.refresh_token);
    const user = await api.get<UserResponse>("/api/auth/me");
    return { token: tokens.access_token, user };
  },
);

export const fetchUser = createAsyncThunk("auth/fetchUser", async () => {
  const user = await api.get<UserResponse>("/api/auth/me");
  return user;
});

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email: string) => {
    await api.post("/api/auth/forgot-password", { email });
  },
);

// ── Slice ──────────────────────────────────────────────────────────
const initialState: AuthState = {
  user: null,
  token: getToken(),
  isLoading: !!getToken(),
  error: null,
  authModal: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      clearTokens();
    },
    openAuthModal(state, action: { payload: "login" | "signup" }) {
      state.authModal = action.payload;
    },
    closeAuthModal(state) {
      state.authModal = null;
    },
  },
  extraReducers: (builder) => {
    // register
    builder.addCase(register.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.error.message) ?? "Registration failed";
    });

    // login
    builder.addCase(login.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.error.message) ?? "Login failed";
    });

    // fetchUser
    builder.addCase(fetchUser.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(fetchUser.rejected, (state) => {
      state.isLoading = false;
      state.user = null;
      state.token = null;
      clearTokens();
    });
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────
export const selectIsAuthenticated = (state: RootState) => !!state.auth.token && !!state.auth.user;
export const selectAuthUser = (state: RootState) => state.auth.user;
