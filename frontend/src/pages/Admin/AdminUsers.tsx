import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../app/store";
import {
  fetchAdminUsers,
  createStaffUser,
  updateAdminUser,
  deactivateUser,
  selectAdminUsers,
  selectAdminLoading,
  selectAdminError,
  STAFF_ROLES,
  type StaffRole,
  type AdminUser,
} from "../../features/admin/adminSlice";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#e05c1a",
  DESIGN: "#3b82f6",
  PRINTING: "#8b5cf6",
  SHIPPING: "#06b6d4",
  CUSTOMER: "#64748b",
};

type TabType = "customers" | "staff";

export default function AdminUsers() {
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector(selectAdminUsers);
  const loading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);

  const [tab, setTab] = useState<TabType>("customers");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  const customers = users.filter(u => u.role === "CUSTOMER");
  const staff = users.filter(u => u.role !== "CUSTOMER");
  const displayed = tab === "customers" ? customers : staff;

  const tabBtn = (t: TabType, label: string, count: number) => (
    <button
      onClick={() => setTab(t)}
      style={{
        padding: "8px 20px",
        background: tab === t ? "#e05c1a18" : "transparent",
        color: tab === t ? "#e05c1a" : "#64748b",
        border: "none",
        borderBottom: tab === t ? "2px solid #e05c1a" : "2px solid transparent",
        fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
      }}
    >
      {label}
      <span style={{
        marginLeft: 8, fontSize: 11, padding: "1px 7px", borderRadius: 10,
        background: tab === t ? "#e05c1a33" : "#1e293b",
        color: tab === t ? "#e05c1a" : "#475569",
      }}>
        {count}
      </span>
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Users</h1>
        {tab === "staff" && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: "10px 20px", background: "#e05c1a", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            + Create Staff User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e293b", marginBottom: 20 }}>
        {tabBtn("customers", "Customers", customers.length)}
        {tabBtn("staff", "Staff Accounts", staff.length)}
      </div>

      {error && (
        <div style={{ padding: 12, background: "#3f1a1a", color: "#f87171", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b", background: "#0b0f1a" }}>
              {["Name", "Email", "Role", "Customer Code", "Status", "Created", "Actions"].map((h) => (
                tab === "customers" || h !== "Customer Code"
                  ? <th key={h} style={{ textAlign: "left", padding: 14, color: "#64748b", fontWeight: 500 }}>{h}</th>
                  : null
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && displayed.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 24, color: "#64748b", textAlign: "center" }}>Loading…</td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 24, color: "#64748b", textAlign: "center" }}>
                {tab === "customers" ? "No customers yet." : "No staff accounts yet."}
              </td></tr>
            ) : (
              displayed.map((user) => <UserRow key={user.id} user={user} showCode={tab === "customers"} />)
            )}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function UserRow({ user, showCode }: { user: AdminUser; showCode?: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(user.role);

  const handleRoleSave = async () => {
    await dispatch(updateAdminUser({ id: user.id, role }));
    setEditing(false);
  };

  const handleDeactivate = async () => {
    if (confirm(`Deactivate ${user.email}?`)) {
      await dispatch(deactivateUser(user.id));
    }
  };

  const color = ROLE_COLORS[user.role] ?? "#64748b";

  return (
    <tr style={{ borderBottom: "1px solid #0f172a" }}>
      <td style={{ padding: 14, color: "#e2e8f0" }}>
        {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
      </td>
      <td style={{ padding: 14, color: "#94a3b8" }}>{user.email}</td>
      <td style={{ padding: 14 }}>
        {editing ? (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              padding: "4px 8px", background: "#0b0f1a", color: "#e2e8f0",
              border: "1px solid #1e293b", borderRadius: 4, fontSize: 12,
            }}
          >
            <option value="CUSTOMER">CUSTOMER</option>
            {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        ) : (
          <span style={{
            background: `${color}22`, color, padding: "3px 10px", borderRadius: 6,
            fontSize: 11, fontWeight: 600, textTransform: "capitalize",
          }}>
            {user.role.replace("_", " ")}
          </span>
        )}
      </td>
      {showCode && (
        <td style={{ padding: 14, color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>
          {user.customer_code ?? "—"}
        </td>
      )}
      <td style={{ padding: 14 }}>
        <span style={{
          color: user.is_active ? "#22c55e" : "#f87171",
          fontSize: 11, fontWeight: 600,
        }}>
          {user.is_active ? "● active" : "● inactive"}
        </span>
      </td>
      <td style={{ padding: 14, color: "#64748b", fontSize: 12 }}>
        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
      </td>
      <td style={{ padding: 14, display: "flex", gap: 8 }}>
        {editing ? (
          <>
            <button
              onClick={handleRoleSave}
              style={{ padding: "4px 10px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer" }}
            >
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setRole(user.role); }}
              style={{ padding: "4px 10px", background: "transparent", color: "#64748b", border: "1px solid #1e293b", borderRadius: 4, fontSize: 11, cursor: "pointer" }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              style={{ padding: "4px 10px", background: "transparent", color: "#94a3b8", border: "1px solid #1e293b", borderRadius: 4, fontSize: 11, cursor: "pointer" }}
            >
              Edit
            </button>
            {user.is_active && (
              <button
                onClick={handleDeactivate}
                style={{ padding: "4px 10px", background: "transparent", color: "#f87171", border: "1px solid #3f1a1a", borderRadius: 4, fontSize: 11, cursor: "pointer" }}
              >
                Deactivate
              </button>
            )}
          </>
        )}
      </td>
    </tr>
  );
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<StaffRole>("DESIGN");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setSubmitting(true);
    try {
      await dispatch(createStaffUser({
        email, password, first_name: firstName, last_name: lastName, role,
      })).unwrap();
      onClose();
    } catch (e) {
      setErr(String(e) || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12,
          padding: 28, width: 480, maxWidth: "90%",
        }}
      >
        <h2 style={{ fontSize: 18, color: "#e2e8f0", margin: "0 0 20px" }}>Create Staff User</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} /></Field>
          <Field label="Temporary Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="First Name"><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} /></Field>
            <Field label="Last Name"><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} /></Field>
          </div>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} style={inputStyle}>
              {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          {err && <div style={{ color: "#f87171", fontSize: 12 }}>{err}</div>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              onClick={onClose}
              style={{ padding: "8px 18px", background: "transparent", color: "#94a3b8", border: "1px solid #1e293b", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!email || !password || submitting}
              style={{
                padding: "8px 18px",
                background: (!email || !password || submitting) ? "#1e293b" : "#e05c1a",
                color: (!email || !password || submitting) ? "#64748b" : "#fff",
                border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
                cursor: (!email || !password || submitting) ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", background: "#0b0f1a", color: "#e2e8f0",
  border: "1px solid #1e293b", borderRadius: 6, fontSize: 13, boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      {children}
    </div>
  );
}
