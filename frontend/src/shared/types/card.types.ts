// ── Field Types ──────────────────────────────────────────────────
export type FieldType =
  | "name" | "title" | "company" | "photo"
  | "id" | "email" | "phone" | "barcode" | "logo" | "address";

export interface CardField {
  id: string;
  type: FieldType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  align?: "left" | "center" | "right";
  fontFamily?: string;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: "solid" | "dashed" | "dotted" | "double" | "none";
  borderRadius?: number;
  shadowColor?: string;
  shadowSize?: number;
  imageUrl?: string;
}

export interface CardTemplate {
  id: string;
  name: string;
  category: string;
  accent: string;
  bg: string;
  frontBg?: string;
  backBg?: string;
  frontBgUrl?: string;
  backBgUrl?: string;
  orientation?: "Horizontal" | "Vertical";
  frontFields: Omit<CardField, "id">[];
  backFields: Omit<CardField, "id">[];
}

// ── Designer Types ───────────────────────────────────────────────
export type CardType = "Company" | "School" | "Others";
export type PrintSide = "Single Side" | "Both Sides";
export type Orientation = "Horizontal" | "Vertical";
export type ChipType = "LED" | "RFID" | "None";
export type Finish = "Matte" | "Glossy" | "Metallic";
export type Material = "PVC Plastic" | "Paper" | "Composite";
export type PrinterType = "Thermal" | "Inkjet";
export type DesignSide = "front" | "back";
export type RHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type DragState =
  | { id: string; mode: "move"; startX: number; startY: number; origX: number; origY: number }
  | { id: string; mode: "resize"; handle: RHandle; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number };

export const TEXT_TYPES: FieldType[] = [
  "name", "title", "company", "id", "email", "phone", "address",
];
