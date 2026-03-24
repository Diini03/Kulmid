

# Fix: Tab Overflow on Mobile

## Problem
The EventBuilder page has 5 tabs (Overview, Guests, Registration, Edit, Settings) that overflow on mobile screens because the `TabsList` doesn't allow horizontal scrolling. The same issue may affect ProfileTabs which uses `flex-wrap` (works but can look cramped).

## Fix

### `src/pages/EventBuilder.tsx` (line 116)
Add `overflow-x-auto scrollbar-hide` to the TabsList so tabs scroll horizontally on mobile instead of overflowing off-screen. Also add `flex-nowrap` to prevent wrapping.

```
Before:
<TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">

After:
<TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0 overflow-x-auto scrollbar-hide flex-nowrap">
```

### `src/components/profile/ProfileTabs.tsx` (line 46)
Replace `flex-wrap` with `overflow-x-auto scrollbar-hide flex-nowrap` so on small screens tabs scroll instead of wrapping into multiple rows.

```
Before:
<TabsList className="w-full justify-start bg-secondary/50 rounded-xl p-1 h-auto flex-wrap">

After:
<TabsList className="w-full justify-start bg-secondary/50 rounded-xl p-1 h-auto overflow-x-auto scrollbar-hide flex-nowrap">
```

### `src/components/ui/tabs.tsx`
Add `flex-shrink-0` to TabsTrigger base styles so individual tab buttons don't compress when inside a scrollable container.

**2 files modified, 1 UI component adjusted. No logic changes.**

