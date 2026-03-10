import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Seo } from "@/components/Seo";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

type EventRow = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: number;
  image_url: string | null;
  status?: string;
  created_by?: string;
};

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [profileData, setProfileData] = useState<any>(null);
  const [hostedEvents, setHostedEvents] = useState<EventRow[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<EventRow[]>([]);
  const [totalGuests, setTotalGuests] = useState(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);

      // Fetch profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      setProfileData(prof);

      // Fetch hosted events
      const { data: hosted } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", userId)
        .order("date", { ascending: false });

      setHostedEvents((hosted as EventRow[]) || []);

      // Fetch total guests across all hosted events
      if (hosted && hosted.length > 0) {
        const eventIds = hosted.map((e: any) => e.id);
        const { count } = await supabase
          .from("event_guests")
          .select("id", { count: "exact", head: true })
          .in("event_id", eventIds);
        setTotalGuests(count || 0);
      }

      // Fetch attended events (via event_guests where user email matches)
      if (user?.email) {
        const { data: guestRecords } = await supabase
          .from("event_guests")
          .select("event_id")
          .eq("email", user.email)
          .eq("status", "approved");

        if (guestRecords && guestRecords.length > 0) {
          const ids = guestRecords.map((g) => g.event_id);
          const { data: attendedEvts } = await supabase
            .from("events")
            .select("*")
            .in("id", ids)
            .order("date", { ascending: false });
          setAttendedEvents((attendedEvts as EventRow[]) || []);
        }
      }

      // Build activity timeline from hosted events + registrations
      const activityList: any[] = [];
      if (hosted) {
        hosted.forEach((e: any) => {
          activityList.push({
            type: "hosted",
            title: `Created "${e.title}"`,
            date: e.created_at || e.date,
            eventId: e.id,
          });
        });
      }
      activityList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(activityList);

      setLoading(false);
    };
    load();
  }, [userId, user?.email]);

  if (loading) {
    return (
      <div className="container max-w-5xl px-4 py-12">
        <div className="text-center text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container max-w-5xl px-4 py-12">
        <div className="text-center text-muted-foreground">Profile not found.</div>
      </div>
    );
  }

  const avgAttendance = hostedEvents.length > 0 ? Math.round(totalGuests / hostedEvents.length) : 0;
  const topEvent = hostedEvents.length > 0 ? hostedEvents[0]?.title : "";

  return (
    <>
      <Seo
        title={`${profileData.full_name} — Kulmid`}
        description={profileData.bio || `${profileData.full_name}'s profile on Kulmid`}
        canonical={`/profile/${userId}`}
      />
      <div className="container max-w-5xl px-4 py-8">
        <ProfileHeader
          profile={profileData}
          stats={{
            hostedEvents: hostedEvents.length,
            attendedEvents: attendedEvents.length,
            totalGuests,
          }}
          isOwner={isOwner}
        />
        <ProfileTabs
          hostedEvents={hostedEvents}
          attendedEvents={attendedEvents}
          favoriteEvents={isOwner ? favorites : []}
          activities={activities}
          stats={{
            hostedEvents: hostedEvents.length,
            totalGuests,
            avgAttendance,
            topEvent,
          }}
          isOwner={isOwner}
        />
      </div>
    </>
  );
};

export default Profile;
