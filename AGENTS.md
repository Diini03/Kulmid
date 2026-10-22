# Architecture rules
- Organizer assistant statistics are loaded in the edge function with a validated caller token, RLS, and an explicit event-owner filter; never use elevated credentials or send attendee-identifying fields to AI.
- Signed-in assistant conversations remain in memory and are cleared on account changes; cancel in-flight requests to prevent private answers crossing sessions.
- Keep AI Gateway generated declarations within the edge function directory and use the server-only SDK to preserve deployable imports and typed streaming.