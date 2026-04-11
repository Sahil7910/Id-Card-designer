// Central API base URL.
// In development: Vite proxy routes /api → localhost:8000, so this is unused for relative calls.
// In production: same-origin deployment (Nginx serves /api/) → empty string.
// For cross-origin deployment: set VITE_API_URL=https://api.yourdomain.com in .env.production
export const API_BASE = import.meta.env.VITE_API_URL ?? "";
