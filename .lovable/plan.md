

## Change Default Theme to Light Mode

A single, safe change to one file.

### What will change
The app currently opens in **dark mode** by default. We will switch it so new visitors see **light mode** first. Users who have already chosen a theme (or whose OS preference is set) will not be affected -- their choice is still respected.

### Technical detail
In `src/components/ThemeProvider.tsx`, change `defaultTheme` from `"dark"` to `"light"`. That is the only change -- one word.

```
Before:  defaultTheme="dark"
After:   defaultTheme="light"
```

No other files are touched. Since `enableSystem` is on, users with a system-level dark mode preference will still get dark mode automatically.

