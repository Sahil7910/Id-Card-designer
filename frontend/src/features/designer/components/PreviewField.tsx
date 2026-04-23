import type { CardField } from "../../../shared/types";
import { TEXT_TYPES } from "../../../shared/types";
import { FIELD_COLORS } from "../constants";
import { BarcodeRenderer } from "./BarcodeRenderer";
import { QRCodeRenderer } from "./QRCodeRenderer";

export function PreviewField({ field }: { field: CardField }) {
  const color = FIELD_COLORS[field.type];
  const isText = TEXT_TYPES.includes(field.type);
  const isPhotoLike = field.type === "photo";

  return (
    <div style={{
      position: "absolute",
      left: `${field.x}%`, top: `${field.y}%`,
      width: `${field.width}%`, height: isText ? "auto" : `${field.height}%`,
      pointerEvents: "none", userSelect: "none",
    }}>
      {/* ── Photo / Logo ── */}
      {isPhotoLike ? (
        <div style={{
          width: "100%", height: "100%",
          position: "relative",
          border: (field.borderStyle && field.borderStyle !== "none")
            ? `${field.borderWidth ?? 2}px ${field.borderStyle} ${field.borderColor ?? "#1e293b"}`
            : field.imageUrl ? "none" : `2px dashed ${color}55`,
          borderRadius: field.borderRadius ?? 6,
          boxShadow: (field.shadowSize ?? 0) > 0
            ? `0 ${field.shadowSize}px ${(field.shadowSize ?? 6) * 2}px ${field.shadowColor ?? "#00000055"}`
            : "none",
          background: field.imageUrl ? "#000" : color + "18",
          overflow: "hidden",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: 40,
        }}>
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
              }}
            />
          ) : (
            <>
              <span style={{ fontSize: 24, opacity: 0.45 }}>{"👤"}</span>
              <span style={{ fontSize: 9, color, fontWeight: 700, opacity: 0.6 }}>
                {"PHOTO"}
              </span>
            </>
          )}
        </div>

      /* ── Barcode ── */
      ) : field.type === "barcode" ? (
        <div style={{
          width: "100%", height: "100%",
          background: "#ffffff", borderRadius: 4,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", boxSizing: "border-box", padding: "4px 6px",
        }}>
          <BarcodeRenderer value={field.barcodeValue ?? "1234567890"} dark={field.color ?? "#000000"} />
        </div>

      /* ── QR Code ── */
      ) : field.type === "qr" ? (
        <div style={{
          width: "100%", height: "100%",
          background: "#ffffff", borderRadius: 4,
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <QRCodeRenderer value={field.qrValue ?? "https://example.com"} dark={field.color ?? "#000000"} light="#ffffff" />
        </div>

      /* ── Text ── */
      ) : (
        <div style={{
          fontSize: field.fontSize ?? 11,
          fontWeight: field.bold ? 700 : 400,
          fontStyle: field.italic ? "italic" : "normal",
          textDecoration: field.underline ? "underline" : "none",
          fontFamily: field.fontFamily ?? "inherit",
          color: field.color ?? "#1e293b",
          textAlign: field.align ?? "left",
          borderRadius: 3, padding: "2px 4px", lineHeight: 1.4,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {field.label}
        </div>
      )}
    </div>
  );
}
