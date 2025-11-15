import { AdminLayout } from "@/components/admin/AdminLayout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventsTable } from "@/components/admin/EventsTable";
import { PendingEventsTable } from "@/components/admin/PendingEventsTable";
import { Calendar, Users, TrendingUp } from "lucide-react";

const OrganizerDashboard = () => {
  const { isAdmin, adminCheckComplete, loading } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalFavorites: 0,
  });

  const categories = ["All", "Pending", "Conference", "Workshop", "Sports", "Festival", "Seminar", "Past Events"];

  const fetchEvents = async () => {
    try {
      console.log('Fetching events as admin...');
      
      // Update event statuses first
      await supabase.rpc('update_event_status');
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator:profiles(
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      console.log('Events fetched:', data?.length || 0);
      if (data) setEvents(data);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
    }
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
    console.log('OrganizerDashboard useEffect - isAdmin:', isAdmin, 'loading:', loading);
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

  if (!isAdmin && adminCheckComplete) {
    return <Navigate to="/" replace />;
  }
  
  if (!adminCheckComplete) {
    return (
      <AdminLayout>
        <div className="py-12">Checking permissions...</div>
      </AdminLayout>
    );
  }

  // Filter events based on active category
  const filteredEvents = activeCategory === "All" 
    ? events.filter(event => event.status !== 'past' && event.status !== 'pending' && event.status !== 'rejected')
    : activeCategory === "Pending"
    ? events.filter(event => event.status === 'pending')
    : activeCategory === "Past Events"
    ? events.filter(event => event.status === 'past')
    : events.filter(event => event.category === activeCategory && event.status !== 'past' && event.status !== 'pending' && event.status !== 'rejected');

  // Get category counts
  const getCategoryCount = (category: string) => {
    if (category === "All") return events.filter(event => event.status !== 'past' && event.status !== 'pending' && event.status !== 'rejected').length;
    if (category === "Pending") return events.filter(event => event.status === 'pending').length;
    if (category === "Past Events") return events.filter(event => event.status === 'past').length;
    return events.filter(event => event.category === category && event.status !== 'past' && event.status !== 'pending' && event.status !== 'rejected').length;
  };

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
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              <Link to="/create">
                <Calendar className="mr-2 h-5 w-5" />
                Create New Event
              </Link>
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
            <Button asChild variant="outline">
              <Link to="/create">
                <Calendar className="mr-2 h-4 w-4" />
                Add Event
              </Link>
            </Button>
          </div>
          
          {events.length > 0 ? (
            <div className="bg-card rounded-xl border shadow-sm">
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <div className="border-b px-6 pt-6">
                  <TabsList className="w-full justify-start h-auto flex-wrap gap-2">
                    {categories.map((category) => (
                      <TabsTrigger
                        key={category}
                        value={category}
                        className="relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        {category}
                        <Badge 
                          variant="secondary" 
                          className="ml-2 h-5 min-w-[20px] px-1.5 data-[state=active]:bg-primary-foreground/20"
                        >
                          {getCategoryCount(category)}
                        </Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {categories.map((category) => (
                  <TabsContent key={category} value={category} className="mt-0">
                    {filteredEvents.length > 0 ? (
                      category === "Pending" ? (
                        <PendingEventsTable events={filteredEvents} onUpdate={() => { fetchEvents(); fetchStats(); }} />
                      ) : (
                        <EventsTable events={filteredEvents} onUpdate={() => { fetchEvents(); fetchStats(); }} />
                      )
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No {category !== "All" ? category.toLowerCase() : ""} events found</p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first event to get started with event management
              </p>
              <Button asChild>
                <Link to="/create">
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Your First Event
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrganizerDashboard;
