import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../app/store";
import {
  fetchDesignQueue,
  fetchPrintQueue,
  fetchShippingQueue,
  selectWorkflowOrders,
  selectWorkflowLoading,
  selectWorkflowError,
} from "../../features/workflow/workflowSlice";
import { STATUS_COLORS, statusLabel } from "./queueConstants";

interface QueueListProps {
  queue: "design-queue" | "print-queue" | "shipping-queue";
  title: string;
  emptyMessage?: string;
}

export default function QueueList({ queue, title, emptyMessage = "No orders in this queue." }: QueueListProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const orders = useSelector(selectWorkflowOrders);
  const loading = useSelector(selectWorkflowLoading);
  const error = useSelector(selectWorkflowError);

  useEffect(() => {
    if (queue === "design-queue") dispatch(fetchDesignQueue());
    else if (queue === "print-queue") dispatch(fetchPrintQueue());
    else dispatch(fetchShippingQueue());
  }, [dispatch, queue]);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", marginBottom: 24, marginTop: 0 }}>{title}</h1>

      {error && (
        <div style={{ padding: 12, background: "#3f1a1a", color: "#f87171", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div style={{ color: "#64748b" }}>Loading orders…</div>
      ) : orders.length === 0 ? (
        <div style={{ color: "#64748b", padding: 40, textAlign: "center", background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12 }}>
          {emptyMessage}
        </div>
      ) : (
        <div style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e293b", background: "#0b0f1a" }}>
                {["Order #", "Customer", "Total", "Cards", "Status", "Date"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: 14, color: "#64748b", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`${order.id}`)}
                  style={{ borderBottom: "1px solid #0f172a", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#13161d")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: 14, color: "#e05c1a", fontWeight: 600 }}>#{order.order_number}</td>
                  <td style={{ padding: 14, color: "#94a3b8", fontSize: 12 }}>{order.customer_email ?? "—"}</td>
                  <td style={{ padding: 14, color: "#e2e8f0", fontWeight: 600 }}>₹{order.grand_total.toFixed(2)}</td>
                  <td style={{ padding: 14, color: "#94a3b8" }}>{order.total_cards}</td>
                  <td style={{ padding: 14 }}>
                    <span style={{
                      background: `${STATUS_COLORS[order.status] ?? "#64748b"}22`,
                      color: STATUS_COLORS[order.status] ?? "#64748b",
                      padding: "3px 10px", borderRadius: 6,
                      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
                      textTransform: "capitalize",
                    }}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td style={{ padding: 14, color: "#64748b", fontSize: 12 }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
