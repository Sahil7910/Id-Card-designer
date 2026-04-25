import { NavLink, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../app/store";
import { useAppDispatch } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";

interface QueueLayoutProps {
  title: string;
  basePath: string;
  accent?: string;
}

const sidebarW = 220;

export default function QueueLayout({ title, basePath, accent = "#e05c1a" }: QueueLayoutProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0b0f1a", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
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
          <div style={{ fontSize: 20, fontWeight: 800, color: accent, letterSpacing: -0.5 }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {user?.email}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, textTransform: "capitalize" }}>
            {user?.role.replace("_", " ")}
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 0" }}>
          <NavLink
            to={basePath}
            end
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? accent : "#94a3b8",
              background: isActive ? `${accent}1a` : "transparent",
              borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
              textDecoration: "none",
              transition: "all 0.15s",
            })}
          >
            <span style={{ fontSize: 16 }}>📋</span>
            Queue
          </NavLink>
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => { dispatch(logout()); navigate("/login"); }}
            style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: "1px solid rgba(224,92,26,0.3)", background: "rgba(224,92,26,0.08)", color: "#e05c1a", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(224,92,26,0.18)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(224,92,26,0.08)"; }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "32px", overflowY: "auto", minHeight: "100vh" }}>
        <Outlet />
      </main>
    </div>
  );
}
