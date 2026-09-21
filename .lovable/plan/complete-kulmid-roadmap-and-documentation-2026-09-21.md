# Complete Kulmid roadmap and documentation

## Scope

1. **Repair and finish organizer verification**
   - Fix the unfinished public event-page organizer imports and name handling.
   - Keep verified badges on public profiles and organizer sections.
   - Add an admin action to grant or remove organizer verification safely.

2. **Complete Somali market support**
   - Fill missing Somali translations used by the current interface.
   - Add a WhatsApp share action to public event pages using the canonical slug URL.

3. **Finish operations and monetization safeguards**
   - Add an admin email-delivery log view using existing delivery records.
   - Apply the existing server-side rate limiter to public registration submissions.
   - Enforce configured plan limits when enforcement is enabled, while preserving today’s behavior when disabled.

4. **Rewrite the README**
   - Replace the template README with complete Kulmid documentation for `https://kulmid.com`.
   - Cover product capabilities, setup, environment configuration, Supabase functions/migrations, scripts, deployment, security, routes, and project structure.
   - Avoid exposing secrets or presenting placeholder information as fact.

5. **Validate and close the roadmap**
   - Verify the affected public, organizer, and admin flows.
   - Check the current build diagnostics and update `roadmap.md` only for completed items.

## Technical notes

- Preserve the React/Vite/Supabase architecture, existing off-white light design, UUID identities, and slug-first event URLs.
- Verification remains a profile property controlled only through admin-authorized database policies.
- Registration safeguards must execute server-side; no security decision will rely on browser storage.
- Plan limits will read the existing `platform_settings.plan_limits` configuration and default to no enforcement unless explicitly enabled.
