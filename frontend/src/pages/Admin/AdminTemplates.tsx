import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../app/store";
import { toggleTemplate, deleteTemplate } from "../../features/admin/adminSlice";
import { api } from "../../shared/utils/api";

import { API_BASE } from "../../shared/utils/apiBase";

interface Template {
  id: string;
  name: string;
  category: string | null;
  accent_color: string | null;
  bg_color: string | null;
  front_fields: object[];
  back_fields: object[];
  front_bg_url: string | null;
  back_bg_url: string | null;
  orientation: string;
  is_active: boolean;
  created_at: string | null;
}

interface TemplateFormData {
  name: string;
  category: string;
  accent_color: string;
  bg_color: string;
  orientation: "Horizontal" | "Vertical";
  print_side: "Single Side" | "Both Sides";
}

const emptyForm = (): TemplateFormData => ({
  name: "",
  category: "Business",
  accent_color: "#e05c1a",
  bg_color: "#ffffff",
  orientation: "Horizontal",
  print_side: "Single Side",
});

const CATEGORIES = ["Business", "School", "Medical", "Government", "Events", "Other"];

const inputStyle: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 6,
  padding: "8px 10px",
  color: "#e2e8f0",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  display: "block",
  marginBottom: 6,
};

function ImagePickerField({
  label,
  existingUrl,
  onChange,
}: {
  label: string;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setPreview(URL.createObjectURL(file));
      onChange(file);
    }
  };

  const fullUrl = existingUrl ? `${API_BASE}${existingUrl}` : null;
  const displayUrl = preview ?? fullUrl;

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            width: 120,
            height: 76,
            borderRadius: 8,
            border: "2px dashed #334155",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            overflow: "hidden",
            flexShrink: 0,
            background: "#1e293b",
            position: "relative",
          }}
        >
          {displayUrl ? (
            <img src={displayUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 11, color: "#475569", textAlign: "center", padding: 6 }}>
              Click to<br />upload
            </span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
              padding: "7px 14px", color: "#94a3b8", fontSize: 12, cursor: "pointer", display: "block", width: "100%",
            }}
          >
            Choose Image
          </button>
          {displayUrl && (
            <div style={{ fontSize: 11, color: "#475569", marginTop: 6, wordBreak: "break-all" }}>
              {preview ? "New image selected" : existingUrl}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>JPG, PNG, or WebP</div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </div>
  );
}

export default function AdminTemplates() {
  const dispatch = useDispatch<AppDispatch>();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormData>(emptyForm());
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadTemplates = async (silent = false) => {
    if (!silent) setFetching(true);
    try {
      const data = await api.get<Template[]>("/api/admin/templates");
      setTemplates(data);
    } catch {
      // silent
    } finally {
      if (!silent) setFetching(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean))) as string[];
  const filtered = filterCategory ? templates.filter((t) => t.category === filterCategory) : templates;

  const openCreate = () => {
    setEditingId(null);
    setEditingTemplate(null);
    setForm(emptyForm());
    setFrontImageFile(null);
    setBackImageFile(null);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (t: Template) => {
    setEditingId(t.id);
    setEditingTemplate(t);
    setForm({
      name: t.name,
      category: t.category ?? "Business",
      accent_color: t.accent_color ?? "#e05c1a",
      bg_color: t.bg_color ?? "#ffffff",
      orientation: (t.orientation === "Vertical" ? "Vertical" : "Horizontal"),
      print_side: (t.back_bg_url || t.back_fields.length > 0) ? "Both Sides" : "Single Side",
    });
    setFrontImageFile(null);
    setBackImageFile(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Name is required."); return; }

    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        // For edit: if new images selected, upload them first
        let front_bg_url = editingTemplate?.front_bg_url ?? null;
        let back_bg_url = editingTemplate?.back_bg_url ?? null;

        if (frontImageFile) {
          const fd = new FormData();
          fd.append("file", frontImageFile);
          const res = await fetch(`${API_BASE}/api/uploads/image`, {
            method: "POST",
            credentials: "include",
            body: fd,
          });
          if (!res.ok) throw new Error("Front image upload failed.");
          const data = await res.json();
          front_bg_url = data.url;
        }
        if (backImageFile && form.print_side === "Both Sides") {
          const fd = new FormData();
          fd.append("file", backImageFile);
          const res = await fetch(`${API_BASE}/api/uploads/image`, {
            method: "POST",
            credentials: "include",
            body: fd,
          });
          if (!res.ok) throw new Error("Back image upload failed.");
          const data = await res.json();
          back_bg_url = data.url;
        }

        const payload = {
          name: form.name.trim(),
          category: form.category.trim() || null,
          accent_color: form.accent_color || null,
          bg_color: form.bg_color || null,
          front_bg_url,
          back_bg_url: form.print_side === "Single Side" ? null : back_bg_url,
          orientation: form.orientation,
        };
        const updated = await api.put<Template>(`/api/admin/templates/${editingId}`, payload);
        setTemplates((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
        loadTemplates(true); // silent re-fetch to sync orientation and all fields from DB
      } else {
        // Create: require at least a front image
        if (!frontImageFile) { setFormError("Front image is required."); setSaving(false); return; }

        const fd = new FormData();
        fd.append("name", form.name.trim());
        fd.append("category", form.category.trim());
        fd.append("accent_color", form.accent_color);
        fd.append("bg_color", form.bg_color);
        fd.append("orientation", form.orientation);
        fd.append("front_image", frontImageFile);
        if (backImageFile) fd.append("back_image", backImageFile);

        const res = await fetch(`${API_BASE}/api/admin/templates/upload`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail ?? "Upload failed.");
        }
        const created: Template = await res.json();
        setTemplates((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    const result = await dispatch(toggleTemplate(id));
    if (toggleTemplate.fulfilled.match(result)) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: (result.payload as { is_active: boolean }).is_active } : t))
      );
    }
    setTogglingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this template? This cannot be undone.")) return;
    setDeletingId(id);
    await dispatch(deleteTemplate(id));
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Templates</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 8, padding: "7px 14px", color: "#e2e8f0", fontSize: 13, cursor: "pointer" }}
          >
            <option value="">All categories</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <span style={{ fontSize: 13, color: "#64748b" }}>{filtered.length} template{filtered.length !== 1 ? "s" : ""}</span>
          <button
            onClick={openCreate}
            style={{ background: "#e05c1a", border: "none", borderRadius: 8, padding: "8px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            + New Template
          </button>
        </div>
      </div>

      {/* Grid */}
      {fetching ? (
        <div style={{ color: "#64748b", fontSize: 14 }}>Loading templates…</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 14 }}>No templates yet. Create one above.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((tmpl) => (
            <div
              key={tmpl.id}
              style={{
                background: "#0f1623",
                border: `1px solid ${tmpl.is_active ? "#1e293b" : "#ef444433"}`,
                borderRadius: 12,
                overflow: "hidden",
                opacity: tmpl.is_active ? 1 : 0.65,
              }}
            >
              {/* Preview area */}
              {(() => {
                const isVert = tmpl.orientation === "Vertical";
                const hasBoth = !!(tmpl.front_bg_url && tmpl.back_bg_url);
                const accent = tmpl.accent_color ?? "#e05c1a";
                const bgCol  = tmpl.bg_color ?? "#fff";

                // Scale to fit 1 or 2 cards inside 150px tall preview area
                const baseW = isVert ? 86  : 134;
                const baseH = isVert ? 134 : 86;
                const maxH  = 100; // leave room for labels
                const scale = hasBoth
                  ? Math.min(maxH / baseH, 90 / baseW)   // fit two side-by-side
                  : Math.min(maxH / baseH, 130 / baseW);
                const cardW = Math.round(baseW * scale);
                const cardH = Math.round(baseH * scale);

                const MiniCard = ({ bgUrl, label }: { bgUrl: string | null; label: string }) => (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: cardW, height: cardH, borderRadius: 5, overflow: "hidden", flexShrink: 0,
                      background: bgUrl ? `url("${API_BASE}${bgUrl}") center/cover no-repeat` : bgCol,
                      border: `2px solid ${accent}`,
                      boxShadow: "0 3px 12px rgba(0,0,0,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                    }}>
                      {!bgUrl && <span style={{ fontSize: 14, fontWeight: 800, color: accent, opacity: 0.35 }}>ID</span>}
                      {!bgUrl && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</span>
                  </div>
                );

                return (
                  <div style={{
                    height: 140,
                    background: "#13161d",
                    borderBottom: "2px solid #1e293b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: hasBoth ? 10 : 0,
                    position: "relative",
                    padding: "8px 12px",
                  }}>
                    <MiniCard bgUrl={tmpl.front_bg_url} label="Front" />
                    {hasBoth && <MiniCard bgUrl={tmpl.back_bg_url} label="Back" />}

                    {/* Active badge */}
                    <span style={{
                      position: "absolute", top: 8, right: 8,
                      background: tmpl.is_active ? "#22c55e22" : "#ef444422",
                      color: tmpl.is_active ? "#22c55e" : "#ef4444",
                      borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600,
                      backdropFilter: "blur(4px)",
                    }}>
                      {tmpl.is_active ? "Active" : "Inactive"}
                    </span>
                    {/* Orientation + sides label */}
                    <span style={{
                      position: "absolute", bottom: 8, left: 8,
                      fontSize: 10, fontWeight: 600, color: "#475569",
                      background: "#0f1623cc", borderRadius: 4, padding: "2px 6px",
                    }}>
                      {isVert ? "↕ Vertical" : "↔ Horizontal"}{hasBoth ? " · 2 sides" : ""}
                    </span>
                  </div>
                );
              })()}

              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{tmpl.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                  {tmpl.category ?? "Uncategorized"} · {tmpl.orientation ?? "Horizontal"}
                  {tmpl.front_bg_url && <span> · has image</span>}
                  {tmpl.back_bg_url && <span> · back image</span>}
                  {tmpl.created_at && <span> · {new Date(tmpl.created_at).toLocaleDateString()}</span>}
                </div>

                {/* Color swatches */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: tmpl.accent_color ?? "#e05c1a", border: "1px solid #334155" }} title={`Accent: ${tmpl.accent_color}`} />
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: tmpl.bg_color ?? "#ffffff", border: "1px solid #334155" }} title={`BG: ${tmpl.bg_color}`} />
                  <span style={{ fontSize: 11, color: "#475569" }}>{tmpl.accent_color} / {tmpl.bg_color}</span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => openEdit(tmpl)}
                    style={{ flex: 1, background: "#1e293b", border: "none", borderRadius: 6, padding: "7px 0", color: "#94a3b8", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggle(tmpl.id)}
                    disabled={togglingId === tmpl.id}
                    style={{ flex: 1, background: "#1e293b", border: "none", borderRadius: 6, padding: "7px 0", color: tmpl.is_active ? "#f59e0b" : "#22c55e", fontSize: 12, fontWeight: 500, cursor: "pointer", opacity: togglingId === tmpl.id ? 0.5 : 1 }}
                  >
                    {togglingId === tmpl.id ? "…" : tmpl.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    disabled={deletingId === tmpl.id}
                    style={{ background: "#ef444418", border: "none", borderRadius: 6, padding: "7px 14px", color: "#ef4444", fontSize: 12, cursor: "pointer", opacity: deletingId === tmpl.id ? 0.5 : 1 }}
                  >
                    {deletingId === tmpl.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            background: "#0f1623", border: "1px solid #1e293b", borderRadius: 14,
            padding: 28, width: 520, maxWidth: "95vw", maxHeight: "90vh",
            overflowY: "auto", display: "flex", flexDirection: "column", gap: 20,
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
              {editingId ? "Edit Template" : "Create New Template"}
            </h2>

            {formError && (
              <div style={{ background: "#ef444418", border: "1px solid #ef444433", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13 }}>
                {formError}
              </div>
            )}

            {/* Name */}
            <div>
              <label style={labelStyle}>Template Name *</label>
              <input
                style={inputStyle}
                placeholder="e.g. Modern Corporate"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Orientation */}
            <div>
              <label style={labelStyle}>Orientation</label>
              <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid #334155" }}>
                {(["Horizontal", "Vertical"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, orientation: opt }))}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      border: "none",
                      background: form.orientation === opt ? "#e05c1a" : "#1e293b",
                      color: form.orientation === opt ? "#fff" : "#64748b",
                      fontSize: 13,
                      fontWeight: form.orientation === opt ? 600 : 400,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {opt === "Horizontal"
                      ? <><span style={{ display: "inline-block", width: 18, height: 12, border: `2px solid ${form.orientation === "Horizontal" ? "#fff" : "#475569"}`, borderRadius: 2 }} /> Horizontal</>
                      : <><span style={{ display: "inline-block", width: 12, height: 18, border: `2px solid ${form.orientation === "Vertical" ? "#fff" : "#475569"}`, borderRadius: 2 }} /> Vertical</>
                    }
                  </button>
                ))}
              </div>
            </div>

            {/* Print Side */}
            <div>
              <label style={labelStyle}>Print Side</label>
              <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid #334155" }}>
                {(["Single Side", "Both Sides"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, print_side: opt }));
                      if (opt === "Single Side") setBackImageFile(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      border: "none",
                      background: form.print_side === opt ? "#e05c1a" : "#1e293b",
                      color: form.print_side === opt ? "#fff" : "#64748b",
                      fontSize: 13,
                      fontWeight: form.print_side === opt ? 600 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {opt === "Single Side" ? "Single Side" : "Both Sides (Front + Back)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Accent Color</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))}
                    style={{ width: 36, height: 36, padding: 2, borderRadius: 6, border: "1px solid #334155", background: "#1e293b", cursor: "pointer" }}
                  />
                  <input
                    style={{ ...inputStyle }}
                    value={form.accent_color}
                    onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))}
                    placeholder="#e05c1a"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Background Color</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={form.bg_color}
                    onChange={(e) => setForm((f) => ({ ...f, bg_color: e.target.value }))}
                    style={{ width: 36, height: 36, padding: 2, borderRadius: 6, border: "1px solid #334155", background: "#1e293b", cursor: "pointer" }}
                  />
                  <input
                    style={{ ...inputStyle }}
                    value={form.bg_color}
                    onChange={(e) => setForm((f) => ({ ...f, bg_color: e.target.value }))}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #1e293b" }} />

            {/* Image uploads */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ImagePickerField
                label={editingId ? "Front Image (leave blank to keep existing)" : "Front Card Image *"}
                existingUrl={editingTemplate?.front_bg_url}
                onChange={setFrontImageFile}
              />
              {form.print_side === "Both Sides" && (
                <ImagePickerField
                  label={editingId ? "Back Image (leave blank to keep existing)" : "Back Card Image *"}
                  existingUrl={editingTemplate?.back_bg_url}
                  onChange={setBackImageFile}
                />
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "#1e293b", border: "none", borderRadius: 8, padding: "9px 20px", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: "#e05c1a", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
