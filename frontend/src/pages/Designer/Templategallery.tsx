import DOMPurify from "dompurify";
import { useState, useEffect } from "react";
import type { CardField, CardTemplate, FieldType } from "../../shared/types";
import { TEXT_TYPES } from "../../shared/types";
import { api } from "../../shared/utils/api";

// Re-export shared types for backwards compatibility
export type { FieldType, CardField, CardTemplate };
export { TEXT_TYPES };

export const TEMPLATE_CATEGORIES: string[] = ["All"];

// ── Mini Card Preview ──────────────────────────────────────────────
import { API_BASE as GALLERY_API_BASE } from "../../shared/utils/apiBase";

export function MiniCardPreview({
  fields, bg, accent, w, h, opacity = 1, bgSvg, bgUrl,
}: {
  fields: Omit<CardField, "id">[];
  bg: string; accent: string;
  w: number; h: number; opacity?: number;
  bgSvg?: string;
  bgUrl?: string;
}) {
  const fullBgUrl = bgUrl ? `${GALLERY_API_BASE}${bgUrl}` : undefined;
  return (
    <div style={{ width: w, height: h, background: bg, borderRadius: 10, position: "relative", overflow: "hidden", flexShrink: 0, opacity, boxShadow: "0 4px 16px rgba(0,0,0,0.35)", border: `1px solid ${accent}33` }}>
      {fullBgUrl ? (
        <img src={fullBgUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
      ) : bgSvg ? (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bgSvg) }} />
      ) : (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: accent }} />
      )}
      {fields.map((f, i) => {
        const isText = TEXT_TYPES.includes(f.type);
        const isBadge = f.type === "id" || f.type === "company";
        return (
          <div key={i} style={{ position: "absolute", left: `${f.x}%`, top: `${f.y}%`, width: `${f.width}%`, height: isText ? "auto" : `${f.height}%` }}>
            {f.type === "photo" ? (
              <div style={{ width: "100%", height: "100%", background: accent + "28", border: f.borderStyle && f.borderStyle !== "none" ? `${Math.min(f.borderWidth ?? 2, 3)}px ${f.borderStyle} ${f.borderColor ?? accent}` : `1.5px dashed ${accent}66`, borderRadius: (f.borderRadius ?? 6) * 0.6, minHeight: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, opacity: 0.5 }}>{"\u{1F464}"}</span>
              </div>
            ) : f.type === "logo" ? (
              <div style={{ width: "100%", height: "100%", background: accent + "18", border: `1px dashed ${accent}44`, borderRadius: 5, minHeight: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, opacity: 0.5 }}>{"\u2B50"}</span>
              </div>
            ) : f.type === "barcode" ? (
              <div style={{ background: "#33415522", border: "1px dashed #33415544", borderRadius: 3, height: "100%", minHeight: 12, display: "flex", gap: 0.5, alignItems: "flex-end", padding: "2px 3px", boxSizing: "border-box" }}>
                {Array.from({ length: 10 }).map((_, j) => (
                  <div key={j} style={{ flex: 1, height: `${50 + (j % 3) * 20}%`, background: "#334155", borderRadius: 0.5, opacity: 0.7 }} />
                ))}
              </div>
            ) : (
              <div style={{ fontSize: Math.max(4, ((f.fontSize ?? 11) * w) / 380 * 0.85), fontWeight: f.bold ? 700 : 400, fontStyle: f.italic ? "italic" : "normal", fontFamily: f.fontFamily ?? "inherit", color: f.color ?? "#1e293b", textAlign: f.align ?? "left", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", background: isBadge && f.bold ? accent + "12" : "transparent", padding: "0 1px", borderRadius: 2 }}>
                {f.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Template Page ──────────────────────────────────────────────────
export default function TemplatePage({ isHorizontal: _isHorizontal, onApply, onClose }: {
  isHorizontal: boolean;
  onApply: (t: CardTemplate) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState("All");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [dbTemplates, setDbTemplates] = useState<CardTemplate[]>([]);

  useEffect(() => {
    api.get<{
      id: string; name: string; category: string | null;
      accent_color: string | null; bg_color: string | null;
      front_fields: Omit<CardField, "id">[]; back_fields: Omit<CardField, "id">[];
      front_bg_url: string | null; back_bg_url: string | null;
      orientation: string;
    }[]>("/api/templates/")
      .then((data) => {
        setDbTemplates(data.map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category ?? "Custom",
          accent: t.accent_color ?? "#e05c1a",
          bg: t.bg_color ?? "#ffffff",
          frontFields: t.front_fields,
          backFields: t.back_fields,
          frontBgUrl: t.front_bg_url ?? undefined,
          backBgUrl: t.back_bg_url ?? undefined,
          orientation: t.orientation === "Vertical" ? "Vertical" : "Horizontal",
        })));
      })
      .catch((err) => { console.error("Failed to load DB templates:", err); });
  }, []);

  const allTemplates = dbTemplates;
  const allCategories = ["All", ...Array.from(new Set(allTemplates.map(t => t.category)))];

  const filtered = category === "All" ? allTemplates : allTemplates.filter(t => t.category === category);
  const previewTpl = allTemplates.find(t => t.id === previewId);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#13161d", overflow: "hidden" }}>
      <div style={{ padding: "18px 28px 14px", borderBottom: "1px solid #2a2f3e", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>Choose a Template</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{allTemplates.length} templates ready to use {"\u2014"} customize after applying.</div>
        </div>
        <button onClick={onClose} style={{ background: "#1e2330", border: "1px solid #3a3f52", color: "#94a3b8", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{"\u2190"} Back to Design</button>
      </div>

      <div style={{ padding: "12px 28px", borderBottom: "1px solid #2a2f3e", display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
        {allCategories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            style={{ padding: "5px 16px", borderRadius: 20, border: `1px solid ${category === cat ? "#e05c1a" : "#2a2f3e"}`, background: category === cat ? "#e05c1a" : "#1e2330", color: category === cat ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>
            {cat}{cat !== "All" && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>({allTemplates.filter(t => t.category === cat).length})</span>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#475569", fontSize: 14 }}>No templates in this category yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 20 }}>
              {filtered.map(tpl => (
                <TemplateCard key={tpl.id} tpl={tpl} isHovered={hoveredId === tpl.id} isPreviewing={previewId === tpl.id}
                  onHover={setHoveredId} onPreview={id => { setPreviewId(id); setPreviewSide("front"); }} onApply={onApply} />
              ))}
            </div>
          )}
        </div>

        {previewTpl && (
          <div style={{ width: 340, background: "#1a1e28", borderLeft: "1px solid #2a2f3e", display: "flex", flexDirection: "column", flexShrink: 0, animation: "slideIn 0.2s ease" }}>
            <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
            <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #2a2f3e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{previewTpl.name}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{previewTpl.category} {"\u00B7"} {previewTpl.backFields.length > 0 ? "Front + Back" : "Front only"}</div>
              </div>
              <button onClick={() => setPreviewId(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>{"\u2715"}</button>
            </div>
            {(previewTpl.backFields.length > 0 || !!previewTpl.backBgUrl) && (
              <div style={{ display: "flex", padding: "10px 14px", gap: 6, borderBottom: "1px solid #2a2f3e" }}>
                {(["front", "back"] as const).map(s => (
                  <button key={s} onClick={() => setPreviewSide(s)}
                    style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: `1px solid ${previewSide === s ? "#e05c1a" : "#2a2f3e"}`, background: previewSide === s ? "#e05c1a18" : "#13161d", color: previewSide === s ? "#e05c1a" : "#64748b", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                    {s === "front" ? "\u25E7 FRONT" : "\u25E8 BACK"}
                  </button>
                ))}
              </div>
            )}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <MiniCardPreview fields={previewSide === "front" ? previewTpl.frontFields : previewTpl.backFields} bg={previewTpl.bg} accent={previewTpl.accent} w={previewTpl.orientation === "Vertical" ? 176 : 278} h={previewTpl.orientation === "Vertical" ? 278 : 176} bgSvg={previewSide === "front" ? previewTpl.frontBg : previewTpl.backBg} bgUrl={previewSide === "front" ? previewTpl.frontBgUrl : previewTpl.backBgUrl} />
            </div>
            <div style={{ padding: "8px 18px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(previewSide === "front" ? previewTpl.frontFields : previewTpl.backFields).map((f, i) => (
                <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#13161d", border: "1px solid #2a2f3e", color: "#64748b", fontWeight: 600, letterSpacing: 0.3 }}>{f.type}</span>
              ))}
            </div>
            <div style={{ padding: "14px 16px", borderTop: "1px solid #2a2f3e" }}>
              <button onClick={() => onApply(previewTpl)} style={{ width: "100%", background: "#e05c1a", border: "none", color: "#fff", borderRadius: 8, padding: "12px 0", cursor: "pointer", fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>{"\u2713"} Apply This Template</button>
              <p style={{ fontSize: 10, color: "#475569", margin: "8px 0 0", textAlign: "center" }}>All fields are editable after applying.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Template Card ──────────────────────────────────────────────────
function TemplateCard({ tpl, isHovered, isPreviewing, onHover, onPreview, onApply }: {
  tpl: CardTemplate; isHovered: boolean; isPreviewing: boolean;
  onHover: (id: string | null) => void; onPreview: (id: string) => void; onApply: (t: CardTemplate) => void;
}) {
  const tplH = tpl.orientation === "Vertical";
  const tW = tplH ? 100 : 157;
  const tH = tplH ? 157 : 100;
  return (
    <div onMouseEnter={() => onHover(tpl.id)} onMouseLeave={() => onHover(null)}
      style={{ background: "#1a1e28", border: `2px solid ${isPreviewing ? "#e05c1a" : isHovered ? "#3a3f52" : "#2a2f3e"}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", transform: isHovered ? "translateY(-3px)" : "none", boxShadow: isHovered ? "0 12px 32px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)" }}>
      <div style={{ background: "#13161d", padding: "16px 12px", display: "flex", gap: 10, justifyContent: "center", alignItems: "center", minHeight: 132 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <MiniCardPreview fields={tpl.frontFields} bg={tpl.bg} accent={tpl.accent} w={tW} h={tH} bgSvg={tpl.frontBg} bgUrl={tpl.frontBgUrl} />
          <span style={{ fontSize: 9, color: "#64748b", fontWeight: 600, letterSpacing: 1 }}>FRONT</span>
        </div>
        {(tpl.backFields.length > 0 || !!tpl.backBgUrl) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <MiniCardPreview fields={tpl.backFields} bg={tpl.bg} accent={tpl.accent} w={tW} h={tH} opacity={0.75} bgSvg={tpl.backBg} bgUrl={tpl.backBgUrl} />
            <span style={{ fontSize: 9, color: "#64748b", fontWeight: 600, letterSpacing: 1 }}>BACK</span>
          </div>
        )}
      </div>
      <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #2a2f3e22" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{tpl.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: tpl.accent + "22", border: `1px solid ${tpl.accent}44`, color: tpl.accent, fontWeight: 600 }}>{tpl.category}</span>
            <span style={{ fontSize: 10, color: "#475569" }}>{tpl.orientation ?? "Horizontal"} · {(tpl.backFields.length > 0 || !!tpl.backBgUrl) ? "Front + Back" : "Front only"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onPreview(tpl.id)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${isPreviewing ? "#e05c1a" : "#3a3f52"}`, background: isPreviewing ? "#e05c1a18" : "#13161d", color: isPreviewing ? "#e05c1a" : "#94a3b8", cursor: "pointer", fontSize: 13 }} title="Preview">{"\u{1F441}"}</button>
          <button onClick={() => onApply(tpl)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#e05c1a", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Use</button>
        </div>
      </div>
    </div>
  );
}
