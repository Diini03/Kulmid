

## Plan: Replace Favicon with Kulmid Logo

### What We'll Do
Replace the current default favicon with the uploaded Kulmid "S" logo image, and ensure no Lovable branding remains in the browser tab.

### Steps

1. **Copy the uploaded image to the public folder**
   - Copy `user-uploads://ChatGPT_Image_Nov_8_2025_04_44_10_PM.png` to `public/favicon.png`
   - The public folder is correct here since favicons are referenced directly in HTML, not imported in React components

2. **Update `index.html`**
   - Add a `<link rel="icon">` tag pointing to the new favicon:
     ```html
     <link rel="icon" type="image/png" href="/favicon.png" />
     ```
   - This replaces the old `public/favicon.ico` (Lovable default)

3. **Delete the old favicon**
   - Remove `public/favicon.ico` (the Lovable badge)

### Files Changed

| Action | File |
|--------|------|
| Copy | Upload to `public/favicon.png` |
| Update | `index.html` - Add favicon link tag |
| Delete | `public/favicon.ico` - Remove old Lovable favicon |

