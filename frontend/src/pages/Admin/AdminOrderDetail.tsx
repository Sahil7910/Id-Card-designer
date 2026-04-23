import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../app/store";
import {
  fetchAdminOrderDetail,
  updateOrderStatus,
  selectAdminOrderDetail,
  selectAdminDetailLoading,
} from "../../features/admin/adminSlice";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  ENQUIRY:    { color: "#94a3b8", bg: "#1e293b", label: "Enquiry",    icon: "❓" },
  CONFIRM:    { color: "#60a5fa", bg: "#1e3a5f", label: "Confirm",    icon: "✅" },
  ONHOLD:     { color: "#fbbf24", bg: "#2d2a12", label: "On Hold",    icon: "⏸" },
  INPROGRESS: { color: "#fb923c", bg: "#2d1a0e", label: "In Progress", icon: "⚙" },
  REVIEW:     { color: "#facc15", bg: "#2a2610", label: "Review",     icon: "🔍" },
  PRINTING:   { color: "#a78bfa", bg: "#1e1a2e", label: "Printing",   icon: "🖨" },
  SHIPPING:   { color: "#38bdf8", bg: "#0c2233", label: "Shipping",   icon: "🚚" },
  DISPATCHED: { color: "#4ade80", bg: "#0e2318", label: "Dispatched", icon: "✓" },
};

// Grouped action buttons — primary actions at top, fulfillment flow below
const PRIMARY_ACTIONS = [
  { status: "CONFIRM", label: "Confirm Order", icon: "✅", accent: "#22c55e" },
  { status: "ONHOLD",  label: "Put On Hold",   icon: "⏸", accent: "#f59e0b" },
  { status: "ENQUIRY", label: "Mark Enquiry",  icon: "❓", accent: "#94a3b8" },
];

const FLOW_ACTIONS = [
  { status: "INPROGRESS", label: "In Progress", icon: "⚙" },
  { status: "REVIEW",     label: "Mark Review", icon: "🔍" },
  { status: "PRINTING",   label: "Mark Printing",  icon: "🖨" },
  { status: "SHIPPING",   label: "Mark Shipping",  icon: "🚚" },
  { status: "DISPATCHED", label: "Mark Dispatched", icon: "✓" },
];

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status, size = "md" }: { status: string; size?: "sm" | "md" | "lg" }) {
  const m = STATUS_META[status] ?? STATUS_META.ENQUIRY;
  const pad = size === "lg" ? "8px 18px" : size === "sm" ? "2px 8px" : "4px 12px";
  const fs = size === "lg" ? 15 : size === "sm" ? 11 : 13;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: pad, borderRadius: 20, fontSize: fs, fontWeight: 700,
      background: m.bg, color: m.color, letterSpacing: 0.4,
      border: `1px solid ${m.color}44`,
    }}>
      <span>{m.icon}</span> {m.label}
    </span>
  );
}

// ── Info Row ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, flexShrink: 0, marginRight: 16 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#e2e8f0", textAlign: "right" }}>{value}</span>
    </div>
  );
}

// ── Section Card ───────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12, padding: "20px 22px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 1.2, marginBottom: 14, textTransform: "uppercase" }}>{title}</div>
      {children}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const order = useSelector(selectAdminOrderDetail);
  const loading = useSelector(selectAdminDetailLoading);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (orderId) dispatch(fetchAdminOrderDetail(orderId));
  }, [dispatch, orderId]);

  const handleStatus = async (newStatus: string) => {
    if (!order || updatingStatus) return;
    setUpdatingStatus(newStatus);
    setStatusMsg(null);
    try {
      await dispatch(updateOrderStatus({ id: order.id, status: newStatus })).unwrap();
      setStatusMsg({ type: "ok", text: `Status updated to "${STATUS_META[newStatus]?.label ?? newStatus}"` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg({ type: "err", text: "Failed to update status. Please try again." });
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading && !order) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ color: "#475569", fontSize: 15 }}>Loading order…</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 40, opacity: 0.3 }}>📦</div>
        <div style={{ color: "#475569", fontSize: 15 }}>Order not found.</div>
        <button onClick={() => navigate("/admin/orders")} style={{ marginTop: 8, background: "#e05c1a", border: "none", color: "#fff", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          ← Back to Orders
        </button>
      </div>
    );
  }

  const addr = order.shipping_address ?? {};
  const createdDate = order.created_at
    ? new Date(order.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "—";
  const updatedDate = order.updated_at
    ? new Date(order.updated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => navigate("/admin/orders")}
            style={{ background: "#0f1623", border: "1px solid #1e293b", color: "#64748b", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
          >
            ← Orders
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: 0, letterSpacing: -0.3 }}>
                #{order.order_number}
              </h1>
              <StatusBadge status={order.status} size="lg" />
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 5 }}>
              Placed {createdDate} · Last updated {updatedDate}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#e05c1a" }}>
          ₹{order.grand_total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Status message toast */}
      {statusMsg && (
        <div style={{
          marginBottom: 18, padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: statusMsg.type === "ok" ? "#0e2318" : "#3b1a1a",
          color: statusMsg.type === "ok" ? "#4ade80" : "#f87171",
          border: `1px solid ${statusMsg.type === "ok" ? "#22c55e44" : "#ef444444"}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {statusMsg.type === "ok" ? "✓" : "⚠"} {statusMsg.text}
        </div>
      )}

      {/* ── Status Actions ── */}
      <SectionCard title="Update Status">
        {/* Primary actions */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>PRIMARY ACTIONS</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {PRIMARY_ACTIONS.map(({ status, label, icon, accent }) => {
              const isActive = order.status === status;
              const isBusy = updatingStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => void handleStatus(status)}
                  disabled={isActive || !!updatingStatus}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", borderRadius: 9, fontWeight: 700, fontSize: 13,
                    border: `2px solid ${isActive ? accent : accent + "44"}`,
                    background: isActive ? accent + "22" : "transparent",
                    color: isActive ? accent : accent + "bb",
                    cursor: isActive || !!updatingStatus ? "not-allowed" : "pointer",
                    opacity: !!updatingStatus && !isBusy ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive && !updatingStatus) { (e.currentTarget as HTMLButtonElement).style.background = accent + "18"; (e.currentTarget as HTMLButtonElement).style.color = accent; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = accent + "bb"; } }}
                >
                  <span style={{ fontSize: 15 }}>{isBusy ? "⟳" : icon}</span>
                  {isBusy ? "Updating…" : label}
                  {isActive && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>(current)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fulfilment flow */}
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>FULFILMENT FLOW</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FLOW_ACTIONS.map(({ status, label, icon }) => {
              const m = STATUS_META[status];
              const isActive = order.status === status;
              const isBusy = updatingStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => void handleStatus(status)}
                  disabled={isActive || !!updatingStatus}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", borderRadius: 7, fontWeight: 600, fontSize: 12,
                    border: `1px solid ${isActive ? m.color + "88" : "#1e293b"}`,
                    background: isActive ? m.bg : "#13161d",
                    color: isActive ? m.color : "#64748b",
                    cursor: isActive || !!updatingStatus ? "not-allowed" : "pointer",
                    opacity: !!updatingStatus && !isBusy ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive && !updatingStatus) { (e.currentTarget as HTMLButtonElement).style.background = m.bg; (e.currentTarget as HTMLButtonElement).style.color = m.color; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = "#13161d"; (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; } }}
                >
                  <span>{isBusy ? "⟳" : icon}</span>
                  {isBusy ? "Updating…" : label}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* ── Two-column detail grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>

        {/* Customer info */}
        <SectionCard title="Customer">
          <InfoRow label="Name" value={order.customer_name || "—"} />
          <InfoRow label="Email" value={
            <a href={`mailto:${order.customer_email ?? ""}`} style={{ color: "#60a5fa", textDecoration: "none" }}>
              {order.customer_email ?? "—"}
            </a>
          } />
          <InfoRow label="Customer ID" value={
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#94a3b8" }}>
              {order.customer_id ?? "—"}
            </span>
          } />
        </SectionCard>

        {/* Shipping address */}
        <SectionCard title="Shipping Address">
          {addr.first_name && <InfoRow label="Name" value={`${addr.first_name ?? ""} ${addr.last_name ?? ""}`.trim()} />}
          {addr.address1 && <InfoRow label="Address" value={addr.address1 + (addr.address2 ? `, ${addr.address2}` : "")} />}
          <InfoRow label="City / State" value={[addr.city, addr.state].filter(Boolean).join(", ") || "—"} />
          <InfoRow label="ZIP / Country" value={[addr.zip, addr.country].filter(Boolean).join(", ") || "—"} />
          {addr.phone && <InfoRow label="Phone" value={addr.phone} />}
          <InfoRow label="Shipping method" value={
            <span style={{ textTransform: "capitalize" }}>{order.shipping_method}</span>
          } />
        </SectionCard>

        {/* Payment & totals */}
        <SectionCard title="Payment & Totals">
          <InfoRow label="Payment method" value={
            <span style={{ textTransform: "capitalize" }}>{order.payment_method.replace("_", " ")}</span>
          } />
          <InfoRow label="Subtotal" value={`₹${order.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
          {order.promo_discount > 0 && (
            <InfoRow label="Discount" value={
              <span style={{ color: "#22c55e" }}>
                −₹{order.promo_discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            } />
          )}
          <InfoRow label="Shipping cost" value={`₹${order.shipping_cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
          <InfoRow label="Tax (GST)" value={`₹${order.tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
          <div style={{ marginTop: 10, padding: "10px 0", borderTop: "2px solid #1e293b", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>Grand Total</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#e05c1a" }}>
              ₹{order.grand_total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </SectionCard>

        {/* Order timeline */}
        <SectionCard title="Order Timeline">
          <InfoRow label="Order placed" value={createdDate} />
          <InfoRow label="Last updated" value={updatedDate} />
          <InfoRow label="Order ID" value={
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#94a3b8" }}>{order.id}</span>
          } />
          <InfoRow label="Total cards" value={
            <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{order.total_cards}</span>
          } />
        </SectionCard>
      </div>

      {/* ── Order Items ── */}
      <div style={{ marginTop: 16 }}>
        <SectionCard title={`Order Items (${order.items.length})`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {order.items.map((item, i) => (
              <div key={item.id} style={{
                background: "#13161d", borderRadius: 10, padding: "16px 18px",
                border: "1px solid #1e293b",
              }}>
                {/* Item header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                      Item {i + 1} — {item.card_type}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 3, fontFamily: "monospace" }}>{item.id}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#e05c1a" }}>
                      ₹{item.total_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {item.quantity} × ₹{item.unit_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Spec grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
                  {[
                    ["Printer",      item.printer],
                    ["Print Side",   item.print_side],
                    ["Orientation",  item.orientation],
                    ["Finish",       item.finish],
                    ["Chip",         item.chip_type],
                    ["Material",     item.material],
                    ["Quantity",     `${item.quantity} cards`],
                    ["Front fields", `${item.front_field_count} field${item.front_field_count !== 1 ? "s" : ""}`],
                    ["Back fields",  `${item.back_field_count} field${item.back_field_count !== 1 ? "s" : ""}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: "#0f1623", borderRadius: 6, padding: "7px 10px", border: "1px solid #1e293b" }}>
                      <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: 0.5, marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
