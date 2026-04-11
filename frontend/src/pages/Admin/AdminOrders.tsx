import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../app/store";
import {
  fetchAdminOrders,
  updateOrderStatus,
  selectAdminOrders,
  selectAdminLoading,
} from "../../features/admin/adminSlice";

const STATUS_OPTIONS = ["confirmed", "printing", "packaging", "shipped", "delivered"];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#3b82f6",
  printing: "#f59e0b",
  packaging: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#22c55e",
};

const cellStyle: React.CSSProperties = { padding: "12px 12px 12px 0", fontSize: 13, verticalAlign: "middle" };
const thStyle: React.CSSProperties = { ...cellStyle, color: "#64748b", fontWeight: 500, borderBottom: "1px solid #1e293b", paddingBottom: 12 };

export default function AdminOrders() {
  const dispatch = useDispatch<AppDispatch>();
  const orders = useSelector(selectAdminOrders);
  const loading = useSelector(selectAdminLoading);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAdminOrders({ search, status: statusFilter }));
  }, [dispatch, search, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    await dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
    setUpdatingId(null);
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", marginBottom: 24, marginTop: 0 }}>Orders</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search by order # or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 340,
            background: "#0f1623",
            border: "1px solid #1e293b",
            borderRadius: 8,
            padding: "8px 14px",
            color: "#e2e8f0",
            fontSize: 13,
            outline: "none",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: "#0f1623",
            border: "1px solid #1e293b",
            borderRadius: 8,
            padding: "8px 14px",
            color: "#e2e8f0",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12, padding: 24, overflowX: "auto" }}>
        {loading && orders.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 14 }}>Loading orders…</div>
        ) : orders.length === 0 ? (
          <div style={{ color: "#475569", fontSize: 14 }}>No orders found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Order #", "Customer", "Date", "Cards", "Total", "Payment", "Status", "Actions"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #0f172a" }}>
                  <td style={{ ...cellStyle, color: "#e05c1a", fontWeight: 600 }}>{order.order_number}</td>
                  <td style={cellStyle}>
                    <div style={{ color: "#e2e8f0" }}>{order.customer_name || "—"}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>{order.customer_email}</div>
                  </td>
                  <td style={{ ...cellStyle, color: "#64748b" }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ ...cellStyle, color: "#94a3b8" }}>{order.total_cards}</td>
                  <td style={{ ...cellStyle, color: "#e2e8f0", fontWeight: 600 }}>₹{order.grand_total.toFixed(2)}</td>
                  <td style={{ ...cellStyle, color: "#94a3b8", textTransform: "capitalize" }}>{order.payment_method}</td>
                  <td style={cellStyle}>
                    <span style={{
                      background: `${STATUS_COLORS[order.status] ?? "#64748b"}22`,
                      color: STATUS_COLORS[order.status] ?? "#64748b",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 6,
                        padding: "4px 8px",
                        color: "#e2e8f0",
                        fontSize: 12,
                        cursor: "pointer",
                        opacity: updatingId === order.id ? 0.5 : 1,
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
