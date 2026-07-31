import {
  Rocket,
  ClipboardList,
  UserCheck,
  BarChart3,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface GuideSection {
  heading: string;
  body?: string;
  steps?: string[];
  tip?: string;
}

export interface Guide {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  icon: LucideIcon;
  sections: GuideSection[];
}

export const GUIDES: Guide[] = [
  {
    slug: "create-your-first-event",
    title: "Create your first event",
    summary:
      "From an empty form to a live, shareable event link in a few minutes.",
    minutes: 4,
    icon: Rocket,
    sections: [
      {
        heading: "Start the form",
        body: "Open Create from the navbar. Everything on this page can be edited later, so don't worry about getting it perfect on the first pass.",
        steps: [
          "Add a cover image — it is the first thing people see on Discover and in shared links.",
          "Give the event a clear title: what it is, and who it is for.",
          "Pick a date and time with the date picker, and set an end time if the event runs for hours.",
          "Choose a location, or switch to online and paste the meeting link.",
        ],
      },
      {
        heading: "Pick a category",
        body: "Categories power search and filtering on Discover. If nothing fits, choose Other — you can leave it uncategorised and change it later.",
      },
      {
        heading: "Set capacity",
        body: "Capacity is unlimited by default. Switch to limited and enter a number when the venue has a real cap — the public page then shows a progress bar and how many spots are left, which reliably increases sign-ups.",
        tip: "Turn on the waitlist so people can still join when you are full. When someone cancels, the next person is promoted automatically.",
      },
      {
        heading: "Control when registration is open",
        body: "Registration opens and closes on the times you set. Leave them empty to accept registrations from the moment you publish until the event starts.",
      },
      {
        heading: "Publish and share",
        body: "Saving publishes instantly — there is no approval queue. Copy your event link and share it. Kulmid admins may additionally promote strong events to the Featured row on Discover.",
      },
    ],
  },
  {
    slug: "build-your-registration-form",
    title: "Build your registration form",
    summary:
      "Collect exactly the information you need, with custom questions that feel like Google Forms.",
    minutes: 4,
    icon: ClipboardList,
    sections: [
      {
        heading: "Open the Registration tab",
        body: "From your event, go to Registration. The top block holds the built-in fields; below it live your own questions.",
      },
      {
        heading: "Toggle built-in fields",
        body: "Name and email are always collected. Phone, organization, job title and similar fields can be switched on, and each one can be marked required.",
      },
      {
        heading: "Add custom questions",
        steps: [
          "Click Add question, then choose a type: short answer, paragraph, dropdown, multiple choice or checkbox.",
          "Type the question, add options for choice types, and mark it required if you need an answer.",
          "Drag to reorder — the public form follows the same order.",
        ],
        tip: "Multiple choice and dropdown questions are the ones that become charts in Insights. Prefer them over free text whenever you plan to analyse the answers.",
      },
      {
        heading: "Editing after people register",
        body: "You can change the form at any time. Earlier registrations keep their original answers, and new questions simply appear blank for them. Exports include every question ever asked, so your columns stay consistent.",
      },
    ],
  },
  {
    slug: "approve-guests-and-check-in",
    title: "Approve guests and check people in",
    summary:
      "Review registrations in one list, then run a smooth door on event day.",
    minutes: 3,
    icon: UserCheck,
    sections: [
      {
        heading: "One list, no nested tabs",
        body: "The Guests tab shows every registration — pending, approved, waitlisted and cancelled — in a single filterable list. Approve or decline directly from a row.",
      },
      {
        heading: "Auto-approve or review manually",
        body: "In Settings you can auto-approve everyone, which sends the confirmation email and QR code immediately. Leave it off when you want to screen people first.",
        tip: "The Overview tab surfaces pending registrations with a bulk Approve all button, so you rarely need to open Guests just to clear the queue.",
      },
      {
        heading: "Check-in on the day",
        steps: [
          "Every approved guest receives a unique QR code by email.",
          "Open the Scanner from your event on any phone and scan at the door.",
          "If someone lost their code, mark them checked in manually from the guest list.",
        ],
      },
      {
        heading: "Codes expire",
        body: "QR codes stop validating once the event has ended, so an old code can never be reused at a later event.",
      },
    ],
  },
  {
    slug: "read-your-insights",
    title: "Read your Insights",
    summary:
      "Understand who registered, and export everything for deeper analysis.",
    minutes: 3,
    icon: BarChart3,
    sections: [
      {
        heading: "KPI tiles",
        body: "The top of the Insights tab shows registrations, approvals, check-ins and fill rate at a glance.",
      },
      {
        heading: "Smart Highlights",
        body: "Kulmid reads your questions and recognises common ones — gender, age, education, role, city, marital status — in English and Somali. When it finds them, it summarises the make-up of your audience without any setup from you.",
      },
      {
        heading: "Per-question charts",
        body: "Every choice-based question gets its own chart automatically. Add a new question and its chart appears as soon as answers arrive.",
      },
      {
        heading: "Cross-breakdowns",
        body: "Combine two questions — for example role against gender — to see a matrix instead of two separate charts.",
      },
      {
        heading: "Export",
        body: "Download every response as CSV or Excel. Each question becomes a column, including questions you removed later, so nothing is lost.",
      },
    ],
  },
  {
    slug: "use-the-ai-assistant",
    title: "Use the AI assistant",
    summary:
      "Where AI helps inside Kulmid, and how to get better results from it.",
    minutes: 3,
    icon: Sparkles,
    sections: [
      {
        heading: "Write your event description",
        body: "On the create and edit forms, use Generate description. Give it the essentials — topic, audience, what people will leave with — and it drafts a description in your tone. Edit it freely; nothing is published until you save.",
        tip: "The more concrete your input, the better the draft. 'Free evening workshop for Mogadishu university students on CV writing' beats 'a workshop'.",
      },
      {
        heading: "Ask the assistant anything about Kulmid",
        body: "The chat bubble is available across the app and on the Help page. Ask how a feature works, how to fix a stuck registration, or what a setting does, and it answers from the platform's own documentation.",
      },
      {
        heading: "Draft invitations and announcements",
        body: "Use it to word your invitation emails and bulk messages to registrants before sending them from the Guests tab.",
      },
      {
        heading: "What it will not do",
        body: "The assistant never changes your event, approves guests or sends emails on your behalf. Every action stays in your hands.",
      },
    ],
  },
];

export const getGuide = (slug?: string) =>
  GUIDES.find((g) => g.slug === slug);

export const getNextGuide = (slug: string) => {
  const i = GUIDES.findIndex((g) => g.slug === slug);
  if (i === -1) return undefined;
  return GUIDES[(i + 1) % GUIDES.length];
};