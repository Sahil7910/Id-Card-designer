import type { FieldType, RHandle } from "../../shared/types";

// ── Design Standards ─────────────────────────────────────────────
// All sizes are percentages of card dimensions (0–100).
// Card is 85.6 mm × 54 mm (standard CR80 ID card).

export interface FieldSizeStandard {
  minW: number; maxW: number;
  minH: number; maxH: number;
  recommended: string;
  tips: string[];
}

export const FIELD_SIZE_STANDARDS: Record<FieldType, FieldSizeStandard> = {
  photo:   { minW: 15, maxW: 40, minH: 20, maxH: 55, recommended: "22% × 30%", tips: ["Too small hides face details", "Wider than 40% leaves little room for other fields"] },
  logo:    { minW: 12, maxW: 55, minH: 8,  maxH: 35, recommended: "30% × 15%", tips: ["Too small makes logo unrecognizable", "Keep proportional to original logo"] },
  name:    { minW: 25, maxW: 90, minH: 5,  maxH: 20, recommended: "55% × 10%", tips: ["Needs enough width for full name", "Height below 5% may clip text"] },
  title:   { minW: 20, maxW: 90, minH: 4,  maxH: 18, recommended: "55% × 8%",  tips: ["Minimum width for readable job title"] },
  company: { minW: 20, maxW: 90, minH: 4,  maxH: 18, recommended: "50% × 8%",  tips: ["Minimum width for company name"] },
  id:      { minW: 18, maxW: 80, minH: 4,  maxH: 15, recommended: "40% × 8%",  tips: ["ID numbers need adequate width"] },
  email:   { minW: 30, maxW: 95, minH: 4,  maxH: 15, recommended: "60% × 8%",  tips: ["Email addresses are long — use at least 30% width"] },
  phone:   { minW: 20, maxW: 85, minH: 4,  maxH: 15, recommended: "45% × 8%",  tips: ["Phone number needs minimum 20% width"] },
  barcode: { minW: 22, maxW: 75, minH: 10, maxH: 30, recommended: "30% × 15%", tips: ["Narrow barcodes may not scan reliably", "Height below 10% reduces scan accuracy", "Wider barcodes improve scanner read rate"] },
  address: { minW: 30, maxW: 95, minH: 8,  maxH: 25, recommended: "60% × 12%", tips: ["Address text needs sufficient width and height"] },
  text:    { minW: 8,  maxW: 95, minH: 4,  maxH: 30, recommended: "50% × 8%",  tips: ["Ensure height is sufficient for font size chosen"] },
  qr:      { minW: 12, maxW: 40, minH: 12, maxH: 40, recommended: "20% × 20%", tips: ["QR codes below 12% may not scan", "Keep width and height equal for a square QR", "Larger QR codes scan more reliably from a distance"] },
};

export interface FieldSizeWarning {
  severity: "error" | "warning";
  message: string;
}

export function getFieldSizeWarnings(
  field: { type: FieldType; width: number; height: number }
): FieldSizeWarning[] {
  const std = FIELD_SIZE_STANDARDS[field.type];
  const warnings: FieldSizeWarning[] = [];

  if (field.width < std.minW) {
    warnings.push({ severity: "error", message: `Width ${Math.round(field.width)}% is too narrow — min ${std.minW}% needed` });
  } else if (field.width > std.maxW) {
    warnings.push({ severity: "warning", message: `Width ${Math.round(field.width)}% is very wide — max ${std.maxW}% recommended` });
  }

  if (field.height < std.minH) {
    warnings.push({ severity: "error", message: `Height ${Math.round(field.height)}% is too short — min ${std.minH}% needed` });
  } else if (field.height > std.maxH) {
    warnings.push({ severity: "warning", message: `Height ${Math.round(field.height)}% is too tall — max ${std.maxH}% recommended` });
  }

  if (field.type === "qr" && Math.abs(field.width - field.height) > 5) {
    warnings.push({ severity: "warning", message: `QR codes should be square — current ratio is ${Math.round(field.width)}% × ${Math.round(field.height)}%` });
  }

  return warnings;
}

export const FIELD_TEMPLATES: { type: FieldType; label: string; icon: string; defaultW: number; defaultH: number }[] = [
  { type: "photo",   label: "Photo",      icon: "\u{1F464}", defaultW: 22, defaultH: 30 },
  { type: "logo",    label: "Logo",       icon: "\u{1F3E2}", defaultW: 30, defaultH: 15 },
  { type: "name",    label: "Full Name",  icon: "\u270F\uFE0F",  defaultW: 55, defaultH: 10 },
  { type: "title",   label: "Job Title",  icon: "\u{1F3F7}\uFE0F",  defaultW: 55, defaultH: 8  },
  { type: "company", label: "Company",    icon: "\u{1F3E2}", defaultW: 50, defaultH: 8  },
  { type: "id",      label: "ID Number",  icon: "#",  defaultW: 40, defaultH: 8  },
  { type: "email",   label: "Email",      icon: "\u2709\uFE0F",  defaultW: 60, defaultH: 8  },
  { type: "phone",   label: "Phone",      icon: "\u{1F4DE}", defaultW: 45, defaultH: 8  },
  { type: "barcode", label: "Barcode",    icon: "\u25A6",  defaultW: 30, defaultH: 15 },
  { type: "address", label: "Address",    icon: "\u{1F4CD}", defaultW: 60, defaultH: 12 },
  { type: "text",    label: "Text Label", icon: "T",  defaultW: 50, defaultH: 8  },
  { type: "qr",      label: "QR Code",   icon: "\u2B1B", defaultW: 20, defaultH: 20 },
];

export const FIELD_COLORS: Record<FieldType, string> = {
  photo:   "#6366f1",
  logo:    "#10b981",
  name:    "#e05c1a",
  title:   "#0ea5e9",
  company: "#8b5cf6",
  id:      "#10b981",
  email:   "#f59e0b",
  phone:   "#ec4899",
  barcode: "#64748b",
  address: "#14b8a6",
  text:    "#e2e8f0",
  qr:      "#0f172a",
};

export const HANDLES: { id: RHandle; cursor: string; style: React.CSSProperties }[] = [
  { id: "nw", cursor: "nw-resize", style: { top: -5, left: -5 } },
  { id: "n",  cursor: "n-resize",  style: { top: -5, left: "50%", transform: "translateX(-50%)" } },
  { id: "ne", cursor: "ne-resize", style: { top: -5, right: -5 } },
  { id: "w",  cursor: "w-resize",  style: { top: "50%", left: -5, transform: "translateY(-50%)" } },
  { id: "e",  cursor: "e-resize",  style: { top: "50%", right: -5, transform: "translateY(-50%)" } },
  { id: "sw", cursor: "sw-resize", style: { bottom: -5, left: -5 } },
  { id: "s",  cursor: "s-resize",  style: { bottom: -5, left: "50%", transform: "translateX(-50%)" } },
  { id: "se", cursor: "se-resize", style: { bottom: -5, right: -5 } },
];
