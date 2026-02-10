import { GraduationCap, Wrench, Users, Music, Monitor, Handshake } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EventCategory = "Seminar" | "Workshop" | "Conference" | "Festival" | "Webinar" | "Meetup";

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
    name: "Webinar",
    icon: Monitor,
    color: "from-indigo-500 to-violet-500",
    description: "Online educational sessions"
  },
  {
    name: "Meetup",
    icon: Handshake,
    color: "from-green-500 to-teal-500",
    description: "Casual gatherings and community networking"
  }
];
