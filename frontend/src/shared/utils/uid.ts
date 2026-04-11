import type { CardField } from "../types";

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function withIds(fields: Omit<CardField, "id">[]): CardField[] {
  return fields.map(f => ({ ...f, id: uid() }));
}
