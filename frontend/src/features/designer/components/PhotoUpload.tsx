import { useState } from "react";

// ── Photo Drive Option ───────────────────────────────────────────
export function PhotoDriveOption({ icon, label, subtitle, color, onUrl }: {
  icon: string; label: string; subtitle: string; color: string; onUrl: (url: string) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState("");

  const handleImport = () => {
    const val = inputVal.trim();
    if (!val) { setError("Paste a public image URL"); return; }
    let url = val;
    const driveMatch = val.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) url = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    if (!url.startsWith("http")) { setError("Must be a valid https:// URL"); return; }
    onUrl(url);
    setShowInput(false);
    setInputVal("");
    setError("");
  };

  return (
    <div>
      <div
        onClick={() => setShowInput(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: `1px solid ${showInput ? color + "55" : "#2a2f3e"}`, background: showInput ? color + "08" : "#13161d", cursor: "pointer", transition: "all 0.15s" }}
        onMouseEnter={e => { if (!showInput) { e.currentTarget.style.borderColor = color + "55"; e.currentTarget.style.background = color + "08"; } }}
        onMouseLeave={e => { if (!showInput) { e.currentTarget.style.borderColor = "#2a2f3e"; e.currentTarget.style.background = "#13161d"; } }}
      >
        <span style={{ width: 32, height: 32, borderRadius: 8, background: color + "18", border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{label}</div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{subtitle}</div>
        </div>
        <span style={{ fontSize: 11, color, fontWeight: 600 }}>{showInput ? "\u25B2" : "\u2192"}</span>
      </div>
      {showInput && (
        <div style={{ marginTop: 6, padding: "10px 12px", background: "#0d1018", border: `1px solid ${color}33`, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>Paste shareable link or public image URL:</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={inputVal} onChange={e => { setInputVal(e.target.value); setError(""); }}
              placeholder="https://drive.google.com/file/d/..."
              style={{ flex: 1, background: "#13161d", border: `1px solid ${error ? "#ef4444" : "#2a2f3e"}`, color: "#e2e8f0", borderRadius: 6, padding: "7px 10px", fontSize: 11, outline: "none" }} />
            <button onClick={handleImport}
              style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: color, color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Import</button>
          </div>
          {error && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 5 }}>{error}</div>}
          <div style={{ fontSize: 9, color: "#334155", marginTop: 6, lineHeight: 1.5 }}>
            {"\u{1F4A1}"} Make sure the file is set to &quot;Anyone with the link can view&quot;
          </div>
        </div>
      )}
    </div>
  );
}

// ── Photo URL Option ─────────────────────────────────────────────
export function PhotoUrlOption({ onUrl }: { onUrl: (url: string) => void }) {
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = () => {
    const url = inputVal.trim();
    if (!url.startsWith("http")) { setError("Must be a valid https:// URL"); return; }
    setLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { onUrl(url); setShowInput(false); setInputVal(""); setError(""); setLoading(false); };
    img.onerror = () => { setError("Could not load image. Make sure the URL is publicly accessible."); setLoading(false); };
    img.src = url;
  };

  return (
    <div>
      <div
        onClick={() => setShowInput(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: `1px solid ${showInput ? "#f59e0b55" : "#2a2f3e"}`, background: showInput ? "#f59e0b08" : "#13161d", cursor: "pointer", transition: "all 0.15s" }}
        onMouseEnter={e => { if (!showInput) { e.currentTarget.style.borderColor = "#f59e0b55"; e.currentTarget.style.background = "#f59e0b08"; } }}
        onMouseLeave={e => { if (!showInput) { e.currentTarget.style.borderColor = "#2a2f3e"; e.currentTarget.style.background = "#13161d"; } }}
      >
        <span style={{ width: 32, height: 32, borderRadius: 8, background: "#f59e0b18", border: "1px solid #f59e0b33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{"\u{1F517}"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>Paste Image URL</div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>Any public image link</div>
        </div>
        <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>{showInput ? "\u25B2" : "\u2192"}</span>
      </div>
      {showInput && (
        <div style={{ marginTop: 6, padding: "10px 12px", background: "#0d1018", border: "1px solid #f59e0b33", borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>Paste direct image URL (.jpg, .png, .webp):</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={inputVal} onChange={e => { setInputVal(e.target.value); setError(""); }}
              placeholder="https://example.com/photo.jpg"
              style={{ flex: 1, background: "#13161d", border: `1px solid ${error ? "#ef4444" : "#2a2f3e"}`, color: "#e2e8f0", borderRadius: 6, padding: "7px 10px", fontSize: 11, outline: "none" }} />
            <button onClick={handleImport} disabled={loading}
              style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: loading ? "#2a2f3e" : "#f59e0b", color: loading ? "#64748b" : "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {loading ? "..." : "Load"}
            </button>
          </div>
          {error && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 5 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
