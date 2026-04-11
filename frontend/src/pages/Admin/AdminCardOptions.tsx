import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../app/store";
import {
  fetchCardOptions,
  createCardOption,
  updateCardOption,
  deleteCardOption,
  selectCardOptions,
  selectAdminLoading,
  type CardOption,
} from "../../features/admin/adminSlice";

const CATEGORIES = [
  { key: "chip_type", label: "Chip Types" },
  { key: "finish", label: "Finishes" },
  { key: "material", label: "Materials" },
];

const inputStyle: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 6,
  padding: "7px 10px",
  color: "#e2e8f0",
  fontSize: 13,
  outline: "none",
  width: "100%",
};

interface OptionFormData {
  value: string;
  label: string;
  price_addon: string;
  is_active: boolean;
  sort_order: string;
}

const emptyForm = (): OptionFormData => ({
  value: "",
  label: "",
  price_addon: "0",
  is_active: true,
  sort_order: "0",
});

export default function AdminCardOptions() {
  const dispatch = useDispatch<AppDispatch>();
  const allOptions = useSelector(selectCardOptions);
  const loading = useSelector(selectAdminLoading);

  const [activeTab, setActiveTab] = useState("chip_type");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OptionFormData>(emptyForm());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCardOptions());
  }, [dispatch]);

  const options = allOptions.filter((o) => o.category === activeTab);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (opt: CardOption) => {
    setEditingId(opt.id);
    setForm({
      value: opt.value,
      label: opt.label,
      price_addon: String(opt.price_addon),
      is_active: opt.is_active,
      sort_order: String(opt.sort_order),
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const data = {
      category: activeTab,
      value: form.value.trim(),
      label: form.label.trim(),
      price_addon: parseFloat(form.price_addon) || 0,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order) || 0,
    };
    if (!data.value || !data.label) return;

    if (editingId) {
      await dispatch(updateCardOption({ id: editingId, ...data }));
    } else {
      await dispatch(createCardOption(data));
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await dispatch(deleteCardOption(id));
    setDeletingId(null);
  };

  const handleToggle = async (opt: CardOption) => {
    await dispatch(updateCardOption({ id: opt.id, is_active: !opt.is_active }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Card Options</h1>
        <button
          onClick={openCreate}
          style={{
            background: "#e05c1a",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Add Option
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #1e293b", paddingBottom: 0 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === cat.key ? "2px solid #e05c1a" : "2px solid transparent",
              padding: "10px 20px",
              color: activeTab === cat.key ? "#e05c1a" : "#64748b",
              fontSize: 14,
              fontWeight: activeTab === cat.key ? 600 : 400,
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {cat.label}
            <span style={{
              marginLeft: 8,
              background: "#1e293b",
              color: "#94a3b8",
              borderRadius: 10,
              padding: "1px 7px",
              fontSize: 11,
            }}>
              {allOptions.filter((o) => o.category === cat.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Options table */}
      <div style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
        {loading && options.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 14 }}>Loading…</div>
        ) : options.length === 0 ? (
          <div style={{ color: "#475569", fontSize: 14 }}>No options yet. Add one above.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                {["Value", "Label", "Price Add-on", "Order", "Active", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0 12px 12px 0", color: "#64748b", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...options].sort((a, b) => a.sort_order - b.sort_order).map((opt) => (
                <tr key={opt.id} style={{ borderBottom: "1px solid #0f172a" }}>
                  <td style={{ padding: "10px 12px 10px 0", color: "#e2e8f0", fontWeight: 600 }}>{opt.value}</td>
                  <td style={{ padding: "10px 12px 10px 0", color: "#94a3b8" }}>{opt.label}</td>
                  <td style={{ padding: "10px 12px 10px 0", color: opt.price_addon > 0 ? "#e05c1a" : "#64748b" }}>
                    {opt.price_addon > 0 ? `+₹${opt.price_addon.toFixed(2)}` : "—"}
                  </td>
                  <td style={{ padding: "10px 12px 10px 0", color: "#64748b" }}>{opt.sort_order}</td>
                  <td style={{ padding: "10px 12px 10px 0" }}>
                    <button
                      onClick={() => handleToggle(opt)}
                      style={{
                        background: opt.is_active ? "#22c55e22" : "#ef444422",
                        border: "none",
                        borderRadius: 6,
                        padding: "3px 10px",
                        color: opt.is_active ? "#22c55e" : "#ef4444",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {opt.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ padding: "10px 0" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => openEdit(opt)}
                        style={{ background: "#1e293b", border: "none", borderRadius: 6, padding: "4px 10px", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(opt.id)}
                        disabled={deletingId === opt.id}
                        style={{
                          background: "#ef444422",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                          color: "#ef4444",
                          fontSize: 12,
                          cursor: "pointer",
                          opacity: deletingId === opt.id ? 0.5 : 1,
                        }}
                      >
                        {deletingId === opt.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            background: "#0f1623",
            border: "1px solid #1e293b",
            borderRadius: 14,
            padding: 28,
            width: 400,
            maxWidth: "90vw",
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", margin: "0 0 20px" }}>
              {editingId ? "Edit Option" : "Add Option"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Value (internal key)</label>
                <input style={inputStyle} value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="e.g. RFID" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Label (display name)</label>
                <input style={inputStyle} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. RFID Chip" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Price Add-on ($)</label>
                <input type="number" min="0" step="0.01" style={inputStyle} value={form.price_addon} onChange={(e) => setForm((f) => ({ ...f, price_addon: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Sort Order</label>
                <input type="number" min="0" style={inputStyle} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  id="is_active"
                  style={{ accentColor: "#e05c1a", width: 16, height: 16 }}
                />
                <label htmlFor="is_active" style={{ fontSize: 13, color: "#94a3b8" }}>Active</label>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "#1e293b", border: "none", borderRadius: 8, padding: "8px 18px", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                style={{ background: "#e05c1a", border: "none", borderRadius: 8, padding: "8px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
