

## Plan: Mobile-First Welcome Page Overhaul

### Problems Identified

Looking at the screenshot, the Welcome page (`/`) has several mobile issues:

1. **The 3D visual section is completely hidden** on screens smaller than `lg` (1024px) due to `hidden lg:block`, leaving a bare, empty-feeling page
2. **Excessive vertical spacing** — `min-h-screen` + `py-20` creates too much empty space above and below the text
3. **Text is too large** for small screens (`text-5xl` on mobile)
4. **Buttons don't feel bold enough** — they could be full-width and more prominent on mobile
5. **No visual interest on mobile** — without the 3D elements, the page is just text on a dark background

---

### Solution

Redesign the Welcome page to be **mobile-first** with a scaled-down version of the 3D visual elements visible on all screen sizes, tighter spacing, and full-width CTA buttons.

---

### Changes (1 file: `src/pages/Welcome.tsx`)

**1. Show 3D elements on mobile (scaled down)**
- Remove `hidden lg:block` from the 3D visual section
- On mobile: show a compact, centered version of the floating elements above or below the text
- On desktop: keep the current side-by-side grid layout

**2. Fix spacing**
- Replace `min-h-screen` with `min-h-[85vh]` on mobile, `min-h-screen` on desktop
- Reduce `py-20` to `py-12` on mobile
- Tighten `space-y-8` to `space-y-6` on mobile

**3. Adjust typography for mobile**
- `text-4xl` on mobile (down from `text-5xl`)
- `text-lg` for subtitle on mobile (down from `text-xl`)

**4. Full-width, stacked buttons on mobile**
- Both buttons become `w-full` on mobile
- Slightly larger touch targets
- Stack vertically by default, side-by-side on `sm+`

**5. Mobile 3D visual section**
- Show a smaller, horizontal arrangement of floating shapes below the CTA buttons on mobile
- Use `aspect-[2/1]` ratio instead of `aspect-square` to keep it compact
- Scale down the floating elements (smaller sizes, tighter positioning)

---

### Visual Layout (Mobile)

```text
+----------------------------------+
| [Logo]              [Search] [=] |
|                                  |
|        (compact floating         |
|         3D shapes here)          |
|                                  |
|       Delightful                 |
|       events                     |
|       start here.                |
|                                  |
|  Set up an event page, invite    |
|     friends and sell tickets.    |
|                                  |
|  [====== Browse Events ======>]  |
|  [==== Create Your Event ====]   |
|                                  |
+----------------------------------+
```

---

### Technical Details

| Area | Current (Mobile) | Updated (Mobile) |
|------|-----------------|-----------------|
| Min height | `min-h-screen` (100vh) | `min-h-[80vh] md:min-h-screen` |
| Padding | `py-20` | `py-10 md:py-20` |
| Heading size | `text-5xl` | `text-4xl md:text-5xl` |
| Subtitle | `text-xl` | `text-lg md:text-xl` |
| 3D section | `hidden lg:block` | Always visible, compact on mobile |
| Layout | `grid lg:grid-cols-2` | Single column on mobile, 2-col on `lg` |
| Buttons | `flex-col sm:flex-row` | Full-width on mobile with `w-full sm:w-auto` |
| 3D container | `aspect-square max-w-lg` | `h-48 md:h-auto md:aspect-square` on mobile |
| Floating shapes | 16-20px sizes | 10-14px on mobile, original on lg |

