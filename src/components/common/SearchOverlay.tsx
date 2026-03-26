import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, X, Plus, Home, Calendar, Compass, HelpCircle, 
  Settings, User, ArrowRight, Clock, MapPin 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface EventResult {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  image_url: string | null;
}

const getShortcuts = (userId?: string) => [
  { icon: Plus, label: "Create Event", path: "/create", requireAuth: true },
  { icon: Home, label: "Go to Home", path: "/home", requireAuth: true },
  { icon: Calendar, label: "Browse Events", path: "/events", requireAuth: false },
  { icon: Compass, label: "Discover", path: "/discover", requireAuth: false },
  { icon: User, label: "My Profile", path: userId ? `/profile/${userId}` : "/events", requireAuth: true },
  { icon: Calendar, label: "My Events", path: "/events", requireAuth: true },
  { icon: Settings, label: "Settings", path: "/settings", requireAuth: true },
  { icon: HelpCircle, label: "Help Center", path: "/help", requireAuth: false },
];

export const SearchOverlay = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter shortcuts based on auth
  const shortcuts = getShortcuts(user?.id);
  const availableShortcuts = shortcuts.filter(
    (s) => !s.requireAuth || (s.requireAuth && user)
  );

  // Search events when query changes
  useEffect(() => {
    const searchEvents = async () => {
      if (query.length < 2) {
        setEvents([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date, location, category, image_url")
        .or(`title.ilike.%${query}%,location.ilike.%${query}%,category.ilike.%${query}%`)
        .in("status", ["approved", "upcoming", "ongoing"])
        .order("date", { ascending: true })
        .limit(5);

      if (!error && data) {
        setEvents(data);
      }
      setLoading(false);
    };

    const debounce = setTimeout(searchEvents, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setEvents([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Calculate total items for keyboard nav
  const totalItems = query.length >= 2 ? events.length : availableShortcuts.length;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalItems);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
          break;
        case "Enter":
          e.preventDefault();
          if (query.length >= 2 && events[selectedIndex]) {
            navigate(`/event/${events[selectedIndex].id}`);
            onClose();
          } else if (query.length < 2 && availableShortcuts[selectedIndex]) {
            navigate(availableShortcuts[selectedIndex].path);
            onClose();
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    },
    [open, selectedIndex, totalItems, query, events, availableShortcuts, navigate, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Global keyboard shortcut to open search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!open) {
          // Trigger open via parent - this component can't do that
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [open, onClose]);

  const handleShortcutClick = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="container max-w-2xl mt-[10vh] px-4">
        <div
          className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Input
              autoFocus
              placeholder="Search for events, pages, and more..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground"
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">ESC</kbd>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="max-h-[60vh]">
            <div className="p-2">
              {/* Loading state */}
              {loading && (
                <div className="px-3 py-8 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm">Searching...</p>
                </div>
              )}

              {/* Event Results */}
              {!loading && query.length >= 2 && (
                <>
                  {events.length > 0 ? (
                    <div className="space-y-1">
                      <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Events
                      </p>
                      {events.map((event, index) => (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            selectedIndex === index
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          {event.image_url ? (
                            <img
                              src={event.image_url}
                              alt=""
                              className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.title}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(event.date), "MMM d, yyyy")}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{event.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-8 text-center text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No events found for "{query}"</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </div>
                  )}
                </>
              )}

              {/* Shortcuts (shown when no query) */}
              {!loading && query.length < 2 && (
                <div className="space-y-1">
                  <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Quick Actions
                  </p>
                  {availableShortcuts.map((shortcut, index) => {
                    const Icon = shortcut.icon;
                    return (
                      <button
                        key={shortcut.path}
                        onClick={() => handleShortcutClick(shortcut.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          selectedIndex === index
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{shortcut.label}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">↑</kbd>
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">↓</kbd>
                <span className="ml-1">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
                <span className="ml-1">Select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">⌘</kbd>
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">K</kbd>
              <span className="ml-1">to toggle</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
