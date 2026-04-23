import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../app/store";
import { api } from "../../shared/utils/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  card_type: string;
  printer: string;
  print_side: string;
  orientation: string;
  chip_type: string;
  finish: string;
  material: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  front_field_count: number;
  back_field_count: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  shipping_address: {
    first_name?: string;
    last_name?: string;
    address1?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  shipping_method: string;
  shipping_cost: number;
  payment_method: string;
  subtotal: number;
  promo_discount: number;
  tax: number;
  grand_total: number;
  total_cards: number;
  items: OrderItem[];
  created_at: string | null;
  updated_at: string | null;
}

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_ORDER = ["CONFIRM", "INPROGRESS", "REVIEW", "PRINTING", "SHIPPING", "DISPATCHED"];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  ENQUIRY:    { bg: "#334155", color: "#94a3b8", label: "Enquiry"     },
  CONFIRM:    { bg: "#1e3a5f", color: "#60a5fa", label: "Confirm"     },
  ONHOLD:     { bg: "#2d2a12", color: "#fbbf24", label: "On Hold"     },
  INPROGRESS: { bg: "#2d1a0e", color: "#fb923c", label: "In Progress" },
  REVIEW:     { bg: "#2a2610", color: "#facc15", label: "Review"      },
  PRINTING:   { bg: "#1e1a2e", color: "#a78bfa", label: "Printing"    },
  SHIPPING:   { bg: "#1e2d3e", color: "#38bdf8", label: "Shipping"    },
  DISPATCHED: { bg: "#1a2e1a", color: "#22c55e", label: "Dispatched"  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.ENQUIRY;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: s.bg, color: s.color, letterSpacing: 0.4,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function StatusTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_ORDER.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "16px 0 0" }}>
      {STATUS_ORDER.map((s, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const st = STATUS_STYLES[s];
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STATUS_ORDER.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? (active ? st.color : "#22c55e") : "#1e2330",
                border: `2px solid ${done ? (active ? st.color : "#22c55e") : "#2a2f3e"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: done ? "#0f172a" : "#475569", fontWeight: 700,
                transition: "all 0.3s",
              }}>
                {done && !active ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: done ? (active ? st.color : "#22c55e") : "#475569", whiteSpace: "nowrap", letterSpacing: 0.5 }}>
                {st.label.toUpperCase()}
              </span>
            </div>
            {i < STATUS_ORDER.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < currentIdx ? "#22c55e" : "#2a2f3e", margin: "0 2px", marginBottom: 16, transition: "all 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Order Card ─────────────────────────────────────────────────────────────

function OrderCard({ order, isExpanded, onToggle }: {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const createdDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—";

  const shippingName = [order.shipping_address.first_name, order.shipping_address.last_name].filter(Boolean).join(" ");
  const shippingCity = [order.shipping_address.city, order.shipping_address.state, order.shipping_address.country].filter(Boolean).join(", ");

  return (
    <div style={{
      background: "#1a1e28", border: "1px solid #2a2f3e", borderRadius: 14,
      overflow: "hidden", transition: "box-shadow 0.2s",
      boxShadow: isExpanded ? "0 8px 32px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
    }}>
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", cursor: "pointer",
          background: isExpanded ? "#1e2330" : "transparent",
          borderBottom: isExpanded ? "1px solid #2a2f3e" : "none",
          transition: "background 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>
              #{order.order_number}
            </div>
            <div style={{ fontSize: 12, color: "#475569" }}>{createdDate}</div>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#e05c1a" }}>
              ₹{order.grand_total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{order.total_cards} cards</div>
          </div>
          <div style={{ color: "#475569", fontSize: 16, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>▾</div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div style={{ padding: "20px" }}>
          <StatusTimeline status={order.status} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 20 }}>
            {/* Shipping info */}
            <div style={{ background: "#13161d", borderRadius: 10, padding: "14px 16px", border: "1px solid #2a2f3e" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 1, marginBottom: 8 }}>SHIPPING TO</div>
              {shippingName && <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 600 }}>{shippingName}</div>}
              {shippingCity && <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{shippingCity}</div>}
              <div style={{ fontSize: 11, color: "#475569", marginTop: 6, textTransform: "capitalize" }}>
                {order.shipping_method} shipping
              </div>
            </div>

            {/* Payment info */}
            <div style={{ background: "#13161d", borderRadius: 10, padding: "14px 16px", border: "1px solid #2a2f3e" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 1, marginBottom: 8 }}>PAYMENT</div>
              <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 600, textTransform: "capitalize" }}>{order.payment_method.replace("_", " ")}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                Subtotal: ₹{order.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              {order.promo_discount > 0 && (
                <div style={{ fontSize: 12, color: "#22c55e" }}>
                  Discount: -₹{order.promo_discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              )}
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Tax: ₹{order.tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e05c1a", marginTop: 4 }}>
                Total: ₹{order.grand_total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Items table */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 1, marginBottom: 10 }}>ORDER ITEMS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {order.items.map((item) => (
                <div key={item.id} style={{
                  background: "#13161d", borderRadius: 10, padding: "12px 16px",
                  border: "1px solid #2a2f3e",
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{item.card_type}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                      {item.printer} · {item.print_side} · {item.material} · {item.finish} · {item.chip_type}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{item.orientation}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      {item.quantity} × ₹{item.unit_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                      ₹{item.total_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Orders Page ────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((s: RootState) => !!s.auth.user);
  const user = useSelector((s: RootState) => s.auth.user);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError(null);
    api.get<Order[]>(`/api/orders/?page=${page}&per_page=10`)
      .then((data) => {
        if (page === 1) {
          setOrders(data);
        } else {
          setOrders((prev) => [...prev, ...data]);
        }
        setHasMore(data.length === 10);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message ?? "Failed to load orders");
        setLoading(false);
      });
  }, [isLoggedIn, page]);

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
    : "";

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f1a", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div style={{
        background: "#13161d", borderBottom: "1px solid #1e2330",
        padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: "#1e2330", border: "1px solid #2a2f3e", color: "#94a3b8", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            ← Home
          </button>
          <div style={{ width: 1, height: 20, background: "#2a2f3e" }} />
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>My Orders</span>
            {displayName && <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{displayName}</span>}
          </div>
        </div>
        <button
          onClick={() => navigate("/designer/new")}
          style={{ background: "#e05c1a", border: "none", color: "#fff", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
        >
          + New Order
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>
        {loading && orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>⟳</div>
            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            <div style={{ color: "#475569", fontSize: 14 }}>Loading your orders…</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ color: "#ef4444", fontSize: 14, marginBottom: 16 }}>{error}</div>
            <button onClick={() => { setPage(1); setOrders([]); }} style={{ background: "#e05c1a", border: "none", color: "#fff", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4 }}>📋</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>No orders yet</div>
            <div style={{ color: "#475569", fontSize: 14, marginBottom: 24 }}>Your placed orders will appear here</div>
            <button onClick={() => navigate("/designer/new")} style={{ background: "#e05c1a", border: "none", color: "#fff", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              Design Your First Card
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                {orders.length} order{orders.length !== 1 ? "s" : ""} found
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isExpanded={expandedId === order.id}
                  onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                />
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  style={{ background: "#1e2330", border: "1px solid #2a2f3e", color: loading ? "#475569" : "#94a3b8", borderRadius: 8, padding: "10px 28px", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  {loading ? "Loading…" : "Load More Orders"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
