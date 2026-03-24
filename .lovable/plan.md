

# Kulmid — Somali Translation (i18n) with Language Switcher

## Approach

Create a lightweight React Context-based i18n system with JSON translation files. No external library needed — keeps bundle small and gives full control.

## New Files

### 1. `src/i18n/en.ts` — English translations (~80-100 keys)
Core UI strings: navbar labels, buttons, hero text, form labels, common actions, onboarding, footer links, admin labels.

### 2. `src/i18n/so.ts` — Somali translations (same keys)
Somali equivalents. Focus on natural, readable Somali — not machine-translated.

### 3. `src/i18n/index.ts` — Translation types and registry
Export a `translations` map keyed by locale code (`en`, `so`), plus the `TranslationKeys` type.

### 4. `src/contexts/LanguageContext.tsx` — Language provider
- Stores current language in React state + `localStorage` (`kulmid_language`)
- Provides `t(key)` function that looks up the key in the current locale's translations, falls back to English if missing
- Provides `language` and `setLanguage`
- Wraps the app in `App.tsx`

### 5. `src/components/common/LanguageSwitcher.tsx` — Dropdown component
- Small dropdown button showing "