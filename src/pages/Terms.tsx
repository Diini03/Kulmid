import { Seo } from "@/components/Seo";

const Terms = () => (
  <>
    <Seo title="Terms of Use — Kulmid" description="The terms that govern your use of Kulmid." canonical="/terms" />
    <article className="container max-w-3xl px-4 py-16 prose prose-neutral dark:prose-invert">
      <h1>Terms of Use</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>Using Kulmid</h2>
      <p>Kulmid is a community event platform. By using it you agree to use it lawfully and to not abuse other users, organizers, or the service itself.</p>

      <h2>Your account</h2>
      <p>You are responsible for the security of your login credentials and for everything that happens under your account.</p>

      <h2>Events you create</h2>
      <p>You're responsible for the events you publish, including their accuracy, the data you collect from registrants, and any communication you send through Kulmid.</p>

      <h2>Prohibited content</h2>
      <p>No spam, hate speech, harassment, illegal activity, or events that endanger participants. We may remove events that violate these rules without prior notice.</p>

      <h2>Payments (coming soon)</h2>
      <p>When paid ticketing launches via WAAFI and Stripe, additional payment terms will apply. Platform fees are described on the Pricing page.</p>

      <h2>Liability</h2>
      <p>Kulmid is provided "as is." We are not liable for losses arising from event cancellations, organizer behavior, or third-party services.</p>

      <h2>Contact</h2>
      <p>Questions? Reach us at <a href="mailto:hello@kulmid.app">hello@kulmid.app</a>.</p>
    </article>
  </>
);

export default Terms;