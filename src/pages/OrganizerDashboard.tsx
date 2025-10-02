import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventForm } from "@/components/admin/EventForm";
import { EventsTable } from "@/components/admin/EventsTable";
import { Calendar, Users, TrendingUp } from "lucide-react";

const OrganizerDashboard = () => {
  const { isAdmin, loading } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalFavorites: 0,
  });

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setEvents(data);
  };

  const fetchStats = async () => {
    const { count: eventsCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    const { count: favoritesCount } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalEvents: eventsCount || 0,
      totalFavorites: favoritesCount || 0,
    });
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
      fetchStats();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">Loading...</div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <Seo title="Admin Dashboard" canonical="/organizer" />
      <section className="container py-12 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => setCreateOpen(true)} variant="hero">
            Create Event
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Events</div>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-semibold">{stats.totalEvents}</div>
          </div>
          <div className="rounded-xl border p-6 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Favorites</div>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-semibold">{stats.totalFavorites}</div>
          </div>
          <div className="rounded-xl border p-6 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Engagement</div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-semibold">
              {stats.totalEvents > 0 ? Math.round((stats.totalFavorites / stats.totalEvents) * 100) / 100 : 0}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Manage Events</h2>
          {events.length > 0 ? (
            <EventsTable events={events} onUpdate={() => { fetchEvents(); fetchStats(); }} />
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">No events yet. Create your first event!</p>
            </div>
          )}
        </div>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <EventForm
            onSuccess={() => {
              setCreateOpen(false);
              fetchEvents();
              fetchStats();
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default OrganizerDashboard;
