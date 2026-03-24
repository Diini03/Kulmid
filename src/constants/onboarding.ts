import {
  Sparkles,
  Lightbulb,
  Briefcase,
  GraduationCap,
  Heart,
  Palette,
  Users,
  Music,
  Building2,
  Rocket,
  Wrench,
  Monitor,
  Handshake,
  Calendar,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface OnboardingStep {
  id: string;
  key: string;
  type: "intro" | "multi_select" | "single_select" | "city_input" | "completion";
  title: string;
  subtitle: string;
  required: boolean;
  field?: string;
  options?: { value: string; label: string; icon?: LucideIcon }[];
}

export interface OnboardingPreferences {
  topics: string[];
  location_city: string;
  event_categories: string[];
  event_mode: string;
  attendance_frequency: string;
}

export const SOMALIA_CITIES = [
  "Mogadishu",
  "Hargeisa",
  "Garowe",
  "Bosaso",
  "Kismayo",
  "Berbera",
  "Baidoa",
  "Marka",
  "Beledweyne",
  "Galkayo",
  "Burao",
  "Jowhar",
  "Las Anod",
];

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    key: "welcome",
    type: "intro",
    title: "Welcome to Kulmid",
    subtitle: "Let's personalize your event experience.",
    required: false,
  },
  {
    id: "interests",
    key: "interests",
    type: "multi_select",
    title: "What are you interested in?",
    subtitle: "Choose a few topics so we can recommend better events.",
    required: true,
    field: "topics",
    options: [
      { value: "Technology", label: "Technology", icon: Monitor },
      { value: "Business", label: "Business", icon: Briefcase },
      { value: "Education", label: "Education", icon: GraduationCap },
      { value: "Health", label: "Health", icon: Heart },
      { value: "Design", label: "Design", icon: Palette },
      { value: "Networking", label: "Networking", icon: Users },
      { value: "Entertainment", label: "Entertainment", icon: Music },
      { value: "Community", label: "Community", icon: Building2 },
      { value: "Startup", label: "Startup", icon: Rocket },
      { value: "Workshop", label: "Workshop", icon: Wrench },
    ],
  },
  {
    id: "location",
    key: "location",
    type: "city_input",
    title: "Where are you based?",
    subtitle: "We'll prioritize nearby and relevant events.",
    required: false,
    field: "location_city",
  },
  {
    id: "event_types",
    key: "event_types",
    type: "multi_select",
    title: "What kind of events do you prefer?",
    subtitle: "Choose the formats you're most likely to attend.",
    required: false,
    field: "event_categories",
    options: [
      { value: "Workshop", label: "Workshops", icon: Wrench },
      { value: "Conference", label: "Conferences", icon: Users },
      { value: "Meetup", label: "Meetups", icon: Handshake },
      { value: "Seminar", label: "Seminars", icon: GraduationCap },
      { value: "Webinar", label: "Online Events", icon: Monitor },
      { value: "In-Person", label: "In-Person Events", icon: MapPin },
    ],
  },
  {
    id: "attendance_intent",
    key: "attendance_intent",
    type: "single_select",
    title: "How often do you attend events?",
    subtitle: "This helps us balance recommendations.",
    required: false,
    field: "attendance_frequency",
    options: [
      { value: "often", label: "Often", icon: Calendar },
      { value: "sometimes", label: "Sometimes", icon: Calendar },
      { value: "rarely", label: "Rarely", icon: Calendar },
    ],
  },
  {
    id: "finish",
    key: "finish",
    type: "completion",
    title: "You're all set!",
    subtitle: "We'll use your preferences to improve Discover.",
    required: false,
  },
];
