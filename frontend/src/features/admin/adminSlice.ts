import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { api } from "../../shared/utils/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminOrderItem {
  id: string;
  card_type: string;
  printer: string;
  finish: string;
  chip_type: string;
  material: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  status: string;
  grand_total: number;
  total_cards: number;
  payment_method: string;
  shipping_method: string;
  created_at: string | null;
  customer_email: string | null;
  customer_name: string | null;
  items: AdminOrderItem[];
}

export interface PricingConfig {
  key: string;
  value: number;
  label: string;
  updated_at: string | null;
}

export interface CardOption {
  id: string;
  category: string;
  value: string;
  label: string;
  price_addon: number;
  is_active: boolean;
  sort_order: number;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string | null;
}

export interface AdminStats {
  total_orders: number;
  total_revenue: number;
  total_users: number;
  active_templates: number;
  orders_by_status: Record<string, number>;
  revenue_last_30_days: number;
  orders_last_30_days: number;
  top_finishes: { value: string; count: number }[];
  top_chip_types: { value: string; count: number }[];
  top_materials: { value: string; count: number }[];
  recent_orders: AdminOrder[];
}

interface AdminState {
  stats: AdminStats | null;
  orders: AdminOrder[];
  pricingConfig: PricingConfig[];
  cardOptions: CardOption[];
  users: AdminUser[];
  loading: boolean;
  error: string | null;
}

// ── Thunks ─────────────────────────────────────────────────────────────────────

export const fetchAdminStats = createAsyncThunk("admin/fetchStats", async () => {
  return api.get<AdminStats>("/api/admin/stats");
});

export const fetchAdminOrders = createAsyncThunk(
  "admin/fetchOrders",
  async (params: { page?: number; status?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.status) qs.set("status", params.status);
    if (params.search) qs.set("search", params.search);
    const query = qs.toString() ? `?${qs}` : "";
    return api.get<AdminOrder[]>(`/api/admin/orders${query}`);
  }
);

export const fetchPricingConfig = createAsyncThunk("admin/fetchPricing", async () => {
  return api.get<PricingConfig[]>("/api/admin/pricing");
});

export const updatePricingKey = createAsyncThunk(
  "admin/updatePricing",
  async ({ key, value }: { key: string; value: number }, { rejectWithValue }) => {
    try {
      return await api.put<PricingConfig>(`/api/admin/pricing/${key}`, { value });
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Failed to update pricing";
      return rejectWithValue(detail);
    }
  }
);

export const fetchCardOptions = createAsyncThunk("admin/fetchCardOptions", async () => {
  return api.get<CardOption[]>("/api/admin/card-options");
});

export const createCardOption = createAsyncThunk(
  "admin/createCardOption",
  async (data: Omit<CardOption, "id">) => {
    return api.post<CardOption>("/api/admin/card-options", data);
  }
);

export const updateCardOption = createAsyncThunk(
  "admin/updateCardOption",
  async ({ id, ...data }: Partial<CardOption> & { id: string }) => {
    return api.put<CardOption>(`/api/admin/card-options/${id}`, data);
  }
);

export const deleteCardOption = createAsyncThunk(
  "admin/deleteCardOption",
  async (id: string) => {
    await api.del(`/api/admin/card-options/${id}`);
    return id;
  }
);

export const updateOrderStatus = createAsyncThunk(
  "admin/updateOrderStatus",
  async ({ id, status }: { id: string; status: string }) => {
    return api.put<AdminOrder>(`/api/orders/${id}/status`, { status });
  }
);

export const fetchAdminUsers = createAsyncThunk("admin/fetchUsers", async () => {
  return api.get<AdminUser[]>("/api/admin/users");
});

export const toggleTemplate = createAsyncThunk(
  "admin/toggleTemplate",
  async (id: string) => {
    return api.put<{ id: string; is_active: boolean }>(`/api/admin/templates/${id}/toggle`, {});
  }
);

export const deleteTemplate = createAsyncThunk(
  "admin/deleteTemplate",
  async (id: string) => {
    await api.del(`/api/admin/templates/${id}`);
    return id;
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────────

const initialState: AdminState = {
  stats: null,
  orders: [],
  pricingConfig: [],
  cardOptions: [],
  users: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state: AdminState) => { state.loading = true; state.error = null; };
    const rejected = (state: AdminState, action: { error: { message?: string } }) => {
      state.loading = false;
      state.error = action.error.message ?? "An error occurred";
    };

    builder
      .addCase(fetchAdminStats.pending, pending)
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, rejected)

      .addCase(fetchAdminOrders.pending, pending)
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchAdminOrders.rejected, rejected)

      .addCase(fetchPricingConfig.pending, pending)
      .addCase(fetchPricingConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.pricingConfig = action.payload;
      })
      .addCase(fetchPricingConfig.rejected, rejected)

      .addCase(updatePricingKey.fulfilled, (state, action) => {
        const idx = state.pricingConfig.findIndex((p) => p.key === action.payload.key);
        if (idx !== -1) state.pricingConfig[idx] = action.payload;
      })

      .addCase(fetchCardOptions.pending, pending)
      .addCase(fetchCardOptions.fulfilled, (state, action) => {
        state.loading = false;
        state.cardOptions = action.payload;
      })
      .addCase(fetchCardOptions.rejected, rejected)

      .addCase(createCardOption.fulfilled, (state, action) => {
        state.cardOptions.push(action.payload);
      })
      .addCase(updateCardOption.fulfilled, (state, action) => {
        const idx = state.cardOptions.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.cardOptions[idx] = action.payload;
      })
      .addCase(deleteCardOption.fulfilled, (state, action) => {
        state.cardOptions = state.cardOptions.filter((o) => o.id !== action.payload);
      })

      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.orders[idx].status = action.payload.status;
      })

      .addCase(fetchAdminUsers.pending, pending)
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, rejected);
  },
});

export const adminActions = adminSlice.actions;
export default adminSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────────────────
export const selectAdminStats = (state: RootState) => state.admin.stats;
export const selectAdminOrders = (state: RootState) => state.admin.orders;
export const selectPricingConfig = (state: RootState) => state.admin.pricingConfig;
export const selectCardOptions = (state: RootState) => state.admin.cardOptions;
export const selectAdminUsers = (state: RootState) => state.admin.users;
export const selectAdminLoading = (state: RootState) => state.admin.loading;
export const selectAdminError = (state: RootState) => state.admin.error;
