import { Seo } from "@/components/Seo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Compass, Calendar, Plus, Users, QrCode, BarChart3, Mail, Bell,
  Shield, Wallet, Sparkles, Globe, CheckCircle2, ArrowRight, Search,
  Settings, UserCircle, MessageCircle, Tag, Image as ImageIcon
} from "lucide-react";

const sections = [
  {
    id: "what",
    icon: Sparkles,
    title: "What is Kulmid?",
    body: `Kulmid is a community event platform built for the Somali ecosystem and beyond. It replaces the messy workflow of Google Forms + spreadsheets + WhatsApp lists with one tool that handles discovery, registration, approval, communication, check-in and analytics — in English and Somali, with mobile-money support.`,
  },
  {
    id: "who",
    icon: Users,
    title: "Who is it for?",
    body: `Organizers running meetups, conferences, workshops, weddings, religious gatherings or trainings. Attendees who want to discover what's happening near them and register in seconds. Admins who curate what gets featured on Discover.`,
  },
];

const tour = [
  {
    icon: Compass,
    title: "1. Discover events",
    href: "/discover",
    points: [
      "Browse featured events curated by Kulmid admins",
      "Filter by category (Tech, Education, Business, Religious, etc.)",
      "Search by title, host or city — bilingual (EN / SO)",
    ],
  },
  {
    icon: Plus,
    title: "2. Create an event",
    href: "/create",
    points: [
      "Title, date/time, location, cover image, category, capacity (unlimited or limited)",
      "AI-assisted description generation",
      "Pricing: free, paid via Stripe Connect (5% fee), or WAAFI mobile money for Somalia",
      "Instant publish — your link is live the moment you save",
    ],
  },
  {
    icon: Settings,
    title: "3. Build your registration form",
    points: [
      "Toggle built-in fields (name, email, phone, organization)",
      "Add custom questions: short text, paragraph, dropdown, multiple choice, checkbox",
      "Mark questions required, reorder them, edit any time",
      "Form schema is versioned — late edits don't break old responses",
    ],
  },
  {
    icon: Mail,
    title: "4. Invite & accept guests",
    points: [
      "Send branded invitations by email (custom title + message)",
      "Auto-approve or manually review each registration",
      "Approve / reject from one unified Guests tab — no nested menus",
      "Every action triggers an email + in-app notification",
    ],
  },
  {
    icon: QrCode,
    title: "5. Check-in on event day",
    points: [
      "Each approved guest receives a unique QR code by email",
      "Open the in-app Scanner from your event — works on any phone camera",
      "Manual check-in fallback from the guest list",
      "Real-time check-in counter on your dashboard",
    ],
  },
  {
    icon: BarChart3,
    title: "6. Insights & analytics",
    points: [
      "KPI tiles: registrations, approvals, check-ins, fill rate",
      "Smart Highlights auto-detect common demographics (gender, age, role, location)",
      "Dynamic charts for every multiple-choice question — no setup",
      "Cross-breakdowns (e.g. Role × Gender) for deeper segmentation",
      "One-click CSV / Excel export with every question as a column",
    ],
  },
  {
    icon: UserCircle,
    title: "7. Your profile",
    href: "/settings/profile",
    points: [
      "Username-based public URL: kulmid.com/u/yourname",
      "Avatar with built-in cropper",
      "Social links (website, X, Instagram, LinkedIn, etc.)",
      "Privacy controls in Settings",
    ],
  },
  {
    icon: Shield,
    title: "8. Admin & Discover curation",
    points: [
      "Every event publishes instantly — admins don't gate creation",
      "Admins promote standout events to Featured on Discover",
      "Category management (add, edit, color/icon, deactivate)",
      "Platform-wide reports and user management",
    ],
  },
];

const features = [
  { icon: Globe, label: "Bilingual EN / SO" },
  { icon: Wallet, label: "Stripe + WAAFI payments" },
  { icon: Bell, label: "Realtime notifications" },
  { icon: ImageIcon, label: "Cover image uploads" },
  { icon: Tag, label: "Dynamic categories" },
  { icon: MessageCircle, label: "Built-in AI assistant" },
  { icon: Calendar, label: "Calendar view + Google Calendar export" },
  { icon: CheckCircle2, label: "Light-mode professional UI" },
];

const stack = [
  { label: "Frontend", value: "React 18, TypeScript, Vite, Tailwind, shadcn/ui" },
  { label: "Backend", value: "Supabase (Postgres + Row Level Security)" },
  { label: "Edge logic", value: "Deno Edge Functions for email, AI, check-in, payments" },
  { label: "Email", value: "Resend + Brevo transactional delivery" },
  { label: "AI", value: "Lovable AI Gateway (Gemini / GPT) for descriptions & chat" },
  { label: "Hosting", value: "Vercel with HSTS + CSP security headers" },
];

export default function Guide() {
  return (
    <>
      <Seo
        title="Kulmid Guide — Full Platform Tour"
        description="A complete tour of Kulmid: how to discover, create, register, check in, and analyze events on the platform."
        canonical="/guide"
      />

      {/* Hero */}
      <section className="container max-w-5xl px-4 py-16 md:py-24">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-5">
          <Compass className="w-3.5 h-3.5" /> Full Platform Tour
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Everything you can do on Kulmid
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-8">
          A complete guide to the platform — from discovering your first event to running analytics on the responses.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link to="/create">Create an event <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
          <Button asChild variant="outline"><Link to="/discover"><Search className="w-4 h-4 mr-1" /> Browse Discover</Link></Button>
        </div>
      </section>

      {/* What & Who */}
      <section className="container max-w-5xl px-4 pb-8">
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="rounded-2xl border border-border bg-card p-6">
                <Icon className="w-6 h-6 text-primary mb-3" />
                <h2 className="text-xl font-semibold mb-2">{s.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* The Tour */}
      <section className="container max-w-5xl px-4 py-16">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
          The Full Tour — 8 Steps
        </h2>
        <div className="grid gap-5">
          {tour.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start gap-5">
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      {step.href && (
                        <Link to={step.href} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                          Open <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {step.points.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Highlights grid */}
      <section className="container max-w-5xl px-4 py-16 border-t border-border">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">Platform Highlights</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="rounded-xl border border-border bg-card p-5 flex flex-col items-start gap-3">
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stack */}
      <section className="container max-w-5xl px-4 py-16 border-t border-border">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">How it's built</h2>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {stack.map((row, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 p-5">
              <div className="md:w-40 text-sm font-semibold">{row.label}</div>
              <div className="text-muted-foreground text-sm">{row.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container max-w-5xl px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Ready to host your next event?</h2>
        <p className="text-muted-foreground mb-6">Create it in under a minute. Share your link. Watch registrations roll in.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg"><Link to="/create">Create your event</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/help">Visit Help Center</Link></Button>
        </div>
      </section>
    </>
  );
}