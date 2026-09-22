# Kulmid

Kulmid is a bilingual event-management platform for creating, publishing, discovering, registering for, and operating events. The production website is [https://kulmid.com](https://kulmid.com).

## Product capabilities

- Instant event publishing with readable `/event/:slug` public URLs
- Public event pages with capacity, registration windows, waitlists, organizer identity, sharing, and calendar links
- Google Forms-style registration fields and event-specific questions
- Guest approval, bulk approval, invitations, cancellation, QR check-in, and CSV/Excel export
- Organizer analytics for registrations, attendance, responses, demographics, and post-event feedback
- Email confirmations, reminders, feedback requests, summaries, and organizer bulk email
- Public username profiles at `/u/:username`, profile photos, social links, and verified organizer badges
- English and Somali interface support
- Admin curation, event/user/category/report management, analytics, audit history, delivery logs, and platform settings
- AI-assisted event descriptions, attendance predictions, and help assistant
- Stripe Connect and WAAFI-oriented payment foundations

## Technology

- React 18, TypeScript, and Vite 5
- Tailwind CSS and shadcn/ui
- React Router and TanStack Query
- Supabase Authentication, Postgres, Storage, Row Level Security, RPC functions, and Edge Functions
- Vercel-compatible SPA and crawler rewrites

## Local development

### Requirements

- Node.js 18 or newer
- npm
- Access to the connected Supabase project for backend changes

### Setup

```bash
git clone <repository-url>
cd <repository-folder>
npm install
npm run dev
```

Vite serves the local application and reloads changes automatically.

### Environment variables

Create a local `.env` file with the public Supabase client settings:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-reference
```

Never place service-role keys, provider secrets, or private API keys in frontend variables or committed files. Edge Function secrets belong in Supabase project secrets.

## Commands

```bash
npm run dev        # start the development server
npm run build      # create a production build
npm run build:dev  # create a development-mode build
npm run lint       # run ESLint
npm run preview    # preview a completed build locally
```

## Project structure

```text
src/
  components/      shared interface and feature components
  contexts/        authentication, language, theme, and app state
  hooks/           reusable data and interface hooks
  i18n/            English and Somali dictionaries
  integrations/    generated Supabase client and types
  lib/             event URLs, exports, validation, analytics, and utilities
  pages/           public, organizer, account, and admin screens
supabase/
  functions/       Deno Edge Functions for email, AI, metadata, check-in, and automation
  migrations/      database schema history managed through Supabase migrations
public/            static files and event cover images
```

## Important routes

| Route | Purpose |
| --- | --- |
| `/discover` | Browse published events |
| `/event/:slug` | Canonical public event page |
| `/events` | Organizer event list |
| `/event/:id/builder` | Event workspace |
| `/u/:username` | Public organizer profile |
| `/guides` | Product guides |
| `/settings` | Profile, preferences, notifications, privacy, and appearance |
| `/admin` | Protected administration console |

Legacy event IDs and profile URLs remain supported and redirect to canonical addresses where possible.

## Supabase backend

The application uses a connected Supabase project for authentication and data. Database access is protected with Row Level Security. Admin authorization is stored separately in `user_roles` and checked through server-side database functions.

Key backend areas include:

- `events`, registration fields/questions, guests, answers, waitlists, and feedback
- public profiles, usernames, verification state, and account plan tier
- categories, favorites, notifications, reports, and platform settings
- email delivery and administrator audit records
- database-enforced registration rate limits and optionally enabled plan limits

Apply schema changes with the project's migration workflow rather than editing generated client types manually.

### Edge Functions

Edge Functions handle operations that need protected credentials or server-side validation, including:

- registration confirmation and organizer notifications
- invitations, reminders, feedback requests, and bulk email
- event metadata and sitemap responses
- QR check-in and registration cancellation
- AI descriptions, attendance predictions, and assistant responses
- email-domain validation

When adding a function, register its JWT behavior in the single `supabase/config.toml` file and store private credentials in Supabase Function secrets.

## Event images

Built-in cover images are served from `public/covers/`. Keep permanent cover files there so Vite includes them unchanged in production builds.

## Security model

- UUID user identities remain the source of ownership; usernames are public aliases only.
- Roles are stored in `user_roles`, never in profiles or browser storage.
- Admin pages are protected in the interface and all privileged data remains protected by database policies.
- Public event queries use an explicit safe column list.
- Public registration is validated by database rules, time windows, capacity logic, duplicate protection, and rate limiting.
- QR check-in expires after an event ends.
- Deployment headers enable HTTPS enforcement, MIME protection, clickjacking protection, a restrictive referrer policy, and limited browser permissions.
- Secrets must never be committed or exposed through `VITE_` variables.

## Internationalization

Translation dictionaries live in `src/i18n/en.ts` and `src/i18n/so.ts`. Add matching keys to both files, then access them through `useLanguage()`. Date formatting should follow the active locale.

## Deployment

The canonical production domain is [https://kulmid.com](https://kulmid.com). Frontend changes must be published or deployed to become live. Supabase migrations and Edge Functions are deployed through the connected backend workflow.

The Vercel configuration includes:

- SPA fallback for client-side routes
- crawler rewrites for dynamic event metadata
- a dynamic `/sitemap.xml`
- security headers

Set the deployment's canonical application URL and email-link base URL to `https://kulmid.com`.

## Documentation

- User help: `/help`
- Guided product tours: `/guides`
- About Kulmid: `/about`
- Privacy: `/privacy`
- Terms: `/terms`

## Contributing

1. Keep changes focused and preserve backward compatibility.
2. Reuse the existing design tokens and interface components.
3. Add matching English and Somali text for new user-facing features.
4. Protect new data with grants and Row Level Security.
5. Validate organizer, public, mobile, and admin flows before merging.

## License

Kulmid is proprietary software. All rights reserved.