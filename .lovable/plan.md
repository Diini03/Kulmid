

## Plan: Update Logo Across Favicon, Navbar, and Footer

### What we're doing
Replace the current logo assets with the uploaded teal icon logo, and ensure "KULMID" text appears next to the logo in both the navbar and footer.

### Steps

1. **Copy uploaded logo to project**
   - Copy `user-uploads://download.png` → `public/favicon.png` (for favicon)
   - Copy `user-uploads://download.png` → `src/assets/kulmid-new-logo.png` (for navbar/footer)

2. **Update favicon in `index.html`**
   - Change `<link rel="icon" ...>` to reference `/favicon.png`

3. **Update Navbar (`src/components/layout/Navbar.tsx`)**
   - Import the new logo instead of `kulmid-logo-nav.png`
   - Add "KULMID" text next to the logo icon (bold, styled to match brand)
   - Keep the same h-9 w-9 sizing for the icon

4. **Update Footer (`src/components/layout/Footer.tsx`)**
   - Replace the horizontal wordmark images (`kulmid-logo-dark.png` / `kulmid-logo-white.png`) with the new icon + "KULMID" text
   - Use the new icon logo + styled text so it works in both light and dark themes without needing two separate image files
   - Remove the dual-image theme-toggle approach since text color handles theming naturally

### Result
- Favicon shows the teal icon
- Navbar: teal icon + "KULMID" text
- Footer: teal icon + "KULMID" text (theme-aware via CSS text color)

