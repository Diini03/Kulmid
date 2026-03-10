

## Fix Logo: Use Icon + Theme-Aware Horizontal Logos

### What changes

**1. Copy uploaded assets to `src/assets/`**
- `logoicon.png` → `src/assets/kulmid-logo-icon.png` (icon-only, for favicon-sized uses)
- `horiz-dark-logo.png` → `src/assets/kulmid-logo-dark.png` (dark text, for light mode)
- `horiz-white-logo.png` → `src/assets/kulmid-logo-white.png` (white text, for dark mode)

**2. Navbar (`src/components/layout/Navbar.tsx`)**
- Replace the current `kulmid-logo.png` import with the two horizontal logos
- Use `useTheme()` (already imported) to pick the right one:
  - Light mode / system → `kulmid-logo-dark.png`
  - Dark mode → `kulmid-logo-white.png`
- Change the logo `<img>` from `h-9 w-9` (icon size) to `h-8` (horizontal logo, auto width) so it displays properly as a wordmark
- Mobile sheet header: same theme-aware logo

**3. Footer (`src/components/layout/Footer.tsx`)**
- Same theme-aware horizontal logo swap (currently uses `kulmid-logo-text.png`)

**4. AdminLayout (`src/components/admin/AdminLayout.tsx`)**
- Use the icon logo (`kulmid-logo-icon.png`) at `h-8 w-8` since the sidebar is narrow

### Files
- **Copy**: 3 uploaded images to `src/assets/`
- **Modify**: `Navbar.tsx`, `Footer.tsx`, `AdminLayout.tsx`

