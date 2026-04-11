import { useRef } from "react";
import type { CardField, RHandle } from "../../../shared/types";
import { TEXT_TYPES } from "../../../shared/types";
import { FIELD_COLORS, HANDLES } from "../constants";

interface DraggableFieldProps {
  field: CardField;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onResizeDown: (e: React.MouseEvent, id: string, h: RHandle) => void;
  isEditable: boolean;
  onPhotoUpload?: (fieldId: string, dataUrl: string) => void;
}

export function DraggableField({ field, isSelected, onMouseDown, onResizeDown, isEditable, onPhotoUpload }: DraggableFieldProps) {
  const color = FIELD_COLORS[field.type];
  const isText = TEXT_TYPES.includes(field.type);
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div onMouseDown={e => { if (isEditable) { e.stopPropagation(); onMouseDown(e, field.id); } }}
      onClick={e => e.stopPropagation()}
      style={{ position: "absolute", left: `${field.x}%`, top: `${field.y}%`, width: `${field.width}%`, height: isText ? "auto" : `${field.height}%`, cursor: isEditable ? "grab" : "default", zIndex: isSelected ? 10 : 1, userSelect: "none", minWidth: 20, minHeight: 10 }}>
      {isSelected && isEditable && (
        <>
          <div style={{ position: "absolute", inset: -4, border: `2px dashed ${color}`, borderRadius: 5, pointerEvents: "none", zIndex: 20 }} />
          <div style={{ position: "absolute", top: -20, left: 0, background: color, borderRadius: "3px 3px 0 0", padding: "1px 7px", fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: 0.5, whiteSpace: "nowrap", zIndex: 22 }}>
            {field.type.toUpperCase()}
          </div>
          {HANDLES.map(h => (
            <div key={h.id} onMouseDown={e => { e.stopPropagation(); onResizeDown(e, field.id, h.id); }}
              style={{ position: "absolute", width: 10, height: 10, background: "#fff", border: `2px solid ${color}`, borderRadius: 2, cursor: h.cursor, zIndex: 25, ...h.style }} />
          ))}
        </>
      )}
      {field.type === "photo" ? (
        <div
          onClick={e => {
            if (isEditable) { e.stopPropagation(); fileInputRef.current?.click(); }
          }}
          style={{ width: "100%", height: "100%", background: field.imageUrl ? "transparent" : "#e2e8f055", border: (field.borderStyle && field.borderStyle !== "none") ? `${field.borderWidth ?? 2}px ${field.borderStyle} ${field.borderColor ?? "#1e293b"}` : field.imageUrl ? "none" : `2px dashed ${color}55`, borderRadius: field.borderRadius ?? 6, boxShadow: (field.shadowSize ?? 0) > 0 ? `0 ${field.shadowSize}px ${(field.shadowSize ?? 6) * 2}px ${field.shadowColor ?? "#00000055"}` : "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, minHeight: 40, overflow: "hidden", cursor: isEditable ? "pointer" : "default" }}>
          {field.imageUrl ? (
            <img src={field.imageUrl} alt="Photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <>
              <span style={{ fontSize: 22, opacity: 0.45 }}>{"\u{1F464}"}</span>
              <span style={{ fontSize: 8, color, fontWeight: 700, opacity: 0.6, letterSpacing: 0.5 }}>TAP TO UPLOAD</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file || !onPhotoUpload) return;
              const reader = new FileReader();
              reader.onload = ev => onPhotoUpload(field.id, ev.target?.result as string);
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />
        </div>
      ) : field.type === "barcode" ? (
        <div style={{ width: "100%", height: "100%", background: color + "12", border: `1px dashed ${color}44`, borderRadius: 4, padding: "4px 6px", display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box", minHeight: 40 }}>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end", height: "70%" }}>
            {Array.from({ length: 22 }).map((_, i) => <div key={i} style={{ flex: i % 3 === 0 ? 2 : 1, height: `${55 + (i % 5) * 9}%`, background: "#334155", borderRadius: 1, opacity: 0.75 }} />)}
          </div>
          <div style={{ fontSize: 7, color: "#64748b", textAlign: "center", letterSpacing: 2, marginTop: 3 }}>1 2 3 4 5 6 7 8 9</div>
        </div>
      ) : field.type === "logo" ? (
        <div style={{ width: "100%", height: "100%", background: color + "18", border: `2px dashed ${color}55`, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 30 }}>
          <span style={{ fontSize: 18, opacity: 0.45 }}>{"\u2B50"}</span>
          <span style={{ fontSize: 8, color, fontWeight: 700, opacity: 0.6 }}>LOGO</span>
        </div>
      ) : (
        <div style={{ fontSize: field.fontSize ?? 11, fontWeight: field.bold ? 700 : 400, fontStyle: field.italic ? "italic" : "normal", textDecoration: field.underline ? "underline" : "none", fontFamily: field.fontFamily ?? "inherit", color: field.color ?? "#1e293b", textAlign: field.align ?? "left", background: isSelected && isEditable ? color + "0c" : "transparent", borderRadius: 3, padding: "2px 4px", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {field.label}
        </div>
      )}
    </div>
  );
}
