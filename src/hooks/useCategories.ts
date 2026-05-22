import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap, Wrench, Users, Music, Monitor, Handshake,
  Briefcase, Code, Coffee, Heart, Globe, Star, Calendar, Mic,
  BookOpen, Camera, Gamepad2, Palette, Trophy, Utensils, Plane,
  Dumbbell, Sparkles, Rocket, Lightbulb, Target, Award, Gift,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap, Wrench, Users, Music, Monitor, Handshake,
  Briefcase, Code, Coffee, Heart, Globe, Star, Calendar, Mic,
  BookOpen, Camera, Gamepad2, Palette, Trophy, Utensils, Plane,
  Dumbbell, Sparkles, Rocket, Lightbulb, Target, Award, Gift,
};

export interface DBCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface CategoryConfig {
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

const FALLBACK: CategoryConfig[] = [
  { name: "Seminar", icon: GraduationCap, color: "from-blue-500 to-cyan-500", description: "Educational talks and presentations" },
  { name: "Workshop", icon: Wrench, color: "from-purple-500 to-pink-500", description: "Hands-on learning experiences" },
  { name: "Conference", icon: Users, color: "from-teal-500 to-emerald-500", description: "Professional networking events" },
  { name: "Festival", icon: Music, color: "from-orange-500 to-red-500", description: "Cultural celebrations and entertainment" },
  { name: "Webinar", icon: Monitor, color: "from-indigo-500 to-violet-500", description: "Online educational sessions" },
  { name: "Meetup", icon: Handshake, color: "from-green-500 to-teal-500", description: "Casual gatherings and community networking" },
];

export const useCategories = () => {
  const query = useQuery({
    queryKey: ["categories", "active"],
    queryFn: async (): Promise<CategoryConfig[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as DBCategory[]).map((c) => ({
        name: c.name,
        icon: ICON_MAP[c.icon] || GraduationCap,
        color: c.color,
        description: c.description || "",
      }));
    },
    staleTime: 60_000,
  });

  return {
    categories: query.data && query.data.length > 0 ? query.data : FALLBACK,
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const useAllCategories = () => {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: async (): Promise<DBCategory[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as DBCategory[];
    },
  });
};