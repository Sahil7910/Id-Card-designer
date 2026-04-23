import type { CardField, FieldType } from "../../../shared/types";
import { FIELD_TEMPLATES } from "../constants";

let _uidCounter = 0;
function uid(): string {
  return `f_${Date.now()}_${++_uidCounter}`;
}

export const TEXT_PRESETS: { type: FieldType; label: string; icon: string }[] = [
  { type: "name",    label: "Full Name",  icon: "\u{1F464}" },
  { type: "title",   label: "Job Title",  icon: "\u{1F3F7}\uFE0F" },
  { type: "company", label: "Company",    icon: "\u{1F3E2}" },
  { type: "id",      label: "ID Number",  icon: "#" },
  { type: "email",   label: "Email",      icon: "\u2709\uFE0F" },
  { type: "phone",   label: "Phone",      icon: "\u{1F4DE}" },
  { type: "address", label: "Address",    icon: "\u{1F4CD}" },
];

export function createField(type: FieldType, existingCount: number): CardField {
  const tpl = FIELD_TEMPLATES.find(t => t.type === type)!;
  const base: CardField = {
    id: uid(),
    type,
    label: tpl.label,
    x: 8,
    y: 8 + existingCount * 13,
    width: tpl.defaultW,
    height: tpl.defaultH,
    borderStyle: "none",
    borderWidth: 2,
    borderColor: "#1e293b",
    borderRadius: 6,
  };

  switch (type) {
    case "name":
      return { ...base, fontSize: 14, bold: true, color: "#1e293b", align: "left" };

    case "title":
    case "company":
    case "id":
    case "email":
    case "phone":
    case "address":
      return { ...base, fontSize: 11, color: "#1e293b", align: "left" };

    case "text":
      return { ...base, label: "Text Label", fontSize: 12, color: "#1e293b", align: "left" };

    case "photo":
      return { ...base, imageFit: "cover", imageScale: 1, imageOffsetX: 0, imageOffsetY: 0 };

    case "barcode":
      return { ...base, barcodeValue: "1234567890", color: "#000000" };

    case "qr":
      return { ...base, qrValue: "https://example.com", color: "#000000" };

    default:
      return base;
  }
}
