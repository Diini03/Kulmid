

## Chatbot Cleanup — Two Fixes

### Fix 1: FAQ Chips Overflowing Their Area

**Problem**: Six questions in a 2-column grid are too many and overflow the chat area.

**Solution**: 
- Switch from `grid-cols-2` to a single-column layout so each chip fits neatly
- Reduce the list from 6 to 4 questions (keep 2 English + 2 Somali, removing the least essential pair)
- Wrap the FAQ area in a scrollable container as a safety net

**File**: `src/components/chat/FAQChips.tsx`
- Remove "How does registration work?" and "Sidee diiwaangelinta u shaqeysaa?" (the least common first question)
- Change grid to `flex flex-col gap-2` for a clean single-column stack

---

### Fix 2: Remove the Gradient Accent Line

**Problem**: The colored gradient bar at the very top of the chat panel (line 289 in `ChatWidget.tsx`) makes it look overly "AI-generated."

**Solution**: Delete the gradient line entirely. The header border already provides enough visual separation.

**File**: `src/components/chat/ChatWidget.tsx`
- Remove: `<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />`

---

### Summary

| Change | File |
|--------|------|
| Reduce FAQ to 4 items, single-column layout | `FAQChips.tsx` |
| Remove gradient accent line at top | `ChatWidget.tsx` |

Two small, safe changes. No functionality affected.

