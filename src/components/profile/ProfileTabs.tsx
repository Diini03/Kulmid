import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventCard } from "@/components/events/EventCard";
import { ActivityTimeline } from "./ActivityTimeline";
import { CommunityImpact } from "./CommunityImpact";
import { Badge } from "@/components/ui/badge";
import { Calendar, Ticket, Heart, Activity } from "lucide-react";

type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: number;
  image_url: string | null;
  status?: string;
};

interface ProfileTabsProps {
  hostedEvents: EventItem[];
  attendedEvents: EventItem[];
  favoriteEvents: EventItem[];
  activities: { type: string; title: string; date: string; eventId?: string }[];
  stats: { hostedEvents: number; totalGuests: number; avgAttendance: number; topEvent: string };
  isOwner: boolean;
}

const statusVariant = (status?: string) => {
  switch (status) {
    case "approved":
    case "upcoming": return "default";
    case "pending": return "secondary";
    case "past": return "outline";
    default: return "secondary";
  }
};

const EmptyTab = ({ message }: { message: string }) => (
  <div className="py-16 text-center">
    <p className="text-muted-foreground text-sm">{message}</p>
  </div>
);

export const ProfileTabs = ({ hostedEvents, attendedEvents, favoriteEvents, activities, stats, isOwner }: ProfileTabsProps) => (
  <Tabs defaultValue="hosted" className="mt-8">
    <TabsList className="w-full justify-start bg-secondary/50 rounded-xl p-1 h-auto overflow-x-auto scrollbar-hide flex-nowrap">
      <TabsTrigger value="hosted" className="rounded-lg gap-1.5 data-[state=active]:bg-background">
        <Calendar className="h-4 w-4" />Hosted
        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{hostedEvents.length}</Badge>
      </TabsTrigger>
      <TabsTrigger value="attended" className="rounded-lg gap-1.5 data-[state=active]:bg-background">
        <Ticket className="h-4 w-4" />Attended
        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{attendedEvents.length}</Badge>
      </TabsTrigger>
      {isOwner && (
        <TabsTrigger value="favorites" className="rounded-lg gap-1.5 data-[state=active]:bg-background">
          <Heart className="h-4 w-4" />Favorites
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{favoriteEvents.length}</Badge>
        </TabsTrigger>
      )}
      <TabsTrigger value="activity" className="rounded-lg gap-1.5 data-[state=active]:bg-background">
        <Activity className="h-4 w-4" />Activity
      </TabsTrigger>
    </TabsList>

    <TabsContent value="hosted" className="mt-6">
      {hostedEvents.length === 0 ? (
        <EmptyTab message="No hosted events yet." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hostedEvents.map((event) => (
            <div key={event.id} className="relative">
              {event.status && (
                <Badge variant={statusVariant(event.status)} className="absolute top-3 left-3 z-10 text-[10px] capitalize">
                  {event.status}
                </Badge>
              )}
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
      {/* Community Impact section */}
      {hostedEvents.length > 0 && <CommunityImpact stats={stats} />}
    </TabsContent>

    <TabsContent value="attended" className="mt-6">
      {attendedEvents.length === 0 ? (
        <EmptyTab message="No attended events yet." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attendedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </TabsContent>

    {isOwner && (
      <TabsContent value="favorites" className="mt-6">
        {favoriteEvents.length === 0 ? (
          <EmptyTab message="No favorite events yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </TabsContent>
    )}

    <TabsContent value="activity" className="mt-6">
      <ActivityTimeline activities={activities} />
    </TabsContent>
  </Tabs>
);
