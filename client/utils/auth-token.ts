/**
 * Global auth token store for x-session header.
 * Set from AuthContext when session changes.
 */

let accessToken: string | null = null;

export function setAuthToken(token: string | null) {
  accessToken = token;
}

export function getAuthToken(): string | null {
  return accessToken;
}

export function withAuthHeaders(
  headers: Record<string, string> = {}
): Record<string, string> {
  if (accessToken) {
    headers['x-session'] = accessToken;
  }
  // Always ensure Content-Type for JSON requests
  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

/** Get the API base URL, handling Metro's "undefined" string substitution */
let cachedBaseUrl: string | null = null;
export function getApiBase(): string {
  if (cachedBaseUrl) return cachedBaseUrl;
  const rawUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  cachedBaseUrl = (rawUrl && rawUrl !== 'undefined' && rawUrl !== '')
    ? rawUrl
    : 'http://localhost:9091';
  return cachedBaseUrl!;
}