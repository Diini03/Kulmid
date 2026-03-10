import { Calendar, Ticket, Send, UserCheck } from "lucide-react";
import { format } from "date-fns";

interface Activity {
  type: string;
  title: string;
  date: string;
  eventId?: string;
}

const iconMap: Record<string, typeof Calendar> = {
  hosted: Calendar,
  registered: Ticket,
  invited: Send,
  checked_in: UserCheck,
};

export const ActivityTimeline = ({ activities }: { activities: Activity[] }) => {
  if (activities.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.slice(0, 20).map((activity, idx) => {
        const Icon = iconMap[activity.type] || Calendar;
        return (
          <div key={idx} className="flex gap-4 relative">
            {/* Timeline line */}
            {idx < activities.length - 1 && (
              <div className="absolute left-[15px] top-9 bottom-0 w-px bg-border" />
            )}
            {/* Dot */}
            <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            {/* Content */}
            <div className="pb-6 min-w-0">
              <p className="text-sm text-foreground">{activity.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(activity.date), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
