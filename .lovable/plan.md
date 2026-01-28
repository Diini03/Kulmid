

## Plan: Informational Pages Redesign - Modern Minimal Consolidation

### Overview
Consolidate and redesign the 5 informational pages (About, OurStory, OurTeam, Achievements, Contact) into a modern, minimal design that matches the sleek Discover/Events pages aesthetic. Remove clutter, big hero images, and template-looking elements.

---

### Current State Analysis

| Page | Issues |
|------|--------|
| **About** | Duplicate content (repeats story/milestones from OurStory), hero image not needed |
| **OurStory** | 60vh hero with large image overlay, gradient backgrounds, too much padding |
| **OurTeam** | Template-looking cards, gradient hero, emoji icons, placeholder images |
| **Achievements** | Vague stats ("Growing", "Many"), gradient heroes, repetitive sections |
| **Contact** | Fake US address/phone, FAQ duplicates Help page, map placeholder |

---

### Consolidation Strategy

**Remove 2 pages, keep 3:**

| Keep | Merge Into | Remove |
|------|------------|--------|
| **About** | Absorb story + timeline + values | - |
| **Team** | Standalone (redesigned) | - |
| **Contact** | Absorb achievements as simple stats | - |
| - | - | **OurStory** (merge into About) |
| - | - | **Achievements** (merge into Contact as "Impact" section) |

**Update Footer:** Links change from 7 to 5:
- Events, About, Team, Contact, Help

---

### New Page Designs

#### 1. About Page (New - Absorbs OurStory)
```text
+------------------------------------------+
|  About Kulmid                            |  <- Simple text hero, no image
|  One line tagline                        |
+------------------------------------------+
|                                          |
|  [Two columns: Mission | What We Do]     |  <- Clean grid, no images
|                                          |
+------------------------------------------+
|  Our Journey                             |
|                                          |
|  2024 ─────● Platform Launch             |  <- Minimal timeline
|  2024 ─────● Growing Together            |     (vertical line + dots)
|  2025 ─────● Expanding Reach             |
|                                          |
+------------------------------------------+
|  Our Values                              |
|                                          |
|  [Trust] [Accessibility] [Community]     |  <- Simple 3-column cards
|                                          |
+------------------------------------------+
```

**Design principles:**
- No hero image
- No gradients (pure bg-background)
- Minimal timeline with teal accent dots
- Clean typography focus

---

#### 2. Team Page (New Design)
```text
+------------------------------------------+
|  The Team                                |  <- Simple heading
|  Short tagline                           |
+------------------------------------------+
|                                          |
|  [Avatar] Name                           |  <- Simple list layout
|          Role                            |     Not cards, not grid
|          One-line bio                    |
|                                          |
|  [Avatar] Name                           |
|          Role                            |
|          One-line bio                    |
|                                          |
|  ... (5 members)                         |
|                                          |
+------------------------------------------+
```

**Design principles:**
- Remove emojis, badges, expertise tags
- Simple avatar + text rows (not card grid)
- No social buttons (placeholder links anyway)
- No "Culture" or "Stats" sections
- Clean, minimal, professional

---

#### 3. Contact Page (New - Absorbs Achievements)
```text
+------------------------------------------+
|  Contact Us                              |  <- Simple heading
|  Tagline                                 |
+------------------------------------------+
|                                          |
|  [Contact Form - 2/3 width]              |  <- Simplified form
|                                          |     Remove category dropdown
|                                          |     Name, Email, Message only
|                                          |
|  [Contact Info - 1/3 width]              |  <- Real Kulmid info
|    Email: hello@kulmid.com               |     Not fake US address
|    Phone: (if available)                 |
|                                          |
+------------------------------------------+
|  Our Impact                              |  <- Absorbed from Achievements
|                                          |
|  [Events Hosted] [Communities] [Users]   |  <- 3 simple stats
|                                          |
+------------------------------------------+
```

**Design principles:**
- Remove fake US address
- Remove FAQ (already in Help page)
- Remove map placeholder
- Add simple "Impact" stats section from Achievements
- Streamlined form fields

---

### Files to Modify

| Action | File |
|--------|------|
| **Rewrite** | `src/pages/About.tsx` - New minimal design with story/values |
| **Rewrite** | `src/pages/OurTeam.tsx` - Simple list layout |
| **Rewrite** | `src/pages/Contact.tsx` - Simplified form + impact stats |
| **Delete** | `src/pages/OurStory.tsx` - Content merged into About |
| **Delete** | `src/pages/Achievements.tsx` - Content merged into Contact |
| **Update** | `src/App.tsx` - Remove routes, add redirects |
| **Update** | `src/components/layout/Footer.tsx` - Remove links |

---

### Route Changes

```text
/about         -> Keep (new design)
/our-story     -> Redirect to /about
/our-team      -> Keep (rename route to /team)
/team          -> New route for Team page
/achievements  -> Redirect to /contact
/contact       -> Keep (new design with impact section)
```

---

### Technical Details

#### About Page Structure
- Hero: Simple `<h1>` + `<p>` tagline (no image/gradient)
- Section 1: Two-column grid (Mission | What We Do)
- Section 2: Minimal timeline with CSS-only vertical line
- Section 3: Three value cards (outline style, no backgrounds)

#### Team Page Structure
- Hero: Simple heading
- List: Flexbox rows with avatar (64px circle) + text stack
- No cards, no grid, no social icons

#### Contact Page Structure
- Hero: Simple heading
- Grid: 2/3 form + 1/3 info
- Form: Name, Email, Message only (3 fields)
- Impact: 3 stats with actual numbers or "Growing" placeholders

#### Redirects in App.tsx
```typescript
<Route path="/our-story" element={<Navigate to="/about" replace />} />
<Route path="/achievements" element={<Navigate to="/contact" replace />} />
```

---

### Summary

This redesign will:

1. **Reduce from 5 to 3 pages** - Cleaner navigation, less maintenance
2. **Remove template-looking elements** - No hero images, gradients, emojis
3. **Match Events/Discover aesthetic** - Minimal, clean, professional
4. **Fix fake content** - Remove US address, use real Kulmid info
5. **Eliminate duplication** - FAQ only in Help, story only in About

