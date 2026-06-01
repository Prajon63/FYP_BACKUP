/** Live backend (Render Web Service). Update if your API URL changes. */
export const PRODUCTION_API_ORIGIN = 'https://fyp-backup.onrender.com';

/**
 * Resolves API origin for axios / socket.
 * Rewrites mistaken capella-api URL from older Render builds.
 */
export function resolveApiOrigin(): string | null {
  let raw = import.meta.env.VITE_API_URL?.trim();
  if (raw) {
    if (raw.includes('capella-api.onrender.com')) {
      raw = PRODUCTION_API_ORIGIN;
    }
    return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }

  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('.onrender.com') && !host.includes('fyp-backup')) {
      return PRODUCTION_API_ORIGIN;
    }
  }

  return null;
}

export function resolveApiBaseUrl(): string {
  const origin = resolveApiOrigin();
  return origin ? `${origin}/api` : '/api';
}

export function resolveSocketUrl(): string {
  let raw = import.meta.env.VITE_SOCKET_URL?.trim();
  if (raw) {
    if (raw.includes('capella-api.onrender.com')) {
      raw = PRODUCTION_API_ORIGIN;
    }
    return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }

  const fromApi = resolveApiOrigin();
  if (fromApi) return fromApi;

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000`;
  }
  return 'http://localhost:5000';
}
