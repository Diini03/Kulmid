import { Card } from "@/components/ui/card";
import { Trophy, Users, TrendingUp, Star } from "lucide-react";

interface CommunityImpactProps {
  stats: {
    hostedEvents: number;
    totalGuests: number;
    avgAttendance: number;
    topEvent: string;
  };
}

export const CommunityImpact = ({ stats }: CommunityImpactProps) => (
  <div className="mt-10">
    <h3 className="text-lg font-semibold text-foreground mb-4">Community Impact</h3>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Events Hosted", value: stats.hostedEvents, icon: Trophy },
        { label: "Total Attendees", value: stats.totalGuests, icon: Users },
        { label: "Avg. Attendance", value: stats.avgAttendance, icon: TrendingUp },
        { label: "Top Event", value: stats.topEvent || "—", icon: Star, isText: true },
      ].map((item) => (
        <Card key={item.label} className="p-4 border bg-card">
          <item.icon className="h-4 w-4 text-primary mb-2" />
          <div className={`font-bold text-foreground ${item.isText ? "text-sm truncate" : "text-xl"}`}>
            {item.value}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
        </Card>
      ))}
    </div>
  </div>
);
