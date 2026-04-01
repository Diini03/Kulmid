
Goal: remove the social-media share buttons from the event page for now, since the event form does not yet collect social link fields.

Implementation plan:
1. Update `src/pages/EventDetails.tsx`
   - Remove the `handleSocialShare` helper.
   - Remove the Twitter, Facebook, and WhatsApp share buttons from the “Share Event” section.
   - Keep only the generic “Copy Link” action, since it does not depend on missing form inputs.

2. Update `src/pages/EventView.tsx`
   - Remove the “Share Event” section buttons for Twitter, Facebook, LinkedIn, and WhatsApp.
   - Keep the existing top “Share/Copy link” button in the header, because it is still useful without social URLs.

3. Clean up imports
   - Remove any now-unused icons, state, or helpers related only to social sharing.

4. Keep future-ready structure
   - Do not add social-link fields yet.
   - Leave the organizer section unchanged.
   - When social inputs are later added to the form, we can reintroduce these buttons with real event-specific links.

Technical notes:
- The current social buttons are hardcoded share actions, not actual links stored from the event form.
- The visible sections are:
  - `src/pages/EventDetails.tsx` → “Share Event” block
  - `src/pages/EventView.tsx` → “Share Event” block
- This is a small UI cleanup and should not affect registration, reporting, organizer info, navbar, or footer.

Expected result:
- Event pages no longer show social platform buttons that suggest configurable social links.
- Users still have a simple way to share via copied event URL.
