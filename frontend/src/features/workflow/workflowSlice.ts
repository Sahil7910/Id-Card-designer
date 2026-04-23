import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { api, uploadFile } from "../../shared/utils/api";
import type { AdminOrder } from "../admin/adminSlice";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_by_role: string | null;
  note: string | null;
  changed_at: string | null;
}

export interface OrderAttachment {
  id: string;
  order_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string | null;
}

interface WorkflowState {
  orders: AdminOrder[];
  orderDetail: AdminOrder | null;
  auditLogs: AuditLogEntry[];
  attachments: OrderAttachment[];
  loading: boolean;
  detailLoading: boolean;
  auditLoading: boolean;
  attachmentsLoading: boolean;
  uploadLoading: boolean;
  trackingLoading: boolean;
  error: string | null;
}

// ── Thunks ─────────────────────────────────────────────────────────────────────

export const fetchDesignQueue = createAsyncThunk("workflow/fetchDesignQueue", async () => {
  return api.get<AdminOrder[]>("/api/design-queue/");
});

export const fetchPrintQueue = createAsyncThunk("workflow/fetchPrintQueue", async () => {
  return api.get<AdminOrder[]>("/api/print-queue/");
});

export const fetchShippingQueue = createAsyncThunk("workflow/fetchShippingQueue", async () => {
  return api.get<AdminOrder[]>("/api/shipping-queue/");
});

export const fetchQueueOrderDetail = createAsyncThunk(
  "workflow/fetchQueueOrderDetail",
  async ({ queue, orderId }: { queue: string; orderId: string }) => {
    return api.get<AdminOrder>(`/api/${queue}/${orderId}`);
  }
);

export const fetchOrderAudit = createAsyncThunk(
  "workflow/fetchOrderAudit",
  async ({ queue, orderId }: { queue: string; orderId: string }) => {
    return api.get<AuditLogEntry[]>(`/api/${queue}/${orderId}/audit`);
  }
);

export const fetchOrderAttachments = createAsyncThunk(
  "workflow/fetchOrderAttachments",
  async ({ queue, orderId }: { queue: string; orderId: string }) => {
    return api.get<OrderAttachment[]>(`/api/${queue}/${orderId}/attachments`);
  }
);

export const uploadAttachment = createAsyncThunk(
  "workflow/uploadAttachment",
  async ({ orderId, formData }: { orderId: string; formData: FormData }, { rejectWithValue }) => {
    try {
      return await uploadFile<OrderAttachment>(`/api/design-queue/${orderId}/attachments`, formData);
    } catch (err: unknown) {
      const detail = (err as { message?: string })?.message ?? "Upload failed";
      return rejectWithValue(detail);
    }
  }
);

export const updateTracking = createAsyncThunk(
  "workflow/updateTracking",
  async (
    { orderId, data }: {
      orderId: string;
      data: { tracking_number?: string; courier_name?: string; tracking_url?: string; note?: string };
    },
    { rejectWithValue }
  ) => {
    try {
      return await api.patch<{ id: string; tracking_number: string | null; courier_name: string | null; tracking_url: string | null }>(
        `/api/shipping-queue/${orderId}/tracking`,
        data
      );
    } catch (err: unknown) {
      const detail = (err as { message?: string })?.message ?? "Failed to update tracking";
      return rejectWithValue(detail);
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────────

const initialState: WorkflowState = {
  orders: [],
  orderDetail: null,
  auditLogs: [],
  attachments: [],
  loading: false,
  detailLoading: false,
  auditLoading: false,
  attachmentsLoading: false,
  uploadLoading: false,
  trackingLoading: false,
  error: null,
};

const workflowSlice = createSlice({
  name: "workflow",
  initialState,
  reducers: {
    clearWorkflowError(state) {
      state.error = null;
    },
    clearOrderDetail(state) {
      state.orderDetail = null;
      state.auditLogs = [];
      state.attachments = [];
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state: WorkflowState) => { state.loading = true; state.error = null; };
    const setError = (state: WorkflowState, action: { error: { message?: string } }) => {
      state.loading = false;
      state.error = action.error.message ?? "An error occurred";
    };

    builder
      // Queue lists
      .addCase(fetchDesignQueue.pending, setLoading)
      .addCase(fetchDesignQueue.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchDesignQueue.rejected, setError)

      .addCase(fetchPrintQueue.pending, setLoading)
      .addCase(fetchPrintQueue.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchPrintQueue.rejected, setError)

      .addCase(fetchShippingQueue.pending, setLoading)
      .addCase(fetchShippingQueue.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchShippingQueue.rejected, setError)

      // Order detail
      .addCase(fetchQueueOrderDetail.pending, (state) => { state.detailLoading = true; })
      .addCase(fetchQueueOrderDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.orderDetail = action.payload;
      })
      .addCase(fetchQueueOrderDetail.rejected, (state) => { state.detailLoading = false; })

      // Audit logs
      .addCase(fetchOrderAudit.pending, (state) => { state.auditLoading = true; })
      .addCase(fetchOrderAudit.fulfilled, (state, action) => {
        state.auditLoading = false;
        state.auditLogs = action.payload;
      })
      .addCase(fetchOrderAudit.rejected, (state) => { state.auditLoading = false; })

      // Attachments
      .addCase(fetchOrderAttachments.pending, (state) => { state.attachmentsLoading = true; })
      .addCase(fetchOrderAttachments.fulfilled, (state, action) => {
        state.attachmentsLoading = false;
        state.attachments = action.payload;
      })
      .addCase(fetchOrderAttachments.rejected, (state) => { state.attachmentsLoading = false; })

      // Upload attachment
      .addCase(uploadAttachment.pending, (state) => { state.uploadLoading = true; })
      .addCase(uploadAttachment.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.attachments.push(action.payload);
      })
      .addCase(uploadAttachment.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = (action.payload as string) ?? "Upload failed";
      })

      // Tracking update
      .addCase(updateTracking.pending, (state) => { state.trackingLoading = true; })
      .addCase(updateTracking.fulfilled, (state, action) => {
        state.trackingLoading = false;
        if (state.orderDetail) {
          state.orderDetail.tracking_number = action.payload.tracking_number;
          state.orderDetail.courier_name = action.payload.courier_name;
          state.orderDetail.tracking_url = action.payload.tracking_url;
        }
      })
      .addCase(updateTracking.rejected, (state, action) => {
        state.trackingLoading = false;
        state.error = (action.payload as string) ?? "Tracking update failed";
      });
  },
});

export const workflowActions = workflowSlice.actions;
export default workflowSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────────────────
export const selectWorkflowOrders = (state: RootState) => state.workflow.orders;
export const selectWorkflowOrderDetail = (state: RootState) => state.workflow.orderDetail;
export const selectWorkflowAuditLogs = (state: RootState) => state.workflow.auditLogs;
export const selectWorkflowAttachments = (state: RootState) => state.workflow.attachments;
export const selectWorkflowLoading = (state: RootState) => state.workflow.loading;
export const selectWorkflowDetailLoading = (state: RootState) => state.workflow.detailLoading;
export const selectWorkflowUploadLoading = (state: RootState) => state.workflow.uploadLoading;
export const selectWorkflowTrackingLoading = (state: RootState) => state.workflow.trackingLoading;
export const selectWorkflowError = (state: RootState) => state.workflow.error;
