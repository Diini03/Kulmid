

## Plan: Modern Chatbot Redesign

### Overview
Redesign the Kulmid AI chatbot with a more modern, eye-catching design that fixes dark mode readability issues and adds click-outside-to-close functionality.

---

### Current Issues Identified

1. **Dark Mode Readability**: User messages use teal background (`bg-primary`) with dark text (`--primary-foreground: 0 0% 5%`) - very hard to read
2. **No Click-Outside-to-Close**: Chat stays open until user clicks the X button
3. **Basic Design**: Current look doesn't catch the user's attention
4. **Floating Button**: Simple button that doesn't stand out

---

### Design Changes

#### 1. Floating Chat Button - Eye-Catching
```text
Current:  Simple round button
New:      Animated gradient ring + pulse effect + tooltip on hover
          Gently pulses to catch attention
          Shows "Need help?" tooltip on first visit
```

#### 2. Chat Panel - Modern Glass Design
```text
+------------------------------------------+
|  ✦ Kulmid AI                        [×] |  <- Gradient accent line at top
+------------------------------------------+
|                                          |
|   [Bot Avatar]                           |
|   "Hi! 👋 How can I help?"              |
|                                          |
|   [FAQ Chips in grid layout]             |
|                                          |
+------------------------------------------+
|                                          |
|  [Message input with send icon]          |
+------------------------------------------+
```

#### 3. Message Bubbles - Clean & Readable

**User Messages (Right-aligned):**
- Light mode: Dark background (`bg-foreground`) + light text
- Dark mode: Light/white background + dark text
- Creates strong contrast in both modes

**Assistant Messages (Left-aligned):**
- Subtle card-style background
- Clean typography with proper markdown rendering

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/chat/ChatWidget.tsx` | Add click-outside handler, modern styling, animated button |
| `src/components/chat/ChatMessage.tsx` | Fix color scheme for both modes, modern bubble design |
| `src/components/chat/FAQChips.tsx` | Update to grid layout, subtle styling |

---

### Technical Implementation

#### Click-Outside-to-Close
Add a `useRef` for the chat panel and a click listener:
```typescript
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };
  
  if (isOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }
  
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen]);
```

#### Fixed Message Colors
User messages will use explicit colors that work in both modes:
- Background: `bg-foreground` (black in light mode, near-white in dark mode)
- Text: `text-background` (white in light mode, near-black in dark mode)

This ensures high contrast regardless of theme.

#### Animated Floating Button
- Subtle pulse animation ring
- Gradient border effect
- Scale animation on hover
- Sparkle/chat icon with animation

---

### Visual Comparison

**Before (Current):**
```text
- Basic teal header
- Hard-to-read user messages in dark mode
- Simple floating button
- No backdrop/click-outside
```

**After (New):**
```text
- Gradient accent line at top
- High-contrast messages in both modes
- Animated floating button with glow effect
- Click-outside-to-close
- Smooth entrance/exit animations
- Better spacing and typography
```

---

### Summary

This redesign will:

1. **Fix the readability issue** - Messages will be clear in both light and dark modes
2. **Add click-outside-to-close** - More intuitive UX
3. **Make it eye-catching** - Animated button that users notice when they need help
4. **Keep it clean** - Follows the monochrome teal design system
5. **Improve overall polish** - Smooth animations, better spacing, modern look

