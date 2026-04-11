import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../app/store";
import {
  fetchPricingConfig,
  updatePricingKey,
  selectPricingConfig,
  selectAdminLoading,
} from "../../features/admin/adminSlice";

const SECTIONS = [
  {
    title: "Chip Type Pricing",
    icon: "💡",
    description: "Add-on cost per card for each chip type",
    keys: ["addon_rfid", "addon_led"],
  },
  {
    title: "Shipping Costs",
    icon: "🚚",
    description: "Flat shipping fee per order by delivery speed",
    keys: ["shipping_standard", "shipping_express", "shipping_overnight"],
  },
];

export default function AdminPricing() {
  const dispatch = useDispatch<AppDispatch>();
  const configs = useSelector(selectPricingConfig);
  const loading = useSelector(selectAdminLoading);

  const [edits, setEdits]     = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState<string | null>(null);
  const [saved, setSaved]     = useState<string | null>(null);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(fetchPricingConfig());
  }, [dispatch]);

  const handleEdit = (key: string, val: string) => {
    // clear any previous error when user starts editing again
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    setEdits(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (key: string) => {
    const raw = edits[key];
    if (raw === undefined) return;
    const num = parseFloat(raw);
    if (isNaN(num) || num < 0) {
      setErrors(prev => ({ ...prev, [key]: "Enter a valid number ≥ 0" }));
      return;
    }
    setSaving(key);
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    try {
      await dispatch(updatePricingKey({ key, value: num })).unwrap();
      setSaved(key);
      setEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
      setTimeout(() => setSaved(s => s === key ? null : s), 2500);
    } catch (err: unknown) {
      // rejectWithValue returns the string directly; fallback for unexpected shapes
      const msg = typeof err === "string" ? err : (err as { detail?: string })?.detail ?? "Save failed. Please try again.";
      setErrors(prev => ({ ...prev, [key]: msg }));
    } finally {
      setSaving(null);
    }
  };

  if (loading && configs.length === 0) {
    return <div style={{ color: "#64748b", fontSize: 16, padding: 32 }}>Loading pricing config…</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", marginBottom: 8, marginTop: 0 }}>Pricing</h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>
        Manage chip type add-ons and shipping costs. Each field saves individually to the database.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 680 }}>
        {SECTIONS.map((section) => (
          <div key={section.title} style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 14, padding: 24 }}>

            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{section.icon}</span>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{section.title}</h2>
            </div>
            <p style={{ fontSize: 12, color: "#475569", margin: "0 0 18px 30px" }}>{section.description}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {section.keys.map((key) => {
                const config = configs.find((c) => c.key === key);

                if (!config) return (
                  <div key={key} style={{ fontSize: 12, color: "#f59e0b", padding: "10px 14px", background: "#1c1a0e", borderRadius: 8, border: "1px solid #f59e0b33" }}>
                    ⚠ Key <code style={{ color: "#fbbf24" }}>{key}</code> not found in DB — run <code style={{ color: "#fbbf24" }}>alembic upgrade head</code>
                  </div>
                );

                const currentVal  = edits[key] ?? String(config.value);
                const isDirty     = edits[key] !== undefined && parseFloat(edits[key]) !== config.value;
                const isSaving    = saving === key;
                const isSaved     = saved === key;
                const errorMsg    = errors[key];

                return (
                  <div key={key}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 16px", background: "#13161d", borderRadius: 9,
                      border: `1px solid ${errorMsg ? "#ef444466" : isDirty ? "#e05c1a44" : "#1e293b"}`,
                      transition: "border-color 0.15s",
                    }}>
                      {/* Label */}
                      <div style={{ flex: 1, fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>
                        {config.label}
                      </div>

                      {/* Input + Save */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#64748b", fontSize: 13, userSelect: "none" }}>₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={currentVal}
                          onChange={(e) => handleEdit(key, e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && isDirty && handleSave(key)}
                          style={{
                            width: 96,
                            background: "#1e293b",
                            border: `1px solid ${errorMsg ? "#ef4444" : isDirty ? "#e05c1a" : "#334155"}`,
                            borderRadius: 6,
                            padding: "7px 10px",
                            color: "#e2e8f0",
                            fontSize: 13,
                            outline: "none",
                            textAlign: "right",
                          }}
                        />
                        <button
                          onClick={() => handleSave(key)}
                          disabled={!isDirty || isSaving}
                          style={{
                            padding: "7px 16px",
                            background: isSaved ? "#16a34a" : isDirty ? "#e05c1a" : "#1e293b",
                            border: "none",
                            borderRadius: 6,
                            color: isDirty || isSaved ? "#fff" : "#475569",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: isDirty && !isSaving ? "pointer" : "default",
                            transition: "all 0.15s",
                            minWidth: 72,
                            opacity: isSaving ? 0.7 : 1,
                          }}
                        >
                          {isSaving ? "Saving…" : isSaved ? "✓ Saved" : "Save"}
                        </button>
                      </div>
                    </div>

                    {/* Error message */}
                    {errorMsg && (
                      <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, marginLeft: 4 }}>
                        ✕ {errorMsg}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
