import { Seo } from "@/components/Seo";

const Privacy = () => (
  <>
    <Seo title="Privacy Policy — Kulmid" description="How Kulmid collects, stores and uses your data." canonical="/privacy" />
    <article className="container max-w-3xl px-4 py-16 prose prose-neutral dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>What we collect</h2>
      <p>When you create an account we collect your name, email, and any profile details you provide. When you register for an event we collect the answers you submit on that event's registration form.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To create and operate your account</li>
        <li>To let event organizers manage registrations and check-ins</li>
        <li>To send transactional emails (confirmations, reminders, status updates)</li>
        <li>To improve the product and detect abuse</li>
      </ul>

      <h2>Sharing</h2>
      <p>Your registration details are visible to the organizer of the event you registered for. We do not sell your personal data to third parties.</p>

      <h2>Storage</h2>
      <p>Data is stored securely on Supabase infrastructure with row-level security enforced on every table.</p>

      <h2>Your rights</h2>
      <p>You can edit your profile and delete your account at any time from Settings. To request a full data export or deletion, email <a href="mailto:privacy@kulmid.app">privacy@kulmid.app</a>.</p>

      <h2>Contact</h2>
      <p>Questions about this policy? Reach us at <a href="mailto:privacy@kulmid.app">privacy@kulmid.app</a>.</p>
    </article>
  </>
);

export default Privacy;