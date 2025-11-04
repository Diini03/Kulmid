import { GraduationCap, Wrench, Users, Music, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EventCategory = "Seminar" | "Workshop" | "Conference" | "Festival" | "Sports";

export interface CategoryConfig {
  name: EventCategory;
  icon: LucideIcon;
  color: string;
  description: string;
}

export const categories: CategoryConfig[] = [
  {
    name: "Seminar",
    icon: GraduationCap,
    color: "from-blue-500 to-cyan-500",
    description: "Educational talks and presentations"
  },
  {
    name: "Workshop",
    icon: Wrench,
    color: "from-purple-500 to-pink-500",
    description: "Hands-on learning experiences"
  },
  {
    name: "Conference",
    icon: Users,
    color: "from-teal-500 to-emerald-500",
    description: "Professional networking events"
  },
  {
    name: "Festival",
    icon: Music,
    color: "from-orange-500 to-red-500",
    description: "Cultural celebrations and entertainment"
  },
  {
    name: "Sports",
    icon: Trophy,
    color: "from-red-500 to-pink-500",
    description: "Athletic events and competitions"
  }
];
