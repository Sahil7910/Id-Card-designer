export interface RGB { r: number; g: number; b: number }
export interface CMYK { c: number; m: number; y: number; k: number }

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

export function hexToCmyk(hex: string): CMYK {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - rn - k) / (1 - k);
  const m = (1 - gn - k) / (1 - k);
  const y = (1 - bn - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

export function cmykToHex(c: number, m: number, y: number, k: number): string {
  const r = 255 * (1 - c / 100) * (1 - k / 100);
  const g = 255 * (1 - m / 100) * (1 - k / 100);
  const b = 255 * (1 - y / 100) * (1 - k / 100);
  return rgbToHex(r, g, b);
}

/** Returns true for highly saturated neon colours that don't print well */
export function isNeonColor(hex: string): boolean {
  try {
    const { r, g, b } = hexToRgb(hex);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2 / 255;
    const saturation = max === min ? 0 : (max - min) / 255 / (lightness < 0.5 ? lightness * 2 : 2 - lightness * 2);
    return saturation > 0.9 && lightness > 0.4 && lightness < 0.65;
  } catch {
    return false;
  }
}

export function getPrintWarning(hex: string): string | null {
  if (isNeonColor(hex)) {
    return "Neon colors may not reproduce accurately in print. Consider a darker shade.";
  }
  return null;
}
