import type { CardField } from "../../../shared/types";
import { TEXT_TYPES } from "../../../shared/types";
import { FIELD_COLORS } from "../constants";

export function PreviewField({ field }: { field: CardField }) {
  const color = FIELD_COLORS[field.type];
  const isText = TEXT_TYPES.includes(field.type);
  return (
    <div style={{ position: "absolute", left: `${field.x}%`, top: `${field.y}%`, width: `${field.width}%`, height: isText ? "auto" : `${field.height}%`, pointerEvents: "none", userSelect: "none" }}>
      {field.type === "photo" ? (
        <div style={{ width: "100%", height: "100%", background: field.imageUrl ? "transparent" : color + "18", border: (field.borderStyle && field.borderStyle !== "none") ? `${field.borderWidth ?? 2}px ${field.borderStyle} ${field.borderColor ?? "#1e293b"}` : field.imageUrl ? "none" : `2px dashed ${color}55`, borderRadius: field.borderRadius ?? 6, boxShadow: (field.shadowSize ?? 0) > 0 ? `0 ${field.shadowSize}px ${(field.shadowSize ?? 6) * 2}px ${field.shadowColor ?? "#00000055"}` : "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, minHeight: 40, overflow: "hidden" }}>
          {field.imageUrl
            ? <img src={field.imageUrl} alt="Photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <><span style={{ fontSize: 24, opacity: 0.45 }}>{"\u{1F464}"}</span><span style={{ fontSize: 9, color, fontWeight: 700, opacity: 0.6 }}>PHOTO</span></>
          }
        </div>
      ) : field.type === "barcode" ? (
        <div style={{ background: color + "12", border: `1px dashed ${color}44`, borderRadius: 4, padding: "4px 6px", height: "100%", minHeight: 40, display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box" }}>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end", height: "70%" }}>
            {Array.from({ length: 22 }).map((_, i) => <div key={i} style={{ flex: i % 3 === 0 ? 2 : 1, height: `${55 + (i % 5) * 9}%`, background: "#334155", borderRadius: 1, opacity: 0.75 }} />)}
          </div>
          <div style={{ fontSize: 7, color: "#64748b", textAlign: "center", letterSpacing: 2, marginTop: 3 }}>1 2 3 4 5 6 7 8 9</div>
        </div>
      ) : field.type === "logo" ? (
        <div style={{ width: "100%", height: "100%", background: color + "18", border: `2px dashed ${color}55`, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 30 }}>
          <span style={{ fontSize: 20, opacity: 0.45 }}>{"\u2B50"}</span>
          <span style={{ fontSize: 8, color, fontWeight: 700, opacity: 0.6 }}>LOGO</span>
        </div>
      ) : (
        <div style={{ fontSize: field.fontSize ?? 11, fontWeight: field.bold ? 700 : 400, fontStyle: field.italic ? "italic" : "normal", textDecoration: field.underline ? "underline" : "none", fontFamily: field.fontFamily ?? "inherit", color: field.color ?? "#1e293b", textAlign: field.align ?? "left", borderRadius: 3, padding: "2px 4px", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {field.label}
        </div>
      )}
    </div>
  );
}
