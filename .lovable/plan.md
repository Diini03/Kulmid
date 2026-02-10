
## Improve Email Validation and Error Handling

### Problem
- Users can enter emails with valid format but fake addresses (e.g., `yuusuf@gmail.com`) — this is normal and handled by email confirmation
- The "email rate limit exceeded" error shows a generic failure message
- Password hint text may still show old "8 characters" requirement

### What We Can Do

**1. Add email domain validation (edge function)**
- Create an edge function `validate-email-domain` that checks if the email's domain has valid MX (mail) records
- For example, `user@fakeDomain123xyz.com` would be rejected because that domain doesn't exist
- Note: `yuusuf@gmail.com` will still pass because `gmail.com` is a real domain — only the confirmation email can catch that

**2. Better error handling in sign-up flow**
- Catch the "email rate limit exceeded" error specifically and show a friendlier message: "Too many attempts. Please wait a few minutes and try again."
- Add a cooldown/disable on the submit button after an error

**3. Ensure password hint text is correct**
- Verify and fix the hint to say "Must be at least 6 characters with one letter and one number"

### How It Works (User Perspective)

1. User enters email like `user@nonexistentdomain.xyz` --> Immediately rejected: "This email domain doesn't exist"
2. User enters `yuusuf@gmail.com` --> Passes domain check (gmail.com is real), sign-up proceeds, confirmation email sent. Since nobody owns that inbox, they can never verify, so the account stays inactive
3. User enters a real email they own --> Gets confirmation email, clicks link, account activated

### Technical Details

**New edge function: `supabase/functions/validate-email-domain/index.ts`**
- Accepts `{ email: string }` in POST body
- Extracts domain from email
- Uses `Deno.resolveDns(domain, "MX")` to check for mail exchange records
- Returns `{ valid: true/false }`

**`src/pages/SignUp.tsx` changes**
- Before calling `signUp()`, call the edge function to validate the domain
- Show inline error if domain is invalid
- Handle rate limit errors with specific messaging
- Ensure password hint text is updated

**`src/contexts/AuthContext.tsx` changes**
- Detect "email rate limit exceeded" error and return a clearer message
