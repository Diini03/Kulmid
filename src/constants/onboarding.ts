import { GraduationCap, Wrench, Users, Music, Trophy, Calendar, Code, TrendingUp, Heart, Briefcase, Palette } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: "multi-select" | "single-select" | "toggle";
  options?: { value: string; label: string; icon?: LucideIcon }[];
  field: keyof UserPreferences;
}

export interface UserPreferences {
  event_categories: string[];
  attendance_frequency: string;
  preferred_format: string;
  topics: string[];
  event_mode: string;
  age_range: string;
  source: string;
  allow_recommendations: boolean;
}

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "categories",
    question: "What types of events interest you?",
    type: "multi-select",
    field: "event_categories",
    options: [
      { value: "Seminar", label: "Seminar", icon: GraduationCap },
      { value: "Workshop", label: "Workshop", icon: Wrench },
      { value: "Conference", label: "Conference", icon: Users },
      { value: "Festival", label: "Festival", icon: Music },
      { value: "Sports", label: "Sports", icon: Trophy },
    ],
  },
  {
    id: "frequency",
    question: "How often do you attend events?",
    type: "single-select",
    field: "attendance_frequency",
    options: [
      { value: "weekly", label: "Weekly", icon: Calendar },
      { value: "monthly", label: "Monthly", icon: Calendar },
      { value: "occasionally", label: "Occasionally", icon: Calendar },
    ],
  },
  {
    id: "format",
    question: "Which format do you prefer?",
    type: "single-select",
    field: "preferred_format",
    options: [
      { value: "Seminar", label: "Seminars", icon: GraduationCap },
      { value: "Workshop", label: "Workshops", icon: Wrench },
      { value: "Conference", label: "Conferences", icon: Users },
    ],
  },
  {
    id: "topics",
    question: "What topics are you most interested in?",
    type: "multi-select",
    field: "topics",
    options: [
      { value: "Technology", label: "Technology", icon: Code },
      { value: "Business", label: "Business", icon: Briefcase },
      { value: "Personal Development", label: "Personal Development", icon: TrendingUp },
      { value: "Health & Wellness", label: "Health & Wellness", icon: Heart },
      { value: "Arts & Culture", label: "Arts & Culture", icon: Palette },
    ],
  },
  {
    id: "recommendations",
    question: "May we personalize event recommendations for you?",
    type: "toggle",
    field: "allow_recommendations",
  },
];
