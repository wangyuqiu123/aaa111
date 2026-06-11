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