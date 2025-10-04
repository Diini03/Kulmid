import { AdminLayout } from "@/components/admin/AdminLayout";
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
      <AdminLayout>
        <div className="py-12">Loading...</div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <Seo title="Admin Dashboard" canonical="/admin" />
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-8 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-primary-foreground/80">
                Manage events, monitor engagement, and control platform content
              </p>
            </div>
            <Button 
              onClick={() => setCreateOpen(true)}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Create New Event
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total Events
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="text-4xl font-bold">{stats.totalEvents}</div>
            <p className="text-sm text-muted-foreground mt-2">Active events on platform</p>
          </div>
          <div className="rounded-xl border p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total Favorites
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="text-4xl font-bold">{stats.totalFavorites}</div>
            <p className="text-sm text-muted-foreground mt-2">User engagement count</p>
          </div>
          <div className="rounded-xl border p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Avg. Engagement
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="text-4xl font-bold">
              {stats.totalEvents > 0 ? (stats.totalFavorites / stats.totalEvents).toFixed(1) : 0}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Favorites per event</p>
          </div>
        </div>

        {/* Events Management Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Event Management</h2>
              <p className="text-muted-foreground">Create, edit, and manage all platform events</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
          
          {events.length > 0 ? (
            <div className="bg-card rounded-xl border shadow-sm">
              <EventsTable events={events} onUpdate={() => { fetchEvents(); fetchStats(); }} />
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first event to get started with event management
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                Create Your First Event
              </Button>
            </div>
          )}
        </div>
      </div>

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
    </AdminLayout>
  );
};

export default OrganizerDashboard;
