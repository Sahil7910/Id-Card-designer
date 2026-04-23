import DOMPurify from "dompurify";
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
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
  const [imgFailed, setImgFailed] = useState(false);
  const fullBgUrl = bgUrl && !imgFailed ? `${GALLERY_API_BASE}${bgUrl}` : undefined;
  return (
    <div style={{ width: w, height: h, background: bg, borderRadius: 10, position: "relative", overflow: "hidden", flexShrink: 0, opacity, boxShadow: "0 4px 16px rgba(0,0,0,0.35)", border: `1px solid ${accent}33` }}>
      {fullBgUrl ? (
        <img
          src={fullBgUrl}
          alt=""
          onError={() => setImgFailed(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
        />
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

// ── Template API shape ─────────────────────────────────────────────
interface TemplateApiItem {
  id: string; name: string; category: string | null;
  accent_color: string | null; bg_color: string | null;
  front_fields: Omit<CardField, "id">[]; back_fields: Omit<CardField, "id">[];
  front_bg_url: string | null; back_bg_url: string | null;
  orientation: string;
}

function mapApiTemplate(t: TemplateApiItem): CardTemplate {
  return {
    id: t.id, name: t.name,
    category: t.category ?? "Custom",
    accent: t.accent_color ?? "#e05c1a",
    bg: t.bg_color ?? "#ffffff",
    frontFields: t.front_fields,
    backFields: t.back_fields,
    frontBgUrl: t.front_bg_url ?? undefined,
    backBgUrl: t.back_bg_url ?? undefined,
    orientation: t.orientation === "Vertical" ? "Vertical" : "Horizontal",
  };
}

// ── Template Page ──────────────────────────────────────────────────
export default function TemplatePage({ isHorizontal: _isHorizontal, onApply, onClose, onCreateTemplate }: {
  isHorizontal: boolean;
  onApply: (t: CardTemplate) => void;
  onClose: () => void;
  onCreateTemplate?: () => void;
}) {
  const isLoggedIn = useSelector((s: RootState) => !!s.auth.user);

  // Gallery tab: "system" | "mine"
  const [activeTab, setActiveTab] = useState<"system" | "mine">("system");
  const [category, setCategory] = useState("All");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");

  const [systemTemplates, setSystemTemplates] = useState<CardTemplate[]>([]);
  const [myTemplates, setMyTemplates] = useState<CardTemplate[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<TemplateApiItem[]>("/api/templates/")
      .then((data) => setSystemTemplates(data.map(mapApiTemplate)))
      .catch((err) => { console.error("Failed to load system templates:", err); });
  }, []);

  const fetchMyTemplates = useCallback(() => {
    if (!isLoggedIn) return;
    setMyLoading(true);
    api.get<TemplateApiItem[]>("/api/templates/my/list")
      .then((data) => setMyTemplates(data.map(mapApiTemplate)))
      .catch((err) => { console.error("Failed to load my templates:", err); })
      .finally(() => setMyLoading(false));
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeTab === "mine") fetchMyTemplates();
  }, [activeTab, fetchMyTemplates]);

  const handleDeleteMyTemplate = async (id: string) => {
    setDeletingId(id);
    try {
      await api.del(`/api/templates/my/${id}`);
      setMyTemplates(prev => prev.filter(t => t.id !== id));
      if (previewId === id) setPreviewId(null);
    } catch (err) {
      console.error("Failed to delete template:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const allTemplates = activeTab === "system" ? systemTemplates : myTemplates;
  const allCategories = ["All", ...Array.from(new Set(systemTemplates.map(t => t.category)))];
  const filtered = activeTab === "mine"
    ? allTemplates
    : (category === "All" ? allTemplates : allTemplates.filter(t => t.category === category));
  const previewTpl = allTemplates.find(t => t.id === previewId);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#13161d", overflow: "hidden" }}>
      <div style={{ padding: "18px 28px 14px", borderBottom: "1px solid #2a2f3e", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>Choose a Template</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
            {activeTab === "system"
              ? `${systemTemplates.length} templates ready to use \u2014 customize after applying.`
              : `${myTemplates.length} saved template${myTemplates.length !== 1 ? "s" : ""} \u2014 only visible to you.`}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "#1e2330", border: "1px solid #3a3f52", color: "#94a3b8", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{"\u2190"} Back to Design</button>
      </div>

      {/* Tab strip */}
      <div style={{ padding: "0 28px", borderBottom: "1px solid #2a2f3e", display: "flex", gap: 0, flexShrink: 0 }}>
        {([["system", "🗂 All Templates"], ["mine", "👤 My Templates"]] as const).map(([tab, label]) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPreviewId(null); setCategory("All"); }}
              disabled={tab === "mine" && !isLoggedIn}
              style={{
                padding: "10px 18px", background: "transparent", border: "none",
                borderBottom: isActive ? "2px solid #e05c1a" : "2px solid transparent",
                color: isActive ? "#e05c1a" : (tab === "mine" && !isLoggedIn) ? "#334155" : "#64748b",
                cursor: (tab === "mine" && !isLoggedIn) ? "not-allowed" : "pointer",
                fontSize: 12, fontWeight: 700, letterSpacing: 0.3, transition: "all 0.15s",
                marginBottom: -1,
              }}
              title={tab === "mine" && !isLoggedIn ? "Sign in to view your templates" : undefined}
            >
              {label}
              {tab === "mine" && !isLoggedIn && <span style={{ marginLeft: 4, fontSize: 9, color: "#334155" }}>(sign in)</span>}
            </button>
          );
        })}
      </div>

      {/* Category filter (system tab only) */}
      {activeTab === "system" && (
        <div style={{ padding: "12px 28px", borderBottom: "1px solid #2a2f3e", display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ padding: "5px 16px", borderRadius: 20, border: `1px solid ${category === cat ? "#e05c1a" : "#2a2f3e"}`, background: category === cat ? "#e05c1a" : "#1e2330", color: category === cat ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>
              {cat}{cat !== "All" && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>({systemTemplates.filter(t => t.category === cat).length})</span>}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px" }}>
          {activeTab === "mine" && myLoading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#475569", fontSize: 14 }}>Loading your templates…</div>
          ) : activeTab === "mine" ? (
            filtered.length === 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 20 }}>
                {onCreateTemplate && (
                  <WhiteboardCard onCreateTemplate={onCreateTemplate} />
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 20 }}>
                {onCreateTemplate && (
                  <WhiteboardCard onCreateTemplate={onCreateTemplate} />
                )}
                {filtered.map(tpl => (
                  <TemplateCard
                    key={tpl.id} tpl={tpl}
                    isHovered={hoveredId === tpl.id} isPreviewing={previewId === tpl.id}
                    onHover={setHoveredId}
                    onPreview={id => { setPreviewId(id); setPreviewSide("front"); }}
                    onApply={onApply}
                    canDelete={true}
                    isDeleting={deletingId === tpl.id}
                    onDelete={handleDeleteMyTemplate}
                  />
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🗂</div>
              <div style={{ color: "#475569", fontSize: 14 }}>No templates in this category yet.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 20 }}>
              {filtered.map(tpl => (
                <TemplateCard
                  key={tpl.id} tpl={tpl}
                  isHovered={hoveredId === tpl.id} isPreviewing={previewId === tpl.id}
                  onHover={setHoveredId}
                  onPreview={id => { setPreviewId(id); setPreviewSide("front"); }}
                  onApply={onApply}
                  canDelete={false}
                  isDeleting={deletingId === tpl.id}
                  onDelete={handleDeleteMyTemplate}
                />
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
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  {activeTab === "mine" ? "My Template" : previewTpl.category} {"\u00B7"} {previewTpl.backFields.length > 0 ? "Front + Back" : "Front only"}
                </div>
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
            <div style={{ padding: "14px 16px", borderTop: "1px solid #2a2f3e", display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => onApply(previewTpl)} style={{ width: "100%", background: "#e05c1a", border: "none", color: "#fff", borderRadius: 8, padding: "12px 0", cursor: "pointer", fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>{"\u2713"} Apply This Template</button>
              {activeTab === "mine" && (
                <button
                  onClick={() => void handleDeleteMyTemplate(previewTpl.id)}
                  disabled={deletingId === previewTpl.id}
                  style={{ width: "100%", background: "transparent", border: "1px solid #ef444455", color: "#ef4444", borderRadius: 8, padding: "8px 0", cursor: deletingId === previewTpl.id ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600 }}>
                  {deletingId === previewTpl.id ? "Deleting…" : "🗑 Delete Template"}
                </button>
              )}
              <p style={{ fontSize: 10, color: "#475569", margin: "4px 0 0", textAlign: "center" }}>All fields are editable after applying.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Whiteboard Card ────────────────────────────────────────────────
function WhiteboardCard({ onCreateTemplate }: { onCreateTemplate: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onCreateTemplate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `2px dashed ${hovered ? "#e05c1a" : "#e05c1a55"}`,
        borderRadius: 12,
        background: hovered ? "#1e2330" : "#13161d",
        cursor: "pointer",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: 192, gap: 10,
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <span style={{ fontSize: 32, opacity: 0.4 }}>🗒️</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#e05c1a", letterSpacing: 0.5 }}>+ Design Template</span>
      <span style={{ fontSize: 10, color: "#475569", textAlign: "center", maxWidth: 110 }}>Start with a blank card</span>
    </div>
  );
}

// ── Template Card ──────────────────────────────────────────────────
function TemplateCard({ tpl, isHovered, isPreviewing, onHover, onPreview, onApply, canDelete, isDeleting, onDelete }: {
  tpl: CardTemplate; isHovered: boolean; isPreviewing: boolean;
  onHover: (id: string | null) => void; onPreview: (id: string) => void; onApply: (t: CardTemplate) => void;
  canDelete?: boolean; isDeleting?: boolean; onDelete?: (id: string) => void;
}) {
  const tplH = tpl.orientation === "Vertical";
  const tW = tplH ? 100 : 157;
  const tH = tplH ? 157 : 100;
  return (
    <div onMouseEnter={() => onHover(tpl.id)} onMouseLeave={() => onHover(null)}
      style={{ background: "#1a1e28", border: `2px solid ${isPreviewing ? "#e05c1a" : isHovered ? "#3a3f52" : "#2a2f3e"}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", transform: isHovered ? "translateY(-3px)" : "none", boxShadow: isHovered ? "0 12px 32px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)" }}>
      <div style={{ background: "#13161d", padding: "16px 12px", display: "flex", gap: 10, justifyContent: "center", alignItems: "center", minHeight: 132, position: "relative" }}>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(tpl.id); }}
            disabled={isDeleting}
            style={{ position: "absolute", top: 8, right: 8, background: "#1a1e28", border: "1px solid #ef444455", color: "#ef4444", borderRadius: 6, width: 26, height: 26, cursor: isDeleting ? "not-allowed" : "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", opacity: isDeleting ? 0.5 : 1, zIndex: 1 }}
            title="Delete template">
            {isDeleting ? "…" : "🗑"}
          </button>
        )}
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
            {!canDelete && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: tpl.accent + "22", border: `1px solid ${tpl.accent}44`, color: tpl.accent, fontWeight: 600 }}>{tpl.category}</span>}
            {canDelete && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "#a855f722", border: "1px solid #a855f744", color: "#a855f7", fontWeight: 600 }}>My Template</span>}
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
