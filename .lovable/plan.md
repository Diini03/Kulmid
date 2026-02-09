

## Plan: Complete Chatbot Enhancement — Phased Implementation

We'll add the most impactful missing features in **4 phases**, each building on the previous one. Every phase delivers real user value.

---

### Phase 1: Core Usability (Essential Controls)

These are things users expect from any chatbot and will notice immediately if missing.

**1a. Clear Conversation Button**
- Add a trash/eraser icon in the header next to the close button
- Clears all messages and resets to the welcome screen with FAQ chips
- Shows a confirmation before clearing

**1b. Textarea for Multi-line Input**
- Replace the single-line `Input` with a `Textarea` that auto-grows
- Starts as 1 line, expands up to 4 lines as the user types
- Submit on Enter, new line on Shift+Enter

**1c. Message Character Limit**
- Cap input at 500 characters
- Show a subtle character counter near the input (e.g., "127/500")
- Disable send button when over limit

**Files changed:** `ChatWidget.tsx`

---

### Phase 2: Message Interactions (Per-Message Actions)

Features that let users interact with individual messages.

**2a. Copy Message Button**
- On hover (desktop) or tap (mobile), show a small copy icon on assistant messages
- Copies the raw text to clipboard
- Brief "Copied!" feedback via tooltip or toast

**2b. Retry Failed Messages**
- When a message fails, show a retry button instead of removing the message
- "Failed to send. Tap to retry" with a refresh icon
- Clicking it re-sends the same message

**2c. Message Timestamps**
- Show a subtle timestamp below each message (e.g., "2:34 PM")
- Only visible on hover (desktop) or always visible on mobile

**Files changed:** `ChatMessage.tsx`, `ChatWidget.tsx`

---

### Phase 3: Persistence and Continuity

Users lose their entire conversation on page refresh — this fixes that.

**3a. Chat History via localStorage**
- Save messages to `localStorage` on every update
- Restore messages when the widget reopens or the page reloads
- Clear conversation button also clears localStorage

**3b. Scroll-to-Bottom Button**
- When the user scrolls up in a long conversation, show a floating "scroll to bottom" pill
- Disappears when already at the bottom
- Shows unread message count if new messages arrived while scrolled up

**Files changed:** `ChatWidget.tsx`

---

### Phase 4: Mobile Experience and Polish

Make the chatbot feel native on phones.

**4a. Full-Screen on Mobile**
- On screens smaller than `sm` (640px), the chat panel takes the full screen instead of a small floating box
- Proper safe-area handling for notched phones
- Smooth slide-up animation on open

**4b. Feedback Buttons (Thumbs Up/Down)**
- Add thumbs up/down icons below each assistant message
- Visual feedback when clicked (icon fills in)
- Stored in local state (no backend needed for now)

**Files changed:** `ChatWidget.tsx`, `ChatMessage.tsx`

---

### Summary Table

| Phase | Feature | File(s) |
|-------|---------|---------|
| 1 | Clear conversation button | `ChatWidget.tsx` |
| 1 | Textarea with auto-grow + Shift+Enter | `ChatWidget.tsx` |
| 1 | Character limit (500) with counter | `ChatWidget.tsx` |
| 2 | Copy message button | `ChatMessage.tsx` |
| 2 | Retry on failure | `ChatWidget.tsx`, `ChatMessage.tsx` |
| 2 | Message timestamps | `ChatMessage.tsx`, `ChatWidget.tsx` |
| 3 | localStorage persistence | `ChatWidget.tsx` |
| 3 | Scroll-to-bottom button | `ChatWidget.tsx` |
| 4 | Full-screen mobile mode | `ChatWidget.tsx` |
| 4 | Thumbs up/down feedback | `ChatMessage.tsx` |

All 4 phases will be implemented in a single pass across 2 files: `ChatWidget.tsx` and `ChatMessage.tsx`.

