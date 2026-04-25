import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { api } from "../../shared/utils/api";

// ── Types ──────────────────────────────────────────────────────────
interface UserResponse {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone: string | null;
  is_admin: boolean;
  role: "CUSTOMER" | "DESIGN" | "PRINTING" | "SHIPPING" | "ADMIN";
  customer_code: string | null;
  created_at: string | null;
}

interface AuthState {
  user: UserResponse | null;
  isLoading: boolean;
  error: string | null;
  authModal: "login" | "signup" | null;
}

// ── Thunks ─────────────────────────────────────────────────────────
export const register = createAsyncThunk(
  "auth/register",
  async (payload: { email: string; password: string; first_name: string; last_name: string }) => {
    await api.post("/api/auth/register", payload);
    const user = await api.get<UserResponse>("/api/auth/me");
    return user;
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { email: string; password: string }) => {
    await api.post("/api/auth/login", payload);
    const user = await api.get<UserResponse>("/api/auth/me");
    return user;
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

export const googleAuth = createAsyncThunk(
  "auth/googleAuth",
  async (accessToken: string) => {
    await api.post("/api/auth/google", { access_token: accessToken });
    const user = await api.get<UserResponse>("/api/auth/me");
    return user;
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await api.post("/api/auth/logout");
});

// ── Slice ──────────────────────────────────────────────────────────
const initialState: AuthState = {
  user: null,
  isLoading: true, // assume session may exist; fetchUser resolves this on startup
  error: null,
  authModal: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
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
      state.user = action.payload;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.error.message) ?? "Registration failed";
    });

    // login
    builder.addCase(login.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.error.message) ?? "Login failed";
    });

    // googleAuth
    builder.addCase(googleAuth.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(googleAuth.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(googleAuth.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message ?? "Google sign-in failed";
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
    });

    // logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.error = null;
    });
    builder.addCase(logout.rejected, (state) => {
      // Clear local state even if the server call fails
      state.user = null;
      state.error = null;
    });
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectUserRole = (state: RootState) => state.auth.user?.role ?? null;
