import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../app/store";
import {
  fetchAdminOrders,
  selectAdminOrders,
  selectAdminLoading,
  ALL_ORDER_STATUSES,
} from "../../features/admin/adminSlice";

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  ENQUIRY:    { color: "#94a3b8", bg: "#1e293b", label: "Enquiry"     },
  CONFIRM:    { color: "#60a5fa", bg: "#1e3a5f", label: "Confirm"     },
  ONHOLD:     { color: "#fbbf24", bg: "#2d2a12", label: "On Hold"     },
  INPROGRESS: { color: "#fb923c", bg: "#2d1a0e", label: "In Progress" },
  REVIEW:     { color: "#facc15", bg: "#2a2610", label: "Review"      },
  PRINTING:   { color: "#a78bfa", bg: "#1e1a2e", label: "Printing"    },
  SHIPPING:   { color: "#38bdf8", bg: "#0c2233", label: "Shipping"    },
  DISPATCHED: { color: "#4ade80", bg: "#0e2318", label: "Dispatched"  },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { color: "#94a3b8", bg: "#1e293b", label: status };
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: m.bg, color: m.color, letterSpacing: 0.4,
      border: `1px solid ${m.color}44`,
      whiteSpace: "nowrap",
    }}>
      {m.label}
    </span>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "13px 12px 13px 0", fontSize: 13, verticalAlign: "middle",
};
const thStyle: React.CSSProperties = {
  ...cellStyle,
  color: "#475569", fontWeight: 600, borderBottom: "1px solid #1e293b",
  paddingBottom: 10, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase",
};

export default function AdminOrders() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const orders = useSelector(selectAdminOrders);
  const loading = useSelector(selectAdminLoading);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAdminOrders({ search, status: statusFilter }));
  }, [dispatch, search, statusFilter]);

  const openOrder = (id: string) => navigate(`/admin/orders/${id}`);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Orders</h1>
        <div style={{ fontSize: 13, color: "#475569" }}>
          {loading ? "Loading…" : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search order # or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 220, maxWidth: 340,
            background: "#0f1623", border: "1px solid #1e293b",
            borderRadius: 8, padding: "8px 14px",
            color: "#e2e8f0", fontSize: 13, outline: "none",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: "#0f1623", border: "1px solid #1e293b",
            borderRadius: 8, padding: "8px 14px",
            color: "#e2e8f0", fontSize: 13, cursor: "pointer",
          }}
        >
          <option value="">All statuses</option>
          {ALL_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s]?.label ?? s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
        {loading && orders.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 14, padding: "32px 24px" }}>Loading orders…</div>
        ) : orders.length === 0 ? (
          <div style={{ color: "#475569", fontSize: 14, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📋</div>
            No orders found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", padding: "0 24px" }}>
              <thead>
                <tr style={{ background: "#0b0f1a" }}>
                  {["Order #", "Customer", "Date", "Cards", "Total", "Payment", "Status", ""].map((h) => (
                    <th key={h} style={{ ...thStyle, padding: "12px 12px 12px 16px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isHovered = hoveredRow === order.id;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => openOrder(order.id)}
                      onMouseEnter={() => setHoveredRow(order.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: "1px solid #0f172a",
                        cursor: "pointer",
                        background: isHovered ? "#13161d" : "transparent",
                        transition: "background 0.12s",
                      }}
                    >
                      <td style={{ ...cellStyle, paddingLeft: 16, color: "#e05c1a", fontWeight: 700 }}>
                        #{order.order_number}
                      </td>
                      <td style={{ ...cellStyle, paddingLeft: 16 }}>
                        <div style={{ color: "#e2e8f0", fontWeight: 500 }}>{order.customer_name || "—"}</div>
                        <div style={{ color: "#64748b", fontSize: 11, marginTop: 1 }}>{order.customer_email}</div>
                      </td>
                      <td style={{ ...cellStyle, paddingLeft: 16, color: "#64748b", fontSize: 12 }}>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                      <td style={{ ...cellStyle, paddingLeft: 16, color: "#94a3b8", fontWeight: 600 }}>
                        {order.total_cards}
                      </td>
                      <td style={{ ...cellStyle, paddingLeft: 16, color: "#f1f5f9", fontWeight: 700 }}>
                        ₹{order.grand_total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ ...cellStyle, paddingLeft: 16, color: "#94a3b8", textTransform: "capitalize", fontSize: 12 }}>
                        {order.payment_method.replace("_", " ")}
                      </td>
                      <td style={{ ...cellStyle, paddingLeft: 16 }}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ ...cellStyle, paddingLeft: 16 }}>
                        <span style={{
                          fontSize: 11, color: isHovered ? "#e05c1a" : "#334155",
                          fontWeight: 600, letterSpacing: 0.3, transition: "color 0.12s",
                        }}>
                          View →
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: "#334155", textAlign: "right" }}>
        Click any row to view full order details and update status
      </div>
    </div>
  );
}
