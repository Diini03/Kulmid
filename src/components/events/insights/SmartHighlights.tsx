import { Card } from "@/components/ui/card";
import { Sparkles, Users, GraduationCap, Briefcase, MapPin, Languages, Heart, CalendarDays, Megaphone } from "lucide-react";
import type { Highlight, InsightCategory } from "@/lib/insightsCategorizer";

const ICONS: Record<InsightCategory, React.ComponentType<{ className?: string }>> = {
  gender: Users,
  marital: Heart,
  education: GraduationCap,
  role: Briefcase,
  age: CalendarDays,
  language: Languages,
  location: MapPin,
  source: Megaphone,
};

interface Props {
  highlights: Highlight[];
}

const SmartHighlights = ({ highlights }: Props) => {
  if (highlights.length === 0) return null;

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Smart highlights</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {highlights.map((h, i) => {
          const Icon = ICONS[h.category];
          return (
            <div
              key={i}
              className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-2xl font-bold tabular-nums">{h.percent}%</span>
              </div>
              <p className="text-sm text-foreground leading-snug">{h.text}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default SmartHighlights;