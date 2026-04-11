// ── India Location Data (from india_location_data.json) ──────────────
// JSON structure: { [State]: { [District]: { [City]: "Pincode" } } }
// All keys/values may have leading/trailing spaces — always .trim() before use.

import rawData from '../../india_location_data.json';

type RawJson = Record<string, Record<string, Record<string, string>>>;
const data = rawData as RawJson;

// ── Exported Types (unchanged — CheckoutForm depends on CityData) ─────
export interface CityData {
  name:    string;
  pincode: string;
}

// ── Countries list ────────────────────────────────────────────────────
// India first (default); remaining countries use free-text inputs.
export const COUNTRIES: string[] = [
  "India",
  "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Netherlands", "Singapore", "UAE",
  "Saudi Arabia", "South Africa", "Others",
];

// ── Helper: find a raw key whose trimmed value matches the query ───────
function findKey(obj: Record<string, unknown>, trimmed: string): string | undefined {
  return Object.keys(obj).find(k => k.trim() === trimmed);
}

// ── Helpers (same signatures as before — no changes in callers needed) ─

export function getStates(_country: string): string[] {
  return Object.keys(data)
    .map(s => s.trim())
    .filter(Boolean)
    .sort();
}

export function getDistricts(_country: string, state: string): string[] {
  const stateKey = findKey(data, state);
  if (!stateKey) return [];
  return Object.keys(data[stateKey])
    .map(d => d.trim())
    .filter(Boolean)
    .sort();
}

export function getCities(
  _country: string,
  state: string,
  district: string,
): CityData[] {
  const stateKey = findKey(data, state);
  if (!stateKey) return [];
  const distKey = findKey(data[stateKey], district);
  if (!distKey) return [];
  return Object.entries(data[stateKey][distKey]).map(([name, pincode]) => ({
    name:    name.trim(),
    pincode: (pincode as string).trim(),
  }));
}

export function getPincode(
  country: string,
  state: string,
  district: string,
  city: string,
): string {
  return getCities(country, state, district).find(c => c.name === city)?.pincode ?? "";
}
