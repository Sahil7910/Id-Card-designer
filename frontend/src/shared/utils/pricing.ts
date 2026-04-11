import type { PrinterType, Finish, ChipType, PrintSide } from "../types";

const DEFAULTS: Record<string, number> = {
  base_thermal: 2.5,
  base_inkjet: 1.2,
  addon_glossy: 0.3,
  addon_metallic: 0.8,
  addon_rfid: 1.5,
  addon_led: 2.0,
  addon_both_sides: 0.4,
  discount_50: 7,
  discount_100: 12,
  discount_200: 18,
  discount_500: 25,
};

export function calcUnitPrice(
  printer: PrinterType,
  finish: Finish,
  chipType: ChipType,
  printSide: PrintSide,
  config?: Record<string, number>,
): number {
  const cfg = config ?? DEFAULTS;
  let base = printer === "Thermal" ? (cfg.base_thermal ?? 2.5) : (cfg.base_inkjet ?? 1.2);
  if (finish === "Glossy") base += (cfg.addon_glossy ?? 0.3);
  if (finish === "Metallic") base += (cfg.addon_metallic ?? 0.8);
  if (chipType === "RFID") base += (cfg.addon_rfid ?? 1.5);
  if (chipType === "LED") base += (cfg.addon_led ?? 2.0);
  if (printSide === "Both Sides") base += (cfg.addon_both_sides ?? 0.4);
  return parseFloat(base.toFixed(2));
}

export function calcTotal(unitPrice: number, qty: number, config?: Record<string, number>): number {
  const cfg = config ?? DEFAULTS;
  let discount = 1;
  if (qty >= 500) discount = 1 - (cfg.discount_500 ?? 25) / 100;
  else if (qty >= 200) discount = 1 - (cfg.discount_200 ?? 18) / 100;
  else if (qty >= 100) discount = 1 - (cfg.discount_100 ?? 12) / 100;
  else if (qty >= 50) discount = 1 - (cfg.discount_50 ?? 7) / 100;
  return parseFloat((unitPrice * qty * discount).toFixed(2));
}

export function getDiscountLabel(qty: number, config?: Record<string, number>): string | null {
  const cfg = config ?? DEFAULTS;
  if (qty >= 500) return `${cfg.discount_500 ?? 25}% OFF`;
  if (qty >= 200) return `${cfg.discount_200 ?? 18}% OFF`;
  if (qty >= 100) return `${cfg.discount_100 ?? 12}% OFF`;
  if (qty >= 50) return `${cfg.discount_50 ?? 7}% OFF`;
  return null;
}
