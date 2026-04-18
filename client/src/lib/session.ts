// Session ID stored in React state (no localStorage - blocked in sandbox)
// We use a module-level variable that persists for the browser session
let _sessionId: string | null = null;

export function getSessionId(): string {
  if (!_sessionId) {
    // Generate a random session ID
    _sessionId = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return _sessionId;
}

export function apiHeaders() {
  return {
    "Content-Type": "application/json",
    "x-session-id": getSessionId(),
  };
}
