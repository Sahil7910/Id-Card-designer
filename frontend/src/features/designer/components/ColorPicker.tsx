import { useState, useEffect } from "react";
import { hexToRgb, rgbToHex, hexToCmyk, getPrintWarning } from "../services/colorUtils";

const PRESETS = [
  "#1e293b", "#ffffff", "#e05c1a", "#0ea5e9", "#10b981",
  "#f59e0b", "#ec4899", "#6366f1", "#334155", "#7c3aed",
];

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);
  const [r, setR] = useState(0);
  const [g, setG] = useState(0);
  const [b, setB] = useState(0);

  // Sync local state when value prop changes
  useEffect(() => {
    setHexInput(value);
    try {
      const rgb = hexToRgb(value);
      setR(rgb.r); setG(rgb.g); setB(rgb.b);
    } catch { /* ignore */ }
  }, [value]);

  const applyHex = (h: string) => {
    const clean = h.startsWith("#") ? h : `#${h}`;
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
      onChange(clean);
      const rgb = hexToRgb(clean);
      setR(rgb.r); setG(rgb.g); setB(rgb.b);
    }
  };

  const applyRgb = (nr: number, ng: number, nb: number) => {
    const hex = rgbToHex(nr, ng, nb);
    onChange(hex);
    setHexInput(hex);
  };

  const cmyk = (() => {
    try { return hexToCmyk(value); } catch { return { c: 0, m: 0, y: 0, k: 0 }; }
  })();

  const warning = getPrintWarning(value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label && <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1 }}>{label}</div>}

      {/* Preset swatches */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {PRESETS.map(c => (
          <div key={c} onClick={() => { onChange(c); setHexInput(c); const rgb = hexToRgb(c); setR(rgb.r); setG(rgb.g); setB(rgb.b); }}
            style={{ width: 22, height: 22, borderRadius: 5, background: c, border: value === c ? "2px solid #e05c1a" : "2px solid #2a2f3e", cursor: "pointer", boxShadow: value === c ? "0 0 0 2px #e05c1a44" : "none", transition: "box-shadow 0.15s, border-color 0.15s" }} />
        ))}
      </div>

      {/* HEX input */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: value, border: "1px solid #2a2f3e", flexShrink: 0 }} />
        <input
          value={hexInput}
          onChange={e => { setHexInput(e.target.value); applyHex(e.target.value); }}
          placeholder="#rrggbb"
          style={{ flex: 1, background: "#13161d", border: "1px solid #2a2f3e", color: "#e2e8f0", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none", fontFamily: "monospace" }}
        />
        <label style={{ width: 28, height: 28, borderRadius: 6, border: "1px dashed #3a3f52", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#64748b", position: "relative", flexShrink: 0 }}>
          <span style={{ pointerEvents: "none" }}>+</span>
          <input type="color" value={value} onChange={e => { onChange(e.target.value); setHexInput(e.target.value); const rgb = hexToRgb(e.target.value); setR(rgb.r); setG(rgb.g); setB(rgb.b); }}
            style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
        </label>
      </div>

      {/* RGB inputs */}
      <div style={{ display: "flex", gap: 5 }}>
        {([["R", r, setR], ["G", g, setG], ["B", b, setB]] as [string, number, (v: number) => void][]).map(([label2, val, setter]) => (
          <div key={label2} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, color: "#64748b", fontWeight: 700 }}>{label2}</span>
            <input type="number" min={0} max={255} value={val}
              onChange={e => {
                const n = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                setter(n);
                const nr2 = label2 === "R" ? n : r;
                const ng2 = label2 === "G" ? n : g;
                const nb2 = label2 === "B" ? n : b;
                applyRgb(nr2, ng2, nb2);
              }}
              style={{ width: "100%", background: "#13161d", border: "1px solid #2a2f3e", color: "#e2e8f0", borderRadius: 5, padding: "4px 6px", fontSize: 11, outline: "none", textAlign: "center", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>

      {/* CMYK display (read-only) */}
      <div style={{ background: "#13161d", border: "1px solid #2a2f3e", borderRadius: 6, padding: "6px 8px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: 1, marginBottom: 4 }}>CMYK (PRINT APPROX.)</div>
        <div style={{ display: "flex", gap: 8 }}>
          {([["C", cmyk.c], ["M", cmyk.m], ["Y", cmyk.y], ["K", cmyk.k]] as [string, number][]).map(([l, v]) => (
            <div key={l} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#64748b" }}>{l}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{v}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Print warning */}
      {warning && (
        <div style={{ background: "#78350f22", border: "1px solid #f59e0b55", borderRadius: 6, padding: "7px 10px", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>⚠️</span>
          <span style={{ fontSize: 10, color: "#f59e0b", lineHeight: 1.4 }}>{warning}</span>
        </div>
      )}
    </div>
  );
}
