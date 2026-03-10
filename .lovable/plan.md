

## Two Changes

### 1. Fix Footer Logo Flicker on Theme Toggle

**Problem**: The footer renders both logo variants (dark/light) and swaps `src` on theme change, causing a visible image load delay.

**Fix**: Render both `<img>` tags simultaneously but toggle visibility with CSS `hidden`/`block`. Both images are preloaded in the DOM so the swap is instant — no network fetch needed.

**File**: `src/components/layout/Footer.tsx`
- Import `useTheme` with `resolvedTheme` (next-themes provides this)
- Render both logos, hide/show with `className={resolvedTheme === "dark" ? "block" : "hidden"}` and vice versa
- Remove the JS-computed `footerLogo` variable and `window.matchMedia` call

### 2. Notification System Enhancements

**Problem**: Notifications only fire on registration. Need: welcome notification on first login, first event creation, and other lifecycle events. Also, notification items should not be clickable — only show a small "mark as read" icon button.

#### A. Welcome Notification (DB Trigger)

Create a DB trigger on `profiles` table INSERT that automatically inserts a welcome notification. This fires when `handle_new_user()` creates the profile row.

**Migration SQL**:
```sql
CREATE OR REPLACE FUNCTION public.send_welcome_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, actor_name)
  VALUES (
    NEW.user_id,
    'welcome',
    'Welcome to Kulmid! 🎉',
    'We''re glad to have you here. Start exploring events or create your own!',
    'Kulmid'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.send_welcome_notification();
```

#### B. First Event Created Notification (DB Trigger)

Trigger on `events` INSERT to congratulate the user on their first event.

```sql
CREATE OR REPLACE FUNCTION public.send_first_event_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  event_count integer;
BEGIN
  SELECT COUNT(*) INTO event_count FROM public.events WHERE created_by = NEW.created_by;
  IF event_count = 1 THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name)
    VALUES (
      NEW.created_by,
      'milestone',
      'Your first event is live! 🚀',
      'Congratulations on creating "' || NEW.title || '". Share it to get registrations!',
      NEW.id,
      'Kulmid'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_created_notification
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.send_first_event_notification();
```

#### C. Update Notification Type Union

**File**: `src/contexts/NotificationsContext.tsx`
- Expand `type` from `"registration" | "invitation"` to `string` to support `welcome`, `milestone`, etc.

#### D. Update NotificationsPanel UI

**File**: `src/components/notifications/NotificationsPanel.tsx`
- Remove `onClick` handler from notification rows (not clickable)
- Remove `cursor-pointer` class
- Replace the delete button with a small "mark as read" `Check` icon button (only shown when unread)
- Add icons for new types: `welcome` → `Sparkles`, `milestone` → `Trophy`
- Keep the delete button but make it always visible (small)

### Files Modified
- `src/components/layout/Footer.tsx`
- `src/components/notifications/NotificationsPanel.tsx`
- `src/contexts/NotificationsContext.tsx`
- New migration SQL (welcome + first event triggers)

