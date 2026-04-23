export const STATUS_COLORS: Record<string, string> = {
  ENQUIRY:    "#94a3b8",
  CONFIRM:    "#3b82f6",
  ONHOLD:     "#f59e0b",
  INPROGRESS: "#fb923c",
  REVIEW:     "#facc15",
  PRINTING:   "#8b5cf6",
  SHIPPING:   "#06b6d4",
  DISPATCHED: "#22c55e",
};

export const ROLE_ALLOWED_STATUSES: Record<string, string[]> = {
  DESIGN:   ["ENQUIRY", "ONHOLD", "INPROGRESS", "REVIEW", "PRINTING"],
  PRINTING: ["ENQUIRY", "INPROGRESS", "CONFIRM", "ONHOLD", "SHIPPING"],
  SHIPPING: ["ONHOLD", "DISPATCHED"],
  ADMIN: [
    "ENQUIRY", "CONFIRM", "ONHOLD", "INPROGRESS", "REVIEW",
    "PRINTING", "SHIPPING", "DISPATCHED",
  ],
};

export function statusLabel(s: string): string {
  return s.replace(/_/g, " ");
}
