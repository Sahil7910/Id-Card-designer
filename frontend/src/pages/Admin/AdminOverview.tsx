import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../app/store";
import { fetchAdminStats, selectAdminStats, selectAdminLoading } from "../../features/admin/adminSlice";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#3b82f6",
  printing: "#f59e0b",
  packaging: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#22c55e",
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: "#0f1623",
      border: "1px solid #1e293b",
      borderRadius: 12,
      padding: "20px 24px",
    }}>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#e2e8f0" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ items, total }: { items: { value: string; count: number }[]; total: number }) {
  if (!items.length) return <div style={{ color: "#475569", fontSize: 13 }}>No data yet</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={item.value} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 100, fontSize: 13, color: "#94a3b8", flexShrink: 0 }}>{item.value}</div>
            <div style={{ flex: 1, background: "#1e293b", borderRadius: 4, height: 8, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "#e05c1a", borderRadius: 4 }} />
            </div>
            <div style={{ width: 32, fontSize: 12, color: "#64748b", textAlign: "right" }}>{item.count}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminOverview() {
  const dispatch = useDispatch<AppDispatch>();
  const stats = useSelector(selectAdminStats);
  const loading = useSelector(selectAdminLoading);

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  if (loading && !stats) {
    return <div style={{ color: "#64748b", fontSize: 16 }}>Loading analytics…</div>;
  }

  if (!stats) {
    return <div style={{ color: "#ef4444", fontSize: 16 }}>Failed to load stats.</div>;
  }

  const totalStatusOrders = Object.values(stats.orders_by_status).reduce((a, b) => a + b, 0);
  const totalFinishes = stats.top_finishes.reduce((a, b) => a + b.count, 0);
  const totalChips = stats.top_chip_types.reduce((a, b) => a + b.count, 0);
  const totalMaterials = stats.top_materials.reduce((a, b) => a + b.count, 0);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", marginBottom: 24, marginTop: 0 }}>Overview</h1>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Orders" value={stats.total_orders} />
        <StatCard label="Total Revenue" value={`₹${stats.total_revenue.toFixed(2)}`} />
        <StatCard label="Total Users" value={stats.total_users} />
        <StatCard label="Active Templates" value={stats.active_templates} />
        <StatCard
          label="Orders (Last 30 Days)"
          value={stats.orders_last_30_days}
          sub={`₹${stats.revenue_last_30_days.toFixed(2)} revenue`}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Orders by status */}
        <div style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", margin: "0 0 20px" }}>Orders by Status</h2>
          {totalStatusOrders === 0 ? (
            <div style={{ color: "#475569", fontSize: 13 }}>No orders yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(stats.orders_by_status).map(([s, count]) => (
                <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[s] ?? "#64748b" }} />
                    <span style={{ fontSize: 13, color: "#94a3b8", textTransform: "capitalize" }}>{s}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top options */}
        <div style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", margin: "0 0 16px" }}>Top Finishes</h2>
          <BarChart items={stats.top_finishes} total={totalFinishes} />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", margin: "20px 0 16px" }}>Top Chip Types</h2>
          <BarChart items={stats.top_chip_types} total={totalChips} />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", margin: "20px 0 16px" }}>Top Materials</h2>
          <BarChart items={stats.top_materials} total={totalMaterials} />
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", margin: "0 0 20px" }}>Recent Orders</h2>
        {stats.recent_orders.length === 0 ? (
          <div style={{ color: "#475569", fontSize: 13 }}>No orders yet</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  {["Order #", "Customer", "Total", "Cards", "Status", "Date"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "0 12px 12px 0", color: "#64748b", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid #0f172a" }}>
                    <td style={{ padding: "10px 12px 10px 0", color: "#e05c1a", fontWeight: 600 }}>{order.order_number}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: "#94a3b8" }}>{order.customer_email ?? "—"}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: "#e2e8f0", fontWeight: 600 }}>₹{order.grand_total.toFixed(2)}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: "#94a3b8" }}>{order.total_cards}</td>
                    <td style={{ padding: "10px 12px 10px 0" }}>
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
                    <td style={{ padding: "10px 0", color: "#64748b" }}>
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
