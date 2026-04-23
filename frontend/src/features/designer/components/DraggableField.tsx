import { useEffect, useRef, useState } from "react";
import type { CardField, RHandle } from "../../../shared/types";
import { TEXT_TYPES } from "../../../shared/types";
import { FIELD_COLORS, HANDLES } from "../constants";
import { BarcodeRenderer } from "./BarcodeRenderer";
import { QRCodeRenderer } from "./QRCodeRenderer";

interface DraggableFieldProps {
  field: CardField;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onResizeDown: (e: React.MouseEvent, id: string, h: RHandle) => void;
  isEditable: boolean;
  onPhotoUpload?: (fieldId: string, dataUrl: string) => void;
  onImageUpdate?: (fieldId: string, updates: Partial<Pick<CardField, "imageScale" | "imageOffsetX" | "imageOffsetY">>) => void;
  onLabelChange?: (fieldId: string, label: string) => void;
}

export function DraggableField({ field, isSelected, onMouseDown, onResizeDown, isEditable, onPhotoUpload, onImageUpdate, onLabelChange }: DraggableFieldProps) {
  const color = FIELD_COLORS[field.type];
  const isText = TEXT_TYPES.includes(field.type);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef(field);
  fieldRef.current = field;
  const isPhotoLike = field.type === "photo";
  const [editing, setEditing] = useState(false);

  // Non-passive wheel listener for scroll-to-zoom
  useEffect(() => {
    if (!isPhotoLike || !isEditable) return;
    const el = photoRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const f = fieldRef.current;
      if (!f.imageUrl || !onImageUpdate) return;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const next = Math.round(Math.max(0.5, Math.min(3.0, (f.imageScale ?? 1) + delta)) * 10) / 10;
      onImageUpdate(f.id, { imageScale: next });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isPhotoLike, isEditable, onImageUpdate]);

  return (
    <div
      onMouseDown={e => { if (isEditable) { e.stopPropagation(); onMouseDown(e, field.id); } }}
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute",
        left: `${field.x}%`, top: `${field.y}%`,
        width: `${field.width}%`, height: isText ? "auto" : `${field.height}%`,
        cursor: isEditable ? "grab" : "default",
        zIndex: isSelected ? 10 : 1,
        userSelect: "none", minWidth: 20, minHeight: 10,
      }}
    >
      {/* Selection handles */}
      {isSelected && isEditable && (
        <>
          <div data-selected-border="1" style={{ position: "absolute", inset: -4, border: `2px dashed ${color}`, borderRadius: 5, pointerEvents: "none", zIndex: 20 }} />
          <div style={{ position: "absolute", top: -20, left: 0, background: color, borderRadius: "3px 3px 0 0", padding: "1px 7px", fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: 0.5, whiteSpace: "nowrap", zIndex: 22 }}>
            {field.label.length > 14 ? field.label.slice(0, 13) + "…" : field.label}
          </div>
          {HANDLES.map(h => (
            <div key={h.id} data-handle={h.id}
              onMouseDown={e => { e.stopPropagation(); onResizeDown(e, field.id, h.id); }}
              style={{ position: "absolute", width: 10, height: 10, background: "#fff", border: `2px solid ${color}`, borderRadius: 2, cursor: h.cursor, zIndex: 25, ...h.style }} />
          ))}
        </>
      )}

      {/* ── Photo ── */}
      {isPhotoLike ? (
        <div
          ref={photoRef}
          onClick={e => {
            e.stopPropagation();
            // Only open file picker when no image uploaded yet
            if (isEditable && !field.imageUrl) fileInputRef.current?.click();
          }}
          style={{
            width: "100%", height: "100%",
            position: "relative",
            border: (field.borderStyle && field.borderStyle !== "none")
              ? `${field.borderWidth ?? 2}px ${field.borderStyle} ${field.borderColor ?? "#1e293b"}`
              : field.imageUrl ? "none" : `2px dashed ${color}55`,
            borderRadius: field.borderRadius ?? 6,
            boxShadow: (field.shadowSize ?? 0) > 0
              ? `0 ${field.shadowSize}px ${(field.shadowSize ?? 6) * 2}px ${field.shadowColor ?? "#00000055"}`
              : "none",
            background: field.imageUrl ? "#000" : "#e2e8f055",
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: 40,
            cursor: isEditable ? (field.imageUrl ? "grab" : "pointer") : "default",
          }}
        >
          {field.imageUrl ? (
            <img
              src={field.imageUrl}
              alt="Photo"
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: field.imageFit ?? "cover",
                transformOrigin: "center center",
                transform: `scale(${field.imageScale ?? 1}) translate(${field.imageOffsetX ?? 0}%, ${field.imageOffsetY ?? 0}%)`,
                display: "block",
                pointerEvents: "none",
              }}
            />
          ) : (
            <>
              <span style={{ fontSize: 22, opacity: 0.45 }}>{"👤"}</span>
              <span style={{ fontSize: 8, color, fontWeight: 700, opacity: 0.6, letterSpacing: 0.5, marginTop: 2 }}>
                {"CLICK TO UPLOAD"}
              </span>
            </>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
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

      /* ── Barcode ── */
      ) : field.type === "barcode" ? (
        <div style={{
          width: "100%", height: "100%",
          background: "#ffffff",
          borderRadius: 4,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", boxSizing: "border-box",
          padding: "4px 6px",
        }}>
          <BarcodeRenderer value={field.barcodeValue ?? "1234567890"} dark={field.color ?? "#000000"} />
        </div>

      /* ── QR Code ── */
      ) : field.type === "qr" ? (
        <div style={{
          width: "100%", height: "100%",
          background: "#ffffff",
          borderRadius: 4,
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <QRCodeRenderer value={field.qrValue ?? "https://example.com"} dark={field.color ?? "#000000"} light="#ffffff" />
        </div>

      /* ── Text ── */
      ) : editing && isEditable && onLabelChange ? (
        <input
          autoFocus
          value={field.label}
          onChange={e => onLabelChange(field.id, e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditing(false); e.stopPropagation(); }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          style={{
            width: "100%",
            fontSize: field.fontSize ?? 11,
            fontWeight: field.bold ? 700 : 400,
            fontStyle: field.italic ? "italic" : "normal",
            textDecoration: field.underline ? "underline" : "none",
            fontFamily: field.fontFamily ?? "inherit",
            color: field.color ?? "#1e293b",
            textAlign: field.align ?? "left",
            background: "#ffffffcc",
            border: `1px solid ${color}`,
            borderRadius: 3, padding: "1px 4px", lineHeight: 1.4,
            outline: "none", boxSizing: "border-box",
          }}
        />
      ) : (
        <div
          onDoubleClick={e => { if (isEditable && onLabelChange) { e.stopPropagation(); setEditing(true); } }}
          style={{
            fontSize: field.fontSize ?? 11,
            fontWeight: field.bold ? 700 : 400,
            fontStyle: field.italic ? "italic" : "normal",
            textDecoration: field.underline ? "underline" : "none",
            fontFamily: field.fontFamily ?? "inherit",
            color: field.color ?? "#1e293b",
            textAlign: field.align ?? "left",
            background: isSelected && isEditable ? color + "0c" : "transparent",
            borderRadius: 3, padding: "2px 4px", lineHeight: 1.4,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            cursor: isEditable ? "text" : "default",
          }}>
          {field.label}
        </div>
      )}
    </div>
  );
}
