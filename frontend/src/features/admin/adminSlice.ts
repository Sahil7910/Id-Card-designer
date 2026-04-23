import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { api } from "../../shared/utils/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminOrderItem {
  id: string;
  design_id: string | null;
  thumbnail_url: string | null;
  card_type: string;
  printer: string;
  print_side: string;
  orientation: string;
  finish: string;
  chip_type: string;
  material: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  front_field_count: number;
  back_field_count: number;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  status: string;
  grand_total: number;
  subtotal: number;
  promo_discount: number;
  tax: number;
  shipping_cost: number;
  total_cards: number;
  payment_method: string;
  shipping_method: string;
  shipping_address: Record<string, string>;
  tracking_number: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_id: string | null;
  items: AdminOrderItem[];
}

export const ALL_ORDER_STATUSES = [
  "ENQUIRY", "CONFIRM", "ONHOLD", "INPROGRESS", "REVIEW",
  "PRINTING", "SHIPPING", "DISPATCHED",
] as const;
export type OrderStatus = typeof ALL_ORDER_STATUSES[number];

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
  role: string;
  customer_code: string | null;
  created_at: string | null;
}

export const STAFF_ROLES = ["DESIGN", "PRINTING", "SHIPPING", "ADMIN"] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export interface AdminStats {
  total_orders: number;
  total_revenue: number;
  total_users: number;
  total_customers: number;
  total_staff: number;
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
  orderDetail: AdminOrder | null;
  pricingConfig: PricingConfig[];
  cardOptions: CardOption[];
  users: AdminUser[];
  loading: boolean;
  detailLoading: boolean;
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
    const result = await api.patch<{ id: string; status: string }>(`/api/orders/${id}/status`, { status });
    return result;
  }
);

export const fetchAdminOrderDetail = createAsyncThunk(
  "admin/fetchOrderDetail",
  async (orderId: string) => {
    return api.get<AdminOrder>(`/api/admin/orders/${orderId}`);
  }
);

export const fetchAdminUsers = createAsyncThunk("admin/fetchUsers", async () => {
  return api.get<AdminUser[]>("/api/admin/users");
});

export const createStaffUser = createAsyncThunk(
  "admin/createStaffUser",
  async (
    data: { email: string; password: string; first_name?: string; last_name?: string; role: StaffRole },
    { rejectWithValue }
  ) => {
    try {
      return await api.post<AdminUser>("/api/admin/users", data);
    } catch (err: unknown) {
      const detail = (err as { message?: string })?.message ?? "Failed to create user";
      return rejectWithValue(detail);
    }
  }
);

export const updateAdminUser = createAsyncThunk(
  "admin/updateAdminUser",
  async (
    { id, ...data }: { id: string; role?: string; is_active?: boolean; first_name?: string; last_name?: string },
    { rejectWithValue }
  ) => {
    try {
      return await api.put<AdminUser>(`/api/admin/users/${id}`, data);
    } catch (err: unknown) {
      const detail = (err as { message?: string })?.message ?? "Failed to update user";
      return rejectWithValue(detail);
    }
  }
);

export const deactivateUser = createAsyncThunk(
  "admin/deactivateUser",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.del(`/api/admin/users/${id}`);
      return id;
    } catch (err: unknown) {
      const detail = (err as { message?: string })?.message ?? "Failed to deactivate user";
      return rejectWithValue(detail);
    }
  }
);

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
  orderDetail: null,
  pricingConfig: [],
  cardOptions: [],
  users: [],
  loading: false,
  detailLoading: false,
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
        // Also update the detail view if it's open
        if (state.orderDetail?.id === action.payload.id) {
          state.orderDetail.status = action.payload.status;
        }
      })

      .addCase(fetchAdminOrderDetail.pending, (state) => { state.detailLoading = true; })
      .addCase(fetchAdminOrderDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.orderDetail = action.payload;
      })
      .addCase(fetchAdminOrderDetail.rejected, (state) => { state.detailLoading = false; })

      .addCase(fetchAdminUsers.pending, pending)
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, rejected)

      .addCase(createStaffUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
      })
      .addCase(createStaffUser.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Failed to create user";
      })

      .addCase(updateAdminUser.fulfilled, (state, action) => {
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = action.payload;
      })

      .addCase(deactivateUser.fulfilled, (state, action) => {
        const idx = state.users.findIndex((u) => u.id === action.payload);
        if (idx !== -1) state.users[idx].is_active = false;
      });
  },
});

export const adminActions = adminSlice.actions;
export default adminSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────────────────
export const selectAdminStats = (state: RootState) => state.admin.stats;
export const selectAdminOrders = (state: RootState) => state.admin.orders;
export const selectAdminOrderDetail = (state: RootState) => state.admin.orderDetail;
export const selectPricingConfig = (state: RootState) => state.admin.pricingConfig;
export const selectCardOptions = (state: RootState) => state.admin.cardOptions;
export const selectAdminUsers = (state: RootState) => state.admin.users;
export const selectAdminLoading = (state: RootState) => state.admin.loading;
export const selectAdminDetailLoading = (state: RootState) => state.admin.detailLoading;
export const selectAdminError = (state: RootState) => state.admin.error;
