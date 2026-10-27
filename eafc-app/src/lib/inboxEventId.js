/**
 * Per-click mailbox event id.
 * Stage keys sendInboxMessage uniqueness as:
 *   {message_type}:{event_id}:{recipient_email}
 * Same event_id → retry / one row. New event_id → INSERT at top of inbox.
 */
export function createInboxEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
