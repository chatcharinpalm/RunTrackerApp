/** Lightweight unique id — no crypto dependency needed for local-only Phase 1 records. */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
