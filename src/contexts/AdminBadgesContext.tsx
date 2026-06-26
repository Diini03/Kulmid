import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AdminBadges {
  pendingEventsCount: number;
  openReportsCount: number;
  pendingRegistrationsCount: number;
}

const AdminBadgesContext = createContext<AdminBadges>({
  pendingEventsCount: 0,
  openReportsCount: 0,
  pendingRegistrationsCount: 0,
});

export const useAdminBadges = () => useContext(AdminBadgesContext);

export const AdminBadgesProvider = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useAuth();
  const [badges, setBadges] = useState<AdminBadges>({
    pendingEventsCount: 0,
    openReportsCount: 0,
    pendingRegistrationsCount: 0,
  });

  const fetchPendingEvents = useCallback(async () => {
    // Curation queue = live events not yet featured on Discover
    const { count } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .in("status", ["published", "pending"]);
    setBadges((prev) => ({ ...prev, pendingEventsCount: count || 0 }));
  }, []);

  const fetchOpenReports = useCallback(async () => {
    const { count } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "reviewing"]);
    setBadges((prev) => ({ ...prev, openReportsCount: count || 0 }));
  }, []);

  const fetchPendingRegistrations = useCallback(async () => {
    const { count } = await supabase
      .from("event_guests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    setBadges((prev) => ({ ...prev, pendingRegistrationsCount: count || 0 }));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    fetchPendingEvents();
    fetchOpenReports();
    fetchPendingRegistrations();

    const eventsChannel = supabase
      .channel("admin-badge-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, fetchPendingEvents)
      .subscribe();

    const reportsChannel = supabase
      .channel("admin-badge-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetchOpenReports)
      .subscribe();

    const guestsChannel = supabase
      .channel("admin-badge-guests")
      .on("postgres_changes", { event: "*", schema: "public", table: "event_guests" }, fetchPendingRegistrations)
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(guestsChannel);
    };
  }, [isAdmin, fetchPendingEvents, fetchOpenReports, fetchPendingRegistrations]);

  return (
    <AdminBadgesContext.Provider value={badges}>
      {children}
    </AdminBadgesContext.Provider>
  );
};
