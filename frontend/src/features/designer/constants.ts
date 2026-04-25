import type { FieldType, RHandle } from "../../shared/types";

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
