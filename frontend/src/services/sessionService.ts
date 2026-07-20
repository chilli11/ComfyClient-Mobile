const SESSION_KEY = 'comfyclient.session_token';

export function getStoredSessionToken(): string {
  try {
    return localStorage.getItem(SESSION_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredSessionToken(sessionToken: string): void {
  try {
    if (sessionToken) {
      localStorage.setItem(SESSION_KEY, sessionToken);
    }
  } catch {
    // Ignore storage failures.
  }
}
