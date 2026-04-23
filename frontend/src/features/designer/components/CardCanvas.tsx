import { useRef } from "react";
import DOMPurify from "dompurify";
import type { CardField, DesignSide, PrintSide, RHandle } from "../../../shared/types";
import { DraggableField } from "./DraggableField";

interface CardCanvasProps {
  label: string;
  side: DesignSide;
  isActive: boolean;
  isEditing: boolean;
  fields: CardField[];
  cardW: number;
  cardH: number;
  cardRef: React.RefObject<HTMLDivElement | null>;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onResizeDown: (e: React.MouseEvent, id: string, h: RHandle) => void;
  selectedFieldId: string | null;
  onCardClick: () => void;
  printSide: PrintSide;
  onPhotoUpload?: (fieldId: string, dataUrl: string) => void;
  bgSvg?: string;
  bgUrl?: string;
  onTemplateUpload?: (file: File) => void;
  onRemoveBackground?: () => void;
}

import { API_BASE as CANVAS_API_BASE } from "../../../shared/utils/apiBase";

export function CardCanvas({
  label, side, isActive, isEditing, fields, cardW, cardH,
  cardRef, onMouseDown, onResizeDown, selectedFieldId, onCardClick, printSide, onPhotoUpload, bgSvg, bgUrl, onTemplateUpload, onRemoveBackground,
}: CardCanvasProps) {
  const accent = side === "front" ? "#e05c1a" : "#6366f1";
  const fullBgUrl = bgUrl ? `${CANVAS_API_BASE}${bgUrl}` : undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {printSide === "Both Sides" && (
        <button onClick={e => { e.stopPropagation(); onCardClick(); }}
          style={{ fontSize: 10, fontWeight: 700, color: isEditing ? "#fff" : accent, letterSpacing: 1.5, background: isEditing ? accent : accent + "18", border: `1px solid ${accent}66`, borderRadius: 20, padding: "4px 14px", cursor: "pointer", transition: "all 0.2s" }}>
          {label} {isEditing ? "\u270E EDITING NOW" : "\u2014 click to edit"}
        </button>
      )}
      <div ref={cardRef} onClick={e => { e.stopPropagation(); onCardClick(); }}
        style={{ width: cardW, height: cardH, background: side === "front" ? "#ffffff" : "#f1f5f9", borderRadius: 14, boxShadow: isEditing ? `0 0 0 3px ${accent}, 0 16px 56px rgba(0,0,0,0.55)` : isActive ? `0 0 0 2px ${accent}66, 0 10px 40px rgba(0,0,0,0.4)` : "0 6px 32px rgba(0,0,0,0.4)", transition: "width 0.35s cubic-bezier(.4,0,.2,1), height 0.35s cubic-bezier(.4,0,.2,1), box-shadow 0.2s", position: "relative", overflow: "hidden", cursor: isEditing ? "default" : "pointer", userSelect: "none" }}>
        {fullBgUrl ? (
          <>
            <img src={fullBgUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
            {isEditing && onRemoveBackground && (
              <button
                onClick={e => { e.stopPropagation(); onRemoveBackground(); }}
                style={{ position: "absolute", top: 8, right: 8, zIndex: 30, width: 24, height: 24, borderRadius: 6, background: "#ef444499", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Remove background">
                {"\u2715"}
              </button>
            )}
          </>
        ) : bgSvg ? (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bgSvg) }} />
        ) : null}

        {/* Empty state: clickable upload zone when no background and no fields */}
        {fields.length === 0 && !bgSvg && !fullBgUrl && isEditing && onTemplateUpload && (
          <div
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
            style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, pointerEvents: "auto", cursor: "pointer" }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, border: `2px dashed ${accent}88`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: accent, opacity: 0.7 }}>⬆</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 10, color: accent, opacity: 0.85, fontWeight: 700, letterSpacing: 1 }}>UPLOAD TEMPLATE</span>
              <span style={{ fontSize: 9, color: "#64748b", fontWeight: 500 }}>Click to upload PNG / JPG from your system</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              style={{ display: "none" }}
              onClick={e => e.stopPropagation()}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) onTemplateUpload(file);
                e.target.value = "";
              }}
            />
          </div>
        )}


        {fields.map(field => (
          <DraggableField key={field.id} field={field} isSelected={selectedFieldId === field.id}
            onMouseDown={onMouseDown} onResizeDown={onResizeDown} isEditable={isEditing} onPhotoUpload={onPhotoUpload} />
        ))}
        {!isEditing && printSide === "Both Sides" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.04)", borderRadius: 14, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 10, pointerEvents: "none" }}>
            <span style={{ fontSize: 9, color: accent, fontWeight: 700, background: accent + "18", border: `1px solid ${accent}44`, borderRadius: 4, padding: "2px 7px" }}>CLICK TO EDIT</span>
          </div>
        )}
      </div>
      {printSide === "Single Side" && (
        <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 1.5, background: accent + "18", border: `1px solid ${accent}44`, borderRadius: 4, padding: "3px 10px" }}>
          {label} SIDE
        </div>
      )}
    </div>
  );
}
