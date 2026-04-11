import { NavLink, Outlet, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: "▤", end: true },
  { to: "/admin/orders", label: "Orders", icon: "📦", end: false },
  { to: "/admin/pricing", label: "Pricing", icon: "💰", end: false },
  { to: "/admin/card-options", label: "Card Options", icon: "🗂️", end: false },
  { to: "/admin/templates", label: "Templates", icon: "🎨", end: false },
];

const sidebarW = 220;

export default function AdminLayout() {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0b0f1a", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarW,
        minWidth: sidebarW,
        background: "#0f1623",
        borderRight: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#e05c1a", letterSpacing: -0.5 }}>
            Admin Panel
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {user?.email}
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 0" }}>
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#e05c1a" : "#94a3b8",
                background: isActive ? "rgba(224,92,26,0.1)" : "transparent",
                borderLeft: isActive ? "3px solid #e05c1a" : "3px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s",
              })}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #1e293b" }}>
          <Link
            to="/"
            style={{ fontSize: 13, color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px", overflowY: "auto", minHeight: "100vh" }}>
        <Outlet />
      </main>
    </div>
  );
}
