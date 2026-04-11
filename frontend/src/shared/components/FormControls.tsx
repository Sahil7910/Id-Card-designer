import type { ReactNode } from "react";

// ── Btn ──────────────────────────────────────────────────────────
export function Btn({ children, ghost: _ghost, accent, onClick }: {
  children: ReactNode;
  ghost?: boolean;
  accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: accent ? "#e05c1a" : "transparent",
        border: `1px solid ${accent ? "transparent" : "#3a3f52"}`,
        color: accent ? "#fff" : "#94a3b8",
        borderRadius: 6,
        padding: "7px 14px",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

// ── Section ──────────────────────────────────────────────────────
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 10, padding: 13 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

// ── FieldRow ─────────────────────────────────────────────────────
export function FieldRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

// ── RadioGroup ───────────────────────────────────────────────────
export function RadioGroup({ options, value, onChange }: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {options.map(opt => (
        <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: value === opt ? "#e2e8f0" : "#64748b" }}>
          <div
            onClick={() => onChange(opt)}
            style={{
              width: 14, height: 14, borderRadius: "50%",
              border: `2px solid ${value === opt ? "#e05c1a" : "#3a3f52"}`,
              background: value === opt ? "#e05c1a" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            {value === opt && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />}
          </div>
          {opt}
        </label>
      ))}
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────
export function Select({ value, options, onChange, placeholder }: {
  value: string;
  options: string[];
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      style={{
        width: "100%", background: "#13161d", border: "1px solid #2a2f3e",
        color: value === "" ? "#475569" : "#e2e8f0",
        borderRadius: 7, padding: "9px 12px", fontSize: 13, outline: "none",
        cursor: "pointer", appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        paddingRight: 32,
      }}
    >
      {placeholder !== undefined && <option value="" disabled>{placeholder}</option>}
      {options.filter(o => o !== "").map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
}
